// -*- coding: utf-8 -*-
// 渲染器, 连接UIAdapter与UIInstance, 负责渲染和运行事件循环

import type { UIAdapter } from '../adapters/base.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ToolExecutor } from '../tools/executor.js';
import { createLogger } from '../logger.js';

const logger = createLogger('Renderer');

/**
 * 渲染器类, 将UIInstance通过UIAdapter渲染到目标平台.
 *
 * 职责:
 * - 调用adapter.createWindow()创建窗口并渲染组件
 * - 调用adapter.runEventLoop()运行事件循环
 */
export class Renderer {
  /** UI适配器 */
  private readonly adapter: UIAdapter;

  /** 工具执行器(可选) */
  private readonly toolExecutor?: ToolExecutor;

  /**
   * 创建渲染器实例.
   *
   * @param adapter - UI适配器
   * @param toolExecutor - 可选的工具执行器
   */
  constructor(adapter: UIAdapter, toolExecutor?: ToolExecutor) {
    this.adapter = adapter;
    this.toolExecutor = toolExecutor;
    logger.info(`使用适配器: ${adapter.name}`);
  }

  /**
   * 渲染UI实例.
   * 先调用adapter.createWindow()创建窗口, 然后调用adapter.runEventLoop()运行事件循环.
   *
   * @param uiInstance - 要渲染的UI实例
   */
  async render(uiInstance: UIInstance): Promise<void> {
    logger.info(`渲染UI: ${uiInstance.title}`);
    await this.adapter.createWindow(uiInstance, this.toolExecutor);
    await this.adapter.runEventLoop();
  }
}
