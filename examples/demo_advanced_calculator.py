# -*- coding: utf-8 -*-
"""增强计算器示例 - 支持单位转换"""

from genui import UIGenerator, Renderer


def main() -> None:
    """示例: 生成一个增强计算器, 支持表达式计算和单位转换"""
    description = """创建一个增强计算器界面:
1. 表达式计算: 输入框输入数学表达式, 计算按钮, 显示结果
2. 单位转换: 输入数值, 选择源单位和目标单位, 转换按钮, 显示结果
支持的单位包括: km, m, mile (长度), celsius, fahrenheit (温度)
"""

    print("=== 增强计算器示例 ===")
    print(f"描述: {description}")
    print()

    generator = UIGenerator()

    print("正在生成UI...")
    ui_instance = generator.generate(description)

    print(f"生成成功! 窗口标题: {ui_instance.title}")
    print()

    renderer = Renderer()
    renderer.render(ui_instance)


if __name__ == "__main__":
    main()
