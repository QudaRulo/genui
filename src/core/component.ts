// -*- coding: utf-8 -*-
// UI组件抽象层, 定义各种UI组件的Zod schema

import { z } from 'zod';

// ============================================================
// 按钮组件 Schema
// ============================================================
export const ButtonSchema = z.object({
  id: z.string(),
  type: z.literal('button'),
  text: z.string(),
  on_click: z.string().optional(),
  enabled: z.boolean().default(true),
  width: z.number().optional(),
  height: z.number().optional(),
});

/** 按钮组件类型 */
export type Button = z.infer<typeof ButtonSchema>;

// ============================================================
// 文本输入框组件 Schema
// ============================================================
export const TextInputSchema = z.object({
  id: z.string(),
  type: z.literal('text_input'),
  placeholder: z.string().default(''),
  default_value: z.string().default(''),
  multiline: z.boolean().default(false),
  width: z.number().optional(),
  height: z.number().optional(),
});

/** 文本输入框组件类型 */
export type TextInput = z.infer<typeof TextInputSchema>;

// ============================================================
// 文本标签组件 Schema
// ============================================================
export const LabelSchema = z.object({
  id: z.string(),
  type: z.literal('label'),
  text: z.string(),
  font_size: z.number().default(12),
  bold: z.boolean().default(false),
  color: z.string().optional(),
});

/** 文本标签组件类型 */
export type Label = z.infer<typeof LabelSchema>;

// ============================================================
// 复选框组件 Schema
// ============================================================
export const CheckboxSchema = z.object({
  id: z.string(),
  type: z.literal('checkbox'),
  label: z.string(),
  checked: z.boolean().default(false),
  on_change: z.string().optional(),
});

/** 复选框组件类型 */
export type Checkbox = z.infer<typeof CheckboxSchema>;

// ============================================================
// 单选按钮组组件 Schema
// ============================================================
export const RadioGroupSchema = z.object({
  id: z.string(),
  type: z.literal('radio_group'),
  label: z.string(),
  options: z.array(z.string()),
  selected: z.string().optional(),
  on_change: z.string().optional(),
});

/** 单选按钮组组件类型 */
export type RadioGroup = z.infer<typeof RadioGroupSchema>;

// ============================================================
// 下拉选择框组件 Schema
// ============================================================
export const DropdownSchema = z.object({
  id: z.string(),
  type: z.literal('dropdown'),
  label: z.string().default(''),
  options: z.array(z.string()),
  selected: z.string().optional(),
  width: z.number().optional(),
});

/** 下拉选择框组件类型 */
export type Dropdown = z.infer<typeof DropdownSchema>;

// ============================================================
// 手动定义递归类型以避免循环引用
// ============================================================

/** 容器组件类型(手动定义以支持递归) */
export interface Container {
  id: string;
  type: 'container';
  layout: 'vertical' | 'horizontal' | 'grid';
  children: ComponentType[];
  padding: number;
  spacing: number;
  width?: number;
  height?: number;
}

/** 所有组件的联合类型 */
export type ComponentType =
  | Button
  | TextInput
  | Label
  | Container
  | Checkbox
  | RadioGroup
  | Dropdown;

// ============================================================
// 组件联合类型 Schema (含递归Container)
// ============================================================

/**
 * 组件联合类型 Schema, 使用discriminatedUnion按type字段区分.
 * Container的children字段使用z.lazy()实现递归引用.
 */
export const ComponentSchema: z.ZodType<ComponentType> = z.discriminatedUnion(
  'type',
  [
    ButtonSchema,
    TextInputSchema,
    LabelSchema,
    z.object({
      id: z.string(),
      type: z.literal('container'),
      layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
      children: z
        .array(z.lazy((): z.ZodType<ComponentType> => ComponentSchema))
        .default([]),
      padding: z.number().default(10),
      spacing: z.number().default(5),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    CheckboxSchema,
    RadioGroupSchema,
    DropdownSchema,
  ],
);

// ============================================================
// 容器组件 Schema (独立导出, 使用ComponentSchema引用)
// ============================================================
export const ContainerSchema = z.object({
  id: z.string(),
  type: z.literal('container'),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
  children: z
    .array(z.lazy((): z.ZodType<ComponentType> => ComponentSchema))
    .default([]),
  padding: z.number().default(10),
  spacing: z.number().default(5),
  width: z.number().optional(),
  height: z.number().optional(),
});
