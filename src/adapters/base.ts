// -*- coding: utf-8 -*-
// UI适配器基础接口, 定义适配器的通用行为

import type { UIInstance } from '../core/ui-instance.js';

/**
 * UI适配器接口.
 * 所有适配器(如Tkinter, Web, Test等)都需要实现此接口.
 */
export interface UIAdapter {
  /** 适配器名称 */
  readonly name: string;

  /**
   * 创建窗口并渲染UI实例.
   *
   * @param uiInstance - 要渲染的UI实例
   * @param toolExecutor - 可选的工具执行器(用于调用外部工具)
   */
  createWindow(uiInstance: UIInstance, toolExecutor?: any): Promise<void>;

  /**
   * 运行事件循环.
   * 对于GUI适配器这会阻塞直到窗口关闭, 对于TestAdapter则立即返回.
   */
  runEventLoop(): Promise<void>;
}
