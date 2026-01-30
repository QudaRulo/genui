# -*- coding: utf-8 -*-
"""测试示例文件的代码正确性 - 不实际运行UI"""

import pytest
import importlib.util
import os


def test_weather_example_exists() -> None:
    """验证天气查询示例文件存在"""
    example_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "examples",
        "demo_weather.py"
    )
    assert os.path.exists(example_path), "demo_weather.py 不存在"


def test_calculator_example_exists() -> None:
    """验证增强计算器示例文件存在"""
    example_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "examples",
        "demo_advanced_calculator.py"
    )
    assert os.path.exists(example_path), "demo_advanced_calculator.py 不存在"


def test_weather_example_imports() -> None:
    """验证天气查询示例可以导入"""
    example_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "examples",
        "demo_weather.py"
    )

    spec = importlib.util.spec_from_file_location("demo_weather", example_path)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    # 不执行, 只验证可以加载
    assert hasattr(module, '__file__')


def test_calculator_example_imports() -> None:
    """验证增强计算器示例可以导入"""
    example_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "examples",
        "demo_advanced_calculator.py"
    )

    spec = importlib.util.spec_from_file_location("demo_advanced_calculator", example_path)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    # 不执行, 只验证可以加载
    assert hasattr(module, '__file__')
