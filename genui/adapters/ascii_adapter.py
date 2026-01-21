# -*- coding: utf-8 -*-
"""ASCII UI适配器, 使用Rich库在终端渲染UI"""

from typing import Any, Dict, Callable, List
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from rich.prompt import Prompt, Confirm
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


class ASCIIAdapter(AdapterBase):
    """ASCII适配器, 将抽象组件转换为Rich终端UI组件"""

    def __init__(self):
        """初始化适配器"""
        self.console = Console()
        self.component_values: Dict[str, Any] = {}  # 组件ID到值的映射
        self.event_handlers: Dict[str, Callable] = {}

    def render_component(
        self,
        component: Component,
        _parent: Any,  # parent not used in ASCII rendering
        event_handlers: Dict[str, Callable]
    ) -> Any:
        """渲染单个组件为Rich可渲染对象

        Args:
            component: 要渲染的抽象组件
            parent: 父组件(对于ASCII来说主要是用于嵌套结构)
            event_handlers: 事件处理函数字典

        Returns:
            Rich可渲染对象
        """
        if isinstance(component, Button):
            return self._render_button(component)
        elif isinstance(component, TextInput):
            return self._render_text_input(component)
        elif isinstance(component, Label):
            return self._render_label(component)
        elif isinstance(component, Container):
            return self._render_container(component, event_handlers)
        elif isinstance(component, Checkbox):
            return self._render_checkbox(component)
        elif isinstance(component, RadioGroup):
            return self._render_radio_group(component)
        elif isinstance(component, Dropdown):
            return self._render_dropdown(component)
        else:
            raise ValueError(f"不支持的组件类型: {type(component)}")

    def _render_button(self, component: Button) -> Text:
        """渲染按钮为带边框的文本"""
        style = "bold green" if component.enabled else "dim"
        return Text(f"[{component.text}]", style=style)

    def _render_text_input(self, component: TextInput) -> Panel:
        """渲染文本输入框为面板"""
        content = component.default_value or ""
        # TextInput没有label属性, 使用placeholder或id作为标题
        title_text = component.placeholder or component.id

        if component.multiline:
            title = f"📝 {title_text} (多行输入)"
        else:
            title = f"📝 {title_text}"

        return Panel(
            Text(content or "(空)", style="cyan" if content else "dim"),
            title=title,
            border_style="blue"
        )

    def _render_label(self, component: Label) -> Text:
        """渲染标签为文本"""
        style = "bold" if component.bold else ""
        if component.color:
            style = f"{style} {component.color}".strip()

        text = Text(component.text, style=style)
        return text

    def _render_container(
        self,
        component: Container,
        event_handlers: Dict[str, Callable]
    ) -> Panel:
        """渲染容器为面板"""
        # 创建子组件的渲染对象
        children_renderables = []
        for child in component.children:
            child_renderable = self.render_component(child, component, event_handlers)
            children_renderables.append(child_renderable)

        # 根据布局方式创建表格或直接堆叠
        if component.layout == "grid":
            # 网格布局使用表格
            table = Table(show_header=False, box=None, padding=(0, 1))
            # 每行最多3列
            cols_per_row = 3
            for i in range(0, len(children_renderables), cols_per_row):
                row_items = children_renderables[i:i+cols_per_row]
                table.add_row(*row_items)
            content = table
        else:
            # 垂直或水平布局, 使用表格模拟
            if component.layout == "horizontal":
                table = Table(show_header=False, box=None, padding=(0, 1))
                table.add_row(*children_renderables)
                content = table
            else:  # vertical
                table = Table(show_header=False, box=None, padding=(0, 0))
                for child_renderable in children_renderables:
                    table.add_row(child_renderable)
                content = table

        # 用面板包装
        return Panel(
            content,
            border_style="white",
            padding=(component.padding // 10, component.padding // 10)
        )

    def _render_checkbox(self, component: Checkbox) -> Text:
        """渲染复选框"""
        check = "☑" if component.checked else "☐"
        return Text(f"{check} {component.label}", style="green" if component.checked else "white")

    def _render_radio_group(self, component: RadioGroup) -> Panel:
        """渲染单选按钮组"""
        lines = []
        for option in component.options:
            check = "◉" if option == component.selected else "○"
            lines.append(f"{check} {option}")

        content = Text("\n".join(lines))
        return Panel(content, title=component.label, border_style="yellow")

    def _render_dropdown(self, component: Dropdown) -> Panel:
        """渲染下拉选择框"""
        selected = component.selected or "(请选择)"
        content = Text(f"▼ {selected}", style="cyan")
        return Panel(
            content,
            title=component.label or "选择",
            border_style="magenta"
        )

    def create_window(self, ui_instance: UIInstance) -> Any:
        """创建ASCII UI显示

        Args:
            ui_instance: UI实例

        Returns:
            渲染好的UI对象
        """
        # 编译事件处理函数
        self.event_handlers = self._compile_handlers(ui_instance.event_handlers)

        # 渲染根组件
        root_renderable = self.render_component(
            ui_instance.root,
            None,
            self.event_handlers
        )

        # 创建主面板
        main_panel = Panel(
            root_renderable,
            title=f"✨ {ui_instance.title}",
            border_style="bold blue",
            padding=(1, 2)
        )

        return {
            "panel": main_panel,
            "ui_instance": ui_instance
        }

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

        # 创建工具函数
        def display(message: str) -> None:
            """显示消息到控制台"""
            self.console.print(message)

        def get_value(component_id: str) -> Any:
            """根据组件ID获取值"""
            return self.component_values.get(component_id)

        # 创建全局执行环境, 提供必要的工具函数
        global_env = {
            "__builtins__": __builtins__,
            "display": display,
            "get_value": get_value,
            "print": print,
        }

        for name, code in handler_codes.items():
            # 创建局部执行环境
            local_env = {}
            try:
                # 执行函数定义代码
                exec(code, global_env, local_env)
                # 提取函数
                if name in local_env:
                    handlers[name] = local_env[name]
            except Exception as e:
                self.console.print(f"[red]编译处理函数 {name} 失败: {e}[/red]")
                self.console.print(f"[red]代码内容:\n{code}[/red]")

        return handlers

    def run_event_loop(self, window: Any) -> None:
        """运行交互循环

        Args:
            window: 包含UI信息的字典
        """
        panel = window["panel"]
        ui_instance = window["ui_instance"]

        # 显示UI
        self.console.clear()
        self.console.print(panel)
        self.console.print()

        # 收集所有交互式组件
        interactive_components = self._collect_interactive_components(ui_instance.root)

        if not interactive_components:
            self.console.print("[yellow]此UI没有交互式组件, 按Enter键退出...[/yellow]")
            input()
            return

        # 交互循环
        self.console.print("[bold green]请填写以下信息:[/bold green]")
        self.console.print()

        for component in interactive_components:
            self._interact_with_component(component)

        self.console.print()
        self.console.print("[bold green]✓ 所有输入已完成![/bold green]")
        self.console.print()

        # 显示结果
        self._show_results(interactive_components)

        # 等待用户确认退出
        self.console.print()
        input("按Enter键退出...")

    def _collect_interactive_components(self, component: Component) -> List[Component]:
        """收集所有交互式组件

        Args:
            component: 根组件

        Returns:
            交互式组件列表
        """
        interactive = []

        if isinstance(component, (TextInput, Checkbox, RadioGroup, Dropdown)):
            interactive.append(component)
        elif isinstance(component, Button):
            # 按钮也算交互式组件
            interactive.append(component)

        # 递归处理容器
        if isinstance(component, Container):
            for child in component.children:
                interactive.extend(self._collect_interactive_components(child))

        return interactive

    def _interact_with_component(self, component: Component) -> None:
        """与单个组件交互

        Args:
            component: 组件
        """
        if isinstance(component, TextInput):
            # TextInput没有label属性, 使用placeholder或id
            label = component.placeholder or component.id
            prompt_text = f"📝 {label}"

            default = component.default_value or ""
            value = Prompt.ask(prompt_text, default=default)
            self.component_values[component.id] = value

        elif isinstance(component, Checkbox):
            value = Confirm.ask(f"☐ {component.label}", default=component.checked)
            self.component_values[component.id] = value

        elif isinstance(component, RadioGroup):
            self.console.print(f"[bold]{component.label}:[/bold]")
            for i, option in enumerate(component.options, 1):
                self.console.print(f"  {i}. {option}")

            while True:
                choice = Prompt.ask("请选择 (输入序号)", default="1")
                try:
                    idx = int(choice) - 1
                    if 0 <= idx < len(component.options):
                        self.component_values[component.id] = component.options[idx]
                        break
                    else:
                        self.console.print("[red]无效的选择, 请重试[/red]")
                except ValueError:
                    self.console.print("[red]请输入数字[/red]")

        elif isinstance(component, Dropdown):
            label = component.label or "选择"
            self.console.print(f"[bold]{label}:[/bold]")
            for i, option in enumerate(component.options, 1):
                self.console.print(f"  {i}. {option}")

            default_idx = 1
            if component.selected and component.selected in component.options:
                default_idx = component.options.index(component.selected) + 1

            while True:
                choice = Prompt.ask("请选择 (输入序号)", default=str(default_idx))
                try:
                    idx = int(choice) - 1
                    if 0 <= idx < len(component.options):
                        self.component_values[component.id] = component.options[idx]
                        break
                    else:
                        self.console.print("[red]无效的选择, 请重试[/red]")
                except ValueError:
                    self.console.print("[red]请输入数字[/red]")

        elif isinstance(component, Button):
            if component.enabled and component.on_click:
                if Confirm.ask(f"执行操作: {component.text}?", default=False):
                    handler = self.event_handlers.get(component.on_click)
                    if handler:
                        try:
                            handler()
                            self.console.print(f"[green]✓ {component.text} 执行成功[/green]")
                        except Exception as e:
                            self.console.print(f"[red]✗ 执行失败: {e}[/red]")

    def _show_results(self, components: List[Component]) -> None:
        """显示收集到的结果

        Args:
            components: 组件列表
        """
        if not self.component_values:
            return

        self.console.print("[bold cyan]📊 收集到的数据:[/bold cyan]")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("组件", style="cyan", no_wrap=True)
        table.add_column("值", style="green")

        for component in components:
            if component.id in self.component_values:
                label = getattr(component, 'label', component.id)
                value = self.component_values[component.id]
                table.add_row(label, str(value))

        self.console.print(table)
