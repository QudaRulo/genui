# -*- coding: utf-8 -*-
"""LLM客户端, 支持OpenAI和Anthropic API"""

import os
from typing import Optional, Literal
from dotenv import load_dotenv
from genui.logger import get_logger

# 加载环境变量
load_dotenv()

logger = get_logger(__name__)


class LLMClient:
    """LLM客户端, 封装与大模型API的交互, 优先支持OpenAI兼容API"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[Literal["openai", "anthropic"]] = None
    ):
        """初始化LLM客户端

        Args:
            api_key: API密钥, 如果为None则从环境变量读取
            base_url: API基础URL, 用于兼容OpenAI的API, 如果为None则从环境变量读取
            model: 模型名称, 如果为None则使用默认模型
            provider: API提供商, "openai"或"anthropic", 如果为None则从环境变量读取或默认使用openai
        """
        # 确定使用的provider
        self.provider = provider or os.getenv("LLM_PROVIDER", "openai")
        logger.info(f"初始化LLM客户端, provider={self.provider}")
        
        if self.provider == "openai":
            self._init_openai(api_key, base_url, model)
        elif self.provider == "anthropic":
            self._init_anthropic(api_key, model)
        else:
            raise ValueError(f"不支持的provider: {self.provider}, 仅支持'openai'或'anthropic'")

    def _init_openai(
        self,
        api_key: Optional[str],
        base_url: Optional[str],
        model: Optional[str]
    ) -> None:
        """初始化OpenAI客户端"""
        from openai import OpenAI
        
        # 获取API密钥
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.error("未找到OPENAI_API_KEY")
            raise ValueError(
                "未找到OPENAI_API_KEY, 请设置环境变量或传入api_key参数"
            )

        # 获取base_url, 支持兼容OpenAI的API
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL")
        
        # 创建客户端
        if self.base_url:
            logger.info(f"使用自定义base_url: {self.base_url}")
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        else:
            logger.info("使用默认OpenAI API")
            self.client = OpenAI(api_key=self.api_key)
        
        # 设置默认模型
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
        logger.info(f"使用模型: {self.model}")

    def _init_anthropic(
        self,
        api_key: Optional[str],
        model: Optional[str]
    ) -> None:
        """初始化Anthropic客户端"""
        try:
            from anthropic import Anthropic
        except ImportError:
            logger.error("未安装anthropic库")
            raise ImportError(
                "使用Anthropic需要安装anthropic库, "
                "请运行: uv sync --extra anthropic"
            )
        
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            logger.error("未找到ANTHROPIC_API_KEY")
            raise ValueError(
                "未找到ANTHROPIC_API_KEY, 请设置环境变量或传入api_key参数"
            )

        self.client = Anthropic(api_key=self.api_key)
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        logger.info(f"使用Anthropic模型: {self.model}")

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
        logger.info(f"开始生成UI配置, 描述: {user_description[:50]}...")
        
        if self.provider == "openai":
            return self._generate_openai(user_description, system_prompt)
        elif self.provider == "anthropic":
            return self._generate_anthropic(user_description, system_prompt)
        else:
            raise ValueError(f"不支持的provider: {self.provider}")

    def _generate_openai(
        self,
        user_description: str,
        system_prompt: str
    ) -> str:
        """使用OpenAI API生成配置"""
        try:
            logger.debug(f"调用OpenAI API, model={self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_description}
                ],
                temperature=0.7,
                max_tokens=4096
            )
            
            result = response.choices[0].message.content
            logger.info(f"成功生成UI配置, 长度: {len(result)}")
            logger.debug(f"生成内容: {result[:200]}...")
            return result
            
        except Exception as e:
            logger.error(f"调用OpenAI API失败: {e}", exc_info=True)
            raise RuntimeError(f"调用OpenAI API失败: {e}")

    def _generate_anthropic(
        self,
        user_description: str,
        system_prompt: str
    ) -> str:
        """使用Anthropic API生成配置"""
        try:
            logger.debug(f"调用Anthropic API, model={self.model}")
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
            logger.info(f"成功生成UI配置, 长度: {len(response_text)}")
            logger.debug(f"生成内容: {response_text[:200]}...")
            return response_text

        except Exception as e:
            logger.error(f"调用Anthropic API失败: {e}", exc_info=True)
            raise RuntimeError(f"调用Anthropic API失败: {e}")

    async def generate_ui_config(
        self,
        user_description: str,
        system_prompt: str
    ) -> str:
        """异步版本的UI配置生成

        Args:
            user_description: 用户对UI的描述
            system_prompt: 系统提示词, 包含可用组件说明和输出格式要求

        Returns:
            LLM生成的JSON格式UI配置字符串
        """
        # 当前使用同步版本, 后续可以添加真正的异步支持
        return self.generate_ui_config_sync(user_description, system_prompt)
