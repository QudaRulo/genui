// -*- coding: utf-8 -*-
// Renderer 单元测试

import { describe, it, expect } from 'vitest';
import { Renderer } from '../src/renderer/renderer.js';
import { TestAdapter } from '../src/adapters/test-adapter.js';
import { UIInstanceSchema, type UIInstance } from '../src/core/ui-instance.js';

describe('Renderer', () => {
  it('应该使用TestAdapter渲染UIInstance并可访问组件', async () => {
    const adapter = new TestAdapter();
    const renderer = new Renderer(adapter);

    const instance: UIInstance = UIInstanceSchema.parse({
      title: '渲染器测试窗口',
      root: {
        id: 'root',
        type: 'container',
        children: [
          { id: 'btn1', type: 'button', text: '点击' },
          { id: 'label1', type: 'label', text: '你好' },
        ],
      },
    });

    await renderer.render(instance);

    // 验证组件已通过适配器正确渲染
    expect(adapter.getWidget('root')).toBeDefined();
    expect(adapter.getWidget('btn1')).toBeDefined();
    expect(adapter.getWidget('label1')).toBeDefined();
    expect(adapter.getOutput('label1')).toBe('你好');
  });

  it('应该支持传入toolExecutor参数构造', async () => {
    const adapter = new TestAdapter();
    // 使用undefined作为toolExecutor, 验证构造不抛出异常
    const renderer = new Renderer(adapter, undefined);

    const instance: UIInstance = UIInstanceSchema.parse({
      title: '工具执行器测试',
      root: {
        id: 'root',
        type: 'container',
        children: [
          { id: 'label1', type: 'label', text: '测试' },
        ],
      },
    });

    await renderer.render(instance);
    expect(adapter.getWidget('label1')).toBeDefined();
  });
});
