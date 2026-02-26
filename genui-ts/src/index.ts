// -*- coding: utf-8 -*-
// genui-ts - 基于大模型的动态 UI 生成工具
// 公共API入口, 从所有模块统一导出

export const VERSION = '0.1.0';

// Core - 组件schema, 类型和UI实例模型
export {
  ButtonSchema,
  TextInputSchema,
  LabelSchema,
  ContainerSchema,
  CheckboxSchema,
  RadioGroupSchema,
  DropdownSchema,
  ComponentSchema,
  type Button,
  type TextInput,
  type Label,
  type Container,
  type Checkbox,
  type RadioGroup,
  type Dropdown,
  type ComponentType,
  UIInstanceSchema,
  listAllComponents,
  findComponentById,
  type UIInstance,
} from './core/index.js';

// Generator - LLM客户端和UI生成器
export {
  LLMClient,
  UIGenerator,
} from './generator/index.js';
export type { LLMClientConfig, Provider } from './generator/index.js';

// Renderer - 渲染器
export { Renderer } from './renderer/index.js';

// Adapters - 适配器
export { TestAdapter } from './adapters/index.js';
export type { UIAdapter, VirtualWidget } from './adapters/index.js';

// Tools - 工具系统
export { ToolRegistry, ToolExecutor, getAllBuiltinTools } from './tools/index.js';
export type { ToolDefinition } from './tools/index.js';

// Logger - 日志模块
export { createLogger, parseLogLevel, LogLevel } from './logger.js';
export type { Logger } from './logger.js';
