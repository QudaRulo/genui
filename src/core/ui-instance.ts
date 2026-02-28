// -*- coding: utf-8 -*-
// UI实例模型, 定义完整的UI实例结构

import { z } from 'zod';
import { ComponentSchema, type ComponentType } from './component.js';

// ============================================================
// UIInstance Schema
// ============================================================
export const UIInstanceSchema = z.object({
  title: z.string(),
  width: z.number().default(600),
  height: z.number().default(400),
  root: ComponentSchema,
  event_handlers: z.record(z.string(), z.string()).default({}),
});

/** UI实例类型, 表示一个完整的UI界面 */
export type UIInstance = z.infer<typeof UIInstanceSchema>;

/**
 * 递归收集UIInstance中的所有组件(root + 所有子孙组件).
 *
 * @param instance - UI实例
 * @returns 所有组件的列表
 */
export function listAllComponents(instance: UIInstance): ComponentType[] {
  const components: ComponentType[] = [instance.root];

  function collect(comp: ComponentType): void {
    if ('children' in comp && Array.isArray(comp.children)) {
      for (const child of comp.children as ComponentType[]) {
        components.push(child);
        collect(child);
      }
    }
  }

  collect(instance.root);
  return components;
}

/**
 * 根据ID在UIInstance中查找组件.
 *
 * @param instance - UI实例
 * @param id - 组件ID
 * @returns 找到的组件, 不存在则返回undefined
 */
export function findComponentById(
  instance: UIInstance,
  id: string,
): ComponentType | undefined {
  for (const comp of listAllComponents(instance)) {
    if (comp.id === id) {
      return comp;
    }
  }
  return undefined;
}
