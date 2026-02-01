# genui 快速开始指南

## 安装

### 从 wheel 文件安装

```bash
pip install genui-0.4.0-py3-none-any.whl
```

### 安装可选依赖

```bash
# 使用 Anthropic Claude
pip install genui-0.4.0-py3-none-any.whl[anthropic]
```

## 环境配置

设置 API 密钥：

```bash
# 使用 OpenAI (默认)
export OPENAI_API_KEY="your-openai-key"

# 或使用 Anthropic Claude
export ANTHROPIC_API_KEY="your-anthropic-key"
```

## 基础使用

### 1. 命令行模式

最简单的使用方式:

```bash
genui
```

交互流程:
```
欢迎使用 genui v0.4.0

请选择适配器:
  [1] Tkinter (默认, 图形界面)
  [2] ASCII (终端界面)
选择 [1]: 1

请输入UI描述 (输入 'quit' 退出):
> 创建一个简单的计算器

[信息] 正在生成UI...
[信息] UI生成完成: 简单计算器
[信息] 正在渲染...

(显示图形界面窗口)
```

### 2. Python 代码方式

```python
from genui import UIGenerator, Renderer

# 创建生成器
generator = UIGenerator()

# 生成 UI
ui = generator.generate("创建一个登录界面, 包含用户名、密码输入框和登录按钮")

# 渲染显示
renderer = Renderer()
renderer.render(ui)
```

## 自定义工具

v0.4 支持两种方式注册自定义工具。

### 方式 A: 基础注册 API

```python
from genui import UIGenerator, Renderer, ToolRegistry

# 创建注册表
registry = ToolRegistry()

# 定义工具函数
def send_email(to: str, subject: str, body: str) -> dict:
    """发送邮件

    Args:
        to: 收件人邮箱
        subject: 邮件主题
        body: 邮件正文

    Returns:
        发送结果
    """
    # 实际的邮件发送逻辑
    print(f"发送邮件到 {to}")
    return {"status": "success", "message": f"邮件已发送"}

# 使用 LangChain 的 @tool 装饰器转换
from langchain_core.tools import tool
email_tool = tool(send_email)
registry.register(email_tool)

# 使用
generator = UIGenerator(tool_registry=registry)
ui = generator.generate("创建一个发送邮件的界面")
renderer = Renderer()
renderer.render(ui)
```

### 方式 B: 装饰器风格（推荐）

```python
from genui import UIGenerator, Renderer, ToolRegistry, register_tool

# 创建注册表
registry = ToolRegistry()

# 使用装饰器注册
@register_tool(registry)
def fetch_weather(city: str) -> dict:
    """获取天气信息

    Args:
        city: 城市名称

    Returns:
        天气数据
    """
    # 模拟天气查询
    return {
        "city": city,
        "temperature": 25,
        "weather": "晴天"
    }

@register_tool(registry)
def save_file(filename: str, content: str) -> bool:
    """保存文件

    Args:
        filename: 文件名
        content: 文件内容

    Returns:
        是否成功
    """
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

# 使用
generator = UIGenerator(tool_registry=registry)
ui = generator.generate("创建一个天气查询界面, 可以保存查询结果")
renderer = Renderer()
renderer.render(ui)
```

## 自定义适配器

如果你想支持其他 UI 框架，可以继承 `AdapterBase` 创建自定义适配器。

### 适配器接口

```python
from genui.adapters import AdapterBase
from genui.core import Component, UIInstance
from typing import Any, Dict, Callable

class MyAdapter(AdapterBase):
    """自定义适配器示例"""

    def render_component(
        self,
        component: Component,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> Any:
        """渲染单个组件

        Args:
            component: 抽象组件定义
            parent: 父组件
            event_handlers: 事件处理函数字典

        Returns:
            具体框架的组件实例
        """
        # 1. 根据 component.type 创建对应的框架组件
        # 2. 设置组件属性（从 component 对象获取）
        # 3. 绑定事件处理器
        # 4. 如果是 Container, 递归渲染子组件
        # 5. 返回组件实例
        pass

    def create_window(
        self,
        ui_instance: UIInstance,
        tool_executor: Any = None
    ) -> Any:
        """创建主窗口

        Args:
            ui_instance: UI实例（包含title, width, height, root, event_handlers）
            tool_executor: Tool执行器（可选）

        Returns:
            窗口对象
        """
        # 1. 创建窗口
        # 2. 设置窗口属性（标题、大小等）
        # 3. 编译事件处理函数（提供辅助函数环境）
        # 4. 渲染根组件
        # 5. 返回窗口对象
        pass

    def run_event_loop(self, window: Any) -> None:
        """运行事件循环

        Args:
            window: 窗口对象
        """
        # 启动框架的事件循环（阻塞直到窗口关闭）
        pass
```

### 使用自定义适配器

```python
from genui import UIGenerator, Renderer

generator = UIGenerator()
ui = generator.generate("创建一个TODO列表")

# 使用自定义适配器
adapter = MyAdapter()
renderer = Renderer(adapter=adapter)
renderer.render(ui)
```

## 常见问题

### Q: 如何切换 LLM 提供商？

A: 通过环境变量控制:
```python
import os

# 使用 OpenAI
os.environ["OPENAI_API_KEY"] = "your-key"

# 或使用 Anthropic
os.environ["ANTHROPIC_API_KEY"] = "your-key"
```

### Q: 如何禁用内置工具？

A: 创建不加载内置工具的注册表:
```python
registry = ToolRegistry(load_builtin=False)
generator = UIGenerator(tool_registry=registry)
```

### Q: 生成的 UI 如何调用工具？

A: 在事件处理函数中使用 `call_function`:
```python
def handle_query():
    city = get_value("city_input")
    # 调用已注册的工具
    result = call_function("fetch_weather", city=city)
    set_value("result_label", f"温度: {result['temperature']}°C")
```

## 下一步

- 查看 [examples/](../examples/) 目录中的完整示例
- 阅读 [API 文档](../api/) 了解详细接口
- 查看设计文档了解架构: [v0.4 设计文档](../plans/2026-01-31-v0.4-package-release-design.md)
