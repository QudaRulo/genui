// -*- coding: utf-8 -*-
// 组件状态存储, 桥接命令式事件处理器与React声明式渲染

import { createLogger } from '../../logger.js';

const logger = createLogger('ComponentStore');

/** 订阅回调类型 */
type Listener = () => void;

/**
 * 组件状态存储.
 *
 * 集中管理所有组件的运行时值, 提供:
 * - getValue / setValue 供事件处理器使用
 * - subscribe 供React组件订阅变更
 * - display输出记录
 */
export class ComponentStore {
  /** 组件值存储 (组件ID -> 当前值) */
  private values: Map<string, unknown> = new Map();

  /** 订阅者列表 */
  private listeners: Set<Listener> = new Set();

  /** display()调用输出记录 */
  private displayOutputs: string[] = [];

  /**
   * 获取组件的当前值
   * @param id - 组件ID
   * @returns 组件值
   */
  getValue(id: string): unknown {
    if (!this.values.has(id)) {
      throw new Error(`getValue: 组件不存在: ${id}`);
    }
    return this.values.get(id);
  }

  /**
   * 设置组件值, 并通知所有订阅者触发重新渲染
   * @param id - 组件ID
   * @param value - 新值
   */
  setValue(id: string, value: unknown): void {
    this.values.set(id, value);
    this.notify();
  }

  /**
   * 初始化组件值 (不触发通知)
   * @param id - 组件ID
   * @param value - 初始值
   */
  initValue(id: string, value: unknown): void {
    this.values.set(id, value);
  }

  /**
   * 检查组件是否存在
   * @param id - 组件ID
   */
  has(id: string): boolean {
    return this.values.has(id);
  }

  /**
   * 记录display输出并通知订阅者刷新
   * @param message - 显示的消息
   */
  display(message: string): void {
    this.displayOutputs.push(String(message));
    logger.info(`display: ${message}`);
    this.notify();
  }

  /**
   * 获取所有display输出
   */
  getDisplayOutputs(): string[] {
    return [...this.displayOutputs];
  }

  /**
   * 获取快照版本号 (用于useSyncExternalStore)
   */
  getSnapshot(): number {
    return this.version;
  }

  /** 版本号, 每次变更递增 */
  private version = 0;

  /**
   * 订阅状态变更
   * @param listener - 回调函数
   * @returns 取消订阅函数
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 通知所有订阅者 */
  private notify(): void {
    this.version++;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
