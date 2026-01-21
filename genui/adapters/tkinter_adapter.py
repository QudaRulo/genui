# -*- coding: utf-8 -*-
"""Tkinter UI框架适配器"""

import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, Callable, Optional
from genui.core.component import (
    Component,
    Button,
    TextInput,
    Label,
    Container,
    Checkbox,
    RadioGroup,
    Dropdown
)
from genui.core.ui_instance import UIInstance
from genui.adapters.base import AdapterBase


class TkinterAdapter(AdapterBase):
    """Tkinter适配器, 将抽象组件转换为Tkinter组件"""

    def __init__(self):
        """初始化适配器"""
        self.component_widgets: Dict[str, Any] = {}  # 组件ID到widget的映射

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
            渲染后的Tkinter组件
        """
        widget = None

        if isinstance(component, Button):
            widget = self._render_button(component, parent, event_handlers)
        elif isinstance(component, TextInput):
            widget = self._render_text_input(component, parent)
        elif isinstance(component, Label):
            widget = self._render_label(component, parent)
        elif isinstance(component, Container):
            widget = self._render_container(component, parent, event_handlers)
        elif isinstance(component, Checkbox):
            widget = self._render_checkbox(component, parent, event_handlers)
        elif isinstance(component, RadioGroup):
            widget = self._render_radio_group(component, parent, event_handlers)
        elif isinstance(component, Dropdown):
            widget = self._render_dropdown(component, parent)
        else:
            raise ValueError(f"不支持的组件类型: {type(component)}")

        # 保存组件映射
        self.component_widgets[component.id] = widget
        return widget

    def _render_button(
        self,
        component: Button,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> tk.Button:
        """渲染按钮"""
        cmd = None
        if component.on_click and component.on_click in event_handlers:
            cmd = event_handlers[component.on_click]

        btn = tk.Button(
            parent,
            text=component.text,
            command=cmd,
            state=tk.NORMAL if component.enabled else tk.DISABLED
        )

        if component.width:
            btn.config(width=component.width // 8)  # 近似字符宽度
        if component.height:
            btn.config(height=component.height // 20)  # 近似行高

        return btn

    def _render_text_input(
        self,
        component: TextInput,
        parent: Any
    ) -> tk.Text | tk.Entry:
        """渲染文本输入框"""
        if component.multiline:
            widget = tk.Text(parent)
            if component.default_value:
                widget.insert("1.0", component.default_value)
            if component.width:
                widget.config(width=component.width // 8)
            if component.height:
                widget.config(height=component.height // 20)
        else:
            widget = tk.Entry(parent)
            if component.default_value:
                widget.insert(0, component.default_value)
            if component.width:
                widget.config(width=component.width // 8)

        return widget

    def _render_label(
        self,
        component: Label,
        parent: Any
    ) -> tk.Label:
        """渲染标签"""
        font = ("TkDefaultFont", component.font_size)
        if component.bold:
            font = ("TkDefaultFont", component.font_size, "bold")

        label = tk.Label(
            parent,
            text=component.text,
            font=font
        )

        if component.color:
            label.config(fg=component.color)

        return label

    def _render_container(
        self,
        component: Container,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> tk.Frame:
        """渲染容器"""
        frame = tk.Frame(parent, padx=component.padding, pady=component.padding)

        if component.width:
            frame.config(width=component.width)
        if component.height:
            frame.config(height=component.height)

        # 渲染子组件
        for child in component.children:
            child_widget = self.render_component(child, frame, event_handlers)

            if component.layout == "vertical":
                child_widget.pack(pady=component.spacing // 2, fill=tk.X)
            elif component.layout == "horizontal":
                child_widget.pack(side=tk.LEFT, padx=component.spacing // 2)
            elif component.layout == "grid":
                # 简化的网格布局, 每行最多3个
                idx = component.children.index(child)
                child_widget.grid(
                    row=idx // 3,
                    column=idx % 3,
                    padx=component.spacing,
                    pady=component.spacing
                )

        return frame

    def _render_checkbox(
        self,
        component: Checkbox,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> tk.Checkbutton:
        """渲染复选框"""
        var = tk.BooleanVar(value=component.checked)
        cmd = None
        if component.on_change and component.on_change in event_handlers:
            cmd = event_handlers[component.on_change]

        checkbox = tk.Checkbutton(
            parent,
            text=component.label,
            variable=var,
            command=cmd
        )

        return checkbox

    def _render_radio_group(
        self,
        component: RadioGroup,
        parent: Any,
        event_handlers: Dict[str, Callable]
    ) -> tk.Frame:
        """渲染单选按钮组"""
        frame = tk.LabelFrame(parent, text=component.label)
        var = tk.StringVar(value=component.selected or "")

        cmd = None
        if component.on_change and component.on_change in event_handlers:
            cmd = event_handlers[component.on_change]

        for option in component.options:
            rb = tk.Radiobutton(
                frame,
                text=option,
                variable=var,
                value=option,
                command=cmd
            )
            rb.pack(anchor=tk.W)

        return frame

    def _render_dropdown(
        self,
        component: Dropdown,
        parent: Any
    ) -> ttk.Combobox:
        """渲染下拉选择框"""
        var = tk.StringVar(value=component.selected or "")
        dropdown = ttk.Combobox(
            parent,
            textvariable=var,
            values=component.options,
            state="readonly"
        )

        if component.width:
            dropdown.config(width=component.width // 8)

        return dropdown

    def create_window(self, ui_instance: UIInstance) -> tk.Tk:
        """创建主窗口

        Args:
            ui_instance: UI实例

        Returns:
            Tkinter窗口对象
        """
        window = tk.Tk()
        window.title(ui_instance.title)
        window.geometry(f"{ui_instance.width}x{ui_instance.height}")

        # 编译事件处理函数
        event_handlers = self._compile_handlers(ui_instance.event_handlers)

        # 渲染根组件
        root_widget = self.render_component(
            ui_instance.root,
            window,
            event_handlers
        )
        root_widget.pack(fill=tk.BOTH, expand=True)

        return window

    def _compile_handlers(
        self,
        handler_codes: Dict[str, str]
    ) -> Dict[str, Callable]:
        """编译事件处理函数代码

        Args:
            handler_codes: 处理函数代码字典

        Returns:
            编译后的函数字典
        """
        handlers = {}
        for name, code in handler_codes.items():
            # 创建安全的执行环境
            local_env = {}
            try:
                # 执行函数定义代码
                exec(code, {"__builtins__": __builtins__}, local_env)
                # 提取函数
                if name in local_env:
                    handlers[name] = local_env[name]
            except Exception as e:
                print(f"编译处理函数 {name} 失败: {e}")

        return handlers

    def run_event_loop(self, window: tk.Tk) -> None:
        """运行事件循环

        Args:
            window: Tkinter窗口对象
        """
        window.mainloop()

    def get_widget_by_id(self, component_id: str) -> Optional[Any]:
        """根据组件ID获取对应的widget

        Args:
            component_id: 组件ID

        Returns:
            widget对象, 如果不存在则返回None
        """
        return self.component_widgets.get(component_id)
