# -*- coding: utf-8 -*-
"""genui主程序入口"""

import sys
from genui.generator import UIGenerator
from genui.renderer import Renderer


def main() -> None:
    """主函数, 命令行入口"""
    print("=" * 50)
    print("欢迎使用 genui - 基于大模型的动态UI生成库")
    print("=" * 50)
    print()

    # 检查是否提供了描述参数
    if len(sys.argv) > 1:
        # 从命令行参数获取描述
        description = " ".join(sys.argv[1:])
    else:
        # 从标准输入获取描述
        print("请描述你想要生成的UI界面:")
        description = input("> ").strip()

    if not description:
        print("错误: 未提供UI描述")
        sys.exit(1)

    print()
    print(f"正在生成UI: {description}")
    print()

    try:
        # 创建生成器
        generator = UIGenerator()

        # 生成UI实例
        ui_instance = generator.generate(description)

        print("UI生成成功!")
        print(f"窗口标题: {ui_instance.title}")
        print(f"窗口大小: {ui_instance.width}x{ui_instance.height}")
        print(f"组件数量: {len(ui_instance.list_all_components())}")
        print()
        print("正在显示UI...")
        print()

        # 创建渲染器并显示
        renderer = Renderer()
        renderer.render(ui_instance)

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
