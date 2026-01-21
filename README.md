# genui - 基于大模型的动态UI生成库

genui 是一个探索性项目, 使用大模型根据用户描述动态生成可交互的UI界面.

## 概述

传统的UI界面是静态固定的, 使用久了会显得单调. 在大模型时代, 我们可以依靠AI的理解能力, 每次根据用户需求动态生成不同的UI界面进行交互, 大大提升趣味性和灵活性.

## 特性

- 🤖 **AI驱动**: 使用Claude大模型理解用户需求并生成UI配置
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
uv sync --all-extras
```

3. 配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 文件, 添加你的 ANTHROPIC_API_KEY
```

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
│  - LLM客户端 (Claude API)           │
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

- 由大模型驱动 (Claude API)
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

## 限制

- 这是一个探索性项目, 主要用于验证概念
- 当前只支持Tkinter框架
- 生成的事件处理函数功能有限
- 依赖Claude API, 需要网络连接

## 未来计划

- [ ] 支持更多UI框架(PyQt, wxPython等)
- [ ] 改进事件处理逻辑生成
- [ ] 添加更多UI组件
- [ ] 支持自定义组件
- [ ] 优化生成质量和速度
- [ ] 添加UI预览和编辑功能

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!

## 致谢

本项目使用以下技术:
- [Anthropic Claude](https://www.anthropic.com/) - 大模型API
- [Pydantic](https://pydantic.dev/) - 数据验证
- [uv](https://github.com/astral-sh/uv) - Python包管理
