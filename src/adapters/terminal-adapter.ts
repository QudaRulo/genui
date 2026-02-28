// -*- coding: utf-8 -*-
// Terminal适配器, 使用Ink在终端中渲染UI

import React from 'react';
import { render } from 'ink';
import type { UIAdapter } from './base.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ComponentType } from '../core/component.js';
import { listAllComponents } from '../core/ui-instance.js';
import type { ToolExecutor } from '../tools/executor.js';
import { createLogger } from '../logger.js';
import { ComponentStore } from './terminal/store.js';
import { App } from './terminal/app.js';

const logger = createLogger('TerminalAdapter');

/**
 * Terminal适配器, 使用Ink在终端中渲染UI.
 *
 * 工作流程:
 * 1. createWindow(): 初始化store, 编译事件处理器, 准备渲染数据
 * 2. runEventLoop(): 调用ink.render()启动终端UI, 等待用户退出
 */
export class TerminalAdapter implements UIAdapter {
  readonly name: string = 'terminal';

  /** 组件状态存储 */
  private store: ComponentStore = new ComponentStore();

  /** 编译后的事件处理器 */
  private compiledHandlers: Map<string, () => void> = new Map();

  /** 工具执行器 */
  private toolExecutor?: ToolExecutor;

  /** UI实例引用 */
  private uiInstance?: UIInstance;

  /** ink render实例的unmount函数 */
  private unmount?: () => void;

  async createWindow(uiInstance: UIInstance, toolExecutor?: ToolExecutor): Promise<void> {
    logger.info(`创建Terminal窗口: ${uiInstance.title}`);
    this.uiInstance = uiInstance;
    this.toolExecutor = toolExecutor;

    // 重置状态
    this.store = new ComponentStore();
    this.compiledHandlers.clear();

    // 初始化所有组件的值
    const allComponents = listAllComponents(uiInstance);
    for (const comp of allComponents) {
      this.initComponentValue(comp);
    }

    // 编译事件处理器
    this.compileEventHandlers(uiInstance.event_handlers);

    logger.info(`初始化完成, 共${allComponents.length}个组件`);
  }

  async runEventLoop(): Promise<void> {
    if (!this.uiInstance) {
      throw new Error('请先调用createWindow()');
    }

    const appElement = React.createElement(App, {
      title: this.uiInstance.title,
      root: this.uiInstance.root,
      store: this.store,
      handlers: this.compiledHandlers,
    });

    const instance = render(appElement);
    this.unmount = instance.unmount;

    await instance.waitUntilExit();
    logger.info('Terminal UI已关闭');
  }

  /**
   * 关闭终端UI
   */
  close(): void {
    if (this.unmount) {
      this.unmount();
      this.unmount = undefined;
    }
  }

  /**
   * 获取store (用于测试)
   */
  getStore(): ComponentStore {
    return this.store;
  }

  /**
   * 获取编译后的处理器 (用于测试)
   */
  getHandlers(): Map<string, () => void> {
    return this.compiledHandlers;
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 根据组件类型设置初始值
   */
  private initComponentValue(component: ComponentType): void {
    switch (component.type) {
      case 'text_input':
        this.store.initValue(component.id, component.default_value || '');
        break;
      case 'checkbox':
        this.store.initValue(component.id, component.checked ?? false);
        break;
      case 'radio_group':
        this.store.initValue(component.id, component.selected ?? null);
        break;
      case 'dropdown':
        this.store.initValue(component.id, component.selected ?? null);
        break;
      case 'label':
        this.store.initValue(component.id, component.text || '');
        break;
      case 'button':
        this.store.initValue(component.id, null);
        break;
      case 'container':
        // container不需要值
        break;
    }
  }

  /**
   * 编译事件处理器字符串为可执行函数.
   * 注入: getValue, setValue, display, callFunction
   */
  private compileEventHandlers(handlers: Record<string, string>): void {
    const envKeys = [
      'getValue',
      'setValue',
      'display',
      'callFunction',
    ];

    const envValues = [
      // getValue
      (id: string): unknown => {
        return this.store.getValue(id);
      },
      // setValue
      (id: string, value: unknown): void => {
        this.store.setValue(id, value);
      },
      // display
      (message: string): void => {
        this.store.display(message);
      },
      // callFunction
      (name: string, params?: unknown): unknown => {
        // 优先查找编译后的处理器
        const fn = this.compiledHandlers.get(name);
        if (fn) {
          return (fn as (...args: unknown[]) => unknown)(params);
        }
        // 否则尝试通过toolExecutor调用 (同步包装)
        if (this.toolExecutor) {
          // 注意: toolExecutor.callFunction是async, 这里做同步包装
          // 复杂工具调用可能需要异步处理, 但基本场景下可用
          let result: unknown;
          let error: unknown;
          this.toolExecutor.callFunction(name, params).then(
            (r: unknown) => { result = r; },
            (e: unknown) => { error = e; },
          );
          if (error) throw error;
          return result;
        }
        throw new Error(`callFunction: 函数不存在: ${name}`);
      },
    ];

    for (const [handlerName, code] of Object.entries(handlers)) {
      try {
        const fn = new Function(
          ...envKeys,
          `${code}\nreturn ${handlerName};`,
        );
        const handler = fn(...envValues);
        this.compiledHandlers.set(handlerName, handler);
      } catch (err) {
        logger.error(`编译事件处理器失败: ${handlerName}`, err);
      }
    }
  }
}
