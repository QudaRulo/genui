// -*- coding: utf-8 -*-
// 工具注册表, 管理工具的注册和查找

import { createLogger } from '../logger.js';
import type { ToolDefinition } from './types.js';

const logger = createLogger('ToolRegistry');

/**
 * 工具注册表, 负责管理所有可用工具的注册, 查找和描述生成.
 */
export class ToolRegistry {
  /** 内部工具存储, 以工具名称为键 */
  private readonly tools: Map<string, ToolDefinition> = new Map();

  /**
   * 创建工具注册表实例
   * @param loadBuiltin - 是否自动加载内置工具, 默认为 true
   */
  constructor(loadBuiltin: boolean = true) {
    if (loadBuiltin) {
      this.loadBuiltinTools();
    }
  }

  /**
   * 注册一个工具
   * @param tool - 工具定义
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`工具 "${tool.name}" 已存在, 将被覆盖`);
    }
    this.tools.set(tool.name, tool);
    logger.info(`已注册工具: ${tool.name}`);
  }

  /**
   * 根据名称获取工具
   * @param name - 工具名称
   * @returns 工具定义, 不存在则返回 undefined
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有已注册的工具
   * @returns 所有工具定义的数组
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 生成工具的 markdown 描述
   * @param toolNames - 可选的工具名称列表, 不传则描述所有工具
   * @returns markdown 格式的工具描述字符串
   */
  getToolsDescription(toolNames?: string[]): string {
    let tools: ToolDefinition[];
    if (toolNames) {
      tools = toolNames
        .map((name) => this.tools.get(name))
        .filter((tool): tool is ToolDefinition => tool !== undefined);
    } else {
      tools = this.getAllTools();
    }

    if (tools.length === 0) {
      return '当前没有可用的工具.';
    }

    const lines: string[] = ['# 可用工具\n'];
    for (const tool of tools) {
      lines.push(`## ${tool.name}`);
      lines.push(`${tool.description}\n`);
    }
    return lines.join('\n');
  }

  /**
   * 加载内置工具
   */
  private loadBuiltinTools(): void {
    try {
      // 动态导入内置工具模块, 由于是同步构造函数, 使用 require 风格的动态导入
      // 在 ESM 环境下需要异步处理, 这里通过立即执行异步函数实现
      void this.loadBuiltinToolsAsync();
    } catch (error) {
      logger.error(`加载内置工具失败: ${error}`);
    }
  }

  /**
   * 异步加载内置工具
   */
  private async loadBuiltinToolsAsync(): Promise<void> {
    try {
      const builtinModule = await import('./builtin/index.js');
      const builtinTools: ToolDefinition[] = builtinModule.getAllBuiltinTools();
      for (const tool of builtinTools) {
        this.register(tool);
      }
      logger.info(`已加载 ${builtinTools.length} 个内置工具`);
    } catch (error) {
      logger.error(`异步加载内置工具失败: ${error}`);
    }
  }
}
