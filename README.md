# genui

基于大模型的动态 UI 生成工具.

## 概述

genui 使用 LLM 根据用户描述动态生成可交互的 UI 界面. 支持终端 TUI (基于 Ink/React) 和 Web 浏览器两种渲染模式.

## 特性

- **AI 驱动**: LLM 理解用户需求, 两阶段生成 UI 配置
- **多 API 支持**: OpenAI 兼容接口 (DeepSeek, 通义千问, GLM 等) + Anthropic Claude
- **终端 TUI**: 基于 Ink (React 风格) 的终端交互界面
- **Web 渲染**: 浏览器原生 DOM 渲染
- **工具系统**: 内置工具 + 自定义工具扩展
- **类型安全**: 严格 TypeScript + Zod schema 校验
- **可测试**: TestAdapter 支持无头自动化测试

## 快速开始

详见 [docs/guides/quick-start.md](docs/guides/quick-start.md).

```bash
npm install
cp .env.example .env   # 配置 API 密钥
npm run build
node dist/cli.js
```

## 架构

```
┌─────────────────────────┐
│   Generator (LLM驱动)   │
│  LLMClient + UIGenerator│
└──────────┬──────────────┘
           │ UIInstance
┌──────────▼──────────────┐
│   Renderer (渲染调度)    │
└──────────┬──────────────┘
           │ Adapter
┌──────────▼──────────────┐
│  Adapters               │
│  TerminalAdapter (Ink)  │
│  WebAdapter (DOM)       │
│  TestAdapter (headless) │
└─────────────────────────┘
```

## 支持的 LLM 服务

| 服务商 | 配置 |
|--------|------|
| OpenAI | `LLM_PROVIDER=openai` + `OPENAI_API_KEY` |
| DeepSeek | 同上 + `OPENAI_BASE_URL=https://api.deepseek.com/v1` |
| 通义千问 | 同上 + `OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 智谱 GLM | 同上 + `OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4` |
| Anthropic | `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` |

## 可用组件

| 组件 | 类型标识 | 说明 |
|------|---------|------|
| Button | `button` | 按钮 |
| TextInput | `text_input` | 单行/多行输入框 |
| Label | `label` | 文本标签 |
| Container | `container` | 容器 (vertical/horizontal/grid) |
| Checkbox | `checkbox` | 复选框 |
| RadioGroup | `radio_group` | 单选按钮组 |
| Dropdown | `dropdown` | 下拉选择框 |

## 内置工具

| 工具 | 功能 |
|------|------|
| `calculate` | 计算数学表达式 |
| `convert_unit` | 单位转换 |
| `get_weather` | 天气查询 (mock) |
| `get_current_time` | 当前时间 |
| `read_text_file` | 读取文件 |
| `list_directory` | 列出目录 |

## 开发

```bash
npm test          # 运行测试
npm run build     # TypeScript 编译
```

代码规范: Google 风格, 中文注释, 英文标点, 严格 TypeScript 类型注解.

## 许可证

MIT

## 历史文档

Python 版本 (v0.1-v0.4) 的设计文档见 [docs/archive/](docs/archive/).
