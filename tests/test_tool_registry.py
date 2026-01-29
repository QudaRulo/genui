# -*- coding: utf-8 -*-
"""测试 ToolRegistry"""

import pytest
from langchain_core.tools import BaseTool
from genui.tools.registry import ToolRegistry


def test_registry_init_without_builtin():
    """测试不加载内置 tools 的初始化"""
    registry = ToolRegistry(load_builtin=False)
    assert len(registry.get_all_tools()) == 0


def test_registry_init_with_builtin():
    """测试加载内置 tools 的初始化"""
    registry = ToolRegistry(load_builtin=True)
    tools = registry.get_all_tools()
    # 应该有 2 个内置 tools (calculate, convert_unit)
    assert len(tools) >= 2


def test_register_tool():
    """测试注册自定义 tool"""
    from langchain_core.tools import tool

    @tool
    def custom_func(x: int) -> int:
        """A custom function"""
        return x * 2

    registry = ToolRegistry(load_builtin=False)
    registry.register(custom_func)

    assert registry.get_tool("custom_func") is not None
    assert len(registry.get_all_tools()) == 1


def test_get_tool_not_found():
    """测试获取不存在的 tool"""
    registry = ToolRegistry(load_builtin=False)
    assert registry.get_tool("nonexistent") is None


def test_get_tools_description():
    """测试生成 tools 描述"""
    registry = ToolRegistry(load_builtin=True)
    desc = registry.get_tools_description()

    assert isinstance(desc, str)
    assert len(desc) > 0
    # 应该包含 tool 名称
    assert "calculate" in desc or "get_weather" in desc
