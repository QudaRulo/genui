// -*- coding: utf-8 -*-
// 测试适配器, 提供无头(headless)环境用于单元测试UI交互

import type { UIAdapter } from './base.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ComponentType } from '../core/component.js';
import { listAllComponents } from '../core/ui-instance.js';
import { createLogger } from '../logger.js';

const logger = createLogger('TestAdapter');

/**
 * 虚拟组件, 用于在无头环境中模拟UI组件的状态
 */
export interface VirtualWidget {
  /** 组件ID */
  id: string;
  /** 组件类型 */
  type: string;
  /** 组件当前值 */
  value: unknown;
  /** 对应的原始组件定义 */
  component: ComponentType;
  /** 事件处理器映射(事件名 -> 处理函数) */
  eventHandlers: Map<string, () => void>;
}

/**
 * 测试适配器, 用于在无头环境中模拟UI交互.
 *
 * 功能:
 * - 将UI实例的组件渲染为VirtualWidget
 * - 编译事件处理器字符串为可执行函数
 * - 提供模拟用户操作的方法(click, setInput, select, check等)
 * - 记录事件和display输出, 方便测试验证
 */
export class TestAdapter implements UIAdapter {
  readonly name: string = 'test';

  /** 虚拟组件存储(id -> VirtualWidget) */
  private widgets: Map<string, VirtualWidget> = new Map();

  /** 记录的事件列表, 每个事件为[事件类型, 组件ID] */
  private events: Array<[string, string]> = [];

  /** display()调用的输出记录 */
  private displayOutputs: string[] = [];

  /** 编译后的事件处理器函数(处理器名 -> 函数) */
  private compiledHandlers: Map<string, () => void> = new Map();

  async createWindow(uiInstance: UIInstance, _toolExecutor?: any): Promise<void> {
    logger.info(`创建测试窗口: ${uiInstance.title}`);

    // 重置状态
    this.widgets.clear();
    this.events = [];
    this.displayOutputs = [];
    this.compiledHandlers.clear();

    // 编译事件处理器
    this.compileEventHandlers(uiInstance.event_handlers);

    // 递归渲染所有组件
    const allComponents = listAllComponents(uiInstance);
    for (const comp of allComponents) {
      this.renderComponent(comp);
    }

    // 绑定事件
    this.bindEvents(allComponents);

    logger.info(`渲染完成, 共${this.widgets.size}个组件`);
  }

  async runEventLoop(): Promise<void> {
    // 测试适配器不需要事件循环, 立即返回
  }

  // ============================================================
  // 测试辅助方法
  // ============================================================

  /**
   * 模拟点击按钮.
   *
   * @param id - 按钮组件ID
   */
  click(id: string): void {
    const widget = this.widgets.get(id);
    if (!widget) {
      throw new Error(`组件不存在: ${id}`);
    }

    this.events.push(['click', id]);

    const handler = widget.eventHandlers.get('click');
    if (handler) {
      handler();
    }
  }

  /**
   * 模拟设置文本输入框的值.
   *
   * @param id - 文本输入框组件ID
   * @param value - 要设置的值
   */
  setInput(id: string, value: string): void {
    const widget = this.widgets.get(id);
    if (!widget) {
      throw new Error(`组件不存在: ${id}`);
    }
    widget.value = value;
  }

  /**
   * 获取组件的当前值.
   *
   * @param id - 组件ID
   * @returns 组件的当前值
   */
  getOutput(id: string): unknown {
    const widget = this.widgets.get(id);
    if (!widget) {
      throw new Error(`组件不存在: ${id}`);
    }
    return widget.value;
  }

  /**
   * 模拟选择dropdown或radio_group的选项.
   *
   * @param id - 组件ID
   * @param option - 选中的选项值
   */
  select(id: string, option: string): void {
    const widget = this.widgets.get(id);
    if (!widget) {
      throw new Error(`组件不存在: ${id}`);
    }
    widget.value = option;

    this.events.push(['change', id]);

    const handler = widget.eventHandlers.get('change');
    if (handler) {
      handler();
    }
  }

  /**
   * 模拟勾选/取消勾选checkbox.
   *
   * @param id - checkbox组件ID
   * @param checked - 是否勾选
   */
  check(id: string, checked: boolean): void {
    const widget = this.widgets.get(id);
    if (!widget) {
      throw new Error(`组件不存在: ${id}`);
    }
    widget.value = checked;

    this.events.push(['change', id]);

    const handler = widget.eventHandlers.get('change');
    if (handler) {
      handler();
    }
  }

  /**
   * 获取VirtualWidget.
   *
   * @param id - 组件ID
   * @returns VirtualWidget或undefined
   */
  getWidget(id: string): VirtualWidget | undefined {
    return this.widgets.get(id);
  }

  /**
   * 获取记录的事件列表.
   *
   * @returns 事件列表, 每个元素为[事件类型, 组件ID]
   */
  getEvents(): Array<[string, string]> {
    return [...this.events];
  }

  /**
   * 获取display()调用输出的消息列表.
   *
   * @returns display输出消息列表
   */
  getDisplayOutputs(): string[] {
    return [...this.displayOutputs];
  }

  /**
   * 清除记录的事件.
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * 清除display输出记录.
   */
  clearOutputs(): void {
    this.displayOutputs = [];
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 根据组件类型获取初始值.
   *
   * @param component - 组件定义
   * @returns 初始值
   */
  private getInitialValue(component: ComponentType): unknown {
    switch (component.type) {
      case 'text_input':
        return component.default_value || '';
      case 'checkbox':
        return component.checked ?? false;
      case 'radio_group':
        return component.selected ?? null;
      case 'dropdown':
        return component.selected ?? null;
      case 'label':
        return component.text || '';
      default:
        return null;
    }
  }

  /**
   * 渲染单个组件为VirtualWidget.
   *
   * @param component - 组件定义
   */
  private renderComponent(component: ComponentType): void {
    const widget: VirtualWidget = {
      id: component.id,
      type: component.type,
      value: this.getInitialValue(component),
      component,
      eventHandlers: new Map(),
    };
    this.widgets.set(component.id, widget);
  }

  /**
   * 编译事件处理器字符串为可执行函数.
   * 处理器代码中可以使用以下辅助函数:
   * - getValue(id) - 获取组件值
   * - setValue(id, value) - 设置组件值
   * - getWidget(id) - 获取虚拟组件
   * - updateWidget(id, props) - 更新组件属性
   * - display(message) - 显示消息(记录到输出)
   * - callFunction(name, ...args) - 调用其他处理器
   *
   * @param handlers - 事件处理器名->代码字符串映射
   */
  private compileEventHandlers(handlers: Record<string, string>): void {
    // 构建辅助函数环境
    const envKeys = [
      'getValue',
      'setValue',
      'getWidget',
      'updateWidget',
      'display',
      'callFunction',
    ];

    const envValues = [
      // getValue
      (id: string): unknown => {
        const w = this.widgets.get(id);
        if (!w) {
          throw new Error(`getValue: 组件不存在: ${id}`);
        }
        return w.value;
      },
      // setValue
      (id: string, value: unknown): void => {
        const w = this.widgets.get(id);
        if (!w) {
          throw new Error(`setValue: 组件不存在: ${id}`);
        }
        w.value = value;
      },
      // getWidget
      (id: string): VirtualWidget | undefined => {
        return this.widgets.get(id);
      },
      // updateWidget
      (id: string, props: Record<string, unknown>): void => {
        const w = this.widgets.get(id);
        if (!w) {
          throw new Error(`updateWidget: 组件不存在: ${id}`);
        }
        Object.assign(w, props);
      },
      // display
      (message: string): void => {
        this.displayOutputs.push(message);
        logger.info(`display: ${message}`);
      },
      // callFunction
      (name: string, ...args: unknown[]): unknown => {
        const fn = this.compiledHandlers.get(name);
        if (!fn) {
          throw new Error(`callFunction: 处理器不存在: ${name}`);
        }
        return (fn as (...args: unknown[]) => unknown)(...args);
      },
    ];

    for (const [handlerName, code] of Object.entries(handlers)) {
      try {
        // 使用new Function编译事件处理器
        // 在代码末尾添加return语句, 返回命名函数
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

  /**
   * 为组件绑定事件处理器.
   *
   * @param components - 所有组件列表
   */
  private bindEvents(components: ComponentType[]): void {
    for (const comp of components) {
      const widget = this.widgets.get(comp.id);
      if (!widget) {
        continue;
      }

      // button的on_click -> click事件
      if (comp.type === 'button' && 'on_click' in comp && comp.on_click) {
        const handler = this.compiledHandlers.get(comp.on_click);
        if (handler) {
          widget.eventHandlers.set('click', handler);
        }
      }

      // checkbox的on_change -> change事件
      if (comp.type === 'checkbox' && 'on_change' in comp && comp.on_change) {
        const handler = this.compiledHandlers.get(comp.on_change);
        if (handler) {
          widget.eventHandlers.set('change', handler);
        }
      }

      // radio_group的on_change -> change事件
      if (comp.type === 'radio_group' && 'on_change' in comp && comp.on_change) {
        const handler = this.compiledHandlers.get(comp.on_change);
        if (handler) {
          widget.eventHandlers.set('change', handler);
        }
      }
    }
  }
}
