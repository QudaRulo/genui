# genui - 基于大模型的动态UI生成库

genui 是一个探索性项目, 使用大模型根据用户描述动态生成可交互的UI界面.

## 概述

传统的UI界面是静态固定的, 使用久了会显得单调. 在大模型时代, 我们可以依靠AI的理解能力, 每次根据用户需求动态生成不同的UI界面进行交互, 大大提升趣味性和灵活性.

## 特性

- 🎁 **v0.4 新增**: Wheel打包、CLI工具、`@register_tool`装饰器、Headless测试
- 🔧 **v0.3 新增**: Tools集成、两阶段生成、内置工具、LangChain支持
- 🤖 **AI驱动**: 使用大模型理解用户需求并生成UI配置
- 🌐 **多API支持**: 优先支持OpenAI兼容API, 兼容国内各大模型服务商(DeepSeek, 通义千问, GLM等)
- 🔄 **灵活切换**: 支持OpenAI和Anthropic两种API, 可自由切换
- 🎨 **动态生成**: 每次根据描述生成不同的界面, 而非静态模板
- 🔌 **可扩展**: 通过适配器模式支持多种UI框架(Tkinter, ASCII终端)
- 📦 **组件化**: 提供多种抽象UI组件(按钮, 输入框, 标签, 容器等)
- 🧪 **类型安全**: 使用Pydantic进行数据验证和类型注解
- 🖥️ **双模式渲染**: 支持Tkinter图形界面和ASCII终端界面两种模式
- 🎨 **彩色日志**: 使用colorlog提供清晰易读的彩色日志输出

## 安装

### 方式1: 从 wheel 文件安装（v0.4+）

```bash
# 基础安装
pip install genui-0.4.0-py3-none-any.whl

# 安装 Anthropic 支持
pip install genui-0.4.0-py3-none-any.whl[anthropic]
```

### 方式2: 从源码安装（开发模式）

#### 前提条件

- Python >= 3.11
- uv (Python包管理器)

#### 安装步骤

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

在 WSL2 中运行GUI需要配置 X Server 支持. 如果遇到困难, **推荐使用ASCII终端模式**:

```bash
# 使用ASCII模式, 无需X Server配置
uv run python -m genui --ui-mode ascii "创建一个登录界面"
```

如果需要使用GUI模式, 可以配置 X Server:

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

### 方式1: 使用 CLI 工具（v0.4+）

```bash
# 交互模式
genui

# 指定适配器
genui --adapter ascii
genui --adapter tkinter

# 查看帮助
genui --help
```

### 方式2: 使用命令行（开发模式）

```bash
# 直接运行, 然后输入UI描述
uv run python -m genui

# 或者通过参数传入描述
uv run python -m genui "创建一个登录界面, 包含用户名和密码输入框, 以及登录按钮"

# 使用ASCII终端模式 (适合WSL2或无GUI环境)
uv run python -m genui --ui-mode ascii "创建一个简单的计算器"

# 使用Tkinter图形界面模式 (默认)
uv run python -m genui --ui-mode tkinter "创建一个注册表单"
```

### 方式3: 作为库使用

```python
from genui import UIGenerator, Renderer
from genui.adapters import TkinterAdapter, ASCIIAdapter

# 创建生成器
generator = UIGenerator()

# 根据描述生成UI实例
description = "创建一个简单的计算器, 包含两个输入框, 一个下拉框选择运算符, 一个计算按钮"
ui_instance = generator.generate(description)

# 方式A: 使用Tkinter图形界面渲染
renderer = Renderer(adapter=TkinterAdapter())
renderer.render(ui_instance)

# 方式B: 使用ASCII终端界面渲染
renderer = Renderer(adapter=ASCIIAdapter())
renderer.render(ui_instance)
```

### 方式4: 运行示例

```bash
uv run python examples/demo.py
```

## v0.4 新特性: 包发布版本

v0.4 版本专注于打造可发布的基本版本, 提供完整的 API 和工具支持.

### 主要特性

- 🎁 **Wheel 打包**: 生成标准 wheel 文件, 可手动安装到其他项目
- 🚀 **CLI 工具**: 提供 `genui` 命令行工具, 支持交互式UI生成
- 🔧 **装饰器支持**: 新增 `@register_tool` 装饰器, 简化自定义工具注册
- 🧪 **Headless 测试**: TestAdapter 支持自动化测试, 无需手动交互
- 📚 **完整文档**: 快速开始指南、API文档、自定义工具和适配器指南

### 安装使用

**从 wheel 文件安装:**

```bash
pip install genui-0.4.0-py3-none-any.whl
```

**使用 CLI:**

```bash
# 交互模式
genui

# 指定适配器
genui --adapter ascii
```

**使用 API:**

```python
from genui import UIGenerator, Renderer, ToolRegistry, register_tool

# 自定义工具（装饰器方式）
registry = ToolRegistry()

@register_tool(registry)
def my_tool(param: str) -> str:
    """我的自定义工具"""
    return f"处理: {param}"

# 生成和渲染
generator = UIGenerator(tool_registry=registry)
ui = generator.generate("创建一个调用 my_tool 的界面")
Renderer().render(ui)
```

详细文档: [快速开始指南](docs/guides/quick-start.md)

## v0.3 新特性: Tools 集成

v0.3 版本引入了功能调用能力, 让生成的 UI 不仅能展示和交互, 还能调用真实的功能.

### 特性

- **两阶段生成**: LLM 先规划需要的 tools, 再生成 UI
- **内置 Tools**: 6 个示例 tools (计算, 单位转换, 天气查询, 时间查询, 文件操作)
- **可扩展**: 支持用户自定义 tools
- **基于 LangChain**: 统一的 tools 抽象

### 示例

#### 天气查询 UI

```python
from genui import UIGenerator, Renderer

generator = UIGenerator()
ui = generator.generate("创建一个天气查询界面")
renderer = Renderer()
renderer.render(ui)
```

生成的 UI 会自动:
1. 识别需要使用 `get_weather` tool
2. 生成包含输入框和按钮的界面
3. 在点击按钮时调用 `get_weather` tool 并显示结果

#### 增强计算器

```python
description = """创建一个增强计算器:
- 支持数学表达式计算
- 支持单位转换 (长度、温度)
"""

ui = generator.generate(description)
renderer.render(ui)
```

### 内置 Tools

| Tool | 功能 | 参数 |
|------|------|------|
| `calculate` | 计算数学表达式 | `expression: str` |
| `convert_unit` | 单位转换 | `value: float, from_unit: str, to_unit: str` |
| `get_weather` | 获取城市天气 (mock) | `city: str` |
| `get_current_time` | 获取当前时间 | `timezone: str` (可选) |
| `read_text_file` | 读取文本文件 | `file_path: str` |
| `list_directory` | 列出目录内容 | `dir_path: str` |

### 自定义 Tools

```python
from langchain.tools import tool
from genui import UIGenerator, ToolRegistry

@tool
def my_custom_tool(param: str) -> str:
    """我的自定义工具"""
    return f"处理: {param}"

# 注册自定义 tool
registry = ToolRegistry(load_builtin=True)
registry.register(my_custom_tool)

# 使用自定义 tool
generator = UIGenerator(tool_registry=registry)
ui = generator.generate("创建一个使用我的自定义工具的界面")
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
│  - ASCII适配器 (Rich库)             │
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
- 当前支持Tkinter (图形界面) 和 ASCII/Rich (终端界面)
- 未来可扩展PyQt等其他框架

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
- 生成的事件处理函数功能有限
- 需要网络连接调用大模型API
- ASCII模式下交互方式为顺序输入, 无法实现实时响应

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

### Q: ASCII模式和Tkinter模式有什么区别?

**A**: 两种模式的区别:

- **Tkinter模式** (默认): 图形界面, 所有组件同时显示, 支持实时交互
- **ASCII模式**: 终端界面, 使用Rich库渲染, 交互方式为顺序输入

ASCII模式的优点:
- 无需X Server, 适合WSL2/SSH/无GUI环境
- 轻量级, 启动快速
- 彩色终端输出, 美观易读

使用场景:
- WSL2环境推荐使用ASCII模式
- 服务器/SSH环境使用ASCII模式
- 本地开发可使用Tkinter图形界面

### Q: WSL2 中运行出现 XCB 错误?

**A**: WSL2 需要 X Server 支持 GUI. **推荐使用ASCII终端模式来避免此问题**:

```bash
uv run python -m genui --ui-mode ascii "你的描述"
```

如果确实需要GUI模式:

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
