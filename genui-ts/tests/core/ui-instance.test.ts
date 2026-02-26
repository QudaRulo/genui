import { describe, it, expect } from 'vitest';
import {
  UIInstanceSchema,
  listAllComponents,
  findComponentById,
  type UIInstance,
} from '../../src/core/ui-instance.js';
import type { ComponentType } from '../../src/core/component.js';

describe('UIInstanceSchema', () => {
  it('应该解析有效的UIInstance', () => {
    const data = {
      title: '测试窗口',
      root: {
        id: 'root',
        type: 'container',
        children: [
          { id: 'btn-1', type: 'button', text: '确定' },
          { id: 'lbl-1', type: 'label', text: '提示' },
        ],
      },
    };
    const result: UIInstance = UIInstanceSchema.parse(data);
    expect(result.title).toBe('测试窗口');
    expect(result.root.type).toBe('container');
  });

  it('应该使用默认值(width=600, height=400)', () => {
    const data = {
      title: '默认窗口',
      root: { id: 'root', type: 'container' },
    };
    const result = UIInstanceSchema.parse(data);
    expect(result.width).toBe(600);
    expect(result.height).toBe(400);
    expect(result.event_handlers).toEqual({});
  });

  it('应该支持自定义宽高和事件处理器', () => {
    const data = {
      title: '自定义窗口',
      width: 1024,
      height: 768,
      root: { id: 'root', type: 'container' },
      event_handlers: {
        onClick: 'console.log("clicked")',
        onSubmit: 'console.log("submitted")',
      },
    };
    const result = UIInstanceSchema.parse(data);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
    expect(result.event_handlers).toEqual({
      onClick: 'console.log("clicked")',
      onSubmit: 'console.log("submitted")',
    });
  });
});

describe('listAllComponents', () => {
  it('应该递归收集所有组件', () => {
    const instance: UIInstance = UIInstanceSchema.parse({
      title: '测试',
      root: {
        id: 'root',
        type: 'container',
        children: [
          { id: 'btn-1', type: 'button', text: '按钮1' },
          {
            id: 'inner',
            type: 'container',
            children: [
              { id: 'btn-2', type: 'button', text: '按钮2' },
              { id: 'lbl-1', type: 'label', text: '标签' },
            ],
          },
        ],
      },
    });
    const all = listAllComponents(instance);
    // root + btn-1 + inner + btn-2 + lbl-1 = 5
    expect(all).toHaveLength(5);
  });

  it('应该处理没有子组件的根组件', () => {
    const instance: UIInstance = UIInstanceSchema.parse({
      title: '空窗口',
      root: { id: 'root', type: 'container' },
    });
    const all = listAllComponents(instance);
    // 只有root
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('root');
  });

  it('应该处理非容器根组件', () => {
    const instance: UIInstance = UIInstanceSchema.parse({
      title: '按钮窗口',
      root: { id: 'single-btn', type: 'button', text: '唯一按钮' },
    });
    const all = listAllComponents(instance);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('single-btn');
  });
});

describe('findComponentById', () => {
  const instance: UIInstance = UIInstanceSchema.parse({
    title: '查找测试',
    root: {
      id: 'root',
      type: 'container',
      children: [
        { id: 'btn-1', type: 'button', text: '按钮' },
        {
          id: 'inner',
          type: 'container',
          children: [
            { id: 'lbl-deep', type: 'label', text: '深层标签' },
          ],
        },
      ],
    },
  });

  it('应该找到根组件', () => {
    const found = findComponentById(instance, 'root');
    expect(found).toBeDefined();
    expect(found!.id).toBe('root');
    expect(found!.type).toBe('container');
  });

  it('应该找到直接子组件', () => {
    const found = findComponentById(instance, 'btn-1');
    expect(found).toBeDefined();
    expect(found!.type).toBe('button');
  });

  it('应该找到深层嵌套组件', () => {
    const found = findComponentById(instance, 'lbl-deep');
    expect(found).toBeDefined();
    expect(found!.type).toBe('label');
  });

  it('应该对不存在的ID返回undefined', () => {
    const found = findComponentById(instance, 'nonexistent');
    expect(found).toBeUndefined();
  });
});
