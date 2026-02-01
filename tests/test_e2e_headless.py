# -*- coding: utf-8 -*-
"""端到端测试: 使用 TestAdapter 进行 Headless 测试"""

import pytest
from genui import UIGenerator, Renderer, ToolRegistry, register_tool
from genui.adapters import TestAdapter


def test_test_adapter_basic():
    """测试 TestAdapter 基本功能"""
    adapter = TestAdapter()

    # 手动构建一个简单的 UI 实例
    from genui.core import UIInstance, Container, Button, Label

    ui = UIInstance(
        title="测试",
        width=400,
        height=300,
        root=Container(
            id="main",
            type="container",
            layout="vertical",
            children=[
                Label(id="label1", type="label", text="Hello"),
                Button(id="btn1", type="button", text="Click", on_click="handle_click")
            ]
        ),
        event_handlers={
            "handle_click": "def handle_click():\n    set_value('label1', 'Clicked!')\n    display('Button clicked')"
        }
    )

    # 渲染
    renderer = Renderer(adapter=adapter)
    renderer.render(ui)

    # 验证组件存在
    assert "label1" in adapter.widgets
    assert "btn1" in adapter.widgets

    # 验证初始值
    assert adapter.get_output("label1") == "Hello"

    # 模拟点击
    adapter.click("btn1")

    # 验证值变化
    assert adapter.get_output("label1") == "Clicked!"

    # 验证事件记录
    assert ("click", "btn1") in adapter.get_events()

    # 验证输出
    assert "Button clicked" in adapter.get_outputs()


def test_test_adapter_calculator():
    """测试计算器端到端流程"""
    adapter = TestAdapter()

    # 构建计算器 UI
    from genui.core import UIInstance, Container, TextInput, Dropdown, Button, Label

    ui = UIInstance(
        title="计算器",
        width=400,
        height=300,
        root=Container(
            id="main",
            type="container",
            layout="vertical",
            children=[
                TextInput(id="num1", type="text_input", placeholder="第一个数字"),
                Dropdown(
                    id="operator",
                    type="dropdown",
                    label="运算符",
                    options=["+", "-", "*", "/"],
                    selected="+"
                ),
                TextInput(id="num2", type="text_input", placeholder="第二个数字"),
                Label(id="result", type="label", text="结果: "),
                Button(id="calc", type="button", text="计算", on_click="calculate")
            ]
        ),
        event_handlers={
            "calculate": """def calculate():
    try:
        n1 = float(get_value('num1'))
        n2 = float(get_value('num2'))
        op = get_value('operator')

        if op == '+':
            result = n1 + n2
        elif op == '-':
            result = n1 - n2
        elif op == '*':
            result = n1 * n2
        elif op == '/':
            result = n1 / n2 if n2 != 0 else '错误: 除数为0'

        set_value('result', f'结果: {result}')
    except ValueError:
        set_value('result', '错误: 请输入有效数字')
"""
        }
    )

    # 渲染
    renderer = Renderer(adapter=adapter)
    renderer.render(ui)

    # 测试加法
    adapter.set_input("num1", "10")
    adapter.set_input("num2", "5")
    adapter.select("operator", "+")
    adapter.click("calc")

    result = adapter.get_output("result")
    assert "15" in result or "15.0" in result

    # 测试减法
    adapter.set_input("num1", "10")
    adapter.set_input("num2", "3")
    adapter.select("operator", "-")
    adapter.click("calc")

    result = adapter.get_output("result")
    assert "7" in result or "7.0" in result

    # 测试除以0
    adapter.set_input("num1", "10")
    adapter.set_input("num2", "0")
    adapter.select("operator", "/")
    adapter.click("calc")

    result = adapter.get_output("result")
    assert "错误" in result or "除数为0" in result


def test_test_adapter_form():
    """测试表单验证端到端流程"""
    adapter = TestAdapter()

    from genui.core import UIInstance, Container, TextInput, Button, Label, Checkbox

    ui = UIInstance(
        title="登录表单",
        width=400,
        height=300,
        root=Container(
            id="main",
            type="container",
            layout="vertical",
            children=[
                TextInput(id="username", type="text_input", placeholder="用户名"),
                TextInput(id="password", type="text_input", placeholder="密码"),
                Checkbox(id="remember", type="checkbox", label="记住我", checked=False),
                Label(id="message", type="label", text=""),
                Button(id="login", type="button", text="登录", on_click="handle_login")
            ]
        ),
        event_handlers={
            "handle_login": """def handle_login():
    user = get_value('username')
    pwd = get_value('password')
    remember = get_value('remember')

    if not user or not pwd:
        set_value('message', '错误: 请填写用户名和密码')
    else:
        msg = f'欢迎, {user}!'
        if remember:
            msg += ' (已记住)'
        set_value('message', msg)
"""
        }
    )

    # 渲染
    renderer = Renderer(adapter=adapter)
    renderer.render(ui)

    # 测试空输入
    adapter.click("login")
    message = adapter.get_output("message")
    assert "错误" in message or "请填写" in message

    # 测试正常登录
    adapter.set_input("username", "test_user")
    adapter.set_input("password", "password123")
    adapter.click("login")

    message = adapter.get_output("message")
    assert "欢迎" in message
    assert "test_user" in message

    # 测试勾选记住我
    adapter.set_input("username", "user2")
    adapter.set_input("password", "pass2")
    adapter.check("remember", True)
    adapter.click("login")

    message = adapter.get_output("message")
    assert "user2" in message
    assert "记住" in message


def test_test_adapter_with_tools():
    """测试带 Tools 的端到端流程"""
    adapter = TestAdapter()

    # 创建工具注册表
    registry = ToolRegistry()

    @register_tool(registry)
    def add_numbers(a: int, b: int) -> int:
        """加法工具"""
        return a + b

    @register_tool(registry)
    def multiply_numbers(a: int, b: int) -> int:
        """乘法工具"""
        return a * b

    # 构建 UI
    from genui.core import UIInstance, Container, TextInput, Button, Label

    ui = UIInstance(
        title="工具测试",
        width=400,
        height=300,
        root=Container(
            id="main",
            type="container",
            layout="vertical",
            children=[
                TextInput(id="num1", type="text_input", placeholder="数字1"),
                TextInput(id="num2", type="text_input", placeholder="数字2"),
                Label(id="result", type="label", text="结果: "),
                Button(id="btn_add", type="button", text="加法", on_click="do_add"),
                Button(id="btn_mul", type="button", text="乘法", on_click="do_mul")
            ]
        ),
        event_handlers={
            "do_add": """def do_add():
    a = int(get_value('num1'))
    b = int(get_value('num2'))
    result = call_function('add_numbers', a=a, b=b)
    set_value('result', f'结果: {result}')
""",
            "do_mul": """def do_mul():
    a = int(get_value('num1'))
    b = int(get_value('num2'))
    result = call_function('multiply_numbers', a=a, b=b)
    set_value('result', f'结果: {result}')
"""
        }
    )

    # 创建 Tool 执行器
    from genui.tools import ToolExecutor
    executor = ToolExecutor(registry)

    # 渲染
    renderer = Renderer(adapter=adapter)
    window = adapter.create_window(ui, tool_executor=executor)
    adapter.run_event_loop(window)

    # 测试加法工具
    adapter.set_input("num1", "5")
    adapter.set_input("num2", "3")
    adapter.click("btn_add")

    result = adapter.get_output("result")
    assert "8" in result

    # 测试乘法工具
    adapter.set_input("num1", "4")
    adapter.set_input("num2", "6")
    adapter.click("btn_mul")

    result = adapter.get_output("result")
    assert "24" in result


def test_register_tool_decorator():
    """测试 register_tool 装饰器"""
    registry = ToolRegistry()

    @register_tool(registry)
    def test_function(x: int) -> int:
        """测试函数"""
        return x * 2

    # 验证工具已注册
    tool = registry.get_tool("test_function")
    assert tool is not None
    assert tool.name == "test_function"

    # 验证工具可以调用
    from genui.tools import ToolExecutor
    executor = ToolExecutor(registry)
    result = executor.call_function("test_function", x=5)
    assert result == 10
