# -*- coding: utf-8 -*-
"""查询类 tools"""

from datetime import datetime
from langchain_core.tools import tool


@tool
def get_weather(city: str) -> dict:
    """获取城市天气 (mock 数据)

    Args:
        city: 城市名称

    Returns:
        天气信息字典: {"city": str, "weather": str, "temperature": float}
    """
    # Mock 数据
    weather_data = {
        "北京": {"weather": "晴", "temperature": 25.0},
        "上海": {"weather": "多云", "temperature": 28.0},
        "广州": {"weather": "雨", "temperature": 30.0},
        "深圳": {"weather": "雨", "temperature": 29.0},
    }

    weather = weather_data.get(
        city,
        {"weather": "晴", "temperature": 20.0}  # 默认值
    )

    return {
        "city": city,
        "weather": weather["weather"],
        "temperature": weather["temperature"]
    }


@tool
def get_current_time(timezone: str = "Asia/Shanghai") -> str:
    """获取当前时间

    Args:
        timezone: 时区, 默认 "Asia/Shanghai" (暂不支持自定义时区)

    Returns:
        格式化的时间字符串
    """
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")
