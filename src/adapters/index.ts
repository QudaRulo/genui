// -*- coding: utf-8 -*-
// 适配器模块入口, 导出适配器接口和实现

export type { UIAdapter } from './base.js';

export { TestAdapter, type VirtualWidget } from './test-adapter.js';
export { WebAdapter } from './web-adapter.js';
export { TerminalAdapter } from './terminal-adapter.js';
export { ComponentStore } from './terminal/store.js';
