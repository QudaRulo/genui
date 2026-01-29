# -*- coding: utf-8 -*-
"""文件操作类 tools"""

import os
from pathlib import Path
from langchain_core.tools import tool


@tool
def read_text_file(file_path: str) -> str:
    """读取文本文件内容

    Args:
        file_path: 文件路径 (相对或绝对路径)

    Returns:
        文件内容

    Raises:
        FileNotFoundError: 文件不存在
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")

    if not path.is_file():
        raise ValueError(f"路径不是文件: {file_path}")

    return path.read_text(encoding="utf-8")


@tool
def list_directory(dir_path: str = ".") -> list:
    """列出目录内容

    Args:
        dir_path: 目录路径, 默认当前目录

    Returns:
        文件和目录名列表
    """
    path = Path(dir_path)
    if not path.exists():
        raise FileNotFoundError(f"目录不存在: {dir_path}")

    if not path.is_dir():
        raise ValueError(f"路径不是目录: {dir_path}")

    return [item.name for item in path.iterdir()]
