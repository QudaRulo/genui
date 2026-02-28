// -*- coding: utf-8 -*-
// TerminalAdapter单元测试 (测试Store和事件处理器编译, 不测试Ink渲染)

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentStore } from '../src/adapters/terminal/store.js';
import { TerminalAdapter } from '../src/adapters/terminal-adapter.js';
import type { UIInstance } from '../src/core/ui-instance.js';

// ============================================================
// ComponentStore 测试
// ============================================================

describe('ComponentStore', () => {
  let store: ComponentStore;

  beforeEach(() => {
    store = new ComponentStore();
  });

  describe('initValue / getValue / setValue', () => {
    it('应该能初始化和获取值', () => {
      store.initValue('input1', 'hello');
      expect(store.getValue('input1')).toBe('hello');
    });

    it('getValue应该对不存在的ID抛出错误', () => {
      expect(() => store.getValue('nonexistent')).toThrow('组件不存在');
    });

    it('setValue应该更新值', () => {
      store.initValue('input1', 'old');
      store.setValue('input1', 'new');
      expect(store.getValue('input1')).toBe('new');
    });

    it('has应该正确检查组件是否存在', () => {
      expect(store.has('input1')).toBe(false);
      store.initValue('input1', 'val');
      expect(store.has('input1')).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('setValue应该通知订阅者', () => {
      store.initValue('input1', '');
      let notifyCount = 0;
      store.subscribe(() => { notifyCount++; });
      store.setValue('input1', 'changed');
      expect(notifyCount).toBe(1);
    });

    it('initValue不应该通知订阅者', () => {
      let notifyCount = 0;
      store.subscribe(() => { notifyCount++; });
      store.initValue('input1', 'initial');
      expect(notifyCount).toBe(0);
    });

    it('取消订阅后不再收到通知', () => {
      store.initValue('input1', '');
      let notifyCount = 0;
      const unsub = store.subscribe(() => { notifyCount++; });
      store.setValue('input1', 'a');
      expect(notifyCount).toBe(1);
      unsub();
      store.setValue('input1', 'b');
      expect(notifyCount).toBe(1);
    });

    it('多个订阅者都应该收到通知', () => {
      store.initValue('input1', '');
      let count1 = 0;
      let count2 = 0;
      store.subscribe(() => { count1++; });
      store.subscribe(() => { count2++; });
      store.setValue('input1', 'x');
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('display', () => {
    it('应该记录display输出', () => {
      store.display('消息1');
      store.display('消息2');
      expect(store.getDisplayOutputs()).toEqual(['消息1', '消息2']);
    });

    it('display应该通知订阅者', () => {
      let notifyCount = 0;
      store.subscribe(() => { notifyCount++; });
      store.display('hello');
      expect(notifyCount).toBe(1);
    });
  });

  describe('getSnapshot', () => {
    it('每次变更应该递增版本号', () => {
      store.initValue('a', '');
      const v1 = store.getSnapshot();
      store.setValue('a', 'x');
      const v2 = store.getSnapshot();
      store.display('msg');
      const v3 = store.getSnapshot();
      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });
  });
});

// ============================================================
// TerminalAdapter 测试 (不含Ink渲染)
// ============================================================

describe('TerminalAdapter', () => {
  /** 创建测试用UIInstance */
  function createTestInstance(): UIInstance {
    return {
      title: '测试窗口',
      width: 400,
      height: 300,
      root: {
        id: 'main',
        type: 'container',
        layout: 'vertical',
        children: [
          { id: 'title_label', type: 'label', text: '欢迎', font_size: 16, bold: true },
          { id: 'name_input', type: 'text_input', placeholder: '输入姓名', default_value: '张三', multiline: false },
          { id: 'agree_cb', type: 'checkbox', label: '同意协议', checked: true },
          { id: 'gender_radio', type: 'radio_group', label: '性别', options: ['男', '女'], selected: '男' },
          { id: 'city_dd', type: 'dropdown', label: '城市', options: ['北京', '上海'], selected: '北京' },
          { id: 'ok_btn', type: 'button', text: '确定', on_click: 'handle_ok', enabled: true },
          { id: 'result_label', type: 'label', text: '', font_size: 12, bold: false },
        ],
        padding: 10,
        spacing: 5,
      },
      event_handlers: {
        handle_ok: 'function handle_ok() { var name = getValue("name_input"); setValue("result_label", "你好, " + name); display("确定被点击"); }',
      },
    };
  }

  describe('基本属性', () => {
    it('名称应该是terminal', () => {
      const adapter = new TerminalAdapter();
      expect(adapter.name).toBe('terminal');
    });
  });

  describe('createWindow - 组件初始化', () => {
    it('应该初始化所有组件值', async () => {
      const adapter = new TerminalAdapter();
      await adapter.createWindow(createTestInstance());
      const store = adapter.getStore();

      expect(store.getValue('title_label')).toBe('欢迎');
      expect(store.getValue('name_input')).toBe('张三');
      expect(store.getValue('agree_cb')).toBe(true);
      expect(store.getValue('gender_radio')).toBe('男');
      expect(store.getValue('city_dd')).toBe('北京');
      expect(store.getValue('result_label')).toBe('');
    });

    it('应该编译事件处理器', async () => {
      const adapter = new TerminalAdapter();
      await adapter.createWindow(createTestInstance());
      const handlers = adapter.getHandlers();

      expect(handlers.has('handle_ok')).toBe(true);
      expect(typeof handlers.get('handle_ok')).toBe('function');
    });
  });

  describe('事件处理器执行', () => {
    it('事件处理器应该能读写组件值', async () => {
      const adapter = new TerminalAdapter();
      await adapter.createWindow(createTestInstance());
      const handlers = adapter.getHandlers();
      const store = adapter.getStore();

      // 执行handle_ok
      const handleOk = handlers.get('handle_ok')!;
      handleOk();

      expect(store.getValue('result_label')).toBe('你好, 张三');
    });

    it('事件处理器应该能调用display', async () => {
      const adapter = new TerminalAdapter();
      await adapter.createWindow(createTestInstance());
      const handlers = adapter.getHandlers();
      const store = adapter.getStore();

      handlers.get('handle_ok')!();

      expect(store.getDisplayOutputs()).toContain('确定被点击');
    });

    it('修改输入后执行处理器应该读取新值', async () => {
      const adapter = new TerminalAdapter();
      await adapter.createWindow(createTestInstance());
      const handlers = adapter.getHandlers();
      const store = adapter.getStore();

      store.setValue('name_input', '李四');
      handlers.get('handle_ok')!();

      expect(store.getValue('result_label')).toBe('你好, 李四');
    });
  });

  describe('多处理器', () => {
    it('应该支持多个事件处理器', async () => {
      const adapter = new TerminalAdapter();
      const instance: UIInstance = {
        title: '多处理器测试',
        width: 400,
        height: 300,
        root: {
          id: 'root',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'counter', type: 'label', text: '0', font_size: 12, bold: false },
            { id: 'inc_btn', type: 'button', text: '+', on_click: 'handle_inc', enabled: true },
            { id: 'dec_btn', type: 'button', text: '-', on_click: 'handle_dec', enabled: true },
          ],
          padding: 10,
          spacing: 5,
        },
        event_handlers: {
          handle_inc: 'function handle_inc() { var v = parseInt(getValue("counter")); setValue("counter", String(v + 1)); display("递增"); }',
          handle_dec: 'function handle_dec() { var v = parseInt(getValue("counter")); setValue("counter", String(v - 1)); display("递减"); }',
        },
      };

      await adapter.createWindow(instance);
      const handlers = adapter.getHandlers();
      const store = adapter.getStore();

      handlers.get('handle_inc')!();
      handlers.get('handle_inc')!();
      expect(store.getValue('counter')).toBe('2');

      handlers.get('handle_dec')!();
      expect(store.getValue('counter')).toBe('1');

      expect(store.getDisplayOutputs()).toEqual(['递增', '递增', '递减']);
    });
  });
});
