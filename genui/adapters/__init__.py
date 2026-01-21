# -*- coding: utf-8 -*-
"""UI框架适配器模块"""

from genui.adapters.base import AdapterBase
from genui.adapters.tkinter_adapter import TkinterAdapter

__all__ = [
    "AdapterBase",
    "TkinterAdapter",
]
