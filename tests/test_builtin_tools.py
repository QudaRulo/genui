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


def test_get_weather():
    """测试天气查询 (mock)"""
    from genui.tools.builtin.query import get_weather

    result = get_weather.invoke({"city": "北京"})
    assert isinstance(result, dict)
    assert "city" in result
    assert "weather" in result
    assert "temperature" in result


def test_get_current_time():
    """测试获取当前时间"""
    from genui.tools.builtin.query import get_current_time

    result = get_current_time.invoke({})
    assert isinstance(result, str)
    assert len(result) > 0


def test_read_text_file(tmp_path):
    """测试读取文件"""
    from genui.tools.builtin.file_ops import read_text_file

    # 创建测试文件
    test_file = tmp_path / "test.txt"
    test_file.write_text("Hello World", encoding="utf-8")

    result = read_text_file.invoke({"file_path": str(test_file)})
    assert result == "Hello World"


def test_list_directory(tmp_path):
    """测试列出目录"""
    from genui.tools.builtin.file_ops import list_directory

    # 创建测试文件
    (tmp_path / "file1.txt").write_text("", encoding="utf-8")
    (tmp_path / "file2.txt").write_text("", encoding="utf-8")
    (tmp_path / "subdir").mkdir()

    result = list_directory.invoke({"dir_path": str(tmp_path)})
    assert isinstance(result, list)
    assert len(result) == 3
    assert "file1.txt" in result
    assert "file2.txt" in result
    assert "subdir" in result
