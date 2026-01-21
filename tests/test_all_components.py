# -*- coding: utf-8 -*-
"""测试所有组件的get_value和set_value支持"""

from genui.core.ui_instance import UIInstance
from genui.core.component import (
    Container, Button, Label, TextInput,
    Checkbox, RadioGroup, Dropdown
)
from genui.adapters.tkinter_adapter import TkinterAdapter
from genui.renderer.renderer import Renderer


def main():
    """测试所有UI组件的完整交互"""

    ui_instance = UIInstance(
        title="All Components Test",
        width=600,
        height=700,
        root=Container(
            id="root",
            layout="vertical",
            padding=20,
            spacing=10,
            children=[
                Label(
                    id="title",
                    text="All Components Interactive Test",
                    font_size=18,
                    bold=True
                ),

                # TextInput 单行
                Label(id="label_text", text="1. TextInput (Single Line):", bold=True),
                TextInput(
                    id="text_single",
                    placeholder="Enter text...",
                    default_value="Hello World"
                ),

                # TextInput 多行
                Label(id="label_multitext", text="2. TextInput (Multi Line):", bold=True),
                TextInput(
                    id="text_multi",
                    placeholder="Enter multi-line text...",
                    multiline=True,
                    width=500,
                    height=80,
                    default_value="Line 1\nLine 2"
                ),

                # Checkbox
                Label(id="label_checkbox", text="3. Checkbox:", bold=True),
                Checkbox(
                    id="checkbox_agree",
                    label="I agree to the terms",
                    checked=True
                ),

                # RadioGroup
                Label(id="label_radio", text="4. RadioGroup:", bold=True),
                RadioGroup(
                    id="radio_size",
                    label="Select Size",
                    options=["Small", "Medium", "Large"],
                    selected="Medium"
                ),

                # Dropdown
                Label(id="label_dropdown", text="5. Dropdown:", bold=True),
                Dropdown(
                    id="dropdown_color",
                    label="Select Color",
                    options=["Red", "Green", "Blue", "Yellow"],
                    selected="Green"
                ),

                # Result display
                Label(
                    id="result",
                    text="Result will appear here",
                    font_size=12
                ),

                # Buttons
                Container(
                    id="button_container",
                    layout="horizontal",
                    spacing=10,
                    children=[
                        Button(
                            id="read_btn",
                            text="Read All Values",
                            on_click="handle_read"
                        ),
                        Button(
                            id="modify_btn",
                            text="Modify All Values",
                            on_click="handle_modify"
                        ),
                        Button(
                            id="reset_btn",
                            text="Reset All",
                            on_click="handle_reset"
                        )
                    ]
                )
            ]
        ),
        event_handlers={
            "handle_read": """def handle_read():
    # Read all component values
    text_single = get_value('text_single')
    text_multi = get_value('text_multi')
    checkbox = get_value('checkbox_agree')
    radio = get_value('radio_size')
    dropdown = get_value('dropdown_color')

    result_text = f'''Current Values:
- Single Text: {text_single}
- Multi Text: {text_multi.replace(chr(10), ' / ')}
- Checkbox: {checkbox}
- Radio: {radio}
- Dropdown: {dropdown}'''

    set_value('result', result_text)
    display('All values read successfully')
    display(f'Checkbox is: {checkbox} (type: {type(checkbox).__name__})')
    display(f'Radio is: {radio}')
    display(f'Dropdown is: {dropdown}')
""",
            "handle_modify": """def handle_modify():
    # Modify all component values
    set_value('text_single', 'Modified Text!')
    set_value('text_multi', 'New Line 1\\nNew Line 2\\nNew Line 3')
    set_value('checkbox_agree', False)
    set_value('radio_size', 'Large')
    set_value('dropdown_color', 'Blue')

    set_value('result', 'All values have been modified!')
    display('All values modified successfully')
""",
            "handle_reset": """def handle_reset():
    # Reset to default values
    set_value('text_single', 'Hello World')
    set_value('text_multi', 'Line 1\\nLine 2')
    set_value('checkbox_agree', True)
    set_value('radio_size', 'Medium')
    set_value('dropdown_color', 'Green')

    set_value('result', 'All values reset to defaults!')
    display('Reset complete')
"""
        }
    )

    print("=" * 70)
    print("Complete Component Test Suite")
    print("=" * 70)
    print()
    print("This test verifies that get_value() and set_value() work")
    print("correctly with ALL component types:")
    print()
    print("  1. TextInput (single line) - Entry widget")
    print("  2. TextInput (multi line)  - Text widget")
    print("  3. Checkbox                - BooleanVar")
    print("  4. RadioGroup              - StringVar")
    print("  5. Dropdown                - StringVar")
    print()
    print("Features to test:")
    print("  - Read All Values: Display current values of all components")
    print("  - Modify All Values: Change all components to new values")
    print("  - Reset All: Reset all components to default values")
    print()

    adapter = TkinterAdapter()
    renderer = Renderer(adapter)

    try:
        window = renderer.render_to_window(ui_instance)
        print("UI rendered successfully!")
        print()
        print("Please test the following:")
        print("  1. Click 'Read All Values' to see current values")
        print("  2. Modify some values manually")
        print("  3. Click 'Read All Values' again to verify changes")
        print("  4. Click 'Modify All Values' to set new values")
        print("  5. Click 'Reset All' to restore defaults")
        print()

        renderer.run_window(window)

        print("\nTest completed successfully!")
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
