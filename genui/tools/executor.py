# -*- coding: utf-8 -*-
"""Tool 执行器"""

from typing import Any
from genui.tools.registry import ToolRegistry


class ToolExecutor:
    """在运行时执行 tools"""

    def __init__(self, registry: ToolRegistry):
        """初始化执行器

        Args:
            registry: Tool 注册表
        """
        self._registry = registry

    def call_function(self, name: str, **kwargs) -> Any:
        """同步接口调用 tool

        Args:
            name: Tool 名称
            **kwargs: Tool 参数

        Returns:
            Tool 执行结果

        Raises:
            ValueError: Tool 不存在或参数错误
            RuntimeError: Tool 执行失败
        """
        # 后续任务实现
        raise NotImplementedError("ToolExecutor.call_function 尚未实现")
