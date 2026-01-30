# -*- coding: utf-8 -*-
"""天气查询 UI 示例 - 演示 tools 集成"""

from genui import UIGenerator, Renderer


def main() -> None:
    """示例: 生成一个天气查询界面"""
    description = "创建一个天气查询界面, 包含一个输入框输入城市名称, 一个查询按钮, 一个标签显示天气结果"

    print("=== 天气查询 UI 示例 ===")
    print(f"描述: {description}")
    print()

    # 创建生成器
    generator = UIGenerator()

    # 生成UI实例
    print("正在生成UI...")
    ui_instance = generator.generate(description)

    print(f"生成成功! 窗口标题: {ui_instance.title}")
    print()

    # 渲染
    renderer = Renderer()
    renderer.render(ui_instance)


if __name__ == "__main__":
    main()
