# -*- coding: utf-8 -*-
"""测试Text组件的get_value修复"""

from genui.core.ui_instance import UIInstance
from genui.core.component import Container, Button, Label, TextInput
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.renderer.renderer import Renderer


def test_multiline_text():
    """测试多行文本输入框"""

    ui_instance = UIInstance(
        title="多行文本测试",
        width=500,
        height=400,
        root=Container(
            id="root",
            layout="vertical",
            padding=20,
            spacing=10,
            children=[
                Label(
                    id="title",
                    text="文本编辑器测试",
                    font_size=16,
                    bold=True
                ),
                TextInput(
                    id="editor",
                    placeholder="在这里输入多行文本...",
                    multiline=True,
                    width=400,
                    height=200,
                    default_value="这是第一行\n这是第二行\n这是第三行"
                ),
                Label(
                    id="char_count",
                    text="字符数: 0",
                    font_size=12
                ),
                Label(
                    id="line_count",
                    text="行数: 0",
                    font_size=12
                ),
                Container(
                    id="button_container",
                    layout="horizontal",
                    spacing=10,
                    children=[
                        Button(
                            id="count_btn",
                            text="统计",
                            on_click="handle_count"
                        ),
                        Button(
                            id="clear_btn",
                            text="清空",
                            on_click="handle_clear"
                        ),
                        Button(
                            id="shuffle_btn",
                            text="打乱行序",
                            on_click="handle_shuffle"
                        )
                    ]
                )
            ]
        ),
        event_handlers={
            "handle_count": """def handle_count():
    # 使用便捷函数获取多行文本
    text = get_value('editor')

    if text:
        char_count = len(text)
        line_count = len(text.split('\\n'))

        set_value('char_count', f'字符数: {char_count}')
        set_value('line_count', f'行数: {line_count}')
        display(f'统计完成: {char_count} 字符, {line_count} 行')
    else:
        set_value('char_count', '字符数: 0')
        set_value('line_count', '行数: 0')
        display('文本为空')
""",
            "handle_clear": """def handle_clear():
    set_value('editor', '')
    set_value('char_count', '字符数: 0')
    set_value('line_count', '行数: 0')
    display('已清空')
""",
            "handle_shuffle": """def handle_shuffle():
    import random
    text = get_value('editor')

    if text:
        lines = text.split('\\n')
        random.shuffle(lines)
        shuffled_text = '\\n'.join(lines)

        set_value('editor', shuffled_text)
        display('行序已打乱')
    else:
        display('文本为空，无法打乱')
"""
        }
    )

    print("=" * 60)
    print("测试场景: 多行文本输入框 (Text 组件)")
    print("=" * 60)
    print("功能说明:")
    print("1. 在多行文本框中输入内容")
    print("2. 点击'统计'按钮统计字符数和行数")
    print("3. 点击'清空'按钮清除所有内容")
    print("4. 点击'打乱行序'按钮随机打乱各行顺序")
    print()
    print("这个测试验证了 get_value() 和 set_value() 对 Text 组件的支持")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("✓ UI 渲染成功")
        print("✓ 多行文本输入框已创建")
        print()
        print("请测试以下功能:")
        print("- 在文本框中输入多行内容")
        print("- 点击'统计'查看字符数和行数")
        print("- 点击'打乱行序'测试 Text 组件的读写")
        print()

        renderer.run_window(window)

        print("\n✓ 测试完成!")
        return True
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_single_and_multiline():
    """测试单行和多行输入框"""

    ui_instance = UIInstance(
        title="单行/多行输入框对比测试",
        width=500,
        height=450,
        root=Container(
            id="root",
            layout="vertical",
            padding=20,
            spacing=10,
            children=[
                Label(
                    id="title",
                    text="输入框类型对比",
                    font_size=16,
                    bold=True
                ),
                Label(
                    id="label1",
                    text="单行输入框 (Entry):",
                    font_size=12,
                    bold=True
                ),
                TextInput(
                    id="single_input",
                    placeholder="单行文本...",
                    multiline=False,
                    default_value="这是单行输入"
                ),
                Label(
                    id="label2",
                    text="多行输入框 (Text):",
                    font_size=12,
                    bold=True
                ),
                TextInput(
                    id="multi_input",
                    placeholder="多行文本...",
                    multiline=True,
                    width=400,
                    height=100,
                    default_value="这是多行输入\n可以有很多行\n第三行"
                ),
                Label(
                    id="result",
                    text="结果显示区域",
                    font_size=12
                ),
                Button(
                    id="copy_btn",
                    text="复制多行到单行",
                    on_click="handle_copy"
                ),
                Button(
                    id="reverse_btn",
                    text="反转多行文本",
                    on_click="handle_reverse"
                )
            ]
        ),
        event_handlers={
            "handle_copy": """def handle_copy():
    # 从多行文本框获取内容
    multi_text = get_value('multi_input')

    # 将换行符替换为空格
    single_text = multi_text.replace('\\n', ' ')

    # 设置到单行输入框
    set_value('single_input', single_text)
    set_value('result', f'已复制 {len(multi_text)} 个字符')
    display('复制完成')
""",
            "handle_reverse": """def handle_reverse():
    # 获取多行文本
    text = get_value('multi_input')

    if text:
        # 按行反转
        lines = text.split('\\n')
        reversed_lines = lines[::-1]
        reversed_text = '\\n'.join(reversed_lines)

        # 设置回去
        set_value('multi_input', reversed_text)
        set_value('result', f'已反转 {len(lines)} 行')
        display(f'反转完成: {len(lines)} 行')
    else:
        set_value('result', '多行文本为空')
        display('文本为空')
"""
        }
    )

    print("=" * 60)
    print("测试场景: 单行/多行输入框对比")
    print("=" * 60)
    print("功能说明:")
    print("1. multiline=False 生成 Entry (单行)")
    print("2. multiline=True 生成 Text (多行)")
    print("3. get_value() 自动处理两种类型")
    print("4. set_value() 自动处理两种类型")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("✓ UI 渲染成功")
        print()
        print("请测试以下功能:")
        print("- 在两个输入框中输入不同内容")
        print("- 点击'复制多行到单行'")
        print("- 点击'反转多行文本'")
        print()

        renderer.run_window(window)

        print("\n✓ 测试完成!")
        return True
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys

    print("\n" + "=" * 60)
    print("Text 组件修复验证测试")
    print("=" * 60)
    print()

    tests = [
        ("多行文本编辑器", test_multiline_text),
        ("单行/多行对比", test_single_and_multiline),
    ]

    results = []

    for name, test_func in tests:
        print(f"\n>>> 运行测试: {name}\n")
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"测试异常: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

        if name != tests[-1][0]:  # 不是最后一个测试
            print("\n" + "-" * 60)
            input("按Enter键继续下一个测试...")

    # 显示结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{name}: {status}")

    all_passed = all(success for _, success in results)
    print(f"\n总体结果: {'✓ 所有测试通过' if all_passed else '✗ 部分测试失败'}")

    sys.exit(0 if all_passed else 1)
