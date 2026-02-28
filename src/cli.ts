#!/usr/bin/env node
// -*- coding: utf-8 -*-
// CLI入口, 提供交互式UI生成命令行工具

import { parseArgs } from 'node:util';
import * as readline from 'node:readline';
import { config as dotenvConfig } from 'dotenv';
import { VERSION } from './index.js';
import { ToolRegistry } from './tools/registry.js';
import { ToolExecutor } from './tools/executor.js';
import { LLMClient } from './generator/llm-client.js';
import { UIGenerator } from './generator/ui-generator.js';
import { Renderer } from './renderer/renderer.js';
import { TestAdapter } from './adapters/test-adapter.js';
import { WebAdapter } from './adapters/web-adapter.js';
import { TerminalAdapter } from './adapters/terminal-adapter.js';
import type { UIAdapter } from './adapters/base.js';

/** 支持的适配器类型 */
type AdapterType = 'web' | 'terminal' | 'test';

/** 欢迎横幅 */
const BANNER = `
  ╔═══════════════════════════════════╗
  ║         genui-ts v${VERSION}          ║
  ║   AI-powered dynamic UI generator ║
  ╚═══════════════════════════════════╝
`;

/** 帮助文本 */
const HELP_TEXT = `用法: genui-ts [选项]

选项:
  -v, --version          显示版本号
  -h, --help             显示帮助信息
  -a, --adapter <type>   选择适配器 (web|terminal|test), 默认: web

交互命令:
  quit, exit, q          退出程序

环境变量:
  OPENAI_API_KEY         OpenAI API密钥
  OPENAI_MODEL           OpenAI模型名称 (默认: gpt-4o)
  OPENAI_BASE_URL        OpenAI API基础URL
  ANTHROPIC_API_KEY      Anthropic API密钥
  ANTHROPIC_MODEL        Anthropic模型名称 (默认: claude-3-5-sonnet-20241022)
  LLM_PROVIDER           LLM提供商 (openai|anthropic, 默认: openai)
  LOG_LEVEL              日志级别 (DEBUG|INFO|WARNING|ERROR, 默认: INFO)
`;

/**
 * 解析命令行参数
 * @returns 解析后的参数对象
 */
function parseCliArgs(): { version: boolean; help: boolean; adapter: AdapterType } {
  const { values } = parseArgs({
    options: {
      version: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      adapter: { type: 'string', short: 'a', default: 'web' },
    },
    strict: true,
  });

  const adapterValue = values.adapter as string;
  if (adapterValue !== 'web' && adapterValue !== 'terminal' && adapterValue !== 'test') {
    console.error(`错误: 不支持的适配器类型 "${adapterValue}", 可选: web, terminal, test`);
    process.exit(1);
  }

  return {
    version: values.version as boolean,
    help: values.help as boolean,
    adapter: adapterValue as AdapterType,
  };
}

/**
 * 创建UI适配器实例
 * @param adapterType - 适配器类型
 * @returns UI适配器实例
 */
function createAdapter(adapterType: AdapterType): UIAdapter {
  switch (adapterType) {
    case 'web':
      return new WebAdapter();
    case 'test':
      return new TestAdapter();
    case 'terminal':
      return new TerminalAdapter();
    default:
      throw new Error(`未知的适配器类型: ${adapterType as string}`);
  }
}

/**
 * 运行交互式主循环
 * @param generator - UI生成器
 * @param renderer - 渲染器
 */
async function runInteractiveLoop(
  generator: UIGenerator,
  renderer: Renderer,
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  /** 退出命令集合 */
  const exitCommands = new Set(['quit', 'exit', 'q']);

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer: string) => {
        resolve(answer);
      });
    });
  };

  console.log('请输入UI描述 (输入 quit/exit/q 退出):');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await question('> ');
    const trimmed = input.trim();

    if (!trimmed) {
      continue;
    }

    if (exitCommands.has(trimmed.toLowerCase())) {
      console.log('再见!');
      rl.close();
      return;
    }

    try {
      console.log('正在生成UI...');
      const uiInstance = await generator.generate(trimmed);
      console.log(`UI已生成: ${uiInstance.title}`);
      console.log(`组件树: ${JSON.stringify(uiInstance.root, null, 2)}`);

      console.log('正在渲染...');
      await renderer.render(uiInstance);
      console.log('渲染完成.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`生成失败: ${message}`);
    }

    console.log(''); // 空行分隔
  }
}

/**
 * CLI主函数
 */
async function main(): Promise<void> {
  // 加载.env文件
  dotenvConfig();

  // 解析命令行参数
  const args = parseCliArgs();

  // 处理 --version
  if (args.version) {
    console.log(`genui-ts v${VERSION}`);
    process.exit(0);
  }

  // 处理 --help
  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // 打印欢迎横幅
  console.log(BANNER);

  // 创建工具注册表和执行器
  const toolRegistry = new ToolRegistry();
  const toolExecutor = new ToolExecutor(toolRegistry);

  // 创建LLM客户端
  let llmClient: LLMClient;
  try {
    llmClient = new LLMClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`LLM客户端初始化失败: ${message}`);
    console.error('');
    console.error('请设置以下环境变量之一:');
    console.error('  - OPENAI_API_KEY    (使用OpenAI)');
    console.error('  - ANTHROPIC_API_KEY (使用Anthropic, 需同时设置 LLM_PROVIDER=anthropic)');
    console.error('');
    console.error('可以在项目根目录创建 .env 文件, 或直接导出环境变量.');
    process.exit(1);
  }

  // 创建UI生成器
  const generator = new UIGenerator(llmClient, toolRegistry);

  // 创建适配器和渲染器
  const adapter = createAdapter(args.adapter);
  const renderer = new Renderer(adapter, toolExecutor);

  console.log(`适配器: ${adapter.name}`);
  console.log(`LLM提供商: ${llmClient.provider}`);
  console.log('');

  // 运行交互式循环
  await runInteractiveLoop(generator, renderer);
}

// 执行入口
main().catch((error: unknown) => {
  console.error('致命错误:', error);
  process.exit(1);
});
