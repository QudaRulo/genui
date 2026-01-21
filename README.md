# genui - 基于大模型的动态UI生成库

genui 是一个探索性项目, 使用大模型根据用户描述动态生成可交互的UI界面.

## 概述

传统的UI界面是静态固定的, 使用久了会显得单调. 在大模型时代, 我们可以依靠AI的理解能力, 每次根据用户需求动态生成不同的UI界面进行交互, 大大提升趣味性和灵活性.

## 特性

- 🤖 **AI驱动**: 使用大模型理解用户需求并生成UI配置
- 🌐 **多API支持**: 优先支持OpenAI兼容API, 兼容国内各大模型服务商(DeepSeek, 通义千问, GLM等)
- 🔄 **灵活切换**: 支持OpenAI和Anthropic两种API, 可自由切换
- 🎨 **动态生成**: 每次根据描述生成不同的界面, 而非静态模板
- 🔌 **可扩展**: 通过适配器模式支持多种UI框架(当前支持Tkinter)
- 📦 **组件化**: 提供多种抽象UI组件(按钮, 输入框, 标签, 容器等)
- 🧪 **类型安全**: 使用Pydantic进行数据验证和类型注解

## 安装

### 前提条件

- Python >= 3.11
- uv (Python包管理器)

### 安装步骤

1. 克隆仓库:
```bash
git clone <repository-url>
cd genui
```

2. 安装依赖:
```bash
# 安装基础依赖(包含OpenAI支持)
uv sync

# 如果需要使用Anthropic Claude, 额外安装:
uv sync --extra anthropic
```

3. 配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 文件, 配置API密钥
```

## 环境要求

### 操作系统

- **Linux**: 完全支持
- **macOS**: 完全支持
- **Windows**: 完全支持 (原生或 WSL)
- **WSL2**: 需要额外配置 (见下方说明)

### WSL2 用户注意

在 WSL2 中运行需要配置 X Server 支持 GUI 应用:

1. **Windows 11 (推荐)**: 使用内置 WSLg
```bash
wsl --update
wsl --shutdown
# 重新启动WSL后直接使用
```

2. **Windows 10**: 使用 VcXsrv 或 X410

详细配置指南请参考: [WSL2_GUI_SETUP.md](WSL2_GUI_SETUP.md)

## 日志配置

genui 内置完整的日志系统, 方便调试和问题排查.

### 配置日志级别

通过环境变量控制日志输出级别:

```bash
# 在 .env 文件中添加
GENUI_LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR

# 或者在命令行中临时设置
export GENUI_LOG_LEVEL=DEBUG
uv run python -m genui "测试界面"
```

### 日志输出示例

```
[2025-01-21 10:30:15] genui.__main__ - INFO - genui程序启动
[2025-01-21 10:30:15] genui.generator.llm_client - INFO - 初始化LLM客户端, provider=openai
[2025-01-21 10:30:15] genui.generator.llm_client - INFO - 使用默认OpenAI API
[2025-01-21 10:30:15] genui.generator.llm_client - INFO - 使用模型: gpt-4o
[2025-01-21 10:30:20] genui.generator.llm_client - INFO - 成功生成UI配置, 长度: 1234
```

## API配置

### 方式1: 使用OpenAI API (默认, 推荐)

编辑 `.env` 文件:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o  # 可选, 默认为gpt-4o
```

### 方式2: 使用兼容OpenAI的国内API

**DeepSeek (推荐, 性价比高)**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

**阿里云通义千问**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-aliyun-api-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-max
```

**智谱GLM**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-zhipu-api-key
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
OPENAI_MODEL=glm-4
```

### 方式3: 使用Anthropic Claude

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # 可选
```

注意: 使用Anthropic需要先安装额外依赖 `uv sync --extra anthropic`

## 快速开始

### 方式1: 使用命令行

```bash
# 直接运行, 然后输入UI描述
uv run python -m genui

# 或者通过参数传入描述
uv run python -m genui "创建一个登录界面, 包含用户名和密码输入框, 以及登录按钮"
```

### 方式2: 作为库使用

```python
from genui import UIGenerator, Renderer

# 创建生成器
generator = UIGenerator()

# 根据描述生成UI实例
description = "创建一个简单的计算器, 包含两个输入框, 一个下拉框选择运算符, 一个计算按钮"
ui_instance = generator.generate(description)

# 渲染并显示UI
renderer = Renderer()
renderer.render(ui_instance)
```

### 方式3: 运行示例

```bash
uv run python examples/demo.py
```

## 架构设计

genui 采用三层架构:

```
┌─────────────────────────────────────┐
│       生成逻辑层 (Generator)        │
│  - LLM客户端 (支持多API)            │
│  - UI生成器 (Prompt Engineering)    │
└─────────────────┬───────────────────┘
                  │
                  │ UIInstance
                  │
┌─────────────────▼───────────────────┐
│         展示层 (Renderer)           │
│  - 渲染器                           │
└─────────────────┬───────────────────┘
                  │
                  │ Adapter
                  │
┌─────────────────▼───────────────────┐
│   UI组件抽象层 (Core + Adapters)    │
│  - 抽象组件定义                     │
│  - Tkinter适配器                    │
└─────────────────────────────────────┘
```

### 1. 生成逻辑层

- 由大模型驱动 (支持OpenAI和Anthropic API)
- 优先支持OpenAI兼容API, 可使用国内各大模型服务
- 根据用户输入, 预设的UI组件抽象生成UI实例
- 包含事件处理逻辑

### 2. 展示层

- 负责将UI实例渲染为可视化界面
- 管理窗口生命周期和事件循环

### 3. UI组件抽象层

- 将不同框架的UI组件抽象为统一接口
- 通过适配器模式支持多种UI框架
- 当前支持Tkinter, 未来可扩展PyQt等

## 可用组件

genui 提供以下抽象UI组件:

| 组件 | 类型 | 说明 |
|------|------|------|
| Button | `button` | 按钮 |
| TextInput | `text_input` | 文本输入框(单行或多行) |
| Label | `label` | 文本标签 |
| Container | `container` | 容器(支持垂直/水平/网格布局) |
| Checkbox | `checkbox` | 复选框 |
| RadioGroup | `radio_group` | 单选按钮组 |
| Dropdown | `dropdown` | 下拉选择框 |

## 项目结构

```
genui/
├── genui/                  # 主包
│   ├── core/              # 核心模块(组件抽象)
│   ├── adapters/          # UI框架适配器
│   ├── generator/         # 生成逻辑层
│   ├── renderer/          # 展示层
│   └── __main__.py        # 命令行入口
├── tests/                 # 单元测试
├── examples/              # 示例代码
├── pyproject.toml         # 项目配置
└── README.md              # 项目文档
```

## 开发

### 运行测试

```bash
uv run pytest tests/ -v
```

### 代码规范

本项目遵循以下规范:
- 代码风格: Google风格
- 注释: 中文, 英文标点
- 类型注解: 所有函数都有类型注解
- 文件编码: UTF-8

## 示例

### 示例1: 简单表单

```python
from genui import UIGenerator, Renderer

generator = UIGenerator()
description = "创建一个用户注册表单, 包含姓名, 邮箱, 密码输入框, 以及注册按钮"
ui_instance = generator.generate(description)

renderer = Renderer()
renderer.render(ui_instance)
```

### 示例2: 计算器

```python
from genui import UIGenerator, Renderer

generator = UIGenerator()
description = "创建一个简单计算器, 两个数字输入框, 运算符下拉选择(加减乘除), 计算按钮和结果显示"
ui_instance = generator.generate(description)

renderer = Renderer()
renderer.render(ui_instance)
```

## 支持的大模型服务

genui 通过OpenAI兼容接口支持多种大模型服务:

| 服务商 | 模型 | 配置示例 |
|--------|------|----------|
| OpenAI | GPT-4o, GPT-4 | 见上方配置说明 |
| DeepSeek | deepseek-chat | 见上方配置说明 |
| 阿里云 | qwen-max, qwen-plus | 见上方配置说明 |
| 智谱AI | glm-4, glm-3-turbo | 见上方配置说明 |
| Anthropic | Claude 3.5 Sonnet | 需额外安装依赖 |

更多兼容OpenAI接口的服务商请参考 `.env.example` 文件.

## 限制

- 这是一个探索性项目, 主要用于验证概念
- 当前只支持Tkinter框架
- 生成的事件处理函数功能有限
- 需要网络连接调用大模型API

## 未来计划

- [ ] 支持更多UI框架(PyQt, wxPython等)
- [ ] 改进事件处理逻辑生成
- [ ] 添加更多UI组件
- [ ] 支持自定义组件
- [ ] 优化生成质量和速度
- [ ] 添加UI预览和编辑功能
- [ ] 支持本地大模型

## 常见问题

### Q: 推荐使用哪个API?

A: 如果在国内使用, 推荐DeepSeek, 性价比高且速度快. 如果对质量要求高, 推荐OpenAI GPT-4o或Anthropic Claude.

### Q: 如何切换不同的大模型?

A: 编辑 `.env` 文件, 修改 `LLM_PROVIDER`, `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 等配置即可.

### Q: 是否支持本地大模型?

A: 当前不支持, 但只要本地模型提供OpenAI兼容接口(如Ollama), 理论上可以通过配置 `OPENAI_BASE_URL` 使用.

### Q: WSL2 中运行出现 XCB 错误?

**A**: 这是因为 WSL2 需要 X Server 支持 GUI:

1. **Windows 11**: 使用 WSLg (内置)
   ```bash
   wsl --update
   wsl --shutdown
   ```

2. **Windows 10**: 安装 VcXsrv
   ```bash
   # 配置环境变量
   export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
   ```

详细说明: [WSL2_GUI_SETUP.md](WSL2_GUI_SETUP.md)

### Q: 如何查看详细的日志信息?

**A**: 设置日志级别为 DEBUG:

```bash
export GENUI_LOG_LEVEL=DEBUG
uv run python -m genui "你的描述"
```

日志会显示:
- LLM 初始化信息
- API 调用详情
- UI 生成过程
- 错误堆栈信息

### Q: 日志输出太多, 如何关闭?

**A**: 设置更高的日志级别:

```bash
export GENUI_LOG_LEVEL=ERROR  # 只显示错误
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!

## 致谢

本项目使用以下技术:
- [OpenAI API](https://openai.com/) - 大模型API
- [Anthropic Claude](https://www.anthropic.com/) - Claude大模型
- [Pydantic](https://pydantic.dev/) - 数据验证
- [uv](https://github.com/astral-sh/uv) - Python包管理
