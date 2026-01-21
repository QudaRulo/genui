# -*- coding: utf-8 -*-
"""日志系统配置"""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(
    name: str = "genui",
    level: int = logging.INFO,
    log_file: Optional[str] = None
) -> logging.Logger:
    """配置并返回logger实例

    Args:
        name: logger名称
        level: 日志级别
        log_file: 日志文件路径(可选), 如果为None则只输出到控制台

    Returns:
        配置好的logger实例
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # 如果已经有handler, 不重复添加
    if logger.handlers:
        return logger

    # 创建格式化器
    formatter = logging.Formatter(
        '[%(asctime)s] %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 控制台handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 文件handler (如果指定)
    if log_file:
        # 确保日志目录存在
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


# 创建默认logger
default_logger = setup_logger()


def get_logger(name: str = "genui") -> logging.Logger:
    """获取logger实例

    Args:
        name: logger名称

    Returns:
        logger实例
    """
    return logging.getLogger(name)
