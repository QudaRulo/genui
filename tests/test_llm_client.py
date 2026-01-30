# -*- coding: utf-8 -*-
"""测试 LLMClient 迁移到 LangChain 后的功能"""

import os
import pytest
from genui.generator.llm_client import LLMClient


def test_llm_client_openai_init():
    """测试 OpenAI provider 初始化"""
    # 需要设置环境变量
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("需要 OPENAI_API_KEY")

    client = LLMClient(provider="openai")
    assert client.provider == "openai"
    assert hasattr(client, 'llm')


def test_llm_client_default_provider():
    """测试默认 provider"""
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("需要 OPENAI_API_KEY")

    # 清除环境变量中的 LLM_PROVIDER
    old_provider = os.getenv("LLM_PROVIDER")
    if old_provider:
        del os.environ["LLM_PROVIDER"]

    client = LLMClient()
    assert client.provider == "openai"

    # 恢复
    if old_provider:
        os.environ["LLM_PROVIDER"] = old_provider
