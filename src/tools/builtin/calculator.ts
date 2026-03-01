// -*- coding: utf-8 -*-
// 计算器相关内置工具: 表达式计算和单位转换

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

// ============================================================
// 安全数学表达式计算工具
// ============================================================

const calculateParamsSchema = z.object({
  expression: z.string().describe('数学表达式, 例如 "2 + 3 * 4"'),
});

/**
 * 安全数学表达式计算工具.
 * 仅允许数字, 运算符(+, -, *, /, ^, %), 括号, 小数点和空格.
 */
export const calculateTool: ToolDefinition = {
  name: 'calculate',
  description: '安全计算数学表达式, 支持 +, -, *, /, ^(幂), %(取余) 运算',
  parameters: calculateParamsSchema,
  async execute(params: unknown): Promise<unknown> {
    const { expression } = params as z.infer<typeof calculateParamsSchema>;

    // 安全校验: 仅允许数字, 运算符, 括号, 小数点和空格
    const safePattern = /^[\d+\-*/().%^ \t]+$/;
    if (!safePattern.test(expression)) {
      throw new Error(`不安全的表达式: "${expression}"`);
    }

    // 将 ^ 替换为 ** (幂运算)
    const jsExpression = expression.replace(/\^/g, '**');

    // 使用 Function 构造函数安全执行
    const fn = new Function(`"use strict"; return (${jsExpression});`);
    const result = fn() as number;

    // 校验结果是否为有限数字
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error(`计算结果无效: ${result}`);
    }

    return { result };
  },
};

// ============================================================
// 单位转换工具
// ============================================================

/** 长度转换到米的系数 */
const LENGTH_TO_METER: Record<string, number> = {
  m: 1,
  km: 1000,
  mile: 1609.344,
  ft: 0.3048,
  inch: 0.0254,
};

/** 支持的长度单位 */
const LENGTH_UNITS = new Set(Object.keys(LENGTH_TO_METER));

/** 支持的温度单位 */
const TEMPERATURE_UNITS = new Set(['celsius', 'fahrenheit', 'kelvin']);

const convertUnitParamsSchema = z.object({
  value: z.number().describe('要转换的数值'),
  from_unit: z.string().describe('源单位'),
  to_unit: z.string().describe('目标单位'),
});

/**
 * 温度转换函数
 * @param value - 原始温度值
 * @param fromUnit - 源温度单位
 * @param toUnit - 目标温度单位
 * @returns 转换后的温度值
 */
function convertTemperature(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  // 先转为摄氏度
  let celsius: number;
  switch (fromUnit) {
    case 'celsius':
      celsius = value;
      break;
    case 'fahrenheit':
      celsius = (value - 32) * (5 / 9);
      break;
    case 'kelvin':
      celsius = value - 273.15;
      break;
    default:
      throw new Error(`不支持的温度单位: ${fromUnit}`);
  }

  // 从摄氏度转为目标单位
  switch (toUnit) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return celsius * (9 / 5) + 32;
    case 'kelvin':
      return celsius + 273.15;
    default:
      throw new Error(`不支持的温度单位: ${toUnit}`);
  }
}

/**
 * 单位转换工具.
 * 支持长度单位(m, km, mile, ft, inch)和温度单位(celsius, fahrenheit, kelvin).
 */
export const convertUnitTool: ToolDefinition = {
  name: 'convert_unit',
  description:
    '单位转换工具, 支持长度(m, km, mile, ft, inch)和温度(celsius, fahrenheit, kelvin)单位转换',
  parameters: convertUnitParamsSchema,
  async execute(params: unknown): Promise<unknown> {
    const { value, from_unit, to_unit } =
      params as z.infer<typeof convertUnitParamsSchema>;

    const fromLower = from_unit.toLowerCase();
    const toLower = to_unit.toLowerCase();

    // 判断是否为长度单位转换
    if (LENGTH_UNITS.has(fromLower) && LENGTH_UNITS.has(toLower)) {
      const meters = value * LENGTH_TO_METER[fromLower]!;
      const result = meters / LENGTH_TO_METER[toLower]!;
      return { result, from_unit: fromLower, to_unit: toLower };
    }

    // 判断是否为温度单位转换
    if (TEMPERATURE_UNITS.has(fromLower) && TEMPERATURE_UNITS.has(toLower)) {
      const result = convertTemperature(value, fromLower, toLower);
      return { result, from_unit: fromLower, to_unit: toLower };
    }

    throw new Error(`不支持的单位转换: ${from_unit} -> ${to_unit}`);
  },
};
