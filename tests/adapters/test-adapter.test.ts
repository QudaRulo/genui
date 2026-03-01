// -*- coding: utf-8 -*-
// TestAdapter 单元测试

import { describe, it, expect, beforeEach } from 'vitest';
import { TestAdapter } from '../../src/adapters/test-adapter.js';
import { UIInstanceSchema, type UIInstance } from '../../src/core/ui-instance.js';

describe('TestAdapter', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  it('name属性应该返回test', () => {
    expect(adapter.name).toBe('test');
  });

  it('runEventLoop应该立即resolve', async () => {
    await expect(adapter.runEventLoop()).resolves.toBeUndefined();
  });

  describe('createWindow - 渲染组件', () => {
    it('应该渲染简单组件并创建VirtualWidget', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '测试窗口',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '点击' },
            { id: 'label1', type: 'label', text: '你好' },
            { id: 'input1', type: 'text_input', default_value: '默认值' },
          ],
        },
      });

      await adapter.createWindow(instance);

      // 应该注册所有组件(含root容器)
      expect(adapter.getWidget('root')).toBeDefined();
      expect(adapter.getWidget('btn1')).toBeDefined();
      expect(adapter.getWidget('label1')).toBeDefined();
      expect(adapter.getWidget('input1')).toBeDefined();
    });

    it('应该根据组件类型设置初始值', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '初始值测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'input1', type: 'text_input', default_value: '初始文本' },
            { id: 'input2', type: 'text_input' },
            { id: 'chk1', type: 'checkbox', label: '选项', checked: true },
            { id: 'chk2', type: 'checkbox', label: '选项2' },
            {
              id: 'radio1',
              type: 'radio_group',
              label: '单选',
              options: ['A', 'B'],
              selected: 'B',
            },
            {
              id: 'dd1',
              type: 'dropdown',
              options: ['X', 'Y'],
              selected: 'X',
            },
            { id: 'lbl1', type: 'label', text: '标签文本' },
            { id: 'btn1', type: 'button', text: '按钮' },
          ],
        },
      });

      await adapter.createWindow(instance);

      expect(adapter.getOutput('input1')).toBe('初始文本');
      expect(adapter.getOutput('input2')).toBe('');
      expect(adapter.getOutput('chk1')).toBe(true);
      expect(adapter.getOutput('chk2')).toBe(false);
      expect(adapter.getOutput('radio1')).toBe('B');
      expect(adapter.getOutput('dd1')).toBe('X');
      expect(adapter.getOutput('lbl1')).toBe('标签文本');
      expect(adapter.getOutput('btn1')).toBeNull();
    });
  });

  describe('模拟输入和按钮点击', () => {
    it('应该通过setInput设置文本值并通过getOutput读取', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '输入测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'input1', type: 'text_input' },
          ],
        },
      });

      await adapter.createWindow(instance);
      adapter.setInput('input1', '新值');
      expect(adapter.getOutput('input1')).toBe('新值');
    });

    it('应该通过click触发事件处理器并改变状态', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '点击测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '点击我', on_click: 'handle_click' },
            { id: 'label1', type: 'label', text: '初始' },
          ],
        },
        event_handlers: {
          handle_click:
            "function handle_click() { setValue('label1', '已点击!'); display('完成'); }",
        },
      });

      await adapter.createWindow(instance);

      expect(adapter.getOutput('label1')).toBe('初始');

      adapter.click('btn1');

      expect(adapter.getOutput('label1')).toBe('已点击!');
    });
  });

  describe('事件记录', () => {
    it('应该记录click事件', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '事件记录测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '按钮', on_click: 'noop' },
          ],
        },
        event_handlers: {
          noop: 'function noop() {}',
        },
      });

      await adapter.createWindow(instance);
      adapter.click('btn1');

      const events = adapter.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(['click', 'btn1']);
    });

    it('应该记录多个事件并支持清除', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '多事件测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '按钮', on_click: 'noop' },
            { id: 'chk1', type: 'checkbox', label: '选项', on_change: 'noop' },
          ],
        },
        event_handlers: {
          noop: 'function noop() {}',
        },
      });

      await adapter.createWindow(instance);
      adapter.click('btn1');
      adapter.check('chk1', true);

      expect(adapter.getEvents()).toHaveLength(2);

      adapter.clearEvents();
      expect(adapter.getEvents()).toHaveLength(0);
    });
  });

  describe('display输出记录', () => {
    it('应该记录display调用的消息', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: 'display测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '按钮', on_click: 'show_msg' },
          ],
        },
        event_handlers: {
          show_msg:
            "function show_msg() { display('你好世界'); display('第二条消息'); }",
        },
      });

      await adapter.createWindow(instance);
      adapter.click('btn1');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toHaveLength(2);
      expect(outputs[0]).toBe('你好世界');
      expect(outputs[1]).toBe('第二条消息');
    });

    it('应该支持清除display输出', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: 'display清除测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'btn1', type: 'button', text: '按钮', on_click: 'show_msg' },
          ],
        },
        event_handlers: {
          show_msg: "function show_msg() { display('消息'); }",
        },
      });

      await adapter.createWindow(instance);
      adapter.click('btn1');
      expect(adapter.getDisplayOutputs()).toHaveLength(1);

      adapter.clearOutputs();
      expect(adapter.getDisplayOutputs()).toHaveLength(0);
    });
  });

  describe('checkbox交互', () => {
    it('应该通过check设置checkbox值并触发change事件', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: 'checkbox测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            {
              id: 'chk1',
              type: 'checkbox',
              label: '同意',
              on_change: 'on_check',
            },
            { id: 'status', type: 'label', text: '未选中' },
          ],
        },
        event_handlers: {
          on_check:
            "function on_check() { var v = getValue('chk1'); setValue('status', v ? '已选中' : '未选中'); }",
        },
      });

      await adapter.createWindow(instance);
      expect(adapter.getOutput('chk1')).toBe(false);
      expect(adapter.getOutput('status')).toBe('未选中');

      adapter.check('chk1', true);
      expect(adapter.getOutput('chk1')).toBe(true);
      expect(adapter.getOutput('status')).toBe('已选中');

      adapter.check('chk1', false);
      expect(adapter.getOutput('chk1')).toBe(false);
      expect(adapter.getOutput('status')).toBe('未选中');
    });
  });

  describe('dropdown选择', () => {
    it('应该通过select设置dropdown值并触发change事件', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: 'dropdown测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            {
              id: 'dd1',
              type: 'dropdown',
              options: ['苹果', '香蕉', '橙子'],
            },
          ],
        },
      });

      await adapter.createWindow(instance);
      expect(adapter.getOutput('dd1')).toBeNull();

      adapter.select('dd1', '香蕉');
      expect(adapter.getOutput('dd1')).toBe('香蕉');
    });

    it('应该通过select设置radio_group值', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: 'radio_group测试',
        root: {
          id: 'root',
          type: 'container',
          children: [
            {
              id: 'radio1',
              type: 'radio_group',
              label: '选择',
              options: ['A', 'B', 'C'],
              on_change: 'on_radio',
            },
            { id: 'result', type: 'label', text: '' },
          ],
        },
        event_handlers: {
          on_radio:
            "function on_radio() { setValue('result', '选择了: ' + getValue('radio1')); }",
        },
      });

      await adapter.createWindow(instance);
      adapter.select('radio1', 'B');
      expect(adapter.getOutput('radio1')).toBe('B');
      expect(adapter.getOutput('result')).toBe('选择了: B');
    });
  });

  describe('计算器流程', () => {
    it('应该支持输入-计算-显示结果的完整流程', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '计算器',
        root: {
          id: 'root',
          type: 'container',
          children: [
            { id: 'num1', type: 'text_input', placeholder: '数字1' },
            { id: 'num2', type: 'text_input', placeholder: '数字2' },
            { id: 'calc_btn', type: 'button', text: '计算', on_click: 'calculate' },
            { id: 'result', type: 'label', text: '' },
          ],
        },
        event_handlers: {
          calculate:
            "function calculate() { var n1 = parseFloat(getValue('num1')); var n2 = parseFloat(getValue('num2')); setValue('result', '结果: ' + (n1 + n2)); display('计算完成'); }",
        },
      });

      await adapter.createWindow(instance);

      // 设置输入
      adapter.setInput('num1', '10');
      adapter.setInput('num2', '20');

      // 点击计算
      adapter.click('calc_btn');

      // 验证结果
      expect(adapter.getOutput('result')).toBe('结果: 30');

      // 验证display输出
      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toBe('计算完成');

      // 验证事件记录
      const events = adapter.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(['click', 'calc_btn']);
    });
  });

  describe('getWidget', () => {
    it('应该对不存在的widget返回undefined', () => {
      expect(adapter.getWidget('nonexistent')).toBeUndefined();
    });
  });

  describe('嵌套容器渲染', () => {
    it('应该递归渲染嵌套容器中的组件', async () => {
      const instance: UIInstance = UIInstanceSchema.parse({
        title: '嵌套容器',
        root: {
          id: 'root',
          type: 'container',
          children: [
            {
              id: 'inner',
              type: 'container',
              children: [
                { id: 'deep_btn', type: 'button', text: '深层按钮', on_click: 'deep_click' },
                { id: 'deep_lbl', type: 'label', text: '深层标签' },
              ],
            },
          ],
        },
        event_handlers: {
          deep_click:
            "function deep_click() { setValue('deep_lbl', '深层点击!'); }",
        },
      });

      await adapter.createWindow(instance);

      expect(adapter.getWidget('deep_btn')).toBeDefined();
      expect(adapter.getWidget('deep_lbl')).toBeDefined();

      adapter.click('deep_btn');
      expect(adapter.getOutput('deep_lbl')).toBe('深层点击!');
    });
  });
});
