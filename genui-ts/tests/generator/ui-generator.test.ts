// -*- coding: utf-8 -*-
// UIGenerator 单元测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIGenerator } from '../../src/generator/ui-generator.js';
import type { ToolRegistry } from '../../src/tools/registry.js';
import type { Provider } from '../../src/generator/llm-client.js';

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

/** 创建mock LLM客户端 */
function createMockLLMClient(): { provider: Provider; generate: ReturnType<typeof vi.fn> } {
  return {
    provider: 'openai' as const,
    generate: vi.fn(),
  };
}

/** 有效的UI JSON, 用于模拟阶段2的返回 */
const VALID_UI_JSON = JSON.stringify({
  title: '测试窗口',
  width: 600,
  height: 400,
  root: {
    id: 'root',
    type: 'container',
    layout: 'vertical',
    children: [
      { id: 'label1', type: 'label', text: '你好世界' },
    ],
    padding: 10,
    spacing: 5,
  },
  event_handlers: {},
});

describe('UIGenerator.extractJson', () => {
  it('应移除markdown代码块标记', () => {
    const mockClient = createMockLLMClient();
    const generator = new UIGenerator(mockClient as never);

    const input = '```json\n{"title": "测试"}\n```';
    const result = generator.extractJson(input);
    expect(result).toBe('{"title": "测试"}');
  });

  it('应原样返回纯JSON文本', () => {
    const mockClient = createMockLLMClient();
    const generator = new UIGenerator(mockClient as never);

    const input = '{"title": "测试", "width": 600}';
    const result = generator.extractJson(input);
    expect(result).toBe('{"title": "测试", "width": 600}');
  });

  it('应从周围文本中提取JSON', () => {
    const mockClient = createMockLLMClient();
    const generator = new UIGenerator(mockClient as never);

    const input = '这是一些前缀文本\n{"title": "测试"}\n这是一些后缀文本';
    const result = generator.extractJson(input);
    expect(result).toBe('{"title": "测试"}');
  });
});

describe('UIGenerator.generate', () => {
  it('使用mock LLM应返回有效的UIInstance', async () => {
    const mockClient = createMockLLMClient();
    // 阶段1: 工具规划返回
    const stage1Response = JSON.stringify({
      selected_tools: [],
      reasoning: '不需要',
    });
    // 阶段2: UI生成返回
    const stage2Response = VALID_UI_JSON;

    // 第一次调用返回阶段1结果, 第二次返回阶段2结果
    mockClient.generate
      .mockResolvedValueOnce(stage1Response)
      .mockResolvedValueOnce(stage2Response);

    const mockRegistry: Partial<ToolRegistry> = {
      getToolsDescription: vi.fn().mockReturnValue('当前没有可用的工具.'),
    };

    const generator = new UIGenerator(
      mockClient as never,
      mockRegistry as ToolRegistry,
    );

    const result = await generator.generate('创建一个简单的UI');

    expect(result.title).toBe('测试窗口');
    expect(result.width).toBe(600);
    expect(result.height).toBe(400);
    expect(result.root.type).toBe('container');
    expect(result.event_handlers).toEqual({});
    expect(mockClient.generate).toHaveBeenCalledTimes(2);
  });

  it('无工具注册表时应跳过阶段1直接生成UI', async () => {
    const mockClient = createMockLLMClient();
    mockClient.generate.mockResolvedValueOnce(VALID_UI_JSON);

    const generator = new UIGenerator(mockClient as never);
    const result = await generator.generate('创建一个简单的UI');

    expect(result.title).toBe('测试窗口');
    // 没有工具注册表, 只调用一次(阶段2)
    expect(mockClient.generate).toHaveBeenCalledTimes(1);
  });

  it('工具规划失败时不应崩溃, 应使用空工具列表继续', async () => {
    const mockClient = createMockLLMClient();
    // 阶段1: 返回无效JSON
    mockClient.generate
      .mockResolvedValueOnce('这不是有效的JSON')
      .mockResolvedValueOnce(VALID_UI_JSON);

    const mockRegistry: Partial<ToolRegistry> = {
      getToolsDescription: vi.fn().mockReturnValue('当前没有可用的工具.'),
    };

    const generator = new UIGenerator(
      mockClient as never,
      mockRegistry as ToolRegistry,
    );

    // 不应抛出错误
    const result = await generator.generate('创建一个UI');
    expect(result.title).toBe('测试窗口');
    expect(mockClient.generate).toHaveBeenCalledTimes(2);
  });

  it('阶段1返回带markdown包裹的JSON时应正确解析', async () => {
    const mockClient = createMockLLMClient();
    const stage1Response = '```json\n{"selected_tools": ["calculator"], "reasoning": "需要计算"}\n```';

    mockClient.generate
      .mockResolvedValueOnce(stage1Response)
      .mockResolvedValueOnce(VALID_UI_JSON);

    const mockRegistry: Partial<ToolRegistry> = {
      getToolsDescription: vi.fn().mockReturnValue('# 可用工具\n## calculator\n计算器工具'),
    };

    const generator = new UIGenerator(
      mockClient as never,
      mockRegistry as ToolRegistry,
    );

    const result = await generator.generate('创建一个计算器UI');
    expect(result.title).toBe('测试窗口');
    expect(mockClient.generate).toHaveBeenCalledTimes(2);

    // 验证阶段2的系统提示词中包含了工具信息
    const stage2SystemPrompt = mockClient.generate.mock.calls[1]![0] as string;
    expect(stage2SystemPrompt).toContain('calculator');
  });
});
