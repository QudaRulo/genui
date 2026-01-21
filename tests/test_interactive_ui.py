# -*- coding: utf-8 -*-
"""测试UI交互功能"""

from genui.core.ui_instance import UIInstance
from genui.core.component import Container, Button, Label, TextInput, Dropdown
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.renderer.renderer import Renderer


def test_calculator_with_helpers():
    """测试带便捷函数的计算器"""

    ui_instance = UIInstance(
        title="计算器测试 - 便捷函数",
        width=400,
        height=400,
        root=Container(
            id="root",
            layout="vertical",
            padding=20,
            spacing=10,
            children=[
                Label(
                    id="title",
                    text="简单计算器",
                    font_size=16,
                    bold=True
                ),
                TextInput(
                    id="num1_input",
                    placeholder="第一个数字",
                    default_value="10"
                ),
                Dropdown(
                    id="operator_dropdown",
                    label="运算符",
                    options=["+", "-", "*", "/"],
                    selected="+"
                ),
                TextInput(
                    id="num2_input",
                    placeholder="第二个数字",
                    default_value="5"
                ),
                Label(
                    id="result_label",
                    text="结果: (点击计算)",
                    font_size=14,
                    bold=True
                ),
                Container(
                    id="button_container",
                    layout="horizontal",
                    spacing=10,
                    children=[
                        Button(
                            id="calc_btn",
                            text="计算",
                            on_click="handle_calculate"
                        ),
                        Button(
                            id="clear_btn",
                            text="清空",
                            on_click="handle_clear"
                        )
                    ]
                )
            ]
        ),
        event_handlers={
            "handle_calculate": """def handle_calculate():
    try:
        num1 = float(get_value('num1_input'))
        num2 = float(get_value('num2_input'))
        operator = get_value('operator_dropdown')

        if operator == '+':
            result = num1 + num2
        elif operator == '-':
            result = num1 - num2
        elif operator == '*':
            result = num1 * num2
        elif operator == '/':
            if num2 != 0:
                result = num1 / num2
            else:
                set_value('result_label', '错误: 除数不能为0')
                display('除数为0')
                return
        else:
            result = '未知运算符'

        set_value('result_label', f'结果: {result}')
        display(f'计算完成: {num1} {operator} {num2} = {result}')
    except ValueError as e:
        set_value('result_label', '错误: 请输入有效数字')
        display(f'输入无效: {e}')
""",
            "handle_clear": """def handle_clear():
    set_value('num1_input', '')
    set_value('num2_input', '')
    set_value('result_label', '结果: (点击计算)')
    display('已清空所有输入')
"""
        }
    )

    print("=" * 60)
    print("测试场景: 计算器 - 使用便捷函数 (get_value/set_value)")
    print("=" * 60)
    print("功能说明:")
    print("1. 输入两个数字")
    print("2. 选择运算符 (+, -, *, /)")
    print("3. 点击'计算'按钮查看结果")
    print("4. 点击'清空'按钮清除所有输入")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("UI渲染成功")
        print("请测试交互功能...")
        print()

        renderer.run_window(window)

        print("\n测试完成!")
        return True
    except Exception as e:
        print(f"\n测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_form_validation():
    """测试表单验证"""

    ui_instance = UIInstance(
        title="表单验证测试",
        width=400,
        height=350,
        root=Container(
            id="root",
            layout="vertical",
            padding=20,
            spacing=10,
            children=[
                Label(
                    id="title",
                    text="用户注册",
                    font_size=16,
                    bold=True
                ),
                TextInput(
                    id="username",
                    placeholder="用户名 (至少3个字符)"
                ),
                TextInput(
                    id="email",
                    placeholder="邮箱"
                ),
                TextInput(
                    id="password",
                    placeholder="密码 (至少6个字符)"
                ),
                Label(
                    id="message_label",
                    text="",
                    font_size=12
                ),
                Button(
                    id="submit_btn",
                    text="提交注册",
                    on_click="handle_submit"
                )
            ]
        ),
        event_handlers={
            "handle_submit": """def handle_submit():
    username = get_value('username')
    email = get_value('email')
    password = get_value('password')

    # 验证
    errors = []

    if not username or len(username) < 3:
        errors.append('用户名至少3个字符')

    if not email or '@' not in email:
        errors.append('请输入有效邮箱')

    if not password or len(password) < 6:
        errors.append('密码至少6个字符')

    if errors:
        error_msg = '\\n'.join(errors)
        update_widget('message_label', text=f'验证失败:\\n{error_msg}', fg='red')
        display(f'验证失败: {error_msg}')
    else:
        update_widget('message_label', text=f'注册成功! 欢迎 {username}', fg='green')
        display(f'用户 {username} 注册成功')
        # 清空表单
        set_value('username', '')
        set_value('email', '')
        set_value('password', '')
"""
        }
    )

    print("=" * 60)
    print("测试场景: 表单验证 - 使用 update_widget 更新样式")
    print("=" * 60)
    print("功能说明:")
    print("1. 用户名至少3个字符")
    print("2. 邮箱必须包含@符号")
    print("3. 密码至少6个字符")
    print("4. 验证失败显示红色错误信息")
    print("5. 验证成功显示绿色成功信息并清空表单")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("UI渲染成功")
        print("请测试交互功能...")
        print()

        renderer.run_window(window)

        print("\n测试完成!")
        return True
    except Exception as e:
        print(f"\n测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys

    print("\n" + "=" * 60)
    print("UI 交互功能测试套件")
    print("=" * 60)
    print()

    tests = [
        ("计算器测试", test_calculator_with_helpers),
        ("表单验证测试", test_form_validation),
    ]

    results = []

    for name, test_func in tests:
        print(f"\n>>> 运行测试: {name}\n")
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"测试异常: {e}")
            results.append((name, False))

        print("\n" + "-" * 60)
        input("按Enter键继续下一个测试...")

    # 显示结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    for name, success in results:
        status = "PASS" if success else "FAIL"
        print(f"{name}: {status}")

    all_passed = all(success for _, success in results)
    print(f"\n总体结果: {'所有测试通过' if all_passed else '部分测试失败'}")

    sys.exit(0 if all_passed else 1)
