# -*- coding: utf-8 -*-
"""Tool 执行器"""

from typing import Any
from genui.tools.registry import ToolRegistry
from genui.logger import get_logger

logger = get_logger(__name__)


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
        logger.debug(f"调用 tool: {name}, 参数: {kwargs}")

        # 1. 查找 tool
        tool = self._registry.get_tool(name)
        if tool is None:
            error_msg = f"Tool '{name}' 不存在"
            logger.error(error_msg)
            raise ValueError(error_msg)

        # 2. 执行 tool
        try:
            # LangChain tool.invoke() 是同步的
            result = tool.invoke(kwargs)
            logger.info(f"Tool 执行成功: {name}")
            logger.debug(f"返回结果: {result}")
            return result

        except Exception as e:
            error_msg = f"Tool '{name}' 执行失败: {e}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg) from e
