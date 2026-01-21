# -*- coding: utf-8 -*-
"""UI组件抽象层, 定义各种UI组件的抽象表示"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class ComponentBase(BaseModel, ABC):
    """UI组件基类, 所有组件都继承此类"""

    id: str = Field(description="组件唯一标识符")
    type: str = Field(description="组件类型")

    class Config:
        """Pydantic配置"""
        extra = "forbid"


class Button(ComponentBase):
    """按钮组件"""

    type: Literal["button"] = "button"
    text: str = Field(description="按钮文本")
    on_click: Optional[str] = Field(
        default=None,
        description="点击事件处理函数名称"
    )
    enabled: bool = Field(default=True, description="是否启用")
    width: Optional[int] = Field(default=None, description="宽度(像素)")
    height: Optional[int] = Field(default=None, description="高度(像素)")


class TextInput(ComponentBase):
    """文本输入框组件"""

    type: Literal["text_input"] = "text_input"
    placeholder: str = Field(default="", description="占位符文本")
    default_value: str = Field(default="", description="默认值")
    multiline: bool = Field(default=False, description="是否多行输入")
    width: Optional[int] = Field(default=None, description="宽度(像素)")
    height: Optional[int] = Field(default=None, description="高度(像素)")


class Label(ComponentBase):
    """文本标签组件"""

    type: Literal["label"] = "label"
    text: str = Field(description="标签文本")
    font_size: int = Field(default=12, description="字体大小")
    bold: bool = Field(default=False, description="是否加粗")
    color: Optional[str] = Field(default=None, description="文本颜色(hex)")


class Container(ComponentBase):
    """容器组件, 可包含其他组件"""

    type: Literal["container"] = "container"
    layout: Literal["vertical", "horizontal", "grid"] = Field(
        default="vertical",
        description="布局方式: vertical(垂直), horizontal(水平), grid(网格)"
    )
    children: List["Component"] = Field(
        default_factory=list,
        description="子组件列表"
    )
    padding: int = Field(default=10, description="内边距(像素)")
    spacing: int = Field(default=5, description="组件间距(像素)")
    width: Optional[int] = Field(default=None, description="宽度(像素)")
    height: Optional[int] = Field(default=None, description="高度(像素)")


class Checkbox(ComponentBase):
    """复选框组件"""

    type: Literal["checkbox"] = "checkbox"
    label: str = Field(description="复选框标签")
    checked: bool = Field(default=False, description="是否选中")
    on_change: Optional[str] = Field(
        default=None,
        description="状态变化事件处理函数"
    )


class RadioGroup(ComponentBase):
    """单选按钮组组件"""

    type: Literal["radio_group"] = "radio_group"
    label: str = Field(description="单选组标签")
    options: List[str] = Field(description="选项列表")
    selected: Optional[str] = Field(default=None, description="当前选中项")
    on_change: Optional[str] = Field(
        default=None,
        description="选择变化事件处理函数"
    )


class Dropdown(ComponentBase):
    """下拉选择框组件"""

    type: Literal["dropdown"] = "dropdown"
    label: str = Field(default="", description="下拉框标签")
    options: List[str] = Field(description="选项列表")
    selected: Optional[str] = Field(default=None, description="当前选中项")
    width: Optional[int] = Field(default=None, description="宽度(像素)")


# 定义组件联合类型
Component = Union[
    Button,
    TextInput,
    Label,
    Container,
    Checkbox,
    RadioGroup,
    Dropdown
]

# 更新Container的forward reference
Container.model_rebuild()
