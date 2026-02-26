// -*- coding: utf-8 -*-
// 工具执行器, 负责工具的参数校验和执行

import { createLogger } from '../logger.js';
import type { ToolRegistry } from './registry.js';

const logger = createLogger('ToolExecutor');

/**
 * 工具执行器, 负责查找工具, 校验参数并执行.
 */
export class ToolExecutor {
  /** 关联的工具注册表 */
  private readonly registry: ToolRegistry;

  /**
   * 创建工具执行器实例
   * @param registry - 工具注册表
   */
  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * 调用指定名称的工具函数
   * @param name - 工具名称
   * @param params - 工具参数(未校验)
   * @returns 工具执行结果
   * @throws 工具不存在或执行失败时抛出 Error
   */
  async callFunction(name: string, params: unknown): Promise<unknown> {
    const tool = this.registry.getTool(name);
    if (!tool) {
      const msg = `工具 "${name}" 不存在`;
      logger.error(msg);
      throw new Error(msg);
    }

    // 使用 Zod schema 校验参数
    logger.info(`调用工具: ${name}`);
    const validatedParams = tool.parameters.parse(params);

    try {
      const result = await tool.execute(validatedParams);
      logger.info(`工具 "${name}" 执行成功`);
      return result;
    } catch (error) {
      const msg = `工具 "${name}" 执行失败: ${error}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }
}
