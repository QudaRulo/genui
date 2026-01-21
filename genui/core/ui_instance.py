# -*- coding: utf-8 -*-
"""UI实例模型, 定义完整的UI实例结构"""

from typing import Dict, Optional, Callable, Any
from pydantic import BaseModel, Field
from genui.core.component import Component


class UIInstance(BaseModel):
    """UI实例, 表示一个完整的UI界面"""

    title: str = Field(description="窗口标题")
    width: int = Field(default=600, description="窗口宽度(像素)")
    height: int = Field(default=400, description="窗口高度(像素)")
    root: Component = Field(description="根组件")
    event_handlers: Dict[str, str] = Field(
        default_factory=dict,
        description="事件处理函数映射, key为函数名, value为函数代码"
    )

    class Config:
        """Pydantic配置"""
        extra = "forbid"

    def get_handler_code(self, handler_name: str) -> Optional[str]:
        """获取事件处理函数代码

        Args:
            handler_name: 处理函数名称

        Returns:
            函数代码字符串, 如果不存在则返回None
        """
        return self.event_handlers.get(handler_name)

    def list_all_components(self) -> list[Component]:
        """递归获取所有组件

        Returns:
            所有组件的列表
        """
        components = [self.root]

        def _collect(comp: Component) -> None:
            """递归收集组件"""
            if hasattr(comp, 'children'):
                for child in comp.children:
                    components.append(child)
                    _collect(child)

        _collect(self.root)
        return components

    def find_component_by_id(self, component_id: str) -> Optional[Component]:
        """根据ID查找组件

        Args:
            component_id: 组件ID

        Returns:
            找到的组件, 如果不存在则返回None
        """
        for comp in self.list_all_components():
            if comp.id == component_id:
                return comp
        return None
