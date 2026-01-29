# -*- coding: utf-8 -*-
"""测试内置 tools"""

import pytest


def test_calculate_basic():
    """测试基本计算"""
    from genui.tools.builtin.calculator import calculate

    result = calculate.invoke({"expression": "2 + 3"})
    assert result == 5.0

    result = calculate.invoke({"expression": "10 * 5"})
    assert result == 50.0


def test_calculate_complex():
    """测试复杂表达式"""
    from genui.tools.builtin.calculator import calculate

    result = calculate.invoke({"expression": "2 + 3 * 4"})
    assert result == 14.0

    result = calculate.invoke({"expression": "(2 + 3) * 4"})
    assert result == 20.0


def test_convert_unit_length():
    """测试长度单位转换"""
    from genui.tools.builtin.calculator import convert_unit

    result = convert_unit.invoke({
        "value": 1.0,
        "from_unit": "km",
        "to_unit": "m"
    })
    assert result == 1000.0

    result = convert_unit.invoke({
        "value": 1.0,
        "from_unit": "mile",
        "to_unit": "km"
    })
    assert abs(result - 1.60934) < 0.001


def test_convert_unit_temperature():
    """测试温度单位转换"""
    from genui.tools.builtin.calculator import convert_unit

    result = convert_unit.invoke({
        "value": 0.0,
        "from_unit": "celsius",
        "to_unit": "fahrenheit"
    })
    assert result == 32.0

    result = convert_unit.invoke({
        "value": 100.0,
        "from_unit": "celsius",
        "to_unit": "fahrenheit"
    })
    assert result == 212.0
