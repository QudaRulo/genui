// -*- coding: utf-8 -*-
// LLMClient 单元测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMClient } from '../../src/generator/llm-client.js';
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
  // 清理环境变量
  delete process.env.LLM_PROVIDER;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_MODEL;
  delete process.env.ANTHROPIC_MODEL;
  delete process.env.OPENAI_BASE_URL;
});

describe('LLMClient 构造函数', () => {
  it('使用config指定provider为openai时应正确初始化', () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    const client = new LLMClient({ provider: 'openai' });
    expect(client.provider).toBe('openai');
  });

  it('使用config指定provider为anthropic时应正确初始化', () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const client = new LLMClient({ provider: 'anthropic' });
    expect(client.provider).toBe('anthropic');
  });

  it('从环境变量LLM_PROVIDER读取provider', () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const client = new LLMClient();
    expect(client.provider).toBe('anthropic');
  });

  it('未指定provider时默认使用openai', () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    const client = new LLMClient();
    expect(client.provider).toBe('openai');
  });

  it('缺少OPENAI_API_KEY时应抛出错误', () => {
    expect(() => new LLMClient({ provider: 'openai' }))
      .toThrow('OPENAI_API_KEY');
  });

  it('缺少ANTHROPIC_API_KEY时应抛出错误', () => {
    expect(() => new LLMClient({ provider: 'anthropic' }))
      .toThrow('ANTHROPIC_API_KEY');
  });

  it('不支持的provider应抛出错误', () => {
    expect(() => new LLMClient({ provider: 'gemini' as Provider }))
      .toThrow('不支持的LLM提供商');
  });

  it('通过环境变量传入不支持的provider应抛出错误', () => {
    process.env.LLM_PROVIDER = 'unknown';
    expect(() => new LLMClient())
      .toThrow('不支持的LLM提供商');
  });
});

describe('LLMClient.generate() - OpenAI', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('应向正确的URL发送POST请求并携带正确的header', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '你好世界' } }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai' });
    const result = await client.generate('你是助手', '你好');

    expect(result).toBe('你好世界');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(options.method).toBe('POST');

    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-openai-key');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.model).toBe('gpt-4o');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toEqual([
      { role: 'system', content: '你是助手' },
      { role: 'user', content: '你好' },
    ]);
  });

  it('使用自定义OPENAI_BASE_URL', async () => {
    process.env.OPENAI_BASE_URL = 'https://custom.api.com/v1';
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '回复' } }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai' });
    await client.generate('系统', '用户');

    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://custom.api.com/v1/chat/completions');
  });

  it('使用config指定模型名称', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '回复' } }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai', model: 'gpt-3.5-turbo' });
    await client.generate('系统', '用户');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.model).toBe('gpt-3.5-turbo');
  });

  it('使用OPENAI_MODEL环境变量指定模型', async () => {
    process.env.OPENAI_MODEL = 'gpt-4-turbo';
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '回复' } }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai' });
    await client.generate('系统', '用户');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.model).toBe('gpt-4-turbo');
  });

  it('HTTP错误应抛出异常', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: vi.fn().mockResolvedValue('rate limited'),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai' });
    await expect(client.generate('系统', '用户'))
      .rejects.toThrow('OpenAI API请求失败');
  });

  it('空响应应抛出异常', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'openai' });
    await expect(client.generate('系统', '用户'))
      .rejects.toThrow('空响应');
  });
});

describe('LLMClient.generate() - Anthropic', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('应向正确的URL发送POST请求并携带正确的header', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '你好世界' }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'anthropic' });
    const result = await client.generate('你是助手', '你好');

    expect(result).toBe('你好世界');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(options.method).toBe('POST');

    const headers = options.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-anthropic-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.model).toBe('claude-3-5-sonnet-20241022');
    expect(body.system).toBe('你是助手');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toEqual([
      { role: 'user', content: '你好' },
    ]);
  });

  it('使用ANTHROPIC_MODEL环境变量指定模型', async () => {
    process.env.ANTHROPIC_MODEL = 'claude-3-opus-20240229';
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '回复' }],
      }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'anthropic' });
    await client.generate('系统', '用户');

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.model).toBe('claude-3-opus-20240229');
  });

  it('HTTP错误应抛出异常', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: vi.fn().mockResolvedValue('server error'),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'anthropic' });
    await expect(client.generate('系统', '用户'))
      .rejects.toThrow('Anthropic API请求失败');
  });

  it('空响应应抛出异常', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [] }),
    };
    fetchSpy.mockResolvedValue(mockResponse);

    const client = new LLMClient({ provider: 'anthropic' });
    await expect(client.generate('系统', '用户'))
      .rejects.toThrow('空响应');
  });
});
