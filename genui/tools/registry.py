# -*- coding: utf-8 -*-
"""Tool 注册表, 管理可用的 tools"""

from typing import Dict, List, Optional
from langchain_core.tools import BaseTool
from genui.logger import get_logger

logger = get_logger(__name__)


class ToolRegistry:
    """管理可用的 tools"""

    def __init__(self, load_builtin: bool = True):
        """初始化 tool 注册表

        Args:
            load_builtin: 是否自动加载内置 tools
        """
        self._tools: Dict[str, BaseTool] = {}

        if load_builtin:
            self._load_builtin_tools()
            logger.info(f"已加载 {len(self._tools)} 个内置 tools")

    def _load_builtin_tools(self) -> None:
        """加载内置 tools"""
        from genui.tools.builtin import get_all_builtin_tools

        for tool in get_all_builtin_tools():
            self.register(tool)

    def register(self, tool: BaseTool) -> None:
        """注册一个 tool

        Args:
            tool: LangChain BaseTool 实例
        """
        self._tools[tool.name] = tool
        logger.debug(f"注册 tool: {tool.name}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """根据名称获取 tool

        Args:
            name: tool 名称

        Returns:
            Tool 实例, 如果不存在则返回 None
        """
        return self._tools.get(name)

    def get_all_tools(self) -> List[BaseTool]:
        """获取所有注册的 tools

        Returns:
            Tools 列表
        """
        return list(self._tools.values())

    def get_tools_description(
        self,
        tool_names: Optional[List[str]] = None
    ) -> str:
        """生成 tools 的描述文本, 用于 LLM prompt

        Args:
            tool_names: 需要描述的 tool 名称列表, 如果为 None 则描述所有 tools

        Returns:
            格式化的 tools 描述字符串
        """
        if tool_names is None:
            tools = self.get_all_tools()
        else:
            tools = [self.get_tool(name) for name in tool_names if self.get_tool(name)]

        if not tools:
            return "当前没有可用的工具函数."

        descriptions = []
        for tool in tools:
            desc = f"- **{tool.name}**: {tool.description}"
            descriptions.append(desc)

        return "\n".join(descriptions)
