# genui-ts 升级为顶层项目实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `genui-ts/` 提升为项目根目录的唯一实现, 清理所有 Python 遗留代码, 整理文档使其适配 TypeScript 版本.

**Architecture:** 使用 `git mv` 保留文件历史, 先迁移 TS 文件到根目录, 再清理 Python 文件, 最后重写文档. 不移动 `node_modules/` 和 `dist/`（这两个目录不受 git 追踪）, 迁移后在根目录重新运行 `npm install`.

**Tech Stack:** TypeScript 5.x, Node.js 20+, Vitest, Zod, Ink, npm

---

### Task 1: 迁移 TS 源码和测试到根目录

**Files:**
- Move: `genui-ts/src/` → `src/`
- Move: `genui-ts/tests/` → `tests/` (替换 Python 版 tests/)
- Move: `genui-ts/vitest.config.ts` → `vitest.config.ts`
- Move: `genui-ts/tsconfig.json` → `tsconfig.json`
- Move: `genui-ts/package.json` → `package.json`
- Move: `genui-ts/package-lock.json` → `package-lock.json`

**Step 1: 用 git rm 移除 Python 测试目录 (为 TS tests/ 腾位置)**

```bash
cd /c/dev/genui
git rm -r tests/
```

Expected: 输出 `rm 'tests/__init__.py'` 等多行, 所有 Python 测试文件被 staged 删除.

**Step 2: 用 git mv 迁移 genui-ts/src 到根目录**

```bash
git mv genui-ts/src src
```

Expected: 无报错输出.

**Step 3: 用 git mv 迁移 genui-ts/tests 到根目录**

```bash
git mv genui-ts/tests tests
```

Expected: 无报错输出.

**Step 4: 用 git mv 迁移配置文件**

```bash
git mv genui-ts/vitest.config.ts vitest.config.ts
git mv genui-ts/tsconfig.json tsconfig.json
git mv genui-ts/package.json package.json
git mv genui-ts/package-lock.json package-lock.json
```

Expected: 每条命令无报错输出.

**Step 5: 验证 git status 显示迁移正确**

```bash
git status
```

Expected: 显示大量 `renamed: genui-ts/src/... -> src/...`, 以及 `deleted: tests/...` 等条目.

---

### Task 2: 清理 genui-ts 残留目录和 Python 文件

**Files:**
- Delete: `genui-ts/` (残余空目录, node_modules/, dist/ 已在 gitignore 中)
- Delete: `genui/` (Python 包)
- Delete: `pyproject.toml`
- Delete: `uv.lock`
- Delete: `examples/` (Python 示例)
- Delete: `WSL2_GUI_SETUP.md`
- Delete: `依赖管理说明.md`
- Delete: `logs/` (Python 日志文件)

**Step 1: 删除 genui-ts 目录 (含 node_modules, dist 等非 git 追踪文件)**

```bash
rm -rf genui-ts/
```

Expected: 无报错, `ls genui-ts/` 返回 "No such file or directory".

**Step 2: git rm 删除 Python 包和配置文件**

```bash
git rm -r genui/
git rm pyproject.toml uv.lock
```

Expected: 输出 `rm 'genui/__init__.py'` 等多行.

**Step 3: git rm 删除 Python 示例和杂项文档**

```bash
git rm -r examples/
git rm WSL2_GUI_SETUP.md 依赖管理说明.md
```

Expected: 无报错, 文件被 staged 删除.

**Step 4: 删除 logs/ 目录 (非 git 追踪)**

```bash
rm -rf logs/
```

Expected: 无报错.

**Step 5: 验证根目录结构干净**

```bash
ls
```

Expected: 显示 `.env`, `.env.example`, `CLAUDE.md`, `README.md`, `docs/`, `package.json`, `package-lock.json`, `src/`, `tests/`, `tsconfig.json`, `vitest.config.ts`.

---

### Task 3: 更新 package.json 名称和 bin

**Files:**
- Modify: `package.json` (name, bin 字段)

**Step 1: 修改 package.json 的 name 和 bin**

将 `package.json` 中：
```json
"name": "genui-ts",
"bin": {
  "genui-ts": "dist/cli.js"
},
```

改为：
```json
"name": "genui",
"bin": {
  "genui": "dist/cli.js"
},
```

用编辑器工具完成, 不要手动 echo.

**Step 2: 验证修改**

```bash
node -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(p.name, JSON.stringify(p.bin))"
```

Expected: `genui {"genui":"dist/cli.js"}`

---

### Task 4: 安装依赖并验证测试通过

**Step 1: 在根目录安装 npm 依赖**

```bash
npm install
```

Expected: 输出 `added N packages`, 生成 `node_modules/` 目录.

**Step 2: 运行 TypeScript 编译**

```bash
npm run build
```

Expected: 无 TypeScript 错误, 生成 `dist/` 目录.

**Step 3: 运行所有测试**

```bash
npm test
```

Expected: 所有测试 PASS, 无 FAIL.

**Step 4: 提交 Task 1-4 的工作**

```bash
git add -A
git commit -m "refactor: promote genui-ts to root, remove Python codebase"
```

---

### Task 5: 整理文档 - 归档 Python 时代文档

**Files:**
- Create: `docs/archive/` 目录
- Move: `docs/generative_ui库设计说明_demo_changelog.md` → `docs/archive/`
- Move: `docs/v0.3-implementation-report.md` → `docs/archive/`
- Move: `docs/v0.4-implementation-report.md` → `docs/archive/`
- Move: `docs/plans/2026-01-29-v0.3-implementation-plan.md` → `docs/archive/`
- Move: `docs/plans/2026-01-29-v0.3-tools-integration-design.md` → `docs/archive/`
- Move: `docs/plans/2026-01-31-v0.4-package-release-design.md` → `docs/archive/`

**Step 1: 创建 archive 目录并移动 Python 时代文档**

```bash
mkdir -p docs/archive
git mv docs/generative_ui库设计说明_demo_changelog.md docs/archive/
git mv docs/v0.3-implementation-report.md docs/archive/
git mv docs/v0.4-implementation-report.md docs/archive/
git mv docs/plans/2026-01-29-v0.3-implementation-plan.md docs/archive/
git mv docs/plans/2026-01-29-v0.3-tools-integration-design.md docs/archive/
git mv docs/plans/2026-01-31-v0.4-package-release-design.md docs/archive/
```

Expected: 无报错.

**Step 2: 为 archive 目录添加说明文件**

在 `docs/archive/README.md` 中写入:

```markdown
# 归档文档

这里存放 genui Python 版本 (v0.1 - v0.4) 的历史设计文档和实现报告.
当前版本已迁移至 TypeScript, 这些文档仅供参考.
```

---

### Task 6: 重写 docs/guides/quick-start.md

**Files:**
- Modify: `docs/guides/quick-start.md`

全新内容（TypeScript 版）:

```markdown
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

编辑 `.env`:

```bash
# 使用 OpenAI (默认)
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o

# 或使用 DeepSeek (推荐, 性价比高)
LLM_PROVIDER=openai
OPENAI_API_KEY=your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# 或使用 Anthropic Claude
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
# 交互式
node dist/cli.js

# 或编译后使用 genui 命令 (npm link 后)
genui
genui --adapter terminal
```

### 作为库使用

```typescript
import { UIGenerator, Renderer, TerminalAdapter } from './src/index.js';

const generator = new UIGenerator();
const ui = await generator.generate('创建一个计算器界面');

const renderer = new Renderer(new TerminalAdapter());
await renderer.render(ui);
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
│   ├── core/             # 组件定义和 UIInstance
│   ├── generator/        # LLM 客户端和 UI 生成器
│   ├── renderer/         # 渲染器
│   ├── adapters/         # 适配器 (terminal, web, test)
│   └── tools/            # 工具系统 (registry, executor, builtin)
├── tests/                # 单元测试和 E2E 测试
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
```

---

### Task 7: 重写根目录 README.md

**Files:**
- Modify: `README.md`

全新内容：

```markdown
# genui

基于大模型的动态 UI 生成工具 (TypeScript 版).

## 概述

genui 使用 LLM 根据用户描述动态生成可交互的 UI 界面. 支持终端 TUI (基于 Ink/React) 和 Web 浏览器两种渲染模式.

## 特性

- **AI 驱动**: LLM 理解用户需求, 两阶段生成 UI 配置
- **多 API 支持**: OpenAI 兼容接口 (DeepSeek, 通义千问, GLM 等) + Anthropic Claude
- **终端 TUI**: 基于 Ink (React 风格) 的终端交互界面
- **Web 渲染**: 浏览器原生 DOM 渲染
- **工具系统**: 内置工具 (计算器, 文件操作, 查询等) + 自定义工具扩展
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

| 服务商 | 配置示例 |
|--------|----------|
| OpenAI | `LLM_PROVIDER=openai` + `OPENAI_API_KEY` |
| DeepSeek | 同上 + `OPENAI_BASE_URL=https://api.deepseek.com/v1` |
| 通义千问 | 同上 + `OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 智谱 GLM | 同上 + `OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4` |
| Anthropic | `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` |

## 开发

```bash
npm test          # 运行测试
npm run build     # TypeScript 编译
```

代码规范: Google 风格, 中文注释, 英文标点, 严格类型注解.

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

## 许可证

MIT

## 历史文档

Python 版本 (v0.1-v0.4) 的设计文档见 [docs/archive/](docs/archive/).
```

---

### Task 8: 更新 CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

将 Python 相关内容替换为 TypeScript 规范:

```markdown
## 编码要求
- 代码风格使用 Google 风格
- 注释使用中文, 但标点符号使用英文
- 必须使用 TypeScript 类型注解 (严格模式, 禁止 any)
- 文件开头添加 `// -*- coding: utf-8 -*-` 注释

## 代码要求
- 尽量复用代码, 而不是重复造轮子
- 尽量使用 async/await 而不是回调函数
- 尝试新思路如果失败, 则需要还原这次改动然后再重新其他思路, 避免代码杂糅
- 业务逻辑要清晰, 功能尽量解耦, 避免功能严重耦合

## 依赖管理
- 使用 npm 管理依赖
- 运行代码使用 `node dist/cli.js` 或 `npm run build && npm test`

## 项目管理
- 使用 git 进行版本控制
- 你需要针对功能写单元测试, 保证测试通过
- 测试框架: Vitest
```

---

### Task 9: 最终验证并提交

**Step 1: 确认测试仍然通过**

```bash
npm run build && npm test
```

Expected: 编译无错误, 所有测试 PASS.

**Step 2: 检查 git status 无遗漏**

```bash
git status
```

Expected: 所有变更已 staged 或已提交, 无意外的未追踪文件.

**Step 3: 提交所有文档和配置变更**

```bash
git add -A
git commit -m "docs: reorganize for TypeScript-only project, update README and CLAUDE.md"
```

Expected: 提交成功.
