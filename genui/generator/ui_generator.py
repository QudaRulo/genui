# -*- coding: utf-8 -*-
"""UI生成器, 使用LLM根据描述生成UI实例"""

import json
import re
from typing import Optional, List
from genui.core.ui_instance import UIInstance
from genui.generator.llm_client import LLMClient
from genui.tools.registry import ToolRegistry
from genui.logger import get_logger

logger = get_logger(__name__)


# Tool 规划 Prompt
TOOL_PLANNING_PROMPT = """你是一个 UI 功能规划助手.

分析用户需求, 从以下可用工具中选择需要使用的工具:

{tools_description}

用户需求: {user_description}

输出 JSON 格式:
{{
  "selected_tools": ["tool_name1", "tool_name2"],
  "reasoning": "选择这些工具的原因"
}}

规则:
1. 只选择真正需要的工具, 不要选择不相关的
2. 如果用户需求不需要任何工具, selected_tools 为空列表
3. 优先选择功能精确匹配的工具
"""


class UIGenerator:
    """UI生成器, 负责将用户描述转换为UI实例"""

    # 系统提示词模板
    SYSTEM_PROMPT = """你是一个UI生成助手, 根据用户的描述生成UI界面配置.

**重要**: 生成的UI必须具备完整的交互功能, 不能只是展示界面!

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
     * multiline=false: 生成单行Entry组件
     * multiline=true: 生成多行Text组件
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

1. **get_widget(component_id)** - 获取指定id的widget对象
   - 返回Tkinter widget对象(如Entry, Label等)
   - 用于访问和操作UI组件

2. **get_value(component_id)** - 获取组件的值(便捷函数)
   - 自动根据组件类型获取值
   - 支持的组件类型:
     * TextInput (Entry/Text): 获取输入的文本
     * Checkbox: 获取布尔值 (True/False)
     * RadioGroup: 获取选中的选项文本
     * Dropdown: 获取选中的选项文本
     * Label: 获取显示的文本

3. **set_value(component_id, value)** - 设置组件的值(便捷函数)
   - 自动根据组件类型设置值
   - 支持的组件类型:
     * TextInput (Entry/Text): 设置文本内容
     * Checkbox: 设置选中状态 (True/False 或 1/0)
     * RadioGroup: 设置选中的选项文本
     * Dropdown: 设置选中的选项文本
     * Label: 设置显示的文本

4. **update_widget(component_id, **kwargs)** - 更新组件属性(便捷函数)
   - 例如: update_widget("label_id", text="新文本", fg="red")

5. **display(message)** - 在控制台显示消息
   - 用于输出调试信息或结果

6. **print(message)** - 标准输出函数

**常用交互模式**:

方式1 - 使用便捷函数(推荐):
   ```python
   # 获取各种组件的值
   text = get_value("input_id")           # TextInput
   is_checked = get_value("checkbox_id")  # Checkbox (返回 True/False)
   selected = get_value("radio_id")       # RadioGroup (返回选中的文本)
   option = get_value("dropdown_id")      # Dropdown (返回选中的文本)

   # 设置各种组件的值
   set_value("input_id", "新文本")        # TextInput
   set_value("checkbox_id", True)        # Checkbox
   set_value("radio_id", "选项2")        # RadioGroup
   set_value("dropdown_id", "选项B")     # Dropdown
   set_value("result_label", "计算结果: 42")  # Label

   # 更新属性
   update_widget("result_label", text="成功", fg="green")
   ```

方式2 - 直接操作widget(高级用法，通常不需要):
   ```python
   # 获取Entry的值
   widget = get_widget("input_id")
   value = widget.get()

   # 获取Text的值（多行输入框）
   widget = get_widget("textarea_id")
   value = widget.get("1.0", "end-1c")  # Text组件需要指定范围

   # 设置Label的文本
   label = get_widget("label_id")
   label.config(text="新文本")

   # 获取Dropdown的选中值
   dropdown = get_widget("dropdown_id")
   value = dropdown.get()

   # 清空Entry
   widget = get_widget("input_id")
   widget.delete(0, "end")

   # 清空Text
   widget = get_widget("textarea_id")
   widget.delete("1.0", "end")
   ```

**注意**: 推荐使用方式1的便捷函数，它会自动处理不同组件类型的差异。

**事件处理函数示例**(使用便捷函数):

```python
def handle_calculate():
    # 获取输入值(使用便捷函数)
    num1_str = get_value("num1_input")
    num2_str = get_value("num2_input")
    operator = get_value("operator_dropdown")

    # 计算结果
    try:
        num1 = float(num1_str)
        num2 = float(num2_str)

        if operator == "+":
            result = num1 + num2
        elif operator == "-":
            result = num1 - num2
        elif operator == "*":
            result = num1 * num2
        elif operator == "/":
            result = num1 / num2 if num2 != 0 else "错误: 除数不能为0"
        else:
            result = "未知运算符"

        # 更新结果标签(使用便捷函数)
        set_value("result_label", f"结果: {result}")
        display(f"计算完成: {num1} {operator} {num2} = {result}")
    except ValueError:
        set_value("result_label", "错误: 请输入有效的数字")
        display("输入无效")
```

输出格式 (JSON):
{
  "title": "窗口标题",
  "width": 600,
  "height": 400,
  "root": { 组件对象 },
  "event_handlers": {
    "函数名": "def 函数名():\\n    代码"
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
      {
        "id": "title",
        "type": "label",
        "text": "用户登录",
        "font_size": 18,
        "bold": true
      },
      {
        "id": "username",
        "type": "text_input",
        "placeholder": "用户名"
      },
      {
        "id": "password",
        "type": "text_input",
        "placeholder": "密码"
      },
      {
        "id": "result_label",
        "type": "label",
        "text": ""
      },
      {
        "id": "login_btn",
        "type": "button",
        "text": "登录",
        "on_click": "handle_login"
      }
    ]
  },
  "event_handlers": {
    "handle_login": "def handle_login():\\n    username = get_value('username')\\n    password = get_value('password')\\n    \\n    if username and password:\\n        set_value('result_label', f'欢迎, {username}!')\\n        display(f'用户 {username} 登录成功')\\n    else:\\n        set_value('result_label', '请填写用户名和密码')\\n        display('登录失败: 信息不完整')"
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
      {
        "id": "num1_input",
        "type": "text_input",
        "placeholder": "第一个数字"
      },
      {
        "id": "operator_dropdown",
        "type": "dropdown",
        "label": "运算符",
        "options": ["+", "-", "*", "/"],
        "selected": "+"
      },
      {
        "id": "num2_input",
        "type": "text_input",
        "placeholder": "第二个数字"
      },
      {
        "id": "result_label",
        "type": "label",
        "text": "结果: ",
        "font_size": 14,
        "bold": true
      },
      {
        "id": "calc_btn",
        "type": "button",
        "text": "计算",
        "on_click": "handle_calculate"
      },
      {
        "id": "clear_btn",
        "type": "button",
        "text": "清空",
        "on_click": "handle_clear"
      }
    ]
  },
  "event_handlers": {
    "handle_calculate": "def handle_calculate():\\n    try:\\n        num1 = float(get_value('num1_input'))\\n        num2 = float(get_value('num2_input'))\\n        operator = get_value('operator_dropdown')\\n        \\n        if operator == '+':\\n            result = num1 + num2\\n        elif operator == '-':\\n            result = num1 - num2\\n        elif operator == '*':\\n            result = num1 * num2\\n        elif operator == '/':\\n            result = num1 / num2 if num2 != 0 else '错误: 除数为0'\\n        else:\\n            result = '未知运算符'\\n        \\n        set_value('result_label', f'结果: {result}')\\n        display(f'{num1} {operator} {num2} = {result}')\\n    except ValueError:\\n        set_value('result_label', '错误: 请输入有效数字')\\n        display('输入无效')",
    "handle_clear": "def handle_clear():\\n    set_value('num1_input', '')\\n    set_value('num2_input', '')\\n    set_value('result_label', '结果: ')\\n    display('已清空')"
  }
}

注意:
- Dropdown组件只能有: id, type, label, options, selected, width
- Dropdown不能有children, layout, padding, spacing属性
- **事件处理函数必须实现真实的交互逻辑**, 不能只是简单的print语句
- 使用get_widget()获取组件, 使用.get()获取值, 使用.config()设置属性
- 所有需要显示结果的地方, 必须添加一个Label组件来显示
- 只输出JSON, 不要有其他文字
"""

    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        tool_registry: Optional[ToolRegistry] = None
    ):
        """初始化UI生成器

        Args:
            llm_client: LLM客户端实例, 如果为None则创建新实例
            tool_registry: Tool 注册表, 如果为 None 则创建默认实例 (包含内置 tools)
        """
        self.llm_client = llm_client or LLMClient()
        self.tool_registry = tool_registry or ToolRegistry()

    def generate(self, user_description: str) -> UIInstance:
        """根据用户描述生成UI实例

        Args:
            user_description: 用户对UI的描述

        Returns:
            生成的UI实例

        Raises:
            ValueError: 如果生成的配置无效
            RuntimeError: 如果LLM调用失败
        """
        # 调用LLM生成配置
        response = self.llm_client.generate_ui_config_sync(
            user_description=user_description,
            system_prompt=self.SYSTEM_PROMPT
        )

        # 提取JSON内容
        json_str = self._extract_json(response)

        # 解析JSON
        try:
            config_dict = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"无法解析LLM返回的JSON: {e}\n内容: {json_str}")

        # 转换为UIInstance
        try:
            ui_instance = UIInstance.model_validate(config_dict)
            return ui_instance
        except Exception as e:
            # 提供更友好的错误信息
            error_msg = f"生成的UI配置无效:\n{e}\n\n"
            error_msg += "常见问题:\n"
            error_msg += "1. Dropdown/Button/Label等组件不能有children/layout/padding/spacing属性\n"
            error_msg += "2. 只有Container组件才能包含children\n"
            error_msg += "3. 检查组件的type字段是否正确\n\n"
            error_msg += f"生成的配置:\n{json.dumps(config_dict, indent=2, ensure_ascii=False)}"
            raise ValueError(error_msg)

    def _extract_json(self, text: str) -> str:
        """从文本中提取JSON内容

        Args:
            text: 可能包含JSON的文本

        Returns:
            提取的JSON字符串
        """
        # 移除markdown代码块标记
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)

        # 尝试找到JSON对象
        text = text.strip()

        # 如果以{开头, 直接返回
        if text.startswith('{'):
            return text

        # 否则尝试查找第一个{和最后一个}之间的内容
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]

        return text

    def _plan_tools(self, user_description: str) -> List[str]:
        """阶段1: 分析用户需求, 规划需要使用的 tools

        Args:
            user_description: 用户描述

        Returns:
            选中的 tool 名称列表
        """
        # 1. 获取所有可用 tools 的描述
        tools_description = self.tool_registry.get_tools_description()

        # 2. 构建 Tool 规划 prompt
        prompt = TOOL_PLANNING_PROMPT.format(
            tools_description=tools_description,
            user_description=user_description
        )

        # 3. 调用 LLM
        response = self.llm_client.generate_ui_config_sync(
            user_description="请分析并选择所需工具",  # 给一个非空的描述
            system_prompt=prompt
        )

        # 4. 解析返回的 tool 列表
        try:
            # 提取 JSON
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            selected_tools = data.get("selected_tools", [])

            logger.info(f"Tool 规划完成: 选中 {len(selected_tools)} 个 tools")
            logger.info(f"选中的 tools: {selected_tools}")
            if "reasoning" in data:
                logger.debug(f"选择原因: {data['reasoning']}")

            return selected_tools

        except Exception as e:
            logger.warning(f"Tool 规划失败, 使用空列表: {e}")
            return []
