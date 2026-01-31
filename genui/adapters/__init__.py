# -*- coding: utf-8 -*-
"""UI框架适配器模块"""

from genui.adapters.base import AdapterBase
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.adapters.ascii_adapter import ASCIIAdapter
from genui.adapters.test_adapter import TestAdapter

__all__ = [
    "AdapterBase",
    "TkinterAdapter",
    "ASCIIAdapter",
    "TestAdapter",
]
