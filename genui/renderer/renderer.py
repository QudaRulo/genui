# -*- coding: utf-8 -*-
"""UI渲染器, 负责渲染和显示UI实例"""

from typing import Optional
from genui.core.ui_instance import UIInstance
from genui.adapters.base import AdapterBase
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.tools.registry import ToolRegistry
from genui.tools.executor import ToolExecutor
from genui.logger import get_logger

logger = get_logger(__name__)


class Renderer:
    """UI渲染器, 负责将UI实例渲染为可视化界面"""

    def __init__(
        self,
        adapter: Optional[AdapterBase] = None,
        tool_executor: Optional[ToolExecutor] = None
    ):
        """初始化渲染器

        Args:
            adapter: UI框架适配器, 如果为None则使用默认的TkinterAdapter
            tool_executor: Tool 执行器, 如果为 None 则创建默认实例
        """
        self.adapter = adapter or TkinterAdapter()
        self.tool_executor = tool_executor or ToolExecutor(ToolRegistry())
        logger.info(f"使用渲染适配器: {type(self.adapter).__name__}")

    def render(self, ui_instance: UIInstance) -> None:
        """渲染并显示UI实例

        Args:
            ui_instance: 要渲染的UI实例
        """
        # 创建窗口, 传递tool_executor
        window = self.adapter.create_window(ui_instance, self.tool_executor)

        # 运行事件循环
        self.adapter.run_event_loop(window)

    def render_to_window(self, ui_instance: UIInstance) -> object:
        """渲染UI实例到窗口但不运行事件循环

        Args:
            ui_instance: 要渲染的UI实例

        Returns:
            创建的窗口对象
        """
        return self.adapter.create_window(ui_instance, self.tool_executor)

    def run_window(self, window: object) -> None:
        """运行窗口的事件循环

        Args:
            window: 窗口对象
        """
        self.adapter.run_event_loop(window)
