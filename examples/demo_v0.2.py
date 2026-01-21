# -*- coding: utf-8 -*-
"""genui v0.2 示例 - 展示交互功能改进"""

from genui import UIGenerator, Renderer


def main():
    """示例: 使用改进的交互功能生成计算器"""

    description = """
创建一个功能完整的计算器应用:
1. 两个输入框用于输入数字
2. 一个下拉框选择运算符(+, -, *, /)
3. 一个标签显示计算结果
4. 一个"计算"按钮执行计算
5. 一个"清空"按钮清除所有输入

要求:
- 点击计算按钮后，从输入框获取数字，从下拉框获取运算符，进行计算，并在结果标签中显示
- 如果输入无效（不是数字），显示错误信息
- 如果除数为0，显示错误信息
- 点击清空按钮后，清除所有输入和结果
- 使用便捷函数 get_value() 和 set_value() 来操作组件
"""

    print("=" * 70)
    print("genui v0.2 - 交互功能改进示例")
    print("=" * 70)
    print()
    print("描述:")
    print(description)
    print()

    # 创建生成器
    generator = UIGenerator()

    # 生成UI实例
    print("正在调用LLM生成完整可交互的UI...")
    print("(LLM 将使用改进的提示词，生成真实的交互逻辑)")
    print()

    try:
        ui_instance = generator.generate(description)

        print(f"✓ 生成成功!")
        print(f"  窗口标题: {ui_instance.title}")
        print(f"  窗口大小: {ui_instance.width}x{ui_instance.height}")
        print(f"  事件处理函数: {len(ui_instance.event_handlers)} 个")
        print()

        # 显示生成的事件处理函数
        print("生成的事件处理函数:")
        print("-" * 70)
        for name, code in ui_instance.event_handlers.items():
            print(f"\n函数名: {name}")
            print("代码:")
            # 美化显示（替换\n为真实换行）
            formatted_code = code.replace('\\n', '\n')
            for line in formatted_code.split('\n'):
                print(f"  {line}")
        print("-" * 70)
        print()

        # 创建渲染器并显示
        print("正在渲染UI...")
        renderer = Renderer()
        renderer.render(ui_instance)

    except Exception as e:
        print(f"✗ 生成失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
