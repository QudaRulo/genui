# genui TypeScript 重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 genui Python 项目 (v0.4.0) 完整重构为 TypeScript 版本, 保留所有功能并改进 UI 渲染层.

**Architecture:** 保持原有三层架构 (生成层/渲染层/抽象层) 和适配器模式. 用 TypeScript 的类型系统 + Zod 运行时校验替代 Pydantic. 适配器从 Tkinter/ASCII 改为 Web/Terminal/Test.

**Tech Stack:** Node.js 20+, TypeScript 5.x (strict), npm, tsc, Vitest, Zod, Ink (终端 TUI)

---

### Task 1: 项目脚手架

初始化 npm 项目, 配置 TypeScript 编译器和测试框架.

**Files:**
- Create: `genui-ts/package.json`
- Create: `genui-ts/tsconfig.json`
- Create: `genui-ts/vitest.config.ts`
- Create: `genui-ts/.env.example`
- Create: `genui-ts/.gitignore`

**Step 1: 创建项目目录并初始化 npm**

```bash
mkdir genui-ts
cd genui-ts
npm init -y
```

手动修改 `package.json`:

```json
{
  "name": "genui-ts",
  "version": "0.1.0",
  "description": "基于大模型的动态 UI 生成工具 (TypeScript 版)",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "genui-ts": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node dist/cli.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT"
}
```

**Step 2: 安装依赖**

```bash
npm install zod dotenv
npm install -D typescript vitest @types/node
```

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 4: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

**Step 5: 创建 .env.example**

```
# LLM 提供商: "openai" 或 "anthropic"
LLM_PROVIDER=openai

# OpenAI 配置
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o

# Anthropic 配置
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# 日志级别: DEBUG, INFO, WARNING, ERROR
GENUI_LOG_LEVEL=INFO
```

**Step 6: 创建 .gitignore**

```
node_modules/
dist/
.env
*.js.map
```

**Step 7: 创建目录结构骨架**

```bash
mkdir -p src/core src/generator src/renderer src/adapters src/tools/builtin
mkdir -p tests/core tests/adapters tests/tools tests/generator tests/e2e
```

**Step 8: 创建空的入口文件, 验证构建通过**

创建 `src/index.ts`:

```typescript
// genui-ts - 基于大模型的动态 UI 生成工具
export const VERSION = '0.1.0';
```

**Step 9: 验证构建和测试框架正常工作**

创建 `tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('smoke test', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
```

运行:

```bash
npx tsc
npx vitest run
```

Expected: 构建成功, 1 个测试通过.

**Step 10: Commit**

```bash
git add genui-ts/
git commit -m "feat(ts): init project scaffold with TypeScript, Vitest, Zod"
```

---

### Task 2: 核心类型 - 组件定义

对应 Python 版的 `genui/core/component.py`, 用 TypeScript 的可辨识联合 + Zod schema 定义所有 UI 组件.

**Files:**
- Create: `genui-ts/src/core/component.ts`
- Create: `genui-ts/tests/core/component.test.ts`

**Step 1: 编写组件测试**

`tests/core/component.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  ButtonSchema,
  TextInputSchema,
  LabelSchema,
  ContainerSchema,
  CheckboxSchema,
  RadioGroupSchema,
  DropdownSchema,
  ComponentSchema,
} from '../../src/core/component.js';
import type { Button, TextInput, Label, Container, Component } from '../../src/core/component.js';

describe('Component schemas', () => {
  it('should validate a Button', () => {
    const data = { id: 'btn1', type: 'button', text: '点击我', on_click: 'handle_click', enabled: true };
    const result = ButtonSchema.parse(data);
    expect(result.id).toBe('btn1');
    expect(result.type).toBe('button');
    expect(result.text).toBe('点击我');
    expect(result.on_click).toBe('handle_click');
    expect(result.enabled).toBe(true);
  });

  it('should use default values for Button', () => {
    const data = { id: 'btn2', type: 'button', text: '按钮' };
    const result = ButtonSchema.parse(data);
    expect(result.enabled).toBe(true);
    expect(result.on_click).toBeUndefined();
  });

  it('should validate a TextInput', () => {
    const data = { id: 'input1', type: 'text_input', placeholder: '请输入', default_value: '默认值', multiline: false };
    const result = TextInputSchema.parse(data);
    expect(result.id).toBe('input1');
    expect(result.type).toBe('text_input');
    expect(result.placeholder).toBe('请输入');
    expect(result.default_value).toBe('默认值');
    expect(result.multiline).toBe(false);
  });

  it('should validate a Label', () => {
    const data = { id: 'label1', type: 'label', text: '标签文本', font_size: 14, bold: true };
    const result = LabelSchema.parse(data);
    expect(result.text).toBe('标签文本');
    expect(result.font_size).toBe(14);
    expect(result.bold).toBe(true);
  });

  it('should validate a Container with children', () => {
    const data = {
      id: 'container1',
      type: 'container',
      layout: 'vertical',
      children: [
        { id: 'label1', type: 'label', text: '测试' },
        { id: 'btn1', type: 'button', text: '按钮' },
      ],
      padding: 10,
      spacing: 5,
    };
    const result = ContainerSchema.parse(data);
    expect(result.layout).toBe('vertical');
    expect(result.children).toHaveLength(2);
  });

  it('should validate a Checkbox', () => {
    const data = { id: 'check1', type: 'checkbox', label: '同意条款', checked: false };
    const result = CheckboxSchema.parse(data);
    expect(result.label).toBe('同意条款');
    expect(result.checked).toBe(false);
  });

  it('should validate a RadioGroup', () => {
    const data = { id: 'radio1', type: 'radio_group', label: '选择性别', options: ['男', '女', '其他'], selected: '男' };
    const result = RadioGroupSchema.parse(data);
    expect(result.options).toHaveLength(3);
    expect(result.selected).toBe('男');
  });

  it('should validate a Dropdown', () => {
    const data = { id: 'dd1', type: 'dropdown', label: '选择城市', options: ['北京', '上海', '广州'], selected: '北京' };
    const result = DropdownSchema.parse(data);
    expect(result.options).toHaveLength(3);
    expect(result.selected).toBe('北京');
  });

  it('should parse a Component union type', () => {
    const buttonData = { id: 'btn1', type: 'button', text: '按钮' };
    const result = ComponentSchema.parse(buttonData);
    expect(result.type).toBe('button');
  });

  it('should reject invalid component type', () => {
    const bad = { id: 'x', type: 'unknown_widget', text: 'bad' };
    expect(() => ComponentSchema.parse(bad)).toThrow();
  });

  it('should reject Button with extra properties (strict)', () => {
    const data = { id: 'btn1', type: 'button', text: '按钮', children: [] };
    expect(() => ButtonSchema.strict().parse(data)).toThrow();
  });
});
```

**Step 2: 运行测试, 确认失败**

```bash
cd genui-ts && npx vitest run tests/core/component.test.ts
```

Expected: FAIL - module not found.

**Step 3: 实现组件定义**

`src/core/component.ts`:

```typescript
// 组件定义, 对应 Python 版的 genui/core/component.py
import { z } from 'zod';

// 组件类型枚举
export const ComponentType = z.enum([
  'button',
  'text_input',
  'label',
  'container',
  'checkbox',
  'radio_group',
  'dropdown',
]);
export type ComponentType = z.infer<typeof ComponentType>;

// Button
export const ButtonSchema = z.object({
  id: z.string(),
  type: z.literal('button'),
  text: z.string(),
  on_click: z.string().optional(),
  enabled: z.boolean().default(true),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type Button = z.infer<typeof ButtonSchema>;

// TextInput
export const TextInputSchema = z.object({
  id: z.string(),
  type: z.literal('text_input'),
  placeholder: z.string().default(''),
  default_value: z.string().default(''),
  multiline: z.boolean().default(false),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type TextInput = z.infer<typeof TextInputSchema>;

// Label
export const LabelSchema = z.object({
  id: z.string(),
  type: z.literal('label'),
  text: z.string(),
  font_size: z.number().default(12),
  bold: z.boolean().default(false),
  color: z.string().optional(),
});
export type Label = z.infer<typeof LabelSchema>;

// Checkbox
export const CheckboxSchema = z.object({
  id: z.string(),
  type: z.literal('checkbox'),
  label: z.string(),
  checked: z.boolean().default(false),
  on_change: z.string().optional(),
});
export type Checkbox = z.infer<typeof CheckboxSchema>;

// RadioGroup
export const RadioGroupSchema = z.object({
  id: z.string(),
  type: z.literal('radio_group'),
  label: z.string(),
  options: z.array(z.string()),
  selected: z.string().optional(),
  on_change: z.string().optional(),
});
export type RadioGroup = z.infer<typeof RadioGroupSchema>;

// Dropdown
export const DropdownSchema = z.object({
  id: z.string(),
  type: z.literal('dropdown'),
  label: z.string().default(''),
  options: z.array(z.string()),
  selected: z.string().optional(),
  width: z.number().optional(),
});
export type Dropdown = z.infer<typeof DropdownSchema>;

// Container (递归引用, 需要用 z.lazy)
export const ContainerSchema: z.ZodType<Container> = z.object({
  id: z.string(),
  type: z.literal('container'),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
  children: z.lazy(() => z.array(ComponentSchema)).default([]),
  padding: z.number().default(10),
  spacing: z.number().default(5),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type Container = {
  id: string;
  type: 'container';
  layout: 'vertical' | 'horizontal' | 'grid';
  children: Component[];
  padding: number;
  spacing: number;
  width?: number;
  height?: number;
};

// Component 联合类型
export const ComponentSchema: z.ZodType<Component> = z.discriminatedUnion('type', [
  ButtonSchema,
  TextInputSchema,
  LabelSchema,
  ContainerSchema as z.ZodObject<any>,
  CheckboxSchema,
  RadioGroupSchema,
  DropdownSchema,
]);
export type Component = Button | TextInput | Label | Container | Checkbox | RadioGroup | Dropdown;
```

> **注意**: `ContainerSchema` 需要用 `z.lazy` 处理递归引用, 并且需要显式声明 `Container` 类型.
> 如果 `z.discriminatedUnion` 与 `z.lazy` 存在兼容问题, 可退而使用 `z.union` 配合自定义 discriminator 逻辑. 实现时根据实际情况调整.

**Step 4: 运行测试, 确认通过**

```bash
cd genui-ts && npx vitest run tests/core/component.test.ts
```

Expected: 全部通过.

**Step 5: Commit**

```bash
git add genui-ts/src/core/component.ts genui-ts/tests/core/component.test.ts
git commit -m "feat(ts): add component type definitions with Zod schemas"
```

---

### Task 3: 核心类型 - UIInstance

对应 Python 版的 `genui/core/ui_instance.py`.

**Files:**
- Create: `genui-ts/src/core/ui-instance.ts`
- Create: `genui-ts/src/core/index.ts`
- Create: `genui-ts/tests/core/ui-instance.test.ts`

**Step 1: 编写 UIInstance 测试**

`tests/core/ui-instance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { UIInstanceSchema } from '../../src/core/ui-instance.js';
import type { UIInstance } from '../../src/core/ui-instance.js';

describe('UIInstance', () => {
  const sampleUI = {
    title: '测试窗口',
    width: 600,
    height: 400,
    root: {
      id: 'root',
      type: 'container',
      layout: 'vertical',
      children: [
        { id: 'label1', type: 'label', text: '欢迎' },
        { id: 'btn1', type: 'button', text: '开始' },
      ],
    },
    event_handlers: {
      handle_click: "function handle_click() { console.log('clicked'); }",
    },
  };

  it('should parse a valid UIInstance', () => {
    const result = UIInstanceSchema.parse(sampleUI);
    expect(result.title).toBe('测试窗口');
    expect(result.width).toBe(600);
    expect(result.height).toBe(400);
    expect(result.root.type).toBe('container');
  });

  it('should use default values', () => {
    const minimal = {
      title: '最小',
      root: { id: 'root', type: 'container', children: [] },
    };
    const result = UIInstanceSchema.parse(minimal);
    expect(result.width).toBe(600);
    expect(result.height).toBe(400);
  });

  it('should list all components recursively', () => {
    const instance = UIInstanceSchema.parse(sampleUI);
    const components = listAllComponents(instance);
    // root + 2 children = 3
    expect(components).toHaveLength(3);
  });

  it('should find component by id', () => {
    const instance = UIInstanceSchema.parse(sampleUI);
    const found = findComponentById(instance, 'btn1');
    expect(found).toBeDefined();
    expect(found!.id).toBe('btn1');
  });

  it('should return undefined for missing component', () => {
    const instance = UIInstanceSchema.parse(sampleUI);
    const found = findComponentById(instance, 'nonexistent');
    expect(found).toBeUndefined();
  });

  it('should get handler code', () => {
    const instance = UIInstanceSchema.parse(sampleUI);
    expect(instance.event_handlers['handle_click']).toContain('handle_click');
    expect(instance.event_handlers['nonexistent']).toBeUndefined();
  });
});

// 导入辅助函数 (实现后取消注释)
import { listAllComponents, findComponentById } from '../../src/core/ui-instance.js';
```

**Step 2: 运行测试, 确认失败**

```bash
cd genui-ts && npx vitest run tests/core/ui-instance.test.ts
```

**Step 3: 实现 UIInstance**

`src/core/ui-instance.ts`:

```typescript
// UI 实例模型, 对应 Python 版的 genui/core/ui_instance.py
import { z } from 'zod';
import { ComponentSchema } from './component.js';
import type { Component, Container } from './component.js';

// UIInstance schema
export const UIInstanceSchema = z.object({
  title: z.string(),
  width: z.number().default(600),
  height: z.number().default(400),
  root: ComponentSchema,
  event_handlers: z.record(z.string(), z.string()).default({}),
});
export type UIInstance = z.infer<typeof UIInstanceSchema>;

// 递归获取所有组件
export function listAllComponents(instance: UIInstance): Component[] {
  const components: Component[] = [instance.root];

  function collect(comp: Component): void {
    if (comp.type === 'container') {
      for (const child of (comp as Container).children) {
        components.push(child);
        collect(child);
      }
    }
  }

  collect(instance.root);
  return components;
}

// 根据 ID 查找组件
export function findComponentById(instance: UIInstance, id: string): Component | undefined {
  return listAllComponents(instance).find((c) => c.id === id);
}
```

`src/core/index.ts` (模块导出):

```typescript
export {
  ComponentType,
  ButtonSchema,
  TextInputSchema,
  LabelSchema,
  ContainerSchema,
  CheckboxSchema,
  RadioGroupSchema,
  DropdownSchema,
  ComponentSchema,
} from './component.js';
export type {
  Button,
  TextInput,
  Label,
  Container,
  Checkbox,
  RadioGroup,
  Dropdown,
  Component,
} from './component.js';

export { UIInstanceSchema, listAllComponents, findComponentById } from './ui-instance.js';
export type { UIInstance } from './ui-instance.js';
```

**Step 4: 运行测试, 确认通过**

```bash
cd genui-ts && npx vitest run tests/core/
```

Expected: 全部通过.

**Step 5: Commit**

```bash
git add genui-ts/src/core/ genui-ts/tests/core/
git commit -m "feat(ts): add UIInstance model with component tree traversal"
```

---

### Task 4: 日志系统

对应 Python 版的 `genui/logger.py`. TypeScript 版用简洁的控制台日志, 支持彩色输出和日志级别.

**Files:**
- Create: `genui-ts/src/logger.ts`
- Create: `genui-ts/tests/logger.test.ts`

**Step 1: 编写日志测试**

`tests/logger.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createLogger, LogLevel } from '../src/logger.js';

describe('Logger', () => {
  it('should create a logger with default level', () => {
    const logger = createLogger('test');
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf('function');
  });

  it('should respect log level', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = createLogger('test', LogLevel.INFO);
    logger.debug('should not print');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should output messages at correct level', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = createLogger('test', LogLevel.DEBUG);
    logger.info('hello');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

**Step 2: 实现日志模块**

`src/logger.ts`:

```typescript
// 日志系统, 对应 Python 版的 genui/logger.py
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: '\x1b[36m',   // cyan
  INFO: '\x1b[32m',    // green
  WARNING: '\x1b[33m', // yellow
  ERROR: '\x1b[31m',   // red
};
const RESET = '\x1b[0m';

export function createLogger(name: string, level?: LogLevel): Logger {
  const minLevel = level ?? LogLevel.INFO;

  function log(lvl: LogLevel, label: string, message: string, args: unknown[]): void {
    if (lvl < minLevel) return;
    const time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const color = LEVEL_COLORS[label] ?? '';
    const formatted = `${color}[${time}] ${name} - ${label} - ${message}${RESET}`;

    switch (lvl) {
      case LogLevel.DEBUG: console.debug(formatted, ...args); break;
      case LogLevel.INFO: console.info(formatted, ...args); break;
      case LogLevel.WARNING: console.warn(formatted, ...args); break;
      case LogLevel.ERROR: console.error(formatted, ...args); break;
    }
  }

  return {
    debug: (msg, ...args) => log(LogLevel.DEBUG, 'DEBUG', msg, args),
    info: (msg, ...args) => log(LogLevel.INFO, 'INFO', msg, args),
    warn: (msg, ...args) => log(LogLevel.WARNING, 'WARNING', msg, args),
    error: (msg, ...args) => log(LogLevel.ERROR, 'ERROR', msg, args),
  };
}

// 解析环境变量中的日志级别
export function parseLogLevel(value: string | undefined): LogLevel {
  switch (value?.toUpperCase()) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'WARNING': return LogLevel.WARNING;
    case 'ERROR': return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
}
```

**Step 3: 运行测试, 确认通过**

```bash
cd genui-ts && npx vitest run tests/logger.test.ts
```

**Step 4: Commit**

```bash
git add genui-ts/src/logger.ts genui-ts/tests/logger.test.ts
git commit -m "feat(ts): add logger with colored output and log levels"
```

---

### Task 5: 工具系统 - Registry 和 Executor

对应 Python 版的 `genui/tools/registry.py` 和 `genui/tools/executor.py`.

**Files:**
- Create: `genui-ts/src/tools/registry.ts`
- Create: `genui-ts/src/tools/executor.ts`
- Create: `genui-ts/src/tools/types.ts`
- Create: `genui-ts/tests/tools/registry.test.ts`
- Create: `genui-ts/tests/tools/executor.test.ts`

**Step 1: 编写 Tool 类型定义**

`src/tools/types.ts`:

```typescript
// 工具类型定义
import { z } from 'zod';

// Tool 接口, 对应 Python 版的 LangChain BaseTool
export interface Tool<TParams extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  parameters: TParams;
  execute(params: z.infer<TParams>): Promise<unknown>;
}

// 工具定义的简化形式 (用于函数式注册)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType;
  execute(params: any): Promise<unknown>;
}
```

**Step 2: 编写 Registry 测试**

`tests/tools/registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../src/tools/registry.js';

describe('ToolRegistry', () => {
  it('should start empty when not loading builtins', () => {
    const registry = new ToolRegistry(false);
    expect(registry.getAllTools()).toHaveLength(0);
  });

  it('should register and retrieve a tool', () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'test_tool',
      description: 'A test tool',
      parameters: z.object({ x: z.number() }),
      execute: async ({ x }) => x * 2,
    });

    expect(registry.getTool('test_tool')).toBeDefined();
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('should return undefined for unknown tool', () => {
    const registry = new ToolRegistry(false);
    expect(registry.getTool('nonexistent')).toBeUndefined();
  });

  it('should generate tools description', () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'calculate',
      description: '计算数学表达式',
      parameters: z.object({ expression: z.string() }),
      execute: async () => 0,
    });

    const desc = registry.getToolsDescription();
    expect(desc).toContain('calculate');
    expect(desc).toContain('计算数学表达式');
  });

  it('should filter tools description by names', () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'tool_a',
      description: 'Tool A',
      parameters: z.object({}),
      execute: async () => {},
    });
    registry.register({
      name: 'tool_b',
      description: 'Tool B',
      parameters: z.object({}),
      execute: async () => {},
    });

    const desc = registry.getToolsDescription(['tool_a']);
    expect(desc).toContain('tool_a');
    expect(desc).not.toContain('tool_b');
  });

  it('should load builtin tools by default', () => {
    const registry = new ToolRegistry(true);
    const tools = registry.getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 3: 编写 Executor 测试**

`tests/tools/executor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../src/tools/registry.js';
import { ToolExecutor } from '../../src/tools/executor.js';

describe('ToolExecutor', () => {
  it('should execute a registered tool', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'double',
      description: 'Double a number',
      parameters: z.object({ x: z.number() }),
      execute: async ({ x }) => x * 2,
    });

    const executor = new ToolExecutor(registry);
    const result = await executor.callFunction('double', { x: 5 });
    expect(result).toBe(10);
  });

  it('should throw for unknown tool', async () => {
    const registry = new ToolRegistry(false);
    const executor = new ToolExecutor(registry);

    await expect(executor.callFunction('nonexistent', {})).rejects.toThrow("不存在");
  });

  it('should throw when tool execution fails', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'failing',
      description: 'Always fails',
      parameters: z.object({}),
      execute: async () => { throw new Error('boom'); },
    });

    const executor = new ToolExecutor(registry);
    await expect(executor.callFunction('failing', {})).rejects.toThrow('boom');
  });
});
```

**Step 4: 实现 Registry**

`src/tools/registry.ts`:

```typescript
// 工具注册中心, 对应 Python 版的 genui/tools/registry.py
import { createLogger } from '../logger.js';
import type { ToolDefinition } from './types.js';

const logger = createLogger('tools.registry');

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(loadBuiltin: boolean = true) {
    if (loadBuiltin) {
      this.loadBuiltinTools();
      logger.info(`已加载 ${this.tools.size} 个内置 tools`);
    }
  }

  private loadBuiltinTools(): void {
    // 延迟导入, 避免循环依赖
    // 在 Task 6 实现内置工具时补充
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    logger.debug(`注册 tool: ${tool.name}`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsDescription(toolNames?: string[]): string {
    const tools = toolNames
      ? toolNames.map((n) => this.getTool(n)).filter((t): t is ToolDefinition => t !== undefined)
      : this.getAllTools();

    if (tools.length === 0) {
      return '当前没有可用的工具函数.';
    }

    return tools.map((t) => `- **${t.name}**: ${t.description}`).join('\n');
  }
}
```

**Step 5: 实现 Executor**

`src/tools/executor.ts`:

```typescript
// 工具执行器, 对应 Python 版的 genui/tools/executor.py
import { createLogger } from '../logger.js';
import { ToolRegistry } from './registry.js';

const logger = createLogger('tools.executor');

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async callFunction(name: string, params: Record<string, unknown>): Promise<unknown> {
    logger.debug(`调用 tool: ${name}, 参数: ${JSON.stringify(params)}`);

    const tool = this.registry.getTool(name);
    if (!tool) {
      const msg = `Tool '${name}' 不存在`;
      logger.error(msg);
      throw new Error(msg);
    }

    try {
      // 用 Zod 校验参数
      const validated = tool.parameters.parse(params);
      const result = await tool.execute(validated);
      logger.info(`Tool 执行成功: ${name}`);
      return result;
    } catch (error) {
      const msg = `Tool '${name}' 执行失败: ${error}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }
}
```

**Step 6: 运行测试, 确认通过**

```bash
cd genui-ts && npx vitest run tests/tools/
```

Expected: 全部通过 (builtin 加载测试可能需要先跳过或在 Task 6 之后补充).

**Step 7: Commit**

```bash
git add genui-ts/src/tools/ genui-ts/tests/tools/
git commit -m "feat(ts): add ToolRegistry and ToolExecutor"
```

---

### Task 6: 内置工具

对应 Python 版的 `genui/tools/builtin/` 下的 calculator, query, file_ops.

**Files:**
- Create: `genui-ts/src/tools/builtin/calculator.ts`
- Create: `genui-ts/src/tools/builtin/query.ts`
- Create: `genui-ts/src/tools/builtin/file-ops.ts`
- Create: `genui-ts/src/tools/builtin/index.ts`
- Create: `genui-ts/src/tools/index.ts`
- Create: `genui-ts/tests/tools/builtin.test.ts`
- Modify: `genui-ts/src/tools/registry.ts` (补充 loadBuiltinTools)

**Step 1: 编写内置工具测试**

`tests/tools/builtin.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getAllBuiltinTools } from '../../src/tools/builtin/index.js';
import { ToolExecutor } from '../../src/tools/executor.js';
import { ToolRegistry } from '../../src/tools/registry.js';

describe('Builtin tools', () => {
  it('should have at least 6 builtin tools', () => {
    const tools = getAllBuiltinTools();
    expect(tools.length).toBeGreaterThanOrEqual(6);
  });

  describe('calculate', () => {
    it('should evaluate simple expressions', async () => {
      const registry = new ToolRegistry(true);
      const executor = new ToolExecutor(registry);
      expect(await executor.callFunction('calculate', { expression: '2 + 3' })).toBe(5);
      expect(await executor.callFunction('calculate', { expression: '10 * 5' })).toBe(50);
      expect(await executor.callFunction('calculate', { expression: '2 ** 3' })).toBe(8);
    });
  });

  describe('convert_unit', () => {
    it('should convert length units', async () => {
      const registry = new ToolRegistry(true);
      const executor = new ToolExecutor(registry);
      const result = await executor.callFunction('convert_unit', { value: 1, from_unit: 'km', to_unit: 'm' });
      expect(result).toBe(1000);
    });

    it('should convert temperature units', async () => {
      const registry = new ToolRegistry(true);
      const executor = new ToolExecutor(registry);
      const result = await executor.callFunction('convert_unit', { value: 0, from_unit: 'celsius', to_unit: 'fahrenheit' });
      expect(result).toBe(32);
    });
  });

  describe('get_weather', () => {
    it('should return weather data', async () => {
      const registry = new ToolRegistry(true);
      const executor = new ToolExecutor(registry);
      const result = await executor.callFunction('get_weather', { city: '北京' }) as any;
      expect(result.city).toBe('北京');
      expect(result.weather).toBeDefined();
      expect(result.temperature).toBeDefined();
    });
  });

  describe('get_current_time', () => {
    it('should return a time string', async () => {
      const registry = new ToolRegistry(true);
      const executor = new ToolExecutor(registry);
      const result = await executor.callFunction('get_current_time', {});
      expect(typeof result).toBe('string');
      // 应该包含年月日
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });
});
```

**Step 2: 实现内置工具**

`src/tools/builtin/calculator.ts`:

```typescript
// 计算类工具, 对应 Python 版的 genui/tools/builtin/calculator.py
import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

// 安全的数学表达式求值 (不使用 eval)
function safeEval(expr: string): number {
  // 只允许数字, 运算符, 括号, 小数点, 空格
  if (!/^[\d+\-*/().%\s^]+$/.test(expr)) {
    throw new Error(`不安全的表达式: ${expr}`);
  }
  // 将 ^ 替换为 ** (幂运算)
  const normalized = expr.replace(/\^/g, '**');
  // 使用 Function 构造器安全求值
  const fn = new Function(`"use strict"; return (${normalized});`);
  const result = fn();
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error(`计算结果无效: ${result}`);
  }
  return result;
}

export const calculateTool: ToolDefinition = {
  name: 'calculate',
  description: '计算数学表达式, 支持 +, -, *, /, ** (幂运算) 和括号',
  parameters: z.object({
    expression: z.string().describe('数学表达式'),
  }),
  execute: async ({ expression }) => {
    try {
      return safeEval(expression);
    } catch (e) {
      throw new Error(`无法计算表达式 '${expression}': ${e}`);
    }
  },
};

// 长度单位 (转换为米)
const LENGTH_UNITS: Record<string, number> = {
  m: 1.0,
  km: 1000.0,
  mile: 1609.34,
  ft: 0.3048,
  inch: 0.0254,
};

const TEMPERATURE_UNITS = new Set(['celsius', 'fahrenheit', 'kelvin']);

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'celsius') celsius = value;
  else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (from === 'kelvin') celsius = value - 273.15;
  else throw new Error(`不支持的温度单位: ${from}`);

  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
  if (to === 'kelvin') return celsius + 273.15;
  throw new Error(`不支持的温度单位: ${to}`);
}

export const convertUnitTool: ToolDefinition = {
  name: 'convert_unit',
  description: '单位转换, 支持长度 (m, km, mile, ft, inch) 和温度 (celsius, fahrenheit, kelvin)',
  parameters: z.object({
    value: z.number().describe('要转换的值'),
    from_unit: z.string().describe('源单位'),
    to_unit: z.string().describe('目标单位'),
  }),
  execute: async ({ value, from_unit, to_unit }) => {
    const from = from_unit.toLowerCase();
    const to = to_unit.toLowerCase();

    if (TEMPERATURE_UNITS.has(from) || TEMPERATURE_UNITS.has(to)) {
      return convertTemperature(value, from, to);
    }

    if (from in LENGTH_UNITS && to in LENGTH_UNITS) {
      const meters = value * LENGTH_UNITS[from];
      return meters / LENGTH_UNITS[to];
    }

    throw new Error(`不支持的单位转换: ${from_unit} -> ${to_unit}`);
  },
};
```

`src/tools/builtin/query.ts`:

```typescript
// 查询类工具, 对应 Python 版的 genui/tools/builtin/query.py
import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

const WEATHER_DATA: Record<string, { weather: string; temperature: number }> = {
  '北京': { weather: '晴', temperature: 25.0 },
  '上海': { weather: '多云', temperature: 28.0 },
  '广州': { weather: '雨', temperature: 30.0 },
  '深圳': { weather: '雨', temperature: 29.0 },
};

export const getWeatherTool: ToolDefinition = {
  name: 'get_weather',
  description: '获取城市天气 (mock 数据)',
  parameters: z.object({
    city: z.string().describe('城市名称'),
  }),
  execute: async ({ city }) => {
    const data = WEATHER_DATA[city] ?? { weather: '晴', temperature: 20.0 };
    return { city, weather: data.weather, temperature: data.temperature };
  },
};

export const getCurrentTimeTool: ToolDefinition = {
  name: 'get_current_time',
  description: '获取当前时间',
  parameters: z.object({
    timezone: z.string().default('Asia/Shanghai').describe('时区'),
  }),
  execute: async () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  },
};
```

`src/tools/builtin/file-ops.ts`:

```typescript
// 文件操作类工具, 对应 Python 版的 genui/tools/builtin/file_ops.py
import { z } from 'zod';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import type { ToolDefinition } from '../types.js';

export const readTextFileTool: ToolDefinition = {
  name: 'read_text_file',
  description: '读取文本文件内容',
  parameters: z.object({
    file_path: z.string().describe('文件路径'),
  }),
  execute: async ({ file_path }) => {
    try {
      return readFileSync(file_path, 'utf-8');
    } catch (e) {
      throw new Error(`读取文件失败: ${file_path} - ${e}`);
    }
  },
};

export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  description: '列出目录内容',
  parameters: z.object({
    dir_path: z.string().default('.').describe('目录路径'),
  }),
  execute: async ({ dir_path }) => {
    try {
      return readdirSync(dir_path);
    } catch (e) {
      throw new Error(`读取目录失败: ${dir_path} - ${e}`);
    }
  },
};
```

`src/tools/builtin/index.ts`:

```typescript
import type { ToolDefinition } from '../types.js';
import { calculateTool, convertUnitTool } from './calculator.js';
import { getWeatherTool, getCurrentTimeTool } from './query.js';
import { readTextFileTool, listDirectoryTool } from './file-ops.js';

export function getAllBuiltinTools(): ToolDefinition[] {
  return [
    calculateTool,
    convertUnitTool,
    getWeatherTool,
    getCurrentTimeTool,
    readTextFileTool,
    listDirectoryTool,
  ];
}
```

`src/tools/index.ts`:

```typescript
export { ToolRegistry } from './registry.js';
export { ToolExecutor } from './executor.js';
export type { Tool, ToolDefinition } from './types.js';
export { getAllBuiltinTools } from './builtin/index.js';
```

**Step 3: 更新 Registry 的 loadBuiltinTools**

在 `src/tools/registry.ts` 中修改 `loadBuiltinTools`:

```typescript
private loadBuiltinTools(): void {
  const { getAllBuiltinTools } = await import('./builtin/index.js');
  // 注意: 如果不想用 top-level await, 改为同步导入
}
```

> 由于 `loadBuiltinTools` 在构造函数中被调用, 不能用 async. 改为同步导入:

```typescript
private loadBuiltinTools(): void {
  // 直接导入, 因为构造函数是同步的
  const tools = getAllBuiltinToolsSync();
  for (const tool of tools) {
    this.register(tool);
  }
}
```

实际实现时, 在文件顶部直接 import `getAllBuiltinTools`:

```typescript
import { getAllBuiltinTools } from './builtin/index.js';
```

然后:

```typescript
private loadBuiltinTools(): void {
  for (const tool of getAllBuiltinTools()) {
    this.register(tool);
  }
}
```

**Step 4: 运行测试**

```bash
cd genui-ts && npx vitest run tests/tools/
```

Expected: 全部通过.

**Step 5: Commit**

```bash
git add genui-ts/src/tools/ genui-ts/tests/tools/
git commit -m "feat(ts): add builtin tools (calculator, query, file-ops)"
```

---

### Task 7: 适配器基类与 TestAdapter

对应 Python 版的 `genui/adapters/base.py` 和 `genui/adapters/test_adapter.py`.

**Files:**
- Create: `genui-ts/src/adapters/base.ts`
- Create: `genui-ts/src/adapters/test-adapter.ts`
- Create: `genui-ts/src/adapters/index.ts`
- Create: `genui-ts/tests/adapters/test-adapter.test.ts`

**Step 1: 编写 TestAdapter 测试**

`tests/adapters/test-adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TestAdapter } from '../../src/adapters/test-adapter.js';
import { UIInstanceSchema } from '../../src/core/ui-instance.js';

describe('TestAdapter', () => {
  const calcUI = UIInstanceSchema.parse({
    title: '计算器',
    root: {
      id: 'main', type: 'container', layout: 'vertical',
      children: [
        { id: 'num1', type: 'text_input', placeholder: '数字1' },
        { id: 'num2', type: 'text_input', placeholder: '数字2' },
        { id: 'result', type: 'label', text: '结果: ' },
        { id: 'calc', type: 'button', text: '计算', on_click: 'calculate' },
      ],
    },
    event_handlers: {
      calculate: `function calculate() {
        const n1 = parseFloat(getValue('num1'));
        const n2 = parseFloat(getValue('num2'));
        setValue('result', '结果: ' + (n1 + n2));
        display('计算完成');
      }`,
    },
  });

  it('should create window and render components', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(calcUI);
    expect(adapter.getWidget('num1')).toBeDefined();
    expect(adapter.getWidget('num2')).toBeDefined();
    expect(adapter.getWidget('result')).toBeDefined();
    expect(adapter.getWidget('calc')).toBeDefined();
  });

  it('should simulate input and click', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(calcUI);

    adapter.setInput('num1', '10');
    adapter.setInput('num2', '5');
    adapter.click('calc');

    expect(adapter.getOutput('result')).toContain('15');
  });

  it('should record events', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(calcUI);

    adapter.setInput('num1', '1');
    adapter.setInput('num2', '2');
    adapter.click('calc');

    const events = adapter.getEvents();
    expect(events).toContainEqual(['click', 'calc']);
  });

  it('should record display outputs', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(calcUI);

    adapter.setInput('num1', '1');
    adapter.setInput('num2', '2');
    adapter.click('calc');

    expect(adapter.getDisplayOutputs()).toContain('计算完成');
  });

  it('should handle checkbox interaction', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(UIInstanceSchema.parse({
      title: '表单',
      root: {
        id: 'main', type: 'container',
        children: [
          { id: 'agree', type: 'checkbox', label: '同意', checked: false },
        ],
      },
    }));

    expect(adapter.getOutput('agree')).toBe(false);
    adapter.check('agree', true);
    expect(adapter.getOutput('agree')).toBe(true);
  });

  it('should handle dropdown selection', async () => {
    const adapter = new TestAdapter();
    await adapter.createWindow(UIInstanceSchema.parse({
      title: '选择',
      root: {
        id: 'main', type: 'container',
        children: [
          { id: 'city', type: 'dropdown', label: '城市', options: ['北京', '上海'], selected: '北京' },
        ],
      },
    }));

    expect(adapter.getOutput('city')).toBe('北京');
    adapter.select('city', '上海');
    expect(adapter.getOutput('city')).toBe('上海');
  });
});
```

**Step 2: 实现适配器基类**

`src/adapters/base.ts`:

```typescript
// 适配器基类, 对应 Python 版的 genui/adapters/base.py
import type { Component } from '../core/component.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ToolExecutor } from '../tools/executor.js';

export interface UIAdapter {
  readonly name: string;
  createWindow(uiInstance: UIInstance, toolExecutor?: ToolExecutor): Promise<void>;
  runEventLoop(): Promise<void>;
}
```

**Step 3: 实现 TestAdapter**

`src/adapters/test-adapter.ts`:

```typescript
// 测试适配器, 对应 Python 版的 genui/adapters/test_adapter.py
import type { UIAdapter } from './base.js';
import type { Component, Container } from '../core/component.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ToolExecutor } from '../tools/executor.js';

interface VirtualWidget {
  id: string;
  type: string;
  value: unknown;
  component: Component;
  eventHandlers: Map<string, () => void>;
}

export class TestAdapter implements UIAdapter {
  readonly name = 'test';
  private widgets: Map<string, VirtualWidget> = new Map();
  private events: Array<[string, string]> = [];
  private displayOutputs: string[] = [];
  private compiledHandlers: Map<string, () => void> = new Map();

  async createWindow(uiInstance: UIInstance, toolExecutor?: ToolExecutor): Promise<void> {
    // 构建辅助函数环境
    const helperEnv = {
      getValue: (id: string) => this.getOutput(id),
      setValue: (id: string, value: unknown) => this.setValueInternal(id, value),
      getWidget: (id: string) => this.getWidget(id),
      updateWidget: (id: string, props: Record<string, unknown>) => {
        const w = this.getWidget(id);
        if (props.text !== undefined) w.value = props.text;
      },
      display: (msg: string) => this.displayOutputs.push(msg),
      callFunction: toolExecutor
        ? (name: string, params: Record<string, unknown>) => toolExecutor.callFunction(name, params)
        : undefined,
    };

    // 编译事件处理函数
    // 在 JS 中, 用 Function 构造器模拟 Python 的 exec
    for (const [handlerName, code] of Object.entries(uiInstance.event_handlers)) {
      const envKeys = Object.keys(helperEnv).filter((k) => helperEnv[k as keyof typeof helperEnv] !== undefined);
      const envValues = envKeys.map((k) => helperEnv[k as keyof typeof helperEnv]);

      try {
        const fn = new Function(...envKeys, `${code}\nreturn ${handlerName};`);
        const handler = fn(...envValues) as () => void;
        this.compiledHandlers.set(handlerName, handler);
      } catch (e) {
        throw new Error(`编译事件处理函数 '${handlerName}' 失败: ${e}`);
      }
    }

    // 渲染组件树
    this.renderComponent(uiInstance.root);
  }

  private renderComponent(component: Component): void {
    const widget: VirtualWidget = {
      id: component.id,
      type: component.type,
      value: this.getInitialValue(component),
      component,
      eventHandlers: new Map(),
    };

    // 绑定事件处理器
    if (component.type === 'button' && 'on_click' in component && component.on_click) {
      const handler = this.compiledHandlers.get(component.on_click);
      if (handler) widget.eventHandlers.set('click', handler);
    }
    if ((component.type === 'checkbox' || component.type === 'radio_group') && 'on_change' in component && component.on_change) {
      const handler = this.compiledHandlers.get(component.on_change);
      if (handler) widget.eventHandlers.set('change', handler);
    }

    this.widgets.set(component.id, widget);

    // 递归渲染子组件
    if (component.type === 'container') {
      for (const child of (component as Container).children) {
        this.renderComponent(child);
      }
    }
  }

  private getInitialValue(component: Component): unknown {
    switch (component.type) {
      case 'text_input': return component.default_value ?? '';
      case 'checkbox': return component.checked ?? false;
      case 'radio_group': return component.selected ?? null;
      case 'dropdown': return component.selected ?? null;
      case 'label': return component.text ?? '';
      default: return null;
    }
  }

  async runEventLoop(): Promise<void> {
    // 测试模式不需要事件循环
  }

  // ===== 测试辅助方法 =====

  click(componentId: string): void {
    const widget = this.requireWidget(componentId);
    if (widget.type !== 'button') throw new Error(`组件 '${componentId}' 不是按钮`);
    const handler = widget.eventHandlers.get('click');
    if (handler) {
      handler();
      this.events.push(['click', componentId]);
    }
  }

  setInput(componentId: string, value: string): void {
    const widget = this.requireWidget(componentId);
    if (widget.type !== 'text_input') throw new Error(`组件 '${componentId}' 不支持输入`);
    widget.value = value;
  }

  getOutput(componentId: string): unknown {
    return this.requireWidget(componentId).value;
  }

  select(componentId: string, option: string): void {
    const widget = this.requireWidget(componentId);
    if (widget.type !== 'dropdown' && widget.type !== 'radio_group') {
      throw new Error(`组件 '${componentId}' 不支持选择`);
    }
    widget.value = option;
    const handler = widget.eventHandlers.get('change');
    if (handler) {
      handler();
      this.events.push(['change', componentId]);
    }
  }

  check(componentId: string, checked: boolean = true): void {
    const widget = this.requireWidget(componentId);
    if (widget.type !== 'checkbox') throw new Error(`组件 '${componentId}' 不是复选框`);
    widget.value = checked;
    const handler = widget.eventHandlers.get('change');
    if (handler) {
      handler();
      this.events.push(['change', componentId]);
    }
  }

  getWidget(componentId: string): VirtualWidget {
    return this.requireWidget(componentId);
  }

  getEvents(): Array<[string, string]> {
    return [...this.events];
  }

  getDisplayOutputs(): string[] {
    return [...this.displayOutputs];
  }

  clearEvents(): void { this.events = []; }
  clearOutputs(): void { this.displayOutputs = []; }

  private setValueInternal(id: string, value: unknown): void {
    this.requireWidget(id).value = value;
  }

  private requireWidget(id: string): VirtualWidget {
    const w = this.widgets.get(id);
    if (!w) throw new Error(`组件 '${id}' 不存在`);
    return w;
  }
}
```

`src/adapters/index.ts`:

```typescript
export type { UIAdapter } from './base.js';
export { TestAdapter } from './test-adapter.js';
```

**Step 4: 运行测试, 确认通过**

```bash
cd genui-ts && npx vitest run tests/adapters/
```

**Step 5: Commit**

```bash
git add genui-ts/src/adapters/ genui-ts/tests/adapters/
git commit -m "feat(ts): add UIAdapter interface and TestAdapter"
```

---

### Task 8: 渲染器

对应 Python 版的 `genui/renderer/renderer.py`.

**Files:**
- Create: `genui-ts/src/renderer/renderer.ts`
- Create: `genui-ts/src/renderer/index.ts`
- Create: `genui-ts/tests/renderer.test.ts`

**Step 1: 编写渲染器测试**

`tests/renderer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Renderer } from '../src/renderer/renderer.js';
import { TestAdapter } from '../src/adapters/test-adapter.js';
import { UIInstanceSchema } from '../src/core/ui-instance.js';

describe('Renderer', () => {
  it('should render a UIInstance with TestAdapter', async () => {
    const adapter = new TestAdapter();
    const renderer = new Renderer(adapter);

    const ui = UIInstanceSchema.parse({
      title: '测试',
      root: {
        id: 'main', type: 'container',
        children: [{ id: 'label1', type: 'label', text: 'Hello' }],
      },
    });

    await renderer.render(ui);
    expect(adapter.getOutput('label1')).toBe('Hello');
  });
});
```

**Step 2: 实现渲染器**

`src/renderer/renderer.ts`:

```typescript
// 渲染器, 对应 Python 版的 genui/renderer/renderer.py
import type { UIAdapter } from '../adapters/base.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { ToolExecutor } from '../tools/executor.js';
import { createLogger } from '../logger.js';

const logger = createLogger('renderer');

export class Renderer {
  private adapter: UIAdapter;
  private toolExecutor?: ToolExecutor;

  constructor(adapter: UIAdapter, toolExecutor?: ToolExecutor) {
    this.adapter = adapter;
    this.toolExecutor = toolExecutor;
    logger.info(`使用渲染适配器: ${adapter.name}`);
  }

  async render(uiInstance: UIInstance): Promise<void> {
    await this.adapter.createWindow(uiInstance, this.toolExecutor);
    await this.adapter.runEventLoop();
  }
}
```

`src/renderer/index.ts`:

```typescript
export { Renderer } from './renderer.js';
```

**Step 3: 运行测试**

```bash
cd genui-ts && npx vitest run tests/renderer.test.ts
```

**Step 4: Commit**

```bash
git add genui-ts/src/renderer/ genui-ts/tests/renderer.test.ts
git commit -m "feat(ts): add Renderer class"
```

---

### Task 9: LLM 客户端

对应 Python 版的 `genui/generator/llm_client.py`. 直接调用 REST API, 不依赖 LangChain.

**Files:**
- Create: `genui-ts/src/generator/llm-client.ts`
- Create: `genui-ts/tests/generator/llm-client.test.ts`

**Step 1: 编写 LLM 客户端测试 (使用 mock)**

`tests/generator/llm-client.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LLMClient } from '../../src/generator/llm-client.js';

describe('LLMClient', () => {
  it('should construct with default config from env', () => {
    // 设置环境变量
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.LLM_PROVIDER = 'openai';

    const client = new LLMClient();
    expect(client.provider).toBe('openai');

    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  it('should throw for missing API key', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LLM_PROVIDER = 'openai';

    expect(() => new LLMClient()).toThrow('API');

    delete process.env.LLM_PROVIDER;
  });

  it('should throw for unsupported provider', () => {
    process.env.LLM_PROVIDER = 'unsupported';
    expect(() => new LLMClient()).toThrow('不支持');
    delete process.env.LLM_PROVIDER;
  });
});
```

**Step 2: 实现 LLM 客户端**

`src/generator/llm-client.ts`:

```typescript
// LLM 客户端, 对应 Python 版的 genui/generator/llm_client.py
// 直接调用 REST API, 不依赖 LangChain
import { createLogger } from '../logger.js';

const logger = createLogger('generator.llm_client');

type Provider = 'openai' | 'anthropic';

interface LLMConfig {
  provider: Provider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

export class LLMClient {
  readonly provider: Provider;
  private config: LLMConfig;

  constructor(config?: { model?: string; provider?: Provider }) {
    this.provider = config?.provider ?? (process.env.LLM_PROVIDER as Provider) ?? 'openai';

    if (this.provider !== 'openai' && this.provider !== 'anthropic') {
      throw new Error(`不支持的 provider: ${this.provider}, 仅支持 'openai' 或 'anthropic'`);
    }

    const apiKey = this.provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const envVar = this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
      throw new Error(`未找到 ${envVar}, 请设置环境变量`);
    }

    const defaultModel = this.provider === 'openai'
      ? (process.env.OPENAI_MODEL ?? 'gpt-4o')
      : (process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022');

    this.config = {
      provider: this.provider,
      model: config?.model ?? defaultModel,
      apiKey,
      baseUrl: this.provider === 'openai' ? process.env.OPENAI_BASE_URL : undefined,
      temperature: 0.7,
      maxTokens: 4096,
    };

    logger.info(`初始化 LLM 客户端, provider=${this.provider}, model=${this.config.model}`);
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    logger.info(`调用 LLM API, model=${this.config.model}`);

    if (this.config.provider === 'openai') {
      return this.callOpenAI(systemPrompt, userMessage);
    } else {
      return this.callAnthropic(systemPrompt, userMessage);
    }
  }

  private async callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
    const url = `${baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API 调用失败 (${response.status}): ${text}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI API 返回为空');

    logger.info(`成功生成内容, 长度: ${content.length}`);
    return content;
  }

  private async callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API 调用失败 (${response.status}): ${text}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Anthropic API 返回为空');

    logger.info(`成功生成内容, 长度: ${content.length}`);
    return content;
  }
}
```

**Step 3: 运行测试**

```bash
cd genui-ts && npx vitest run tests/generator/
```

**Step 4: Commit**

```bash
git add genui-ts/src/generator/ genui-ts/tests/generator/
git commit -m "feat(ts): add LLMClient with OpenAI and Anthropic support"
```

---

### Task 10: UI 生成器

对应 Python 版的 `genui/generator/ui_generator.py`. 包含两阶段生成 (Tool 规划 + UI 生成).

**Files:**
- Create: `genui-ts/src/generator/ui-generator.ts`
- Create: `genui-ts/src/generator/index.ts`
- Create: `genui-ts/tests/generator/ui-generator.test.ts`

**Step 1: 编写 UI 生成器测试 (mock LLM)**

`tests/generator/ui-generator.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { UIGenerator } from '../../src/generator/ui-generator.js';
import { ToolRegistry } from '../../src/tools/registry.js';

// Mock LLM client
const mockLLMClient = {
  provider: 'openai' as const,
  generate: vi.fn(),
};

describe('UIGenerator', () => {
  it('should extract JSON from markdown code blocks', () => {
    const generator = new UIGenerator(mockLLMClient as any, new ToolRegistry(false));
    const json = generator.extractJson('```json\n{"title": "test"}\n```');
    expect(json).toBe('{"title": "test"}');
  });

  it('should extract raw JSON', () => {
    const generator = new UIGenerator(mockLLMClient as any, new ToolRegistry(false));
    const json = generator.extractJson('{"title": "test"}');
    expect(json).toBe('{"title": "test"}');
  });

  it('should generate UI from LLM response', async () => {
    // Mock: 阶段1 - 返回空 tools
    mockLLMClient.generate.mockResolvedValueOnce(JSON.stringify({
      selected_tools: [],
      reasoning: '不需要工具',
    }));

    // Mock: 阶段2 - 返回 UI 配置
    mockLLMClient.generate.mockResolvedValueOnce(JSON.stringify({
      title: '测试 UI',
      root: {
        id: 'main',
        type: 'container',
        children: [{ id: 'label1', type: 'label', text: 'Hello' }],
      },
      event_handlers: {},
    }));

    const generator = new UIGenerator(mockLLMClient as any, new ToolRegistry(false));
    const ui = await generator.generate('生成一个简单页面');

    expect(ui.title).toBe('测试 UI');
    expect(ui.root.type).toBe('container');
  });
});
```

**Step 2: 实现 UI 生成器**

`src/generator/ui-generator.ts`:

```typescript
// UI 生成器, 对应 Python 版的 genui/generator/ui_generator.py
import { UIInstanceSchema } from '../core/ui-instance.js';
import type { UIInstance } from '../core/ui-instance.js';
import type { LLMClient } from './llm-client.js';
import { ToolRegistry } from '../tools/registry.js';
import { createLogger } from '../logger.js';

const logger = createLogger('generator.ui_generator');

// Tool 规划 prompt (与 Python 版一致)
const TOOL_PLANNING_PROMPT = `你是一个 UI 功能规划助手.

分析用户需求, 从以下可用工具中选择需要使用的工具:

{tools_description}

用户需求: {user_description}

输出 JSON 格式:
{
  "selected_tools": ["tool_name1", "tool_name2"],
  "reasoning": "选择这些工具的原因"
}

规则:
1. 只选择真正需要的工具, 不要选择不相关的
2. 如果用户需求不需要任何工具, selected_tools 为空列表
3. 优先选择功能精确匹配的工具`;

export class UIGenerator {
  private llmClient: LLMClient;
  private toolRegistry: ToolRegistry;

  // 系统提示词 (精简版, 完整版从 Python 版移植)
  private static readonly SYSTEM_PROMPT = `你是一个UI生成助手, 根据用户的描述生成UI界面配置.

{tools_section}

你可以使用以下UI组件: Container, Button, TextInput, Label, Checkbox, RadioGroup, Dropdown.

事件处理函数使用 JavaScript 编写, 可以使用以下辅助函数:
- getValue(componentId) - 获取组件值
- setValue(componentId, value) - 设置组件值
- display(message) - 显示消息
- callFunction(name, params) - 调用工具函数

输出格式 (JSON):
{
  "title": "窗口标题",
  "width": 600,
  "height": 400,
  "root": { 组件对象 },
  "event_handlers": { "函数名": "function 函数名() { ... }" }
}

只输出JSON, 不要有其他文字.`;

  constructor(llmClient: LLMClient, toolRegistry?: ToolRegistry) {
    this.llmClient = llmClient;
    this.toolRegistry = toolRegistry ?? new ToolRegistry();
  }

  async generate(userDescription: string): Promise<UIInstance> {
    logger.info(`开始两阶段 UI 生成, 用户描述: ${userDescription.slice(0, 50)}...`);

    // 阶段1: Tool 规划
    const selectedTools = await this.planTools(userDescription);

    // 阶段2: UI 生成
    const uiInstance = await this.generateUI(userDescription, selectedTools);

    logger.info('UI 生成完成');
    return uiInstance;
  }

  extractJson(text: string): string {
    // 移除 markdown 代码块标记
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    if (cleaned.startsWith('{')) return cleaned;

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return cleaned.slice(start, end + 1);
    }
    return cleaned;
  }

  private async planTools(userDescription: string): Promise<string[]> {
    const toolsDescription = this.toolRegistry.getToolsDescription();
    const prompt = TOOL_PLANNING_PROMPT
      .replace('{tools_description}', toolsDescription)
      .replace('{user_description}', userDescription);

    try {
      const response = await this.llmClient.generate(prompt, '请分析并选择所需工具');
      const jsonStr = this.extractJson(response);
      const data = JSON.parse(jsonStr);
      const selectedTools: string[] = data.selected_tools ?? [];

      logger.info(`Tool 规划完成: 选中 ${selectedTools.length} 个 tools`);
      return selectedTools;
    } catch (e) {
      logger.warn(`Tool 规划失败, 使用空列表: ${e}`);
      return [];
    }
  }

  private buildToolsSection(selectedTools: string[]): string {
    if (selectedTools.length === 0) return '';
    const desc = this.toolRegistry.getToolsDescription(selectedTools);
    return `你可以调用以下功能函数:\n\n${desc}\n\n在事件处理函数中, 使用 callFunction(name, params) 来调用.`;
  }

  private async generateUI(userDescription: string, selectedTools: string[]): Promise<UIInstance> {
    const toolsSection = this.buildToolsSection(selectedTools);
    const systemPrompt = UIGenerator.SYSTEM_PROMPT.replace('{tools_section}', toolsSection);

    const response = await this.llmClient.generate(systemPrompt, userDescription);
    const jsonStr = this.extractJson(response);

    let configDict: unknown;
    try {
      configDict = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error(`无法解析 LLM 返回的 JSON: ${e}\n内容: ${jsonStr}`);
    }

    try {
      return UIInstanceSchema.parse(configDict);
    } catch (e) {
      throw new Error(`生成的 UI 配置无效: ${e}`);
    }
  }
}
```

`src/generator/index.ts`:

```typescript
export { LLMClient } from './llm-client.js';
export { UIGenerator } from './ui-generator.js';
```

**Step 3: 运行测试**

```bash
cd genui-ts && npx vitest run tests/generator/
```

**Step 4: Commit**

```bash
git add genui-ts/src/generator/ genui-ts/tests/generator/
git commit -m "feat(ts): add UIGenerator with two-stage LLM generation"
```

---

### Task 11: 公共 API 导出 & 端到端测试

整合所有模块, 更新 `src/index.ts`, 编写端到端测试.

**Files:**
- Modify: `genui-ts/src/index.ts`
- Create: `genui-ts/tests/e2e/headless.test.ts`
- Delete: `genui-ts/tests/smoke.test.ts` (替换为真实测试)

**Step 1: 更新公共 API**

`src/index.ts`:

```typescript
// genui-ts - 基于大模型的动态 UI 生成工具
export const VERSION = '0.1.0';

// Core
export {
  ComponentType,
  ButtonSchema, TextInputSchema, LabelSchema,
  ContainerSchema, CheckboxSchema, RadioGroupSchema, DropdownSchema,
  ComponentSchema,
  UIInstanceSchema,
  listAllComponents, findComponentById,
} from './core/index.js';
export type {
  Button, TextInput, Label, Container,
  Checkbox, RadioGroup, Dropdown, Component,
  UIInstance,
} from './core/index.js';

// Generator
export { LLMClient } from './generator/index.js';
export { UIGenerator } from './generator/index.js';

// Renderer
export { Renderer } from './renderer/index.js';

// Adapters
export type { UIAdapter } from './adapters/index.js';
export { TestAdapter } from './adapters/index.js';

// Tools
export { ToolRegistry, ToolExecutor } from './tools/index.js';
export type { Tool, ToolDefinition } from './tools/index.js';
```

**Step 2: 编写端到端测试**

`tests/e2e/headless.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TestAdapter } from '../../src/adapters/test-adapter.js';
import { Renderer } from '../../src/renderer/renderer.js';
import { ToolRegistry } from '../../src/tools/registry.js';
import { ToolExecutor } from '../../src/tools/executor.js';
import { UIInstanceSchema } from '../../src/core/ui-instance.js';
import { z } from 'zod';

describe('E2E headless tests', () => {
  it('should handle button click and update label', async () => {
    const adapter = new TestAdapter();
    const renderer = new Renderer(adapter);

    const ui = UIInstanceSchema.parse({
      title: '测试',
      root: {
        id: 'main', type: 'container', layout: 'vertical',
        children: [
          { id: 'label1', type: 'label', text: 'Hello' },
          { id: 'btn1', type: 'button', text: 'Click', on_click: 'handle_click' },
        ],
      },
      event_handlers: {
        handle_click: "function handle_click() { setValue('label1', 'Clicked!'); display('Button clicked'); }",
      },
    });

    await renderer.render(ui);

    expect(adapter.getOutput('label1')).toBe('Hello');
    adapter.click('btn1');
    expect(adapter.getOutput('label1')).toBe('Clicked!');
    expect(adapter.getDisplayOutputs()).toContain('Button clicked');
  });

  it('should handle calculator flow', async () => {
    const adapter = new TestAdapter();
    const renderer = new Renderer(adapter);

    const ui = UIInstanceSchema.parse({
      title: '计算器',
      root: {
        id: 'main', type: 'container',
        children: [
          { id: 'num1', type: 'text_input', placeholder: '数字1' },
          { id: 'op', type: 'dropdown', label: '运算符', options: ['+', '-', '*', '/'], selected: '+' },
          { id: 'num2', type: 'text_input', placeholder: '数字2' },
          { id: 'result', type: 'label', text: '结果: ' },
          { id: 'calc', type: 'button', text: '计算', on_click: 'calculate' },
        ],
      },
      event_handlers: {
        calculate: `function calculate() {
          var n1 = parseFloat(getValue('num1'));
          var n2 = parseFloat(getValue('num2'));
          var op = getValue('op');
          var r;
          if (op === '+') r = n1 + n2;
          else if (op === '-') r = n1 - n2;
          else if (op === '*') r = n1 * n2;
          else if (op === '/') r = n2 !== 0 ? n1 / n2 : '错误: 除数为0';
          setValue('result', '结果: ' + r);
        }`,
      },
    });

    await renderer.render(ui);

    adapter.setInput('num1', '10');
    adapter.setInput('num2', '5');
    adapter.click('calc');
    expect(adapter.getOutput('result')).toContain('15');

    adapter.setInput('num1', '10');
    adapter.setInput('num2', '0');
    adapter.select('op', '/');
    adapter.click('calc');
    expect(String(adapter.getOutput('result'))).toContain('错误');
  });

  it('should integrate tools with UI', async () => {
    const registry = new ToolRegistry(false);
    registry.register({
      name: 'add_numbers',
      description: '加法',
      parameters: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }) => a + b,
    });

    const executor = new ToolExecutor(registry);
    const adapter = new TestAdapter();

    const ui = UIInstanceSchema.parse({
      title: '工具测试',
      root: {
        id: 'main', type: 'container',
        children: [
          { id: 'n1', type: 'text_input' },
          { id: 'n2', type: 'text_input' },
          { id: 'result', type: 'label', text: '' },
          { id: 'btn', type: 'button', text: 'Add', on_click: 'do_add' },
        ],
      },
      event_handlers: {
        do_add: `function do_add() {
          var a = parseInt(getValue('n1'));
          var b = parseInt(getValue('n2'));
          var result = callFunction('add_numbers', { a: a, b: b });
          setValue('result', '结果: ' + result);
        }`,
      },
    });

    await adapter.createWindow(ui, executor);

    adapter.setInput('n1', '3');
    adapter.setInput('n2', '7');
    adapter.click('btn');

    // 注意: callFunction 是 async 的, 但事件处理函数中可能需要 await
    // 如果测试失败, 需要调整 TestAdapter 中 callFunction 为同步版本或适配 async handler
  });
});
```

> **注意**: Tool 集成的端到端测试中, `callFunction` 返回 Promise. 在 TestAdapter 的 `createWindow` 中, 需要考虑是否提供同步版本的 `callFunction`. 实现时根据实际情况调整.

**Step 3: 运行所有测试**

```bash
cd genui-ts && npx vitest run
```

**Step 4: Commit**

```bash
git add genui-ts/src/index.ts genui-ts/tests/
git commit -m "feat(ts): add public API exports and E2E headless tests"
```

---

### Task 12: CLI 入口

对应 Python 版的 `genui/__main__.py`.

**Files:**
- Create: `genui-ts/src/cli.ts`

**Step 1: 实现 CLI**

`src/cli.ts`:

```typescript
#!/usr/bin/env node
// CLI 入口, 对应 Python 版的 genui/__main__.py
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { config } from 'dotenv';
import { VERSION } from './index.js';
import { UIGenerator } from './generator/ui-generator.js';
import { LLMClient } from './generator/llm-client.js';
import { Renderer } from './renderer/renderer.js';
import { ToolRegistry } from './tools/registry.js';
import { ToolExecutor } from './tools/executor.js';
import { TestAdapter } from './adapters/test-adapter.js';
import { createLogger, parseLogLevel } from './logger.js';

// 加载环境变量
config();

const logger = createLogger('cli', parseLogLevel(process.env.GENUI_LOG_LEVEL));

function printBanner(): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  欢迎使用 genui-ts - 动态UI生成工具 v${VERSION}`);
  console.log('  基于大模型, 根据描述生成可交互的界面');
  console.log('='.repeat(60) + '\n');
}

function main(): void {
  const { values } = parseArgs({
    options: {
      adapter: { type: 'string', short: 'a' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.version) {
    console.log(`genui-ts ${VERSION}`);
    return;
  }

  if (values.help) {
    console.log(`用法: genui-ts [选项]

选项:
  -a, --adapter <name>  指定适配器 (web, terminal, test)
  -v, --version         显示版本号
  -h, --help            显示帮助信息

环境变量:
  OPENAI_API_KEY        OpenAI API 密钥
  ANTHROPIC_API_KEY     Anthropic API 密钥`);
    return;
  }

  printBanner();

  // 初始化
  const registry = new ToolRegistry(true);
  const llmClient = new LLMClient();
  const generator = new UIGenerator(llmClient, registry);
  const executor = new ToolExecutor(registry);

  // 目前只有 TestAdapter, Web 和 Terminal 适配器后续实现
  const adapterName = values.adapter ?? 'test';
  console.log(`[信息] 使用适配器: ${adapterName}\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("请输入UI描述 (输入 'quit' 或 'exit' 退出):\n");

  const prompt = (): void => {
    rl.question('> ', async (description) => {
      if (!description.trim()) { prompt(); return; }
      if (['quit', 'exit', 'q'].includes(description.trim().toLowerCase())) {
        console.log('\n再见!');
        rl.close();
        return;
      }

      console.log('\n[信息] 正在生成UI...');
      try {
        const uiInstance = await generator.generate(description.trim());
        console.log(`[信息] UI生成完成: ${uiInstance.title}`);

        // 渲染 (目前用 TestAdapter 展示组件树)
        const adapter = new TestAdapter();
        const renderer = new Renderer(adapter, executor);
        await renderer.render(uiInstance);
        console.log('[信息] UI已渲染\n');
      } catch (e) {
        console.error(`[错误] ${e}\n`);
      }

      prompt();
    });
  };

  prompt();
}

main();
```

**Step 2: 构建并测试 CLI**

```bash
cd genui-ts && npx tsc
node dist/cli.js --help
node dist/cli.js --version
```

Expected: 帮助信息和版本号正常输出.

**Step 3: Commit**

```bash
git add genui-ts/src/cli.ts
git commit -m "feat(ts): add CLI entry point"
```

---

### Task 13: 最终整合与清理

**Files:**
- Modify: `genui-ts/package.json` (确认 scripts 和 bin 正确)
- Delete: `genui-ts/tests/smoke.test.ts`

**Step 1: 运行完整构建和测试**

```bash
cd genui-ts
npx tsc --noEmit
npx vitest run
```

Expected: 构建零错误, 所有测试通过.

**Step 2: 清理并最终提交**

```bash
rm -f genui-ts/tests/smoke.test.ts
git add genui-ts/
git commit -m "feat(ts): complete initial TypeScript rewrite (Tasks 1-12)"
```

---

## 后续任务 (不在本次实施范围内)

以下任务在核心功能稳定后再实施:

- **TerminalAdapter**: 基于 Ink 的终端 TUI 渲染
- **WebAdapter**: HTTP 服务器 + WebSocket 的浏览器渲染
- **完整的 UI 生成 Prompt**: 从 Python 版移植完整的 system prompt
- **register_tool 函数式 API**: 提供 `registerTool(registry)` 装饰器等价物
- **NPM 包发布**: 配置发布到 npm registry
