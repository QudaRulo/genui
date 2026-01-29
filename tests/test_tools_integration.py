# -*- coding: utf-8 -*-
"""测试 Tools 集成 - 自动化测试, 不需要人工交互"""

import pytest
from genui.core.ui_instance import UIInstance
from genui.renderer.renderer import Renderer
from genui.tools.registry import ToolRegistry
from genui.tools.executor import ToolExecutor


def test_call_function_in_event_handler():
    """测试事件处理函数中可以调用 call_function"""
    # 创建包含 call_function 的 UI
    ui_config = {
        "title": "测试工具调用",
        "width": 400,
        "height": 300,
        "root": {
            "id": "main",
            "type": "container",
            "layout": "vertical",
            "children": [
                {
                    "id": "result_label",
                    "type": "label",
                    "text": "结果: 未计算"
                },
                {
                    "id": "calc_btn",
                    "type": "button",
                    "text": "计算",
                    "on_click": "handle_calc"
                }
            ]
        },
        "event_handlers": {
            "handle_calc": """def handle_calc():
    # 调用 calculate tool
    result = call_function("calculate", expression="2 + 3")
    set_value("result_label", f"结果: {result}")
"""
        }
    }

    ui_instance = UIInstance.model_validate(ui_config)

    # 创建 renderer
    renderer = Renderer()

    # 渲染到窗口 (不运行事件循环)
    window = renderer.render_to_window(ui_instance)

    # 获取编译后的事件处理函数
    adapter = renderer.adapter
    event_handlers = adapter._compile_handlers(
        ui_instance.event_handlers,
        renderer.tool_executor
    )

    # 直接调用事件处理函数 (模拟点击)
    event_handlers["handle_calc"]()

    # 验证结果
    result_label = adapter.get_widget_by_id("result_label")
    assert result_label is not None
    assert "5.0" in result_label.cget("text")

    # 清理
    window.destroy()


def test_call_function_error_handling():
    """测试 call_function 的错误处理"""
    ui_config = {
        "title": "测试错误处理",
        "width": 400,
        "height": 300,
        "root": {
            "id": "main",
            "type": "container",
            "layout": "vertical",
            "children": [
                {
                    "id": "result_label",
                    "type": "label",
                    "text": ""
                }
            ]
        },
        "event_handlers": {
            "test_error": """def test_error():
    try:
        call_function("nonexistent_tool", x=1)
        set_value("result_label", "不应该执行到这里")
    except ValueError as e:
        set_value("result_label", "错误已捕获")
"""
        }
    }

    ui_instance = UIInstance.model_validate(ui_config)
    renderer = Renderer()
    window = renderer.render_to_window(ui_instance)

    adapter = renderer.adapter
    event_handlers = adapter._compile_handlers(
        ui_instance.event_handlers,
        renderer.tool_executor
    )

    # 调用会触发错误的处理函数
    event_handlers["test_error"]()

    # 验证错误被正确处理
    result_label = adapter.get_widget_by_id("result_label")
    assert "错误已捕获" in result_label.cget("text")

    window.destroy()
