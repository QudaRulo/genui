// -*- coding: utf-8 -*-
// WebAdapter单元测试

import { describe, it, expect, afterEach } from 'vitest';
import { WebAdapter } from '../src/adapters/web-adapter.js';
import type { UIInstance } from '../src/core/ui-instance.js';

/** 创建一个简单的UIInstance用于测试 */
function createTestInstance(): UIInstance {
  return {
    title: '测试窗口',
    width: 500,
    height: 400,
    root: {
      id: 'main',
      type: 'container',
      layout: 'vertical',
      children: [
        { id: 'title_label', type: 'label', text: '你好世界', font_size: 18, bold: true },
        { id: 'name_input', type: 'text_input', placeholder: '请输入姓名', default_value: '', multiline: false },
        { id: 'bio_input', type: 'text_input', placeholder: '个人简介', default_value: '默认值', multiline: true },
        {
          id: 'btn_row',
          type: 'container',
          layout: 'horizontal',
          children: [
            { id: 'ok_btn', type: 'button', text: '确定', on_click: 'handle_ok', enabled: true },
            { id: 'cancel_btn', type: 'button', text: '取消', enabled: false },
          ],
          padding: 5,
          spacing: 10,
        },
        { id: 'agree_cb', type: 'checkbox', label: '同意协议', checked: true },
        { id: 'gender_radio', type: 'radio_group', label: '性别', options: ['男', '女', '其他'], selected: '男' },
        { id: 'city_select', type: 'dropdown', label: '城市', options: ['北京', '上海', '广州'], selected: '上海', width: 200 },
      ],
      padding: 10,
      spacing: 8,
    },
    event_handlers: {
      handle_ok: 'function handle_ok() { var name = getValue("name_input"); setValue("title_label", "你好, " + name); display("点击了确定"); }',
    },
  };
}

/** 创建测试用WebAdapter(禁用浏览器自动打开) */
function createTestAdapter(): WebAdapter {
  return new WebAdapter(0, false);
}

describe('WebAdapter', () => {
  let adapter: WebAdapter;

  afterEach(() => {
    // 确保服务器关闭
    if (adapter) {
      adapter.close();
    }
  });

  describe('HTML生成', () => {
    it('应该生成包含标题的HTML页面', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      await adapter.createWindow(instance);
      const html = adapter.generateHtml(instance);

      expect(html).toContain('<title>测试窗口</title>');
      expect(html).toContain('测试窗口');
      expect(html).toContain('max-width:500px');
    });

    it('应该渲染label组件', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="title_label"');
      expect(html).toContain('class="genui-label"');
      expect(html).toContain('你好世界');
      expect(html).toContain('font-size:18px');
      expect(html).toContain('font-weight:bold');
    });

    it('应该渲染text_input组件(单行)', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="name_input"');
      expect(html).toContain('type="text"');
      expect(html).toContain('placeholder="请输入姓名"');
    });

    it('应该渲染text_input组件(多行textarea)', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('<textarea');
      expect(html).toContain('id="bio_input"');
      expect(html).toContain('默认值');
    });

    it('应该渲染button组件(带事件)', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="ok_btn"');
      expect(html).toContain('onclick="handle_ok()"');
      expect(html).toContain('确定');
    });

    it('应该渲染disabled按钮', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="cancel_btn"');
      expect(html).toContain('disabled');
      expect(html).toContain('取消');
    });

    it('应该渲染checkbox组件(默认选中)', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="agree_cb"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
      expect(html).toContain('同意协议');
    });

    it('应该渲染radio_group组件', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="gender_radio"');
      expect(html).toContain('<fieldset');
      expect(html).toContain('性别');
      expect(html).toContain('value="男"');
      expect(html).toContain('value="女"');
      expect(html).toContain('value="其他"');
    });

    it('应该渲染dropdown组件', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('id="city_select"');
      expect(html).toContain('<select');
      expect(html).toContain('城市');
      expect(html).toContain('<option');
      expect(html).toContain('上海');
      // 上海应该被选中
      expect(html).toMatch(/value="上海"\s+selected/);
    });

    it('应该渲染container的嵌套结构', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      // 主容器
      expect(html).toContain('id="main"');
      expect(html).toContain('genui-layout-vertical');

      // 嵌套的水平容器
      expect(html).toContain('id="btn_row"');
      expect(html).toContain('genui-layout-horizontal');
    });

    it('应该包含事件处理器代码', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('function handle_ok()');
      expect(html).toContain('getValue("name_input")');
    });

    it('应该包含辅助函数', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('function getValue(componentId)');
      expect(html).toContain('function setValue(componentId, value)');
      expect(html).toContain('function display(message)');
      expect(html).toContain('function callFunction(name, params)');
    });

    it('应该包含CSS样式', async () => {
      adapter = new WebAdapter(0, false);
      const instance = createTestInstance();
      const html = adapter.generateHtml(instance);

      expect(html).toContain('.genui-button');
      expect(html).toContain('.genui-text-input');
      expect(html).toContain('.genui-label');
    });

    it('应该正确转义HTML特殊字符', async () => {
      adapter = new WebAdapter(0, false);
      const instance: UIInstance = {
        title: '<script>alert("xss")</script>',
        width: 400,
        height: 300,
        root: {
          id: 'root',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'lbl', type: 'label', text: 'a & b < c > d "e"', font_size: 12, bold: false },
          ],
          padding: 10,
          spacing: 5,
        },
        event_handlers: {},
      };

      const html = adapter.generateHtml(instance);
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('a &amp; b');
    });
  });

  describe('适配器基本属性', () => {
    it('名称应该是web', () => {
      adapter = new WebAdapter(0, false);
      expect(adapter.name).toBe('web');
    });
  });

  describe('HTTP服务器', () => {
    it('应该能启动和关闭服务器', async () => {
      adapter = new WebAdapter(0, false); // 端口0让系统自动分配
      const instance: UIInstance = {
        title: '测试',
        width: 400,
        height: 300,
        root: { id: 'root', type: 'container', layout: 'vertical', children: [], padding: 10, spacing: 5 },
        event_handlers: {},
      };

      await adapter.createWindow(instance);

      // 启动服务器但立即关闭
      const loopPromise = adapter.runEventLoop();
      // 等一小段时间让服务器启动
      await new Promise((r) => setTimeout(r, 100));
      adapter.close();
      await loopPromise;
    });
  });
});
