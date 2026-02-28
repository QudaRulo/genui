// -*- coding: utf-8 -*-
// 内置工具汇总模块, 导出所有内置工具

import type { ToolDefinition } from '../types.js';
import { calculateTool, convertUnitTool } from './calculator.js';
import { getWeatherTool, getCurrentTimeTool } from './query.js';
import { readTextFileTool, listDirectoryTool } from './file-ops.js';

/**
 * 获取所有内置工具列表
 * @returns 所有内置工具定义的数组
 */
export function getAllBuiltinTools(): ToolDefinition[] {
  return [
    calculateTool,
    convertUnitTool,
    getWeatherTool,
    getCurrentTimeTool,
    readTextFileTool,
    listDirectoryTool,
  ];
}

export {
  calculateTool,
  convertUnitTool,
  getWeatherTool,
  getCurrentTimeTool,
  readTextFileTool,
  listDirectoryTool,
};
