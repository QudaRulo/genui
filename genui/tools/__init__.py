# -*- coding: utf-8 -*-
"""Tools 层, 管理和执行功能函数"""

from typing import Callable
from langchain_core.tools import tool
from genui.tools.registry import ToolRegistry
from genui.tools.executor import ToolExecutor


def register_tool(registry: ToolRegistry) -> Callable:
    """装饰器: 注册工具函数到指定的注册表

    Args:
        registry: 工具注册表实例

    Returns:
        装饰器函数

    Example:
        >>> registry = ToolRegistry()
        >>> @register_tool(registry)
        ... def my_function(param: str) -> str:
        ...     '''函数描述'''
        ...     return f"结果: {param}"
    """
    def decorator(func: Callable) -> Callable:
        # 使用 LangChain 的 @tool 装饰器将函数转换为 BaseTool
        langchain_tool = tool(func)
        registry.register(langchain_tool)
        return func
    return decorator


__all__ = [
    "ToolRegistry",
    "ToolExecutor",
    "register_tool",
]
