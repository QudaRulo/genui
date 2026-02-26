// -*- coding: utf-8 -*-
// 端到端无头测试, 使用TestAdapter在无GUI环境中验证完整UI交互流程

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  UIInstanceSchema,
  TestAdapter,
  Renderer,
  ToolRegistry,
  ToolExecutor,
  type UIInstance,
  type ToolDefinition,
} from '../../src/index.js';

describe('E2E Headless Tests', () => {
  let adapter: TestAdapter;
  let renderer: Renderer;

  beforeEach(() => {
    adapter = new TestAdapter();
    renderer = new Renderer(adapter);
  });

  // ============================================================
  // Test 1: 按钮点击更新标签
  // ============================================================
  describe('Test 1: 按钮点击更新标签', () => {
    it('点击按钮后label文本应更新, 并记录display输出', async () => {
      const ui: UIInstance = UIInstanceSchema.parse({
        title: '测试',
        root: {
          id: 'main',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'label1', type: 'label', text: 'Hello' },
            { id: 'btn1', type: 'button', text: 'Click', on_click: 'handle_click' },
          ],
        },
        event_handlers: {
          handle_click:
            "function handle_click() { setValue('label1', 'Clicked!'); display('Button clicked'); }",
        },
      });

      await renderer.render(ui);

      // 初始状态验证
      expect(adapter.getOutput('label1')).toBe('Hello');

      // 模拟点击
      adapter.click('btn1');

      // 验证label已更新
      expect(adapter.getOutput('label1')).toBe('Clicked!');

      // 验证display输出
      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toBe('Button clicked');

      // 验证事件记录
      const events = adapter.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(['click', 'btn1']);
    });
  });

  // ============================================================
  // Test 2: 计算器流程
  // ============================================================
  describe('Test 2: 计算器流程', () => {
    let calcUi: UIInstance;

    beforeEach(() => {
      calcUi = UIInstanceSchema.parse({
        title: '计算器',
        root: {
          id: 'root',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'num1', type: 'text_input', placeholder: '数字1' },
            {
              id: 'op',
              type: 'dropdown',
              options: ['+', '-', '*', '/'],
              selected: '+',
            },
            { id: 'num2', type: 'text_input', placeholder: '数字2' },
            { id: 'result', type: 'label', text: '' },
            { id: 'calc', type: 'button', text: '计算', on_click: 'do_calc' },
          ],
        },
        event_handlers: {
          do_calc: `function do_calc() {
            var a = parseFloat(getValue('num1'));
            var b = parseFloat(getValue('num2'));
            var operator = getValue('op');
            if (isNaN(a) || isNaN(b)) {
              setValue('result', '错误: 请输入有效数字');
              display('输入无效');
              return;
            }
            var res;
            if (operator === '+') res = a + b;
            else if (operator === '-') res = a - b;
            else if (operator === '*') res = a * b;
            else if (operator === '/') {
              if (b === 0) {
                setValue('result', '错误: 除数不能为零');
                display('除零错误');
                return;
              }
              res = a / b;
            }
            setValue('result', '结果: ' + res);
            display('计算完成');
          }`,
        },
      });
    });

    it('加法: 10 + 5 = 15', async () => {
      await renderer.render(calcUi);

      adapter.setInput('num1', '10');
      adapter.setInput('num2', '5');
      adapter.select('op', '+');
      adapter.click('calc');

      expect(adapter.getOutput('result')).toBe('结果: 15');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('计算完成');
    });

    it('除零应显示错误', async () => {
      await renderer.render(calcUi);

      adapter.setInput('num1', '10');
      adapter.setInput('num2', '0');
      adapter.select('op', '/');
      adapter.click('calc');

      expect(adapter.getOutput('result')).toBe('错误: 除数不能为零');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('除零错误');
    });

    it('减法: 20 - 8 = 12', async () => {
      await renderer.render(calcUi);

      adapter.setInput('num1', '20');
      adapter.setInput('num2', '8');
      adapter.select('op', '-');
      adapter.click('calc');

      expect(adapter.getOutput('result')).toBe('结果: 12');
    });

    it('乘法: 3 * 7 = 21', async () => {
      await renderer.render(calcUi);

      adapter.setInput('num1', '3');
      adapter.setInput('num2', '7');
      adapter.select('op', '*');
      adapter.click('calc');

      expect(adapter.getOutput('result')).toBe('结果: 21');
    });

    it('无效输入应显示错误', async () => {
      await renderer.render(calcUi);

      adapter.setInput('num1', 'abc');
      adapter.setInput('num2', '5');
      adapter.click('calc');

      expect(adapter.getOutput('result')).toBe('错误: 请输入有效数字');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('输入无效');
    });
  });

  // ============================================================
  // Test 3: 带checkbox的登录表单
  // ============================================================
  describe('Test 3: 带checkbox的登录表单', () => {
    let formUi: UIInstance;

    beforeEach(() => {
      formUi = UIInstanceSchema.parse({
        title: '登录表单',
        root: {
          id: 'root',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'username', type: 'text_input', placeholder: '用户名' },
            { id: 'password', type: 'text_input', placeholder: '密码' },
            { id: 'remember', type: 'checkbox', label: '记住我' },
            { id: 'message', type: 'label', text: '' },
            { id: 'login', type: 'button', text: '登录', on_click: 'do_login' },
          ],
        },
        event_handlers: {
          do_login: `function do_login() {
            var user = getValue('username');
            var pass = getValue('password');
            var rem = getValue('remember');
            if (!user || !pass) {
              setValue('message', '错误: 用户名和密码不能为空');
              display('登录失败');
              return;
            }
            var msg = '欢迎, ' + user + '!';
            if (rem) {
              msg += ' (记住登录)';
            }
            setValue('message', msg);
            display('登录成功');
          }`,
        },
      });
    });

    it('空输入应显示错误消息', async () => {
      await renderer.render(formUi);

      // 不输入任何内容直接点击登录
      adapter.click('login');

      expect(adapter.getOutput('message')).toBe('错误: 用户名和密码不能为空');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('登录失败');
    });

    it('有效输入应显示欢迎消息', async () => {
      await renderer.render(formUi);

      adapter.setInput('username', 'admin');
      adapter.setInput('password', 'secret123');
      adapter.click('login');

      expect(adapter.getOutput('message')).toBe('欢迎, admin!');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('登录成功');
    });

    it('勾选记住我后消息应包含"记住"', async () => {
      await renderer.render(formUi);

      adapter.setInput('username', 'admin');
      adapter.setInput('password', 'secret123');
      adapter.check('remember', true);
      adapter.click('login');

      const message = adapter.getOutput('message') as string;
      expect(message).toContain('欢迎, admin!');
      expect(message).toContain('记住');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('登录成功');
    });

    it('只输入用户名不输入密码应显示错误', async () => {
      await renderer.render(formUi);

      adapter.setInput('username', 'admin');
      // 不输入密码
      adapter.click('login');

      expect(adapter.getOutput('message')).toBe('错误: 用户名和密码不能为空');
    });
  });

  // ============================================================
  // Test 4: 工具集成
  // ============================================================
  describe('Test 4: 工具集成', () => {
    it('自定义工具注册和执行应返回正确结果', async () => {
      // 1. 创建工具注册表(不加载内置工具)
      const registry = new ToolRegistry(false);

      // 2. 注册自定义add_numbers工具
      const addNumbersTool: ToolDefinition = {
        name: 'add_numbers',
        description: '将两个数字相加',
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async (params: unknown): Promise<unknown> => {
          const { a, b } = params as { a: number; b: number };
          return { result: a + b };
        },
      };
      registry.register(addNumbersTool);

      // 3. 创建工具执行器
      const executor = new ToolExecutor(registry);

      // 4. 验证工具可以正确执行
      const toolResult = await executor.callFunction('add_numbers', {
        a: 10,
        b: 25,
      });
      expect(toolResult).toEqual({ result: 35 });

      // 5. 创建UI, 使用callFunction调用内部处理器展示结果
      const ui: UIInstance = UIInstanceSchema.parse({
        title: '工具集成测试',
        root: {
          id: 'root',
          type: 'container',
          layout: 'vertical',
          children: [
            { id: 'num_a', type: 'text_input', placeholder: '数字A' },
            { id: 'num_b', type: 'text_input', placeholder: '数字B' },
            { id: 'result', type: 'label', text: '' },
            { id: 'add_btn', type: 'button', text: '相加', on_click: 'handle_add' },
          ],
        },
        event_handlers: {
          compute_sum: `function compute_sum(a, b) {
            return a + b;
          }`,
          handle_add: `function handle_add() {
            var a = parseFloat(getValue('num_a'));
            var b = parseFloat(getValue('num_b'));
            var sum = callFunction('compute_sum', a, b);
            setValue('result', '工具结果: ' + sum);
            display('工具调用完成');
          }`,
        },
      });

      // 6. 渲染并交互
      await renderer.render(ui);

      adapter.setInput('num_a', '10');
      adapter.setInput('num_b', '25');
      adapter.click('add_btn');

      // 7. 验证UI中展示了正确的工具执行结果
      expect(adapter.getOutput('result')).toBe('工具结果: 35');

      const outputs = adapter.getDisplayOutputs();
      expect(outputs).toContain('工具调用完成');
    });

    it('ToolExecutor对不存在的工具应抛出错误', async () => {
      const registry = new ToolRegistry(false);
      const executor = new ToolExecutor(registry);

      await expect(
        executor.callFunction('nonexistent_tool', {}),
      ).rejects.toThrow('不存在');
    });

    it('ToolExecutor对参数校验失败应抛出错误', async () => {
      const registry = new ToolRegistry(false);

      const strictTool: ToolDefinition = {
        name: 'strict_tool',
        description: '需要严格参数的工具',
        parameters: z.object({
          value: z.number(),
        }),
        execute: async (params: unknown): Promise<unknown> => {
          return params;
        },
      };
      registry.register(strictTool);

      const executor = new ToolExecutor(registry);

      // 传入错误类型的参数应该抛出
      await expect(
        executor.callFunction('strict_tool', { value: 'not_a_number' }),
      ).rejects.toThrow();
    });
  });
});
