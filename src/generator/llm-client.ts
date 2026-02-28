// -*- coding: utf-8 -*-
// LLM客户端, 通过REST API直接调用OpenAI和Anthropic

import { createLogger } from '../logger.js';

const logger = createLogger('LLMClient');

/** 支持的LLM提供商类型 */
export type Provider = 'openai' | 'anthropic';

/** OpenAI默认模型 */
const DEFAULT_OPENAI_MODEL = 'gpt-4o';

/** Anthropic默认模型 */
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

/** OpenAI默认API地址 */
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

/** Anthropic API地址 */
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/** Anthropic API版本 */
const ANTHROPIC_VERSION = '2023-06-01';

/** 生成参数: 温度 */
const TEMPERATURE = 0.7;

/** 生成参数: 最大token数 */
const MAX_TOKENS = 4096;

/** LLMClient构造参数 */
export interface LLMClientConfig {
  /** 模型名称 */
  model?: string;
  /** LLM提供商 */
  provider?: Provider;
}

/**
 * LLM客户端, 支持OpenAI和Anthropic的REST API调用.
 */
export class LLMClient {
  /** 当前使用的提供商 */
  readonly provider: Provider;

  /** 模型名称 */
  private readonly model: string;

  /** API密钥 */
  private readonly apiKey: string;

  /** OpenAI API基础URL */
  private readonly baseUrl: string;

  /**
   * 创建LLMClient实例
   * @param config - 可选配置, 包含model和provider
   * @throws 当API密钥缺失或provider不合法时抛出Error
   */
  constructor(config?: LLMClientConfig) {
    // 解析provider: 优先使用config, 其次环境变量, 默认openai
    const rawProvider = config?.provider
      ?? (process.env.LLM_PROVIDER as Provider | undefined)
      ?? 'openai';

    if (rawProvider !== 'openai' && rawProvider !== 'anthropic') {
      throw new Error(`不支持的LLM提供商: ${rawProvider}`);
    }
    this.provider = rawProvider;

    // 解析API密钥
    if (this.provider === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        throw new Error('缺少环境变量 OPENAI_API_KEY');
      }
      this.apiKey = key;
    } else {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error('缺少环境变量 ANTHROPIC_API_KEY');
      }
      this.apiKey = key;
    }

    // 解析模型名称
    if (this.provider === 'openai') {
      this.model = config?.model
        ?? process.env.OPENAI_MODEL
        ?? DEFAULT_OPENAI_MODEL;
      this.baseUrl = process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL;
    } else {
      this.model = config?.model
        ?? process.env.ANTHROPIC_MODEL
        ?? DEFAULT_ANTHROPIC_MODEL;
      this.baseUrl = DEFAULT_OPENAI_BASE_URL; // Anthropic不使用此字段
    }

    logger.info(
      `LLMClient已初始化: provider=${this.provider}, model=${this.model}`,
    );
  }

  /**
   * 调用LLM生成回复
   * @param systemPrompt - 系统提示词
   * @param userMessage - 用户消息
   * @returns 模型生成的文本内容
   * @throws 当HTTP请求失败或响应为空时抛出Error
   */
  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    logger.info(`开始生成, provider=${this.provider}, model=${this.model}`);

    if (this.provider === 'openai') {
      return this.generateOpenAI(systemPrompt, userMessage);
    }
    return this.generateAnthropic(systemPrompt, userMessage);
  }

  /**
   * 通过OpenAI API生成回复
   * @param systemPrompt - 系统提示词
   * @param userMessage - 用户消息
   * @returns 模型生成的文本内容
   */
  private async generateOpenAI(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenAI API请求失败: ${response.status} ${response.statusText} - ${text}`,
      );
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API返回了空响应');
    }

    logger.info('OpenAI生成完成');
    return content;
  }

  /**
   * 通过Anthropic API生成回复
   * @param systemPrompt - 系统提示词
   * @param userMessage - 用户消息
   * @returns 模型生成的文本内容
   */
  private async generateAnthropic(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    const body = {
      model: this.model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Anthropic API请求失败: ${response.status} ${response.statusText} - ${text}`,
      );
    }

    const data = await response.json() as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const textBlock = data.content?.find((block) => block.type === 'text');
    if (!textBlock?.text) {
      throw new Error('Anthropic API返回了空响应');
    }

    logger.info('Anthropic生成完成');
    return textBlock.text;
  }
}
