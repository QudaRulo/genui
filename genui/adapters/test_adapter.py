# -*- coding: utf-8 -*-
"""测试适配器, 支持自动化测试而不需要真实UI"""

from typing import Any, Dict, Callable, List, Tuple, Optional
from genui.adapters.base import AdapterBase
from genui.core.component import Component
from genui.core.ui_instance import UIInstance


class VirtualWidget:
    """虚拟组件, 模拟真实UI组件"""

    def __init__(self, component: Component):
        """初始化虚拟组件

        Args:
            component: 抽象组件定义
        """
        self.component = component
        self.id = component.id
        self.type = component.type
        self.value: Any = None
        self.event_handlers: Dict[str, Callable] = {}

        # 根据组件类型初始化默认值
        if component.type == "text_input":
            self.value = getattr(component, "default_value", "")
        elif component.type == "checkbox":
            self.value = getattr(component, "checked", False)
        elif component.type == "radio_group":
            self.value = getattr(component, "selected", None)
        elif component.type == "dropdown":
            self.value = getattr(component, "selected", None)
        elif component.type == "label":
            self.value = getattr(component, "text", "")

    def get(self) -> Any:
        """获取组件值 (模拟Tkinter的get方法)"""
        return self.value

    def set(self, value: Any):
        """设置组件值"""
        self.value = value

    def config(self, **kwargs):
        """配置组件属性 (模拟Tkinter的config方法)"""
        for key, value in kwargs.items():
            if key == "text":
                self.value = value


class TestAdapter(AdapterBase):
    """测试适配器, 在内存中模拟UI交互"""

    def __init__(self):
        """初始化测试适配器"""
        self.widgets: Dict[str, VirtualWidget] = {}  # 存储所有虚拟组件
        self.events: List[Tuple[str, str]] = []  # 记录触发的事件 (event_type, component_id)
        self.outputs: List[str] = []  # 记录 display() 输出
        self.event_handlers: Dict[str, Callable] = {}  # 事件处理函数
        self.tool_executor: Optional[Any] = None  # Tool执行器

    def render_component(
        self,
        component: Component,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> VirtualWidget:
        """渲染组件到内存

        Args:
            component: 要渲染的抽象组件
            parent: 父组件
            event_handlers: 事件处理函数字典

        Returns:
            虚拟组件实例
        """
        # 创建虚拟组件
        widget = VirtualWidget(component)
        self.widgets[component.id] = widget

        # 绑定事件处理器
        if component.type == "button":
            on_click = getattr(component, "on_click", None)
            if on_click and on_click in event_handlers:
                widget.event_handlers["click"] = event_handlers[on_click]

        elif component.type == "checkbox":
            on_change = getattr(component, "on_change", None)
            if on_change and on_change in event_handlers:
                widget.event_handlers["change"] = event_handlers[on_change]

        elif component.type == "radio_group":
            on_change = getattr(component, "on_change", None)
            if on_change and on_change in event_handlers:
                widget.event_handlers["change"] = event_handlers[on_change]

        # 递归渲染子组件
        if component.type == "container":
            children = getattr(component, "children", [])
            for child in children:
                self.render_component(child, widget, event_handlers)

        return widget

    def create_window(
        self,
        ui_instance: UIInstance,
        tool_executor: Any = None
    ) -> Dict[str, Any]:
        """创建虚拟窗口

        Args:
            ui_instance: UI实例
            tool_executor: Tool执行器

        Returns:
            虚拟窗口对象 (字典)
        """
        self.tool_executor = tool_executor

        # 构建辅助函数环境
        helper_env = {
            "get_widget": self._get_widget,
            "get_value": self._get_value,
            "set_value": self._set_value,
            "update_widget": self._update_widget,
            "display": self._display,
            "print": print,
        }

        # 如果有 tool_executor, 添加 call_function
        if tool_executor:
            helper_env["call_function"] = tool_executor.call_function

        # 编译事件处理函数
        compiled_handlers = {}
        for name, code in ui_instance.event_handlers.items():
            try:
                exec(code, helper_env)
                compiled_handlers[name] = helper_env[name]
            except Exception as e:
                raise RuntimeError(f"编译事件处理函数 '{name}' 失败: {e}")

        self.event_handlers = compiled_handlers

        # 渲染根组件
        root_widget = self.render_component(
            ui_instance.root,
            None,
            compiled_handlers
        )

        return {
            "title": ui_instance.title,
            "width": ui_instance.width,
            "height": ui_instance.height,
            "root": root_widget
        }

    def run_event_loop(self, window: Any) -> None:
        """不运行真实事件循环 (测试模式下不需要)

        Args:
            window: 虚拟窗口对象
        """
        pass

    # ========== 测试辅助方法 ==========

    def click(self, component_id: str):
        """模拟点击按钮

        Args:
            component_id: 组件ID

        Raises:
            ValueError: 如果组件不存在或不是按钮
        """
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")

        if widget.type != "button":
            raise ValueError(f"组件 '{component_id}' 不是按钮")

        # 触发点击事件
        handler = widget.event_handlers.get("click")
        if handler:
            handler()
            self.events.append(("click", component_id))

    def set_input(self, component_id: str, value: str):
        """模拟输入文本

        Args:
            component_id: 组件ID
            value: 输入值

        Raises:
            ValueError: 如果组件不存在或不支持输入
        """
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")

        if widget.type not in ["text_input"]:
            raise ValueError(f"组件 '{component_id}' 不支持输入")

        widget.value = value

    def get_output(self, component_id: str) -> Any:
        """获取组件输出值

        Args:
            component_id: 组件ID

        Returns:
            组件的当前值

        Raises:
            ValueError: 如果组件不存在
        """
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")

        return widget.value

    def select(self, component_id: str, option: str):
        """模拟选择选项 (下拉框或单选按钮组)

        Args:
            component_id: 组件ID
            option: 选择的选项

        Raises:
            ValueError: 如果组件不存在或不支持选择
        """
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")

        if widget.type not in ["dropdown", "radio_group"]:
            raise ValueError(f"组件 '{component_id}' 不支持选择")

        widget.value = option

        # 触发 change 事件
        handler = widget.event_handlers.get("change")
        if handler:
            handler()
            self.events.append(("change", component_id))

    def check(self, component_id: str, checked: bool = True):
        """模拟勾选/取消复选框

        Args:
            component_id: 组件ID
            checked: 是否勾选

        Raises:
            ValueError: 如果组件不存在或不是复选框
        """
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")

        if widget.type != "checkbox":
            raise ValueError(f"组件 '{component_id}' 不是复选框")

        widget.value = checked

        # 触发 change 事件
        handler = widget.event_handlers.get("change")
        if handler:
            handler()
            self.events.append(("change", component_id))

    def get_events(self) -> List[Tuple[str, str]]:
        """获取所有触发的事件

        Returns:
            事件列表 [(event_type, component_id), ...]
        """
        return self.events.copy()

    def get_outputs(self) -> List[str]:
        """获取所有 display() 输出

        Returns:
            输出列表
        """
        return self.outputs.copy()

    def clear_events(self):
        """清空事件记录"""
        self.events.clear()

    def clear_outputs(self):
        """清空输出记录"""
        self.outputs.clear()

    # ========== 内部辅助函数 (供事件处理器使用) ==========

    def _get_widget(self, component_id: str) -> VirtualWidget:
        """获取虚拟组件"""
        widget = self.widgets.get(component_id)
        if not widget:
            raise ValueError(f"组件 '{component_id}' 不存在")
        return widget

    def _get_value(self, component_id: str) -> Any:
        """获取组件值"""
        return self.get_output(component_id)

    def _set_value(self, component_id: str, value: Any):
        """设置组件值"""
        widget = self._get_widget(component_id)
        widget.value = value

    def _update_widget(self, component_id: str, **kwargs):
        """更新组件属性"""
        widget = self._get_widget(component_id)
        for key, value in kwargs.items():
            if key == "text":
                widget.value = value

    def _display(self, message: str):
        """记录输出消息"""
        self.outputs.append(message)
