# -*- coding: utf-8 -*-
"""genui - 基于大模型的动态UI生成库"""

from genui.core import (
    Component,
    ComponentBase,
    Button,
    TextInput,
    Label,
    Container,
    Checkbox,
    RadioGroup,
    Dropdown,
    UIInstance,
)
from genui.generator import LLMClient, UIGenerator
from genui.renderer import Renderer
from genui.adapters import AdapterBase, TkinterAdapter

__version__ = "0.1.0"

__all__ = [
    # Core
    "Component",
    "ComponentBase",
    "Button",
    "TextInput",
    "Label",
    "Container",
    "Checkbox",
    "RadioGroup",
    "Dropdown",
    "UIInstance",
    # Generator
    "LLMClient",
    "UIGenerator",
    # Renderer
    "Renderer",
    # Adapters
    "AdapterBase",
    "TkinterAdapter",
]
