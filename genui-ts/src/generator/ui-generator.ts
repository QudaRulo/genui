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
    const parsed: unknown = JSON.parse(jsonStr);
    const uiInstance = UIInstanceSchema.parse(parsed);

    logger.info(`UI生成完成, 标题: ${uiInstance.title}`);
    return uiInstance;
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
   * 构建UI生成阶段的系统提示词
   * @param selectedTools - 选中的工具名称列表
   * @returns 系统提示词
   */
  private buildGenerationPrompt(selectedTools: string[]): string {
    let toolsSection = '';
    if (this.toolRegistry && selectedTools.length > 0) {
      const description = this.toolRegistry.getToolsDescription(selectedTools);
      toolsSection = `\n可用工具:\n${description}\n`;
    }

    return `你是一个UI生成助手, 根据用户的描述生成UI界面配置.
${toolsSection}
你可以使用以下UI组件: Container, Button, TextInput, Label, Checkbox, RadioGroup, Dropdown.

事件处理函数使用 JavaScript 编写, 可以使用以下辅助函数:
- getValue(componentId) - 获取组件值
- setValue(componentId, value) - 设置组件值
- display(message) - 显示消息
- callFunction(name, params) - 调用工具函数

输出格式 (JSON):
{
  "title": "窗口标题",
  "width": 600,
  "height": 400,
  "root": { 组件对象 },
  "event_handlers": { "函数名": "function 函数名() { ... }" }
}

只输出JSON, 不要有其他文字.`;
  }
}
