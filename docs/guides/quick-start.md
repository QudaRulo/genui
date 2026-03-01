# genui 快速开始指南

## 环境要求

- Node.js >= 20.0.0
- npm

## 安装依赖

```bash
npm install
```

## 环境配置

复制 `.env.example` 为 `.env`, 配置 API 密钥:

```bash
cp .env.example .env
```

编辑 `.env`, 选择一种 LLM 服务:

```bash
# OpenAI (默认)
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o

# DeepSeek (推荐, 性价比高)
LLM_PROVIDER=openai
OPENAI_API_KEY=your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# Anthropic Claude
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key
```

## 编译

```bash
npm run build
```

## 基础使用

### CLI 模式

```bash
# 开发时直接运行
node dist/cli.js

# 安装为全局命令 (可选)
npm link
genui
genui --adapter terminal
```

### 作为库使用

```typescript
import { UIGenerator, Renderer, TerminalAdapter } from 'genui';

const generator = new UIGenerator();
const ui = await generator.generate('创建一个计算器界面');

const renderer = new Renderer(new TerminalAdapter());
await renderer.render(ui);
```

### 自定义工具

```typescript
import { UIGenerator, ToolRegistry } from 'genui';

const registry = new ToolRegistry();
registry.register({
  name: 'greet',
  description: '打招呼',
  parameters: { name: { type: 'string' } },
  execute: async ({ name }) => `你好, ${name}!`,
});

const generator = new UIGenerator({ toolRegistry: registry });
const ui = await generator.generate('创建一个打招呼界面');
```

## 运行测试

```bash
npm test
```

## 项目结构

```
genui/
├── src/
│   ├── index.ts          # 公共 API 入口
│   ├── cli.ts            # CLI 入口
│   ├── logger.ts         # 日志系统
│   ├── core/             # 组件 schema 和 UIInstance
│   ├── generator/        # LLM 客户端和 UI 生成器
│   ├── renderer/         # 渲染调度器
│   ├── adapters/         # 渲染适配器 (terminal, web, test)
│   └── tools/            # 工具系统 (registry, executor, builtin)
├── tests/                # 单元测试和 E2E 测试
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 日志配置

通过环境变量控制日志级别:

```bash
GENUI_LOG_LEVEL=DEBUG   # DEBUG | INFO | WARNING | ERROR
```
