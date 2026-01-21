# -*- coding: utf-8 -*-
"""LLM客户端, 负责与Claude API交互"""

import os
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class LLMClient:
    """LLM客户端, 封装与Claude API的交互"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化LLM客户端

        Args:
            api_key: Anthropic API密钥, 如果为None则从环境变量读取
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("未找到ANTHROPIC_API_KEY, 请设置环境变量或传入api_key参数")

        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-3-5-sonnet-20241022"

    async def generate_ui_config(
        self,
        user_description: str,
        system_prompt: str
    ) -> str:
        """根据用户描述生成UI配置

        Args:
            user_description: 用户对UI的描述
            system_prompt: 系统提示词, 包含可用组件说明和输出格式要求

        Returns:
            LLM生成的JSON格式UI配置字符串
        """
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_description
                    }
                ]
            )

            # 提取回复内容
            response_text = message.content[0].text
            return response_text

        except Exception as e:
            raise RuntimeError(f"调用Claude API失败: {e}")

    def generate_ui_config_sync(
        self,
        user_description: str,
        system_prompt: str
    ) -> str:
        """同步版本的UI配置生成

        Args:
            user_description: 用户对UI的描述
            system_prompt: 系统提示词

        Returns:
            LLM生成的JSON格式UI配置字符串
        """
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_description
                    }
                ]
            )

            # 提取回复内容
            response_text = message.content[0].text
            return response_text

        except Exception as e:
            raise RuntimeError(f"调用Claude API失败: {e}")
