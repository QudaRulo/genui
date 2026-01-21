# -*- coding: utf-8 -*-
"""简单的Text组件测试"""

from genui.core.ui_instance import UIInstance
from genui.core.component import Container, Button, Label, TextInput
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.renderer.renderer import Renderer


def main():
    """测试多行文本输入框的get_value和set_value"""

    ui_instance = UIInstance(
        title="Text Component Test",
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
                    text="Text Component Test",
                    font_size=16,
                    bold=True
                ),
                TextInput(
                    id="editor",
                    placeholder="Enter multiline text here...",
                    multiline=True,
                    width=400,
                    height=200,
                    default_value="Line 1\nLine 2\nLine 3"
                ),
                Label(
                    id="result",
                    text="Result will appear here",
                    font_size=12
                ),
                Container(
                    id="button_container",
                    layout="horizontal",
                    spacing=10,
                    children=[
                        Button(
                            id="count_btn",
                            text="Count Lines",
                            on_click="handle_count"
                        ),
                        Button(
                            id="clear_btn",
                            text="Clear",
                            on_click="handle_clear"
                        ),
                        Button(
                            id="upper_btn",
                            text="To Upper",
                            on_click="handle_upper"
                        )
                    ]
                )
            ]
        ),
        event_handlers={
            "handle_count": """def handle_count():
    text = get_value('editor')
    if text:
        line_count = len(text.split('\\n'))
        char_count = len(text)
        set_value('result', f'Lines: {line_count}, Chars: {char_count}')
        display(f'Count: {line_count} lines, {char_count} chars')
    else:
        set_value('result', 'Text is empty')
""",
            "handle_clear": """def handle_clear():
    set_value('editor', '')
    set_value('result', 'Cleared')
    display('Text cleared')
""",
            "handle_upper": """def handle_upper():
    text = get_value('editor')
    if text:
        upper_text = text.upper()
        set_value('editor', upper_text)
        set_value('result', 'Converted to uppercase')
        display('Converted to uppercase')
    else:
        set_value('result', 'Text is empty')
"""
        }
    )

    print("=" * 60)
    print("Text Component Fix Test")
    print("=" * 60)
    print()
    print("This test verifies that get_value() and set_value()")
    print("work correctly with multiline Text widgets.")
    print()
    print("Features to test:")
    print("1. Count Lines - uses get_value() on Text widget")
    print("2. Clear - uses set_value() on Text widget")
    print("3. To Upper - uses both get_value() and set_value()")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("UI rendered successfully!")
        print("Please test the buttons...")
        print()

        renderer.run_window(window)

        print("\nTest completed!")
        return True
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
