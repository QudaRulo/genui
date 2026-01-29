# -*- coding: utf-8 -*-
"""测试 ToolExecutor"""

import pytest
from genui.tools.registry import ToolRegistry
from genui.tools.executor import ToolExecutor


def test_executor_call_function():
    """测试调用存在的 tool"""
    registry = ToolRegistry(load_builtin=True)
    executor = ToolExecutor(registry)

    result = executor.call_function("calculate", expression="2 + 3")
    assert result == 5.0


def test_executor_call_nonexistent():
    """测试调用不存在的 tool"""
    registry = ToolRegistry(load_builtin=False)
    executor = ToolExecutor(registry)

    with pytest.raises(ValueError, match="不存在"):
        executor.call_function("nonexistent", x=1)


def test_executor_call_with_error():
    """测试 tool 执行失败"""
    registry = ToolRegistry(load_builtin=True)
    executor = ToolExecutor(registry)

    with pytest.raises((ValueError, RuntimeError)):
        # 无效的数学表达式
        executor.call_function("calculate", expression="invalid")
