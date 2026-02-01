# -*- coding: utf-8 -*-
"""genui CLI 入口程序"""

import argparse
import sys
import os
import logging
from typing import Optional

from genui import UIGenerator, Renderer, ToolRegistry
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


def print_banner():
    """打印欢迎横幅"""
    print("\n" + "=" * 60)
    print("  欢迎使用 genui - 动态UI生成工具 v0.4.0")
    print("  基于大模型, 根据描述生成可交互的界面")
    print("=" * 60 + "\n")


def select_adapter(adapter_name: Optional[str] = None) -> str:
    """选择适配器

    Args:
        adapter_name: 指定的适配器名称, 如果为None则交互式选择

    Returns:
        适配器名称
    """
    if adapter_name:
        if adapter_name.lower() in ["tkinter", "ascii"]:
            return adapter_name.lower()
        else:
            print(f"[警告] 未知的适配器 '{adapter_name}', 使用默认的 tkinter")
            return "tkinter"

    print("请选择适配器:")
    print("  [1] Tkinter (默认, 图形界面)")
    print("  [2] ASCII (终端界面)")

    while True:
        choice = input("选择 [1]: ").strip()

        if not choice or choice == "1":
            return "tkinter"
        elif choice == "2":
            return "ascii"
        else:
            print("无效选择, 请输入 1 或 2")


def create_adapter(adapter_name: str):
    """创建适配器实例

    Args:
        adapter_name: 适配器名称

    Returns:
        适配器实例
    """
    if adapter_name == "tkinter":
        return TkinterAdapter()
    elif adapter_name == "ascii":
        return ASCIIAdapter()
    else:
        raise ValueError(f"未知的适配器: {adapter_name}")


def interactive_mode(args: argparse.Namespace):
    """交互模式

    Args:
        args: 命令行参数
    """
    print_banner()

    # 选择适配器
    adapter_name = select_adapter(args.adapter)
    adapter = create_adapter(adapter_name)
    print(f"\n[信息] 使用适配器: {adapter_name}\n")

    # 创建生成器和渲染器
    tool_registry = ToolRegistry(load_builtin=True)
    generator = UIGenerator(tool_registry=tool_registry)
    renderer = Renderer(adapter=adapter)

    # 交互循环
    print("请输入UI描述 (输入 'quit' 或 'exit' 退出):\n")

    while True:
        try:
            # 获取用户输入
            description = input("> ").strip()

            if not description:
                continue

            # 检查退出命令
            if description.lower() in ["quit", "exit", "q"]:
                print("\n再见!")
                break

            # 生成UI
            print("\n[信息] 正在生成UI...")
            try:
                ui_instance = generator.generate(description)
                print(f"[信息] UI生成完成: {ui_instance.title}")
            except Exception as e:
                logger.error(f"UI生成失败: {e}")
                print(f"[错误] UI生成失败: {e}")
                print()
                continue

            # 渲染UI
            print("[信息] 正在渲染...\n")
            try:
                renderer.render(ui_instance)
                print("\n[信息] UI已关闭\n")
            except Exception as e:
                logger.error(f"UI渲染失败: {e}")
                print(f"[错误] UI渲染失败: {e}")
                print()
                continue

            # 继续或退出
            print("继续输入描述或输入 'quit' 退出:\n")

        except KeyboardInterrupt:
            print("\n\n收到中断信号, 退出...")
            break
        except Exception as e:
            logger.error(f"发生错误: {e}", exc_info=True)
            print(f"\n[错误] 发生错误: {e}\n")
            continue


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="genui - 基于大模型的动态UI生成工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  genui                          # 交互模式
  genui --adapter ascii          # 使用ASCII适配器
  genui --adapter tkinter        # 使用Tkinter适配器 (默认)

环境变量:
  OPENAI_API_KEY                 # OpenAI API密钥
  ANTHROPIC_API_KEY              # Anthropic API密钥 (可选)
        """
    )

    parser.add_argument(
        "--adapter",
        type=str,
        choices=["tkinter", "ascii"],
        help="指定适配器 (默认: tkinter)"
    )

    parser.add_argument(
        "--version",
        action="version",
        version="genui 0.4.0"
    )

    args = parser.parse_args()

    # 检查环境变量
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        print("[警告] 未设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY 环境变量")
        print("       请设置其中一个以使用LLM服务\n")

    # 运行交互模式
    interactive_mode(args)


if __name__ == "__main__":
    main()
