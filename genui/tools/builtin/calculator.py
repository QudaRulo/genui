# -*- coding: utf-8 -*-
"""计算类 tools"""

import ast
import operator
from typing import Union, Dict, Any
from langchain_core.tools import tool


# 定义安全的运算符映射
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def _eval_expr(node: ast.AST) -> float:
    """安全地计算AST表达式

    Args:
        node: AST节点

    Returns:
        计算结果

    Raises:
        ValueError: 不支持的表达式类型
    """
    if isinstance(node, ast.Constant):
        return float(node.value)
    elif isinstance(node, ast.BinOp):
        left = _eval_expr(node.left)
        right = _eval_expr(node.right)
        op = OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"不支持的运算符: {type(node.op).__name__}")
        return op(left, right)
    elif isinstance(node, ast.UnaryOp):
        operand = _eval_expr(node.operand)
        op = OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"不支持的一元运算符: {type(node.op).__name__}")
        return op(operand)
    else:
        raise ValueError(f"不支持的表达式类型: {type(node).__name__}")


@tool
def calculate(expression: str) -> float:
    """计算数学表达式

    支持基本运算: +, -, *, /, ** (幂运算) 和括号

    Args:
        expression: 要计算的数学表达式

    Returns:
        计算结果
    """
    try:
        # 解析表达式为AST
        tree = ast.parse(expression, mode='eval')
        # 计算表达式
        result = _eval_expr(tree.body)
        return result
    except Exception as e:
        raise ValueError(f"无法计算表达式 '{expression}': {str(e)}")


# 单位转换定义
# 长度单位转换 (所有单位转换为米)
LENGTH_UNITS = {
    "m": 1.0,
    "km": 1000.0,
    "mile": 1609.34,
    "ft": 0.3048,
    "inch": 0.0254,
}

# 温度单位
TEMPERATURE_UNITS = {"celsius", "fahrenheit", "kelvin"}


def _convert_temperature(
    value: float,
    from_unit: str,
    to_unit: str
) -> float:
    """转换温度单位

    Args:
        value: 要转换的值
        from_unit: 源单位
        to_unit: 目标单位

    Returns:
        转换后的值
    """
    # 先转换到摄氏度
    if from_unit == "celsius":
        celsius = value
    elif from_unit == "fahrenheit":
        celsius = (value - 32) * 5 / 9
    elif from_unit == "kelvin":
        celsius = value - 273.15
    else:
        raise ValueError(f"不支持的温度单位: {from_unit}")

    # 再从摄氏度转换到目标单位
    if to_unit == "celsius":
        return celsius
    elif to_unit == "fahrenheit":
        return celsius * 9 / 5 + 32
    elif to_unit == "kelvin":
        return celsius + 273.15
    else:
        raise ValueError(f"不支持的温度单位: {to_unit}")


@tool
def convert_unit(value: float, from_unit: str, to_unit: str) -> float:
    """单位转换

    支持长度单位: m, km, mile, ft, inch
    支持温度单位: celsius, fahrenheit, kelvin

    Args:
        value: 要转换的值
        from_unit: 源单位
        to_unit: 目标单位

    Returns:
        转换后的值
    """
    # 统一转换为小写
    from_unit = from_unit.lower()
    to_unit = to_unit.lower()

    # 检查是否为温度单位
    if from_unit in TEMPERATURE_UNITS or to_unit in TEMPERATURE_UNITS:
        return _convert_temperature(value, from_unit, to_unit)

    # 检查是否为长度单位
    if from_unit in LENGTH_UNITS and to_unit in LENGTH_UNITS:
        # 先转换为米, 再转换为目标单位
        meters = value * LENGTH_UNITS[from_unit]
        result = meters / LENGTH_UNITS[to_unit]
        return result

    raise ValueError(
        f"不支持的单位转换: {from_unit} -> {to_unit}"
    )
