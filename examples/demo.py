# -*- coding: utf-8 -*-
"""genui 使用示例"""

from genui import UIGenerator, Renderer


def main():
    """示例: 生成一个简单的计算器界面"""
    # 用户描述
    description = "创建一个简单的计算器, 包含两个输入框用于输入数字, 一个下拉框选择运算符(加减乘除), 一个计算按钮, 一个标签显示结果"

    print("生成UI示例")
    print(f"描述: {description}")
    print()

    # 创建生成器
    generator = UIGenerator()

    # 生成UI实例
    print("正在调用LLM生成UI...")
    ui_instance = generator.generate(description)

    print(f"生成成功! 窗口标题: {ui_instance.title}")
    print()

    # 创建渲染器并显示
    renderer = Renderer()
    renderer.render(ui_instance)


if __name__ == "__main__":
    main()
