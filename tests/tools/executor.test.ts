import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../src/tools/registry.js';
import { ToolExecutor } from '../../src/tools/executor.js';
import type { ToolDefinition } from '../../src/tools/types.js';

// 抑制日志输出
beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ToolExecutor', () => {
  it('应该成功执行已注册的工具', async () => {
    const registry = new ToolRegistry(false);
    const tool: ToolDefinition = {
      name: 'greet',
      description: '打招呼工具',
      parameters: z.object({ name: z.string() }),
      async execute(params: unknown) {
        const { name } = params as { name: string };
        return { message: `你好, ${name}!` };
      },
    };
    registry.register(tool);

    const executor = new ToolExecutor(registry);
    const result = await executor.callFunction('greet', { name: '世界' });
    expect(result).toEqual({ message: '你好, 世界!' });
  });

  it('调用不存在的工具应抛出错误', async () => {
    const registry = new ToolRegistry(false);
    const executor = new ToolExecutor(registry);

    await expect(
      executor.callFunction('nonexistent', {}),
    ).rejects.toThrow('不存在');
  });

  it('工具执行失败应抛出错误', async () => {
    const registry = new ToolRegistry(false);
    const tool: ToolDefinition = {
      name: 'failing_tool',
      description: '总是失败的工具',
      parameters: z.object({}),
      async execute(_params: unknown) {
        throw new Error('内部错误');
      },
    };
    registry.register(tool);

    const executor = new ToolExecutor(registry);
    await expect(
      executor.callFunction('failing_tool', {}),
    ).rejects.toThrow('执行失败');
  });

  it('参数校验失败应抛出错误', async () => {
    const registry = new ToolRegistry(false);
    const tool: ToolDefinition = {
      name: 'strict_tool',
      description: '参数严格的工具',
      parameters: z.object({ count: z.number() }),
      async execute(params: unknown) {
        return params;
      },
    };
    registry.register(tool);

    const executor = new ToolExecutor(registry);
    // 传入字符串而非数字, 应该校验失败
    await expect(
      executor.callFunction('strict_tool', { count: 'not_a_number' }),
    ).rejects.toThrow();
  });

  it('应该将校验后的参数传递给工具', async () => {
    const registry = new ToolRegistry(false);
    const executeSpy = vi.fn().mockResolvedValue({ ok: true });
    const tool: ToolDefinition = {
      name: 'spy_tool',
      description: '间谍工具',
      parameters: z.object({
        value: z.string(),
        count: z.number().default(1),
      }),
      execute: executeSpy,
    };
    registry.register(tool);

    const executor = new ToolExecutor(registry);
    await executor.callFunction('spy_tool', { value: 'test' });

    expect(executeSpy).toHaveBeenCalledTimes(1);
    // Zod 应该填充默认值
    expect(executeSpy).toHaveBeenCalledWith({ value: 'test', count: 1 });
  });
});
