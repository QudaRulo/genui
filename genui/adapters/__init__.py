# -*- coding: utf-8 -*-
"""UI框架适配器模块"""

from genui.adapters.base import AdapterBase
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.adapters.ascii_adapter import ASCIIAdapter

__all__ = [
    "AdapterBase",
    "TkinterAdapter",
    "ASCIIAdapter",
]
