# -*- coding: utf-8 -*-
"""内置示例 tools"""

from typing import List
from langchain_core.tools import BaseTool
from genui.tools.builtin.calculator import calculate, convert_unit
from genui.tools.builtin.query import get_weather, get_current_time
from genui.tools.builtin.file_ops import read_text_file, list_directory


def get_all_builtin_tools() -> List[BaseTool]:
    """获取所有内置 tools

    Returns:
        内置 tools 列表
    """
    return [
        calculate,
        convert_unit,
        get_weather,
        get_current_time,
        read_text_file,
        list_directory,
    ]
