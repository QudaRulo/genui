# -*- coding: utf-8 -*-
"""LLM客户端, 支持OpenAI和Anthropic API, 使用LangChain框架"""

import os
from typing import Optional, Literal
from dotenv import load_dotenv
from genui.logger import get_logger

# 加载环境变量
load_dotenv()

logger = get_logger(__name__)


class LLMClient:
    """LLM客户端, 封装与大模型API的交互, 使用LangChain框架"""

    def __init__(
        self,
        model: Optional[str] = None,
        provider: Optional[Literal["openai", "anthropic"]] = None
    ):
        """初始化LLM客户端

        Args:
            model: 模型名称, 如果为None则使用默认模型
            provider: API提供商, "openai"或"anthropic", 如果为None则从环境变量读取或默认使用openai

        注意:
            API密钥和base_url从环境变量读取, LangChain会自动处理
            - OpenAI: OPENAI_API_KEY, OPENAI_BASE_URL (可选)
            - Anthropic: ANTHROPIC_API_KEY
        """
        # 确定使用的provider
        self.provider = provider or os.getenv("LLM_PROVIDER", "openai")
        logger.info(f"初始化LLM客户端, provider={self.provider}")

        if self.provider == "openai":
            self._init_openai(model)
        elif self.provider == "anthropic":
            self._init_anthropic(model)
        else:
            raise ValueError(f"不支持的provider: {self.provider}, 仅支持'openai'或'anthropic'")

    def _init_openai(
        self,
        model: Optional[str]
    ) -> None:
        """初始化OpenAI LangChain客户端"""
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            logger.error("未安装langchain-openai库")
            raise ImportError(
                "使用OpenAI需要安装langchain-openai库, "
                "请运行: uv sync"
            )

        # 检查API密钥
        if not os.getenv("OPENAI_API_KEY"):
            logger.error("未找到OPENAI_API_KEY")
            raise ValueError(
                "未找到OPENAI_API_KEY, 请设置环境变量"
            )

        # 设置默认模型
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
        logger.info(f"使用模型: {self.model}")

        # 获取base_url, 支持兼容OpenAI的API
        base_url = os.getenv("OPENAI_BASE_URL")

        # 创建LangChain客户端
        if base_url:
            logger.info(f"使用自定义base_url: {base_url}")
            self.llm = ChatOpenAI(
                model=self.model,
                base_url=base_url,
                temperature=0.7,
                max_tokens=4096
            )
        else:
            logger.info("使用默认OpenAI API")
            self.llm = ChatOpenAI(
                model=self.model,
                temperature=0.7,
                max_tokens=4096
            )

    def _init_anthropic(
        self,
        model: Optional[str]
    ) -> None:
        """初始化Anthropic LangChain客户端"""
        try:
            from langchain_anthropic import ChatAnthropic
        except ImportError:
            logger.error("未安装langchain-anthropic库")
            raise ImportError(
                "使用Anthropic需要安装langchain-anthropic库, "
                "请运行: uv sync --extra anthropic"
            )

        # 检查API密钥
        if not os.getenv("ANTHROPIC_API_KEY"):
            logger.error("未找到ANTHROPIC_API_KEY")
            raise ValueError(
                "未找到ANTHROPIC_API_KEY, 请设置环境变量"
            )

        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        logger.info(f"使用Anthropic模型: {self.model}")

        # 创建LangChain客户端
        self.llm = ChatAnthropic(
            model=self.model,
            temperature=0.7,
            max_tokens=4096
        )

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
        from langchain_core.messages import SystemMessage, HumanMessage

        logger.info(f"开始生成UI配置, 描述: {user_description[:50]}...")

        try:
            logger.debug(f"调用LLM API, model={self.model}, provider={self.provider}")

            # 使用LangChain的消息格式
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_description)
            ]

            # 调用LLM
            response = self.llm.invoke(messages)

            # 提取生成内容
            result = response.content
            logger.info(f"成功生成UI配置, 长度: {len(result)}")
            logger.debug(f"生成内容: {result[:200]}...")
            return result

        except Exception as e:
            logger.error(f"调用LLM API失败: {e}", exc_info=True)
            raise RuntimeError(f"调用LLM API失败: {e}")

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
