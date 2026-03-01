# genui TypeScript 重构设计方案

> 日期: 2026-02-26
> 状态: 已确认

## 背景与目标

将 genui (Python, v0.4.0) 重构为 TypeScript 版本, 主要目标:

- **Web 端运行**: 利用浏览器原生 UI 渲染能力
- **Node.js 生态**: 利用 npm 生态的丰富前端工具链
- **全栈统一**: 前后端 TypeScript 统一
- **更好的 GUI 支持**: Web 端 UI 生态远比 Python Tkinter/Rich 成熟
- **学习 TypeScript**: 通过实际项目实践 TS 的类型系统

## 技术栈

| 类别 | 选择 | 说明 |
|------|------|------|
| 运行时 | Node.js 20+ | LTS 版本 |
| 语言 | TypeScript 5.x | 严格模式 |
| 包管理 | npm | 最基础, 适合学习 |
| 构建 | tsc | TypeScript 编译器直接编译 |
| 测试 | Vitest | 对 TS 原生支持好, 语法兼容 Jest |
| 数据校验 | Zod | TS 生态中对标 Pydantic, 类型推导一流 |
| 终端 TUI | Ink | React 风格的终端 UI 库 |
| Web 渲染 | 原生 DOM API | 先用原生, 后续可接入 React |
| LLM 客户端 | 待定 | 先用 REST API 直接调用, 后续再选框架 |

## 项目结构

```
genui-ts/
├── src/
│   ├── index.ts                  # 公共 API 导出
│   ├── cli.ts                    # CLI 入口
│   ├── logger.ts                 # 日志系统
│   ├── core/
│   │   ├── component.ts          # 组件定义
│   │   └── ui-instance.ts        # UIInstance 模型
│   ├── generator/
│   │   ├── llm-client.ts         # LLM 客户端抽象
│   │   └── ui-generator.ts       # LLM 驱动的 UI 生成器
│   ├── renderer/
│   │   └── renderer.ts           # 渲染器
│   ├── adapters/
│   │   ├── base.ts               # 适配器接口
│   │   ├── web-adapter.ts        # 浏览器 HTML/CSS 渲染
│   │   ├── terminal-adapter.ts   # 终端 TUI 渲染
│   │   └── test-adapter.ts       # 无头测试适配器
│   └── tools/
│       ├── registry.ts           # 工具注册中心
│       ├── executor.ts           # 工具执行器
│       └── builtin/              # 内置工具
│           ├── calculator.ts
│           ├── query.ts
│           └── file-ops.ts
├── tests/
│   ├── core/
│   │   ├── component.test.ts
│   │   └── ui-instance.test.ts
│   ├── adapters/
│   │   ├── test-adapter.test.ts
│   │   └── web-adapter.test.ts
│   ├── tools/
│   │   ├── registry.test.ts
│   │   └── executor.test.ts
│   ├── generator/
│   │   └── ui-generator.test.ts
│   └── e2e/
│       └── headless.test.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## 核心类型系统与组件模型

### 组件类型

用可辨识联合 (Discriminated Union) 在编译期约束组件类型:

```typescript
type ComponentType =
  | 'button' | 'text_input' | 'label'
  | 'container' | 'checkbox' | 'radio_group' | 'dropdown';

interface ComponentBase {
  id: string;
  type: ComponentType;
  properties: Record<string, unknown>;
  events?: Record<string, string>;
  children?: Component[];
}

interface ButtonProps { text: string; enabled?: boolean; }
interface TextInputProps { placeholder?: string; value?: string; }
// ... 每种组件都有对应的 Props 接口

type Component =
  | { type: 'button'; properties: ButtonProps } & ComponentBase
  | { type: 'text_input'; properties: TextInputProps } & ComponentBase
  // ...
```

### UIInstance

用 Zod 做运行时校验, 同时自动推导 TS 类型:

```typescript
const UIInstanceSchema = z.object({
  title: z.string(),
  components: z.array(ComponentSchema),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
});

type UIInstance = z.infer<typeof UIInstanceSchema>;
```

**设计决策:**
- 编译期用 TypeScript 类型系统 (interface, 联合类型) 约束
- 运行期用 Zod 校验 LLM 返回的 JSON (LLM 输出不可信, 必须运行时校验)
- 可辨识联合让 `switch(component.type)` 时自动获得类型缩窄

## 适配器架构

### 接口定义

TypeScript 版用 interface + abstract class 双层设计:

```typescript
interface UIAdapter {
  readonly name: string;

  createWindow(title: string, width: number, height: number): Promise<void>;
  destroyWindow(): Promise<void>;

  renderComponent(component: Component, parent?: unknown): Promise<string>;
  updateComponent(id: string, properties: Record<string, unknown>): void;
  removeComponent(id: string): void;

  bindEvent(componentId: string, event: string, handler: () => void): void;
  runEventLoop(): Promise<void>;
}

abstract class AdapterBase implements UIAdapter {
  abstract readonly name: string;
  protected components: Map<string, unknown> = new Map();

  async renderTree(instance: UIInstance): Promise<void> {
    for (const comp of instance.components) {
      await this.renderComponent(comp);
    }
  }

  abstract createWindow(title: string, w: number, h: number): Promise<void>;
  abstract renderComponent(component: Component, parent?: unknown): Promise<string>;
  // ...
}
```

### 适配器实现

| 适配器 | 渲染目标 | 依赖 |
|--------|---------|------|
| WebAdapter | 浏览器 DOM | 内置 HTTP 服务器 + WebSocket |
| TerminalAdapter | 终端 TUI | Ink |
| TestAdapter | 无渲染 | 无外部依赖 |

**WebAdapter 工作方式:**
- 内部启动轻量 HTTP 服务器 (Node.js 内置 `http` 模块)
- 将组件树序列化为 HTML/CSS 发送给浏览器
- 通过 WebSocket 双向通信处理事件回调
- `runEventLoop()` 后自动打开浏览器

**扩展新适配器只需实现 UIAdapter 接口, 核心代码不需要改动.**

## 工具系统

### 工具注册

两种注册方式:

```typescript
// 函数式注册
registry.register({
  name: 'calculate',
  description: '计算数学表达式',
  parameters: z.object({
    expression: z.string().describe('数学表达式'),
  }),
  execute: async ({ expression }) => { /* ... */ },
});

// 类式注册
class WeatherTool implements Tool {
  name = 'get_weather';
  description = '查询天气';
  parameters = z.object({ city: z.string() });
  async execute({ city }: z.infer<typeof this.parameters>) { /* ... */ }
}
registry.registerTool(new WeatherTool());
```

Zod 定义参数的好处: 运行时校验 LLM 传来的参数, 同时自动生成 JSON Schema 发给 LLM 做 function calling.

### LLM 客户端

```typescript
interface LLMClient {
  generate(prompt: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
}
```

- 先用直接调用 OpenAI/Anthropic REST API 实现
- 后续可换成 LangChain.js 或 Vercel AI SDK
- 支持环境变量切换 provider

## CLI

```typescript
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    adapter: { type: 'string', default: 'web' },
    help: { type: 'boolean', short: 'h' },
  },
});
```

- 通过 `package.json` 的 `bin` 字段注册 `genui-ts` 命令
- 默认适配器为 web
- 保留 `--adapter terminal` 切换到终端模式

## 迁移路径

按以下顺序实施, 每步都有对应测试:

1. **项目脚手架** - 初始化 npm 项目, tsconfig, Vitest 配置
2. **核心类型** - component.ts, ui-instance.ts, Zod schema
3. **工具系统** - registry, executor, 内置工具
4. **TestAdapter** - 最简单的适配器, 方便跑通流程
5. **LLM 客户端** - 先实现 OpenAI 兼容的 provider
6. **UI 生成器** - 串联 LLM -> 组件 -> 渲染的完整流程
7. **TerminalAdapter** - Ink 终端渲染
8. **WebAdapter** - HTTP + WebSocket 浏览器渲染
9. **CLI** - 命令行入口
