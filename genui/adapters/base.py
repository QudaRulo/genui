# -*- coding: utf-8 -*-
"""UI框架适配器基类"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Callable
from genui.core.component import Component
from genui.core.ui_instance import UIInstance


class AdapterBase(ABC):
    """适配器基类, 将抽象组件转换为具体UI框架的组件"""

    @abstractmethod
    def render_component(
        self,
        component: Component,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> Any:
        """渲染单个组件

        Args:
            component: 要渲染的抽象组件
            parent: 父组件
            event_handlers: 事件处理函数字典

        Returns:
            渲染后的具体框架组件
        """
        pass

    @abstractmethod
    def create_window(self, ui_instance: UIInstance) -> Any:
        """创建主窗口

        Args:
            ui_instance: UI实例

        Returns:
            窗口对象
        """
        pass

    @abstractmethod
    def run_event_loop(self, window: Any) -> None:
        """运行事件循环

        Args:
            window: 窗口对象
        """
        pass
