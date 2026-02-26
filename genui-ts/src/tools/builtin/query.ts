// -*- coding: utf-8 -*-
// 查询类内置工具: 天气查询和时间获取

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

// ============================================================
// 天气查询工具(模拟数据)
// ============================================================

/** 模拟天气数据 */
const MOCK_WEATHER: Record<string, { weather: string; temperature: number }> = {
  '北京': { weather: '晴', temperature: 22.0 },
  '上海': { weather: '多云', temperature: 25.0 },
  '广州': { weather: '阵雨', temperature: 30.0 },
  '深圳': { weather: '多云转晴', temperature: 29.0 },
};

/** 默认天气数据 */
const DEFAULT_WEATHER = { weather: '晴', temperature: 20.0 };

const getWeatherParamsSchema = z.object({
  city: z.string().describe('城市名称'),
});

/**
 * 天气查询工具(模拟数据).
 * 支持查询北京, 上海, 广州, 深圳的天气, 其他城市返回默认数据.
 */
export const getWeatherTool: ToolDefinition = {
  name: 'get_weather',
  description: '查询指定城市的天气信息(模拟数据)',
  parameters: getWeatherParamsSchema,
  async execute(params: unknown): Promise<unknown> {
    const { city } = params as z.infer<typeof getWeatherParamsSchema>;
    const data = MOCK_WEATHER[city] ?? DEFAULT_WEATHER;
    return { city, ...data };
  },
};

// ============================================================
// 当前时间获取工具
// ============================================================

const getCurrentTimeParamsSchema = z.object({}).passthrough();

/**
 * 当前时间获取工具.
 * 返回格式为 YYYY-MM-DD HH:MM:SS 的当前时间字符串.
 */
export const getCurrentTimeTool: ToolDefinition = {
  name: 'get_current_time',
  description: '获取当前时间, 返回格式为 YYYY-MM-DD HH:MM:SS',
  parameters: getCurrentTimeParamsSchema,
  async execute(_params: unknown): Promise<unknown> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return { time };
  },
};
