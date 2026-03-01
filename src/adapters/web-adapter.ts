// -*- coding: utf-8 -*-
// Web适配器, 通过HTTP服务器在浏览器中渲染UI

import * as http from 'node:http';
import { exec } from 'node:child_process';
import { platform } from 'node:os';
import type { UIAdapter } from './base.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ComponentType } from '../core/component.js';
import type { ToolExecutor } from '../tools/executor.js';
import { createLogger } from '../logger.js';

const logger = createLogger('WebAdapter');

/** Web适配器默认端口 */
const DEFAULT_PORT = 9527;

/**
 * Web适配器, 在浏览器中渲染UI实例.
 *
 * 工作流程:
 * 1. 将UIInstance转换为HTML/CSS/JS页面
 * 2. 启动HTTP服务器提供页面
 * 3. 自动打开浏览器
 * 4. 提供/api/call-function端点用于工具调用
 */
export class WebAdapter implements UIAdapter {
  readonly name: string = 'web';

  /** HTTP服务器实例 */
  private server: http.Server | null = null;

  /** 服务器端口 */
  private readonly port: number;

  /** 是否自动打开浏览器 */
  private readonly autoOpen: boolean;

  /** 工具执行器 */
  private toolExecutor?: ToolExecutor;

  /** 生成的HTML内容 */
  private html: string = '';

  /** 服务器关闭的Promise resolve函数 */
  private resolveEventLoop?: () => void;

  /**
   * 创建WebAdapter实例
   * @param port - HTTP服务器端口, 默认9527
   * @param autoOpen - 是否自动打开浏览器, 默认true
   */
  constructor(port: number = DEFAULT_PORT, autoOpen: boolean = true) {
    this.port = port;
    this.autoOpen = autoOpen;
  }

  async createWindow(uiInstance: UIInstance, toolExecutor?: ToolExecutor): Promise<void> {
    logger.info(`创建Web窗口: ${uiInstance.title}`);
    this.toolExecutor = toolExecutor;
    this.html = this.generateHtml(uiInstance);
  }

  async runEventLoop(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.resolveEventLoop = resolve;

      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, () => {
        // 获取实际分配的端口(port=0时系统会自动分配)
        const addr = this.server!.address();
        const actualPort = typeof addr === 'object' && addr ? addr.port : this.port;
        const url = `http://localhost:${actualPort}`;
        logger.info(`Web服务器已启动: ${url}`);
        console.log(`浏览器已打开: ${url}`);
        console.log('按 Ctrl+C 关闭服务器');
        if (this.autoOpen) {
          this.openBrowser(url);
        }
      });

      // 处理Ctrl+C优雅关闭
      const onSignal = (): void => {
        this.close();
        process.removeListener('SIGINT', onSignal);
        process.removeListener('SIGTERM', onSignal);
      };
      process.on('SIGINT', onSignal);
      process.on('SIGTERM', onSignal);
    });
  }

  /**
   * 关闭HTTP服务器
   */
  close(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      logger.info('Web服务器已关闭');
    }
    if (this.resolveEventLoop) {
      this.resolveEventLoop();
      this.resolveEventLoop = undefined;
    }
  }

  // ============================================================
  // HTTP请求处理
  // ============================================================

  /**
   * 处理HTTP请求
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url ?? '/';

    if (url === '/api/call-function' && req.method === 'POST') {
      this.handleCallFunction(req, res);
      return;
    }

    // 默认返回HTML页面
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(this.html);
  }

  /**
   * 处理工具调用API请求
   */
  private handleCallFunction(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      // CORS头
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!this.toolExecutor) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: '工具执行器未初始化' }));
        return;
      }

      try {
        const { name, params } = JSON.parse(body) as { name: string; params: unknown };
        const result = await this.toolExecutor.callFunction(name, params);
        res.writeHead(200);
        res.end(JSON.stringify({ result }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`工具调用失败: ${message}`);
        res.writeHead(400);
        res.end(JSON.stringify({ error: message }));
      }
    });
  }

  // ============================================================
  // 浏览器打开
  // ============================================================

  /**
   * 使用系统默认浏览器打开URL
   */
  private openBrowser(url: string): void {
    const plat = platform();
    let cmd: string;

    if (plat === 'win32') {
      cmd = `start "" "${url}"`;
    } else if (plat === 'darwin') {
      cmd = `open "${url}"`;
    } else {
      cmd = `xdg-open "${url}"`;
    }

    exec(cmd, (err) => {
      if (err) {
        logger.warn(`无法自动打开浏览器: ${err.message}`);
        logger.info(`请手动打开: ${url}`);
      }
    });
  }

  // ============================================================
  // HTML生成
  // ============================================================

  /**
   * 将UIInstance转换为完整的HTML页面
   * @param uiInstance - UI实例
   * @returns HTML字符串
   */
  generateHtml(uiInstance: UIInstance): string {
    const rootHtml = this.renderComponent(uiInstance.root);
    const handlersJs = this.generateEventHandlersJs(uiInstance.event_handlers);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(uiInstance.title)}</title>
  <style>${this.generateCss()}</style>
</head>
<body>
  <div class="genui-window" style="max-width:${uiInstance.width}px;">
    <div class="genui-titlebar">${this.escapeHtml(uiInstance.title)}</div>
    <div class="genui-content">
      ${rootHtml}
    </div>
  </div>
  <script>
${this.generateHelperJs()}
${handlersJs}
  </script>
</body>
</html>`;
  }

  /**
   * 递归渲染组件为HTML
   * @param component - 组件定义
   * @returns HTML字符串
   */
  renderComponent(component: ComponentType): string {
    switch (component.type) {
      case 'container':
        return this.renderContainer(component);
      case 'button':
        return this.renderButton(component);
      case 'text_input':
        return this.renderTextInput(component);
      case 'label':
        return this.renderLabel(component);
      case 'checkbox':
        return this.renderCheckbox(component);
      case 'radio_group':
        return this.renderRadioGroup(component);
      case 'dropdown':
        return this.renderDropdown(component);
      default:
        return `<div class="genui-unknown">未知组件类型</div>`;
    }
  }

  /**
   * 渲染容器组件
   */
  private renderContainer(component: ComponentType & { type: 'container' }): string {
    const childrenHtml = component.children
      .map((child) => this.renderComponent(child))
      .join('\n');

    const style = this.buildStyleAttr({
      padding: `${component.padding}px`,
      gap: `${component.spacing}px`,
      width: component.width ? `${component.width}px` : undefined,
      height: component.height ? `${component.height}px` : undefined,
    });

    return `<div id="${this.escapeHtml(component.id)}" class="genui-container genui-layout-${component.layout}" ${style}>
  ${childrenHtml}
</div>`;
  }

  /**
   * 渲染按钮组件
   */
  private renderButton(component: ComponentType & { type: 'button' }): string {
    const onclick = component.on_click
      ? `onclick="${this.escapeHtml(component.on_click)}()"`
      : '';
    const disabled = component.enabled === false ? 'disabled' : '';
    const style = this.buildStyleAttr({
      width: component.width ? `${component.width}px` : undefined,
      height: component.height ? `${component.height}px` : undefined,
    });

    return `<button id="${this.escapeHtml(component.id)}" class="genui-button" ${onclick} ${disabled} ${style}>${this.escapeHtml(component.text)}</button>`;
  }

  /**
   * 渲染文本输入框组件
   */
  private renderTextInput(component: ComponentType & { type: 'text_input' }): string {
    const style = this.buildStyleAttr({
      width: component.width ? `${component.width}px` : undefined,
      height: component.height ? `${component.height}px` : undefined,
    });

    if (component.multiline) {
      return `<textarea id="${this.escapeHtml(component.id)}" class="genui-text-input" placeholder="${this.escapeHtml(component.placeholder)}" ${style}>${this.escapeHtml(component.default_value)}</textarea>`;
    }

    return `<input type="text" id="${this.escapeHtml(component.id)}" class="genui-text-input" placeholder="${this.escapeHtml(component.placeholder)}" value="${this.escapeHtml(component.default_value)}" ${style}>`;
  }

  /**
   * 渲染标签组件
   */
  private renderLabel(component: ComponentType & { type: 'label' }): string {
    const style = this.buildStyleAttr({
      'font-size': `${component.font_size}px`,
      'font-weight': component.bold ? 'bold' : undefined,
      color: component.color ?? undefined,
    });

    return `<span id="${this.escapeHtml(component.id)}" class="genui-label" ${style}>${this.escapeHtml(component.text)}</span>`;
  }

  /**
   * 渲染复选框组件
   */
  private renderCheckbox(component: ComponentType & { type: 'checkbox' }): string {
    const checked = component.checked ? 'checked' : '';
    const onchange = component.on_change
      ? `onchange="${this.escapeHtml(component.on_change)}()"`
      : '';

    return `<label class="genui-checkbox-label">
  <input type="checkbox" id="${this.escapeHtml(component.id)}" class="genui-checkbox" ${checked} ${onchange}>
  <span>${this.escapeHtml(component.label)}</span>
</label>`;
  }

  /**
   * 渲染单选按钮组组件
   */
  private renderRadioGroup(component: ComponentType & { type: 'radio_group' }): string {
    const name = `radio_${this.escapeHtml(component.id)}`;
    const onchange = component.on_change
      ? `onchange="${this.escapeHtml(component.on_change)}()"`
      : '';

    const optionsHtml = component.options
      .map((opt) => {
        const checked = component.selected === opt ? 'checked' : '';
        return `<label class="genui-radio-option">
  <input type="radio" name="${name}" value="${this.escapeHtml(opt)}" ${checked} ${onchange}>
  <span>${this.escapeHtml(opt)}</span>
</label>`;
      })
      .join('\n');

    return `<fieldset id="${this.escapeHtml(component.id)}" class="genui-radio-group">
  <legend>${this.escapeHtml(component.label)}</legend>
  ${optionsHtml}
</fieldset>`;
  }

  /**
   * 渲染下拉选择框组件
   */
  private renderDropdown(component: ComponentType & { type: 'dropdown' }): string {
    const style = this.buildStyleAttr({
      width: component.width ? `${component.width}px` : undefined,
    });

    const optionsHtml = component.options
      .map((opt) => {
        const selected = component.selected === opt ? 'selected' : '';
        return `<option value="${this.escapeHtml(opt)}" ${selected}>${this.escapeHtml(opt)}</option>`;
      })
      .join('\n');

    const labelHtml = component.label
      ? `<label class="genui-dropdown-label" for="${this.escapeHtml(component.id)}">${this.escapeHtml(component.label)}</label>`
      : '';

    return `<div class="genui-dropdown-wrapper">
  ${labelHtml}
  <select id="${this.escapeHtml(component.id)}" class="genui-dropdown" ${style}>
    ${optionsHtml}
  </select>
</div>`;
  }

  // ============================================================
  // CSS生成
  // ============================================================

  /**
   * 生成页面CSS样式
   */
  private generateCss(): string {
    return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      min-height: 100vh;
    }

    .genui-window {
      background: #16213e;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      width: 100%;
    }

    .genui-titlebar {
      background: linear-gradient(135deg, #0f3460, #533483);
      color: #fff;
      padding: 14px 20px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      letter-spacing: 1px;
    }

    .genui-content {
      padding: 16px;
    }

    /* 容器布局 */
    .genui-container {
      display: flex;
    }
    .genui-layout-vertical {
      flex-direction: column;
    }
    .genui-layout-horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }
    .genui-layout-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    /* 按钮 */
    .genui-button {
      background: linear-gradient(135deg, #0f3460, #533483);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.5px;
    }
    .genui-button:hover:not(:disabled) {
      background: linear-gradient(135deg, #1a4a8a, #6a44a3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(83, 52, 131, 0.4);
    }
    .genui-button:active:not(:disabled) {
      transform: translateY(0);
    }
    .genui-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 文本输入框 */
    .genui-text-input {
      background: #1a1a2e;
      color: #e0e0e0;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      width: 100%;
      transition: border-color 0.2s ease;
      font-family: inherit;
    }
    .genui-text-input:focus {
      outline: none;
      border-color: #533483;
      box-shadow: 0 0 0 3px rgba(83, 52, 131, 0.2);
    }
    .genui-text-input::placeholder {
      color: #666;
    }
    textarea.genui-text-input {
      min-height: 80px;
      resize: vertical;
    }

    /* 标签 */
    .genui-label {
      display: block;
      line-height: 1.5;
    }

    /* 复选框 */
    .genui-checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .genui-checkbox {
      width: 18px;
      height: 18px;
      accent-color: #533483;
    }

    /* 单选按钮组 */
    .genui-radio-group {
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      padding: 12px;
    }
    .genui-radio-group legend {
      color: #a0a0c0;
      font-size: 13px;
      padding: 0 6px;
    }
    .genui-radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 0;
    }
    .genui-radio-option input {
      accent-color: #533483;
    }

    /* 下拉选择框 */
    .genui-dropdown-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .genui-dropdown-label {
      font-size: 13px;
      color: #a0a0c0;
    }
    .genui-dropdown {
      background: #1a1a2e;
      color: #e0e0e0;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }
    .genui-dropdown:focus {
      outline: none;
      border-color: #533483;
      box-shadow: 0 0 0 3px rgba(83, 52, 131, 0.2);
    }

    `;
  }

  // ============================================================
  // JavaScript生成
  // ============================================================

  /**
   * 生成浏览器端辅助函数(getValue, setValue, display, callFunction)
   */
  private generateHelperJs(): string {
    return `
// genui-ts 辅助函数
function getValue(componentId) {
  var el = document.getElementById(componentId);
  if (!el) throw new Error("getValue: 组件不存在: " + componentId);

  // checkbox
  if (el.type === "checkbox") return el.checked;

  // radio_group (fieldset)
  if (el.tagName === "FIELDSET") {
    var checked = el.querySelector("input[type=radio]:checked");
    return checked ? checked.value : null;
  }

  // text_input, dropdown, textarea
  if ("value" in el) return el.value;

  // label
  return el.textContent;
}

function setValue(componentId, value) {
  var el = document.getElementById(componentId);
  if (!el) throw new Error("setValue: 组件不存在: " + componentId);

  // checkbox
  if (el.type === "checkbox") {
    el.checked = !!value;
    return;
  }

  // radio_group (fieldset)
  if (el.tagName === "FIELDSET") {
    var radios = el.querySelectorAll("input[type=radio]");
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = (radios[i].value === value);
    }
    return;
  }

  // text_input, dropdown, textarea
  if ("value" in el) {
    el.value = value;
    return;
  }

  // label
  el.textContent = value;
}

function display(message) {
  console.log("[genui]", message);
}

function callFunction(name, params) {
  // 同步风格: 使用同步XMLHttpRequest(已弃用但在事件处理器中必要)
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/call-function", false);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ name: name, params: params || {} }));

  if (xhr.status === 200) {
    var resp = JSON.parse(xhr.responseText);
    return resp.result;
  } else {
    var errResp = JSON.parse(xhr.responseText);
    throw new Error(errResp.error || "工具调用失败");
  }
}
`;
  }

  /**
   * 生成事件处理器的JavaScript代码
   * @param handlers - 处理器名 -> 代码字符串映射
   * @returns JavaScript代码字符串
   */
  private generateEventHandlersJs(handlers: Record<string, string>): string {
    const parts: string[] = [];

    for (const [, code] of Object.entries(handlers)) {
      // LLM生成的代码已经是 "function handle_xxx() { ... }" 的形式
      parts.push(code);
    }

    return parts.join('\n\n');
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * HTML特殊字符转义
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 从属性对象构建style属性字符串
   */
  private buildStyleAttr(styles: Record<string, string | undefined>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        parts.push(`${key}:${value}`);
      }
    }
    return parts.length > 0 ? `style="${parts.join(';')}"` : '';
  }
}
