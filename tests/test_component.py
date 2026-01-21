# -*- coding: utf-8 -*-
"""测试核心组件"""

import pytest
from genui.core.component import (
    Button,
    TextInput,
    Label,
    Container,
    Checkbox,
    RadioGroup,
    Dropdown
)
from genui.core.ui_instance import UIInstance


def test_button_creation():
    """测试按钮组件创建"""
    button = Button(
        id="btn1",
        text="点击我",
        on_click="handle_click",
        enabled=True
    )
    assert button.id == "btn1"
    assert button.type == "button"
    assert button.text == "点击我"
    assert button.on_click == "handle_click"
    assert button.enabled is True


def test_text_input_creation():
    """测试文本输入框创建"""
    text_input = TextInput(
        id="input1",
        placeholder="请输入",
        default_value="默认值",
        multiline=False
    )
    assert text_input.id == "input1"
    assert text_input.type == "text_input"
    assert text_input.placeholder == "请输入"
    assert text_input.default_value == "默认值"
    assert text_input.multiline is False


def test_label_creation():
    """测试标签组件创建"""
    label = Label(
        id="label1",
        text="标签文本",
        font_size=14,
        bold=True
    )
    assert label.id == "label1"
    assert label.type == "label"
    assert label.text == "标签文本"
    assert label.font_size == 14
    assert label.bold is True


def test_container_creation():
    """测试容器组件创建"""
    label = Label(id="label1", text="测试")
    button = Button(id="btn1", text="按钮")

    container = Container(
        id="container1",
        layout="vertical",
        children=[label, button],
        padding=10,
        spacing=5
    )
    assert container.id == "container1"
    assert container.type == "container"
    assert container.layout == "vertical"
    assert len(container.children) == 2
    assert container.padding == 10
    assert container.spacing == 5


def test_checkbox_creation():
    """测试复选框组件创建"""
    checkbox = Checkbox(
        id="check1",
        label="同意条款",
        checked=False
    )
    assert checkbox.id == "check1"
    assert checkbox.type == "checkbox"
    assert checkbox.label == "同意条款"
    assert checkbox.checked is False


def test_radio_group_creation():
    """测试单选按钮组创建"""
    radio_group = RadioGroup(
        id="radio1",
        label="选择性别",
        options=["男", "女", "其他"],
        selected="男"
    )
    assert radio_group.id == "radio1"
    assert radio_group.type == "radio_group"
    assert radio_group.label == "选择性别"
    assert len(radio_group.options) == 3
    assert radio_group.selected == "男"


def test_dropdown_creation():
    """测试下拉框创建"""
    dropdown = Dropdown(
        id="dropdown1",
        label="选择城市",
        options=["北京", "上海", "广州"],
        selected="北京"
    )
    assert dropdown.id == "dropdown1"
    assert dropdown.type == "dropdown"
    assert dropdown.label == "选择城市"
    assert len(dropdown.options) == 3
    assert dropdown.selected == "北京"


def test_ui_instance_creation():
    """测试UI实例创建"""
    root = Container(
        id="root",
        layout="vertical",
        children=[
            Label(id="label1", text="欢迎"),
            Button(id="btn1", text="开始")
        ]
    )

    ui_instance = UIInstance(
        title="测试窗口",
        width=600,
        height=400,
        root=root,
        event_handlers={
            "handle_click": "def handle_click():\n    print('clicked')"
        }
    )

    assert ui_instance.title == "测试窗口"
    assert ui_instance.width == 600
    assert ui_instance.height == 400
    assert ui_instance.root.id == "root"
    assert len(ui_instance.event_handlers) == 1


def test_ui_instance_list_components():
    """测试列出所有组件"""
    root = Container(
        id="root",
        layout="vertical",
        children=[
            Label(id="label1", text="标题"),
            Button(id="btn1", text="按钮")
        ]
    )

    ui_instance = UIInstance(
        title="测试",
        root=root
    )

    components = ui_instance.list_all_components()
    # root + 2个子组件 = 3个
    assert len(components) == 3


def test_ui_instance_find_component():
    """测试根据ID查找组件"""
    root = Container(
        id="root",
        layout="vertical",
        children=[
            Label(id="label1", text="标题"),
            Button(id="btn1", text="按钮")
        ]
    )

    ui_instance = UIInstance(
        title="测试",
        root=root
    )

    # 查找存在的组件
    found = ui_instance.find_component_by_id("btn1")
    assert found is not None
    assert found.id == "btn1"

    # 查找不存在的组件
    not_found = ui_instance.find_component_by_id("nonexistent")
    assert not_found is None
