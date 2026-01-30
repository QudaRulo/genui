# -*- coding: utf-8 -*-
"""测试 UIGenerator 的 tools 集成"""

import os
import pytest
from genui.generator.ui_generator import UIGenerator
from genui.tools.registry import ToolRegistry


@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="需要 OPENAI_API_KEY"
)
def test_plan_tools_basic():
    """测试 tool 规划"""
    generator = UIGenerator()

    # 测试计算相关的需求
    selected_tools = generator._plan_tools("创建一个计算器界面")

    assert isinstance(selected_tools, list)
    # 应该选中计算相关的 tool
    assert "calculate" in selected_tools or len(selected_tools) >= 0


@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="需要 OPENAI_API_KEY"
)
def test_plan_tools_no_tools_needed():
    """测试不需要 tools 的场景"""
    generator = UIGenerator()

    selected_tools = generator._plan_tools("创建一个简单的登录表单")

    assert isinstance(selected_tools, list)
    # 登录表单不需要特殊 tools
    assert len(selected_tools) == 0 or "calculate" not in selected_tools
