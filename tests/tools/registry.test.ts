import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../src/tools/registry.js';
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

/**
 * 创建一个测试用的工具定义
 */
function createMockTool(name: string, description: string = '测试工具'): ToolDefinition {
  return {
    name,
    description,
    parameters: z.object({ input: z.string() }),
    async execute(params: unknown) {
      const { input } = params as { input: string };
      return { output: `处理: ${input}` };
    },
  };
}

describe('ToolRegistry', () => {
  describe('基础功能(不加载内置工具)', () => {
    it('不加载内置工具时, 注册表应为空', () => {
      const registry = new ToolRegistry(false);
      expect(registry.getAllTools()).toHaveLength(0);
    });

    it('应该能注册并获取工具', () => {
      const registry = new ToolRegistry(false);
      const tool = createMockTool('test_tool', '这是一个测试工具');
      registry.register(tool);

      const found = registry.getTool('test_tool');
      expect(found).toBeDefined();
      expect(found!.name).toBe('test_tool');
      expect(found!.description).toBe('这是一个测试工具');
    });

    it('获取不存在的工具应返回 undefined', () => {
      const registry = new ToolRegistry(false);
      const found = registry.getTool('nonexistent');
      expect(found).toBeUndefined();
    });

    it('应该能注册多个工具并获取全部', () => {
      const registry = new ToolRegistry(false);
      registry.register(createMockTool('tool_a', '工具A'));
      registry.register(createMockTool('tool_b', '工具B'));
      registry.register(createMockTool('tool_c', '工具C'));

      const allTools = registry.getAllTools();
      expect(allTools).toHaveLength(3);
      const names = allTools.map((t) => t.name);
      expect(names).toContain('tool_a');
      expect(names).toContain('tool_b');
      expect(names).toContain('tool_c');
    });

    it('重复注册同名工具应覆盖', () => {
      const registry = new ToolRegistry(false);
      registry.register(createMockTool('dup', '第一个'));
      registry.register(createMockTool('dup', '第二个'));

      const allTools = registry.getAllTools();
      expect(allTools).toHaveLength(1);
      expect(allTools[0]!.description).toBe('第二个');
    });
  });

  describe('getToolsDescription', () => {
    it('没有工具时应返回提示信息', () => {
      const registry = new ToolRegistry(false);
      const desc = registry.getToolsDescription();
      expect(desc).toContain('没有可用的工具');
    });

    it('应该生成所有工具的 markdown 描述', () => {
      const registry = new ToolRegistry(false);
      registry.register(createMockTool('calc', '计算工具'));
      registry.register(createMockTool('query', '查询工具'));

      const desc = registry.getToolsDescription();
      expect(desc).toContain('# 可用工具');
      expect(desc).toContain('## calc');
      expect(desc).toContain('计算工具');
      expect(desc).toContain('## query');
      expect(desc).toContain('查询工具');
    });

    it('应该能按名称过滤工具描述', () => {
      const registry = new ToolRegistry(false);
      registry.register(createMockTool('calc', '计算工具'));
      registry.register(createMockTool('query', '查询工具'));
      registry.register(createMockTool('file', '文件工具'));

      const desc = registry.getToolsDescription(['calc', 'file']);
      expect(desc).toContain('## calc');
      expect(desc).toContain('计算工具');
      expect(desc).toContain('## file');
      expect(desc).toContain('文件工具');
      expect(desc).not.toContain('## query');
    });

    it('过滤不存在的工具名称时应忽略', () => {
      const registry = new ToolRegistry(false);
      registry.register(createMockTool('calc', '计算工具'));

      const desc = registry.getToolsDescription(['calc', 'nonexistent']);
      expect(desc).toContain('## calc');
      expect(desc).not.toContain('nonexistent');
    });
  });

  describe('加载内置工具', () => {
    it('loadBuiltin=true 时应异步加载内置工具', async () => {
      const registry = new ToolRegistry(true);
      // 等待异步加载完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      const allTools = registry.getAllTools();
      expect(allTools.length).toBeGreaterThanOrEqual(6);
      expect(registry.getTool('calculate')).toBeDefined();
      expect(registry.getTool('convert_unit')).toBeDefined();
      expect(registry.getTool('get_weather')).toBeDefined();
      expect(registry.getTool('get_current_time')).toBeDefined();
      expect(registry.getTool('read_text_file')).toBeDefined();
      expect(registry.getTool('list_directory')).toBeDefined();
    });
  });
});
