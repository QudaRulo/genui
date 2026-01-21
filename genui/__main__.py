# -*- coding: utf-8 -*-
"""genui主程序入口"""

import sys
import os
import logging
import argparse
from genui.generator import UIGenerator
from genui.renderer import Renderer
from genui.adapters import TkinterAdapter, ASCIIAdapter
from genui.logger import setup_logger, get_logger

# 配置日志级别 (可通过环境变量控制)
log_level = os.getenv("GENUI_LOG_LEVEL", "INFO").upper()
level_map = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR
}
setup_logger(level=level_map.get(log_level, logging.INFO))

logger = get_logger(__name__)


def main() -> None:
    """主函数, 命令行入口"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(
        description="genui - 基于大模型的动态UI生成库"
    )
    parser.add_argument(
        "description",
        nargs="?",
        help="UI描述 (如果不提供, 将从stdin读取)"
    )
    parser.add_argument(
        "--ui-mode",
        choices=["tkinter", "ascii"],
        default="tkinter",
        help="UI渲染模式: tkinter(图形界面) 或 ascii(终端界面), 默认为tkinter"
    )

    args = parser.parse_args()

    print("=" * 50)
    print("欢迎使用 genui - 基于大模型的动态UI生成库")
    print("=" * 50)
    print()

    logger.info("genui程序启动")
    logger.info(f"UI模式: {args.ui_mode}")

    # 获取UI描述
    if args.description:
        # 从命令行参数获取描述
        description = args.description
        logger.info(f"从命令行参数获取描述: {description}")
    else:
        # 从标准输入获取描述
        print("请描述你想要生成的UI界面:")
        description = input("> ").strip()
        logger.info(f"从用户输入获取描述: {description}")

    if not description:
        logger.error("用户未提供UI描述")
        print("错误: 未提供UI描述")
        sys.exit(1)

    print()
    print(f"正在生成UI: {description}")
    print()

    try:
        # 创建生成器
        logger.info("创建UIGenerator")
        generator = UIGenerator()

        # 生成UI实例
        logger.info("开始生成UI实例")
        ui_instance = generator.generate(description)

        print("UI生成成功!")
        print(f"窗口标题: {ui_instance.title}")
        print(f"窗口大小: {ui_instance.width}x{ui_instance.height}")
        print(f"组件数量: {len(ui_instance.list_all_components())}")
        print()
        print("正在显示UI...")
        print()

        logger.info(f"UI生成成功: {ui_instance.title}, 组件数: {len(ui_instance.list_all_components())}")

        # 根据ui-mode选择适配器
        if args.ui_mode == "ascii":
            logger.info("使用ASCII适配器")
            adapter = ASCIIAdapter()
        else:
            logger.info("使用Tkinter适配器")
            adapter = TkinterAdapter()

        # 创建渲染器并显示
        logger.info("创建渲染器并显示UI")
        renderer = Renderer(adapter=adapter)
        renderer.render(ui_instance)

        logger.info("UI已关闭, 程序退出")

    except Exception as e:
        logger.error(f"程序运行出错: {e}", exc_info=True)
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
