// -*- coding: utf-8 -*-
// 工具系统类型定义, 声明工具的接口和结构

import { z } from 'zod';

/**
 * 工具定义接口, 描述一个可执行的工具
 */
export interface ToolDefinition {
  /** 工具名称, 用于注册和查找 */
  name: string;
  /** 工具描述, 用于生成工具说明 */
  description: string;
  /** 参数的 Zod schema, 用于参数校验 */
  parameters: z.ZodType;
  /** 执行工具的函数 */
  execute(params: unknown): Promise<unknown>;
}
