// -*- coding: utf-8 -*-
// UI生成器, 通过两阶段LLM调用生成UI实例

import { createLogger } from '../logger.js';
import { UIInstanceSchema } from '../core/ui-instance.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { LLMClient } from './llm-client.js';
import type { ToolRegistry } from '../tools/registry.js';

const logger = createLogger('UIGenerator');

/** 工具规划阶段LLM返回的结构 */
interface ToolPlanningResult {
  selected_tools: string[];
  reasoning: string;
}

/**
 * UI生成器, 使用LLM通过两阶段流程生成UI实例.
 *
 * 阶段1 - 工具规划: 分析用户需求并选择所需工具.
 * 阶段2 - UI生成: 根据选中的工具和用户描述生成UI配置.
 */
export class UIGenerator {
  /** LLM客户端 */
  private readonly llmClient: LLMClient;

  /** 工具注册表 */
  private readonly toolRegistry?: ToolRegistry;

  /**
   * 创建UIGenerator实例
   * @param llmClient - LLM客户端, 用于与模型交互
   * @param toolRegistry - 可选的工具注册表, 提供可用工具信息
   */
  constructor(llmClient: LLMClient, toolRegistry?: ToolRegistry) {
    this.llmClient = llmClient;
    this.toolRegistry = toolRegistry;
  }

  /**
   * 根据用户描述生成UI实例.
   *
   * 1. 阶段1: 使用LLM分析需求, 选择所需工具
   * 2. 阶段2: 使用LLM根据选中工具和需求生成UI配置
   *
   * @param userDescription - 用户对UI界面的描述
   * @returns 解析验证后的UIInstance
   * @throws 当LLM返回的JSON无法解析或不符合UIInstance schema时抛出Error
   */
  async generate(userDescription: string): Promise<UIInstance> {
    logger.info(`开始生成UI, 用户描述: ${userDescription}`);

    // 阶段1 - 工具规划
    const selectedTools = await this.planTools(userDescription);
    logger.info(`工具规划完成, 选中工具: ${JSON.stringify(selectedTools)}`);

    // 阶段2 - UI生成
    const systemPrompt = this.buildGenerationPrompt(selectedTools);
    const response = await this.llmClient.generate(systemPrompt, userDescription);

    const jsonStr = this.extractJson(response);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      logger.error(`无法解析LLM返回的JSON: ${e}`);
      logger.debug(`原始响应: ${response}`);
      throw new Error(`无法解析LLM返回的JSON: ${e}`);
    }

    try {
      const uiInstance = UIInstanceSchema.parse(parsed);
      logger.info(`UI生成完成, 标题: ${uiInstance.title}`);
      return uiInstance;
    } catch (e) {
      logger.error(`生成的UI配置无效: ${e}`);
      logger.debug(`LLM返回的配置: ${JSON.stringify(parsed, null, 2)}`);
      throw e;
    }
  }

  /**
   * 从文本中提取JSON字符串.
   *
   * - 移除 ```json 和 ``` markdown标记
   * - 查找第一个 { 到最后一个 } 之间的内容
   *
   * @param text - 包含JSON的文本
   * @returns 清理后的JSON字符串
   */
  extractJson(text: string): string {
    // 移除markdown代码块标记
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // 查找JSON对象的边界
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
  }

  /**
   * 阶段1: 使用LLM规划需要使用的工具
   * @param userDescription - 用户需求描述
   * @returns 选中的工具名称列表, 规划失败时返回空列表
   */
  private async planTools(userDescription: string): Promise<string[]> {
    if (!this.toolRegistry) {
      logger.info('未提供工具注册表, 跳过工具规划');
      return [];
    }

    const toolsDescription = this.toolRegistry.getToolsDescription();
    const planningPrompt = this.buildPlanningPrompt(toolsDescription);

    try {
      const response = await this.llmClient.generate(
        planningPrompt,
        userDescription,
      );
      const jsonStr = this.extractJson(response);
      const result = JSON.parse(jsonStr) as ToolPlanningResult;

      if (Array.isArray(result.selected_tools)) {
        return result.selected_tools;
      }

      logger.warn('工具规划结果格式不正确, 使用空工具列表');
      return [];
    } catch (error) {
      logger.warn(`工具规划失败, 使用空工具列表: ${error}`);
      return [];
    }
  }

  /**
   * 构建工具规划阶段的系统提示词
   * @param toolsDescription - 可用工具的描述文本
   * @returns 系统提示词
   */
  private buildPlanningPrompt(toolsDescription: string): string {
    return `你是一个 UI 功能规划助手.
分析用户需求, 从以下可用工具中选择需要使用的工具:
${toolsDescription}
用户需求: {用户将在下一条消息中提供}
输出 JSON 格式:
{"selected_tools": ["tool_name1"], "reasoning": "原因"}`;
  }

  /**
   * 构建工具调用说明部分
   * @param selectedTools - 选中的工具名称列表
   * @returns 工具说明文本, 无工具时返回空字符串
   */
  private buildToolsSection(selectedTools: string[]): string {
    if (!this.toolRegistry || selectedTools.length === 0) {
      return '';
    }

    const desc = this.toolRegistry.getToolsDescription(selectedTools);
    return `你可以调用以下功能函数:

${desc}

在事件处理函数中, 可以使用 callFunction(name, params) 来调用这些功能:

示例:
\`\`\`javascript
function handle_weather_query() {
  // 获取用户输入
  var city = getValue("city_input");

  // 调用功能函数
  var weatherData = callFunction("get_weather", { city: city });

  // 更新 UI 显示
  var resultText = city + "的天气: " + weatherData.weather + ", 温度: " + weatherData.temperature + "°C";
  setValue("result_label", resultText);
  display("查询成功: " + resultText);
}
\`\`\`

callFunction() 说明:
- 参数: name (函数名), params (参数对象)
- 返回: 函数执行结果
- 异常: 如果函数不存在或执行失败, 会抛出异常, 可以用 try/catch 捕获

`;
  }

  /**
   * 构建UI生成阶段的系统提示词
   * @param selectedTools - 选中的工具名称列表
   * @returns 系统提示词
   */
  private buildGenerationPrompt(selectedTools: string[]): string {
    const toolsSection = this.buildToolsSection(selectedTools);

    return `你是一个UI生成助手, 根据用户的描述生成UI界面配置.

**重要**: 生成的UI必须具备完整的交互功能, 不能只是展示界面!

${toolsSection}

你可以使用以下UI组件, **每个组件只能使用其专属的属性, 不能使用其他组件的属性**:

1. **Container** (容器组件, 用于包含其他组件)
   必需: id, type="container"
   专属属性:
   - layout: "vertical" | "horizontal" | "grid" (布局方式)
   - children: [] (子组件列表, 必须是数组)
   - padding: number (内边距, 默认10)
   - spacing: number (组件间距, 默认5)
   - width, height: number (可选)

2. **Button** (按钮)
   必需: id, type="button"
   专属属性:
   - text: string (按钮文本)
   - on_click: string (点击事件处理函数名, 可选)
   - enabled: boolean (是否启用, 默认true)
   - width, height: number (可选)

3. **TextInput** (文本输入框)
   必需: id, type="text_input"
   专属属性:
   - placeholder: string (占位符, 默认"")
   - default_value: string (默认值, 默认"")
   - multiline: boolean (是否多行, 默认false)
   - width, height: number (可选)

4. **Label** (文本标签)
   必需: id, type="label"
   专属属性:
   - text: string (标签文本)
   - font_size: number (字体大小, 默认12)
   - bold: boolean (是否加粗, 默认false)
   - color: string (颜色hex值, 可选)

5. **Checkbox** (复选框)
   必需: id, type="checkbox"
   专属属性:
   - label: string (标签)
   - checked: boolean (是否选中, 默认false)
   - on_change: string (状态变化事件, 可选)

6. **RadioGroup** (单选按钮组)
   必需: id, type="radio_group"
   专属属性:
   - label: string (组标签)
   - options: [] (选项列表, 必须是字符串数组)
   - selected: string (当前选中项, 可选)
   - on_change: string (变化事件, 可选)

7. **Dropdown** (下拉选择框)
   必需: id, type="dropdown"
   专属属性:
   - label: string (标签, 默认"")
   - options: [] (选项列表, 必须是字符串数组)
   - selected: string (当前选中项, 可选)
   - width: number (宽度, 可选)

**重要规则**:
1. 每个组件必须有 id 和 type 字段
2. type必须是: "container", "button", "text_input", "label", "checkbox", "radio_group", "dropdown" 之一
3. 只有Container组件才能有children属性, 其他组件不能有
4. 只有Container组件才能有layout, padding, spacing属性
5. 不要给组件添加它不支持的属性
6. 所有id必须唯一
7. 根组件通常应该是Container

**事件处理函数编写指南**:

在事件处理函数中, 你可以使用以下工具函数来实现交互:

1. **getValue(componentId)** - 获取组件的值(便捷函数)
   - 支持的组件类型:
     * TextInput: 获取输入的文本
     * Checkbox: 获取布尔值 (true/false)
     * RadioGroup: 获取选中的选项文本
     * Dropdown: 获取选中的选项文本
     * Label: 获取显示的文本

2. **setValue(componentId, value)** - 设置组件的值(便捷函数)
   - 支持的组件类型:
     * TextInput: 设置文本内容
     * Checkbox: 设置选中状态 (true/false)
     * RadioGroup: 设置选中的选项文本
     * Dropdown: 设置选中的选项文本
     * Label: 设置显示的文本

3. **display(message)** - 在控制台显示消息

**事件处理函数示例**(使用便捷函数):

\`\`\`javascript
function handle_calculate() {
  // 获取输入值
  var num1Str = getValue("num1_input");
  var num2Str = getValue("num2_input");
  var operator = getValue("operator_dropdown");

  try {
    var num1 = parseFloat(num1Str);
    var num2 = parseFloat(num2Str);
    var result;

    if (operator === "+") result = num1 + num2;
    else if (operator === "-") result = num1 - num2;
    else if (operator === "*") result = num1 * num2;
    else if (operator === "/") result = num2 !== 0 ? num1 / num2 : "错误: 除数不能为0";
    else result = "未知运算符";

    setValue("result_label", "结果: " + result);
    display(num1 + " " + operator + " " + num2 + " = " + result);
  } catch (e) {
    setValue("result_label", "错误: 请输入有效的数字");
    display("输入无效");
  }
}
\`\`\`

输出格式 (JSON):
{
  "title": "窗口标题",
  "width": 600,
  "height": 400,
  "root": { 组件对象 },
  "event_handlers": {
    "函数名": "function 函数名() { 代码 }"
  }
}

**示例1 - 简单表单(带交互)**:
{
  "title": "登录",
  "width": 400,
  "height": 300,
  "root": {
    "id": "main",
    "type": "container",
    "layout": "vertical",
    "children": [
      {"id": "title", "type": "label", "text": "用户登录", "font_size": 18, "bold": true},
      {"id": "username", "type": "text_input", "placeholder": "用户名"},
      {"id": "password", "type": "text_input", "placeholder": "密码"},
      {"id": "result_label", "type": "label", "text": ""},
      {"id": "login_btn", "type": "button", "text": "登录", "on_click": "handle_login"}
    ]
  },
  "event_handlers": {
    "handle_login": "function handle_login() { var username = getValue('username'); var password = getValue('password'); if (username && password) { setValue('result_label', '欢迎, ' + username + '!'); display('用户 ' + username + ' 登录成功'); } else { setValue('result_label', '请填写用户名和密码'); display('登录失败: 信息不完整'); } }"
  }
}

**示例2 - 计算器(完整交互)**:
{
  "title": "简单计算器",
  "width": 400,
  "height": 300,
  "root": {
    "id": "main",
    "type": "container",
    "layout": "vertical",
    "children": [
      {"id": "num1_input", "type": "text_input", "placeholder": "第一个数字"},
      {"id": "operator_dropdown", "type": "dropdown", "label": "运算符", "options": ["+", "-", "*", "/"], "selected": "+"},
      {"id": "num2_input", "type": "text_input", "placeholder": "第二个数字"},
      {"id": "result_label", "type": "label", "text": "结果: ", "font_size": 14, "bold": true},
      {"id": "calc_btn", "type": "button", "text": "计算", "on_click": "handle_calculate"},
      {"id": "clear_btn", "type": "button", "text": "清空", "on_click": "handle_clear"}
    ]
  },
  "event_handlers": {
    "handle_calculate": "function handle_calculate() { try { var num1 = parseFloat(getValue('num1_input')); var num2 = parseFloat(getValue('num2_input')); var op = getValue('operator_dropdown'); var result; if (op === '+') result = num1 + num2; else if (op === '-') result = num1 - num2; else if (op === '*') result = num1 * num2; else if (op === '/') result = num2 !== 0 ? num1 / num2 : '错误: 除数为0'; else result = '未知运算符'; setValue('result_label', '结果: ' + result); display(num1 + ' ' + op + ' ' + num2 + ' = ' + result); } catch(e) { setValue('result_label', '错误: 请输入有效数字'); display('输入无效'); } }",
    "handle_clear": "function handle_clear() { setValue('num1_input', ''); setValue('num2_input', ''); setValue('result_label', '结果: '); display('已清空'); }"
  }
}

注意:
- Dropdown组件只能有: id, type, label, options, selected, width
- Dropdown不能有children, layout, padding, spacing属性
- **事件处理函数必须实现真实的交互逻辑**, 不能只是简单的console.log
- 使用getValue()获取值, 使用setValue()设置值
- 所有需要显示结果的地方, 必须添加一个Label组件来显示
- 只输出JSON, 不要有其他文字`;
  }
}
