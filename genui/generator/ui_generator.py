# -*- coding: utf-8 -*-
"""UI生成器, 使用LLM根据描述生成UI实例"""

import json
import re
from typing import Optional
from genui.core.ui_instance import UIInstance
from genui.generator.llm_client import LLMClient


class UIGenerator:
    """UI生成器, 负责将用户描述转换为UI实例"""

    # 系统提示词模板
    SYSTEM_PROMPT = """你是一个UI生成助手, 根据用户的描述生成UI界面配置.

你可以使用以下UI组件, **每个组件只能使用其专属的属性, 不能使用其他组件的属性**:

1. **Container** (容器组件, 用于包含其他组件)
   必需: id, type="container"
   专属属性:
   - layout: "vertical" | "horizontal" | "grid" (布局方式)
   - children: [] (子组件列表, 必须是数组)
   - padding: number (内边距, 默认10)
   - spacing: number (组件间距, 默认5)
   - width, height: number (可选)

2. **Button** (按钮)
   必需: id, type="button"
   专属属性:
   - text: string (按钮文本)
   - on_click: string (点击事件处理函数名, 可选)
   - enabled: boolean (是否启用, 默认true)
   - width, height: number (可选)

3. **TextInput** (文本输入框)
   必需: id, type="text_input"
   专属属性:
   - placeholder: string (占位符, 默认"")
   - default_value: string (默认值, 默认"")
   - multiline: boolean (是否多行, 默认false)
   - width, height: number (可选)

4. **Label** (文本标签)
   必需: id, type="label"
   专属属性:
   - text: string (标签文本)
   - font_size: number (字体大小, 默认12)
   - bold: boolean (是否加粗, 默认false)
   - color: string (颜色hex值, 可选)

5. **Checkbox** (复选框)
   必需: id, type="checkbox"
   专属属性:
   - label: string (标签)
   - checked: boolean (是否选中, 默认false)
   - on_change: string (状态变化事件, 可选)

6. **RadioGroup** (单选按钮组)
   必需: id, type="radio_group"
   专属属性:
   - label: string (组标签)
   - options: [] (选项列表, 必须是字符串数组)
   - selected: string (当前选中项, 可选)
   - on_change: string (变化事件, 可选)

7. **Dropdown** (下拉选择框)
   必需: id, type="dropdown"
   专属属性:
   - label: string (标签, 默认"")
   - options: [] (选项列表, 必须是字符串数组)
   - selected: string (当前选中项, 可选)
   - width: number (宽度, 可选)

**重要规则**:
1. 每个组件必须有 id 和 type 字段
2. type必须是: "container", "button", "text_input", "label", "checkbox", "radio_group", "dropdown" 之一
3. 只有Container组件才能有children属性, 其他组件不能有
4. 只有Container组件才能有layout, padding, spacing属性
5. 不要给组件添加它不支持的属性
6. 所有id必须唯一
7. 根组件通常应该是Container

输出格式 (JSON):
{
  "title": "窗口标题",
  "width": 600,
  "height": 400,
  "root": { 组件对象 },
  "event_handlers": {
    "函数名": "def 函数名():\\n    代码"
  }
}

**示例1 - 简单表单**:
{
  "title": "登录",
  "width": 400,
  "height": 300,
  "root": {
    "id": "main",
    "type": "container",
    "layout": "vertical",
    "children": [
      {
        "id": "title",
        "type": "label",
        "text": "用户登录",
        "font_size": 18,
        "bold": true
      },
      {
        "id": "username",
        "type": "text_input",
        "placeholder": "用户名"
      },
      {
        "id": "password",
        "type": "text_input",
        "placeholder": "密码"
      },
      {
        "id": "login_btn",
        "type": "button",
        "text": "登录",
        "on_click": "handle_login"
      }
    ]
  },
  "event_handlers": {
    "handle_login": "def handle_login():\\n    print('登录')"
  }
}

**示例2 - 包含下拉框**:
{
  "title": "选择器",
  "width": 400,
  "height": 200,
  "root": {
    "id": "main",
    "type": "container",
    "layout": "vertical",
    "children": [
      {
        "id": "city_label",
        "type": "label",
        "text": "选择城市"
      },
      {
        "id": "city_dropdown",
        "type": "dropdown",
        "label": "城市",
        "options": ["北京", "上海", "广州"],
        "selected": "北京"
      },
      {
        "id": "confirm_btn",
        "type": "button",
        "text": "确认"
      }
    ]
  },
  "event_handlers": {}
}

注意: 
- Dropdown组件只能有: id, type, label, options, selected, width
- Dropdown不能有children, layout, padding, spacing属性
- 只输出JSON, 不要有其他文字
"""

    def __init__(self, llm_client: Optional[LLMClient] = None):
        """初始化UI生成器

        Args:
            llm_client: LLM客户端实例, 如果为None则创建新实例
        """
        self.llm_client = llm_client or LLMClient()

    def generate(self, user_description: str) -> UIInstance:
        """根据用户描述生成UI实例

        Args:
            user_description: 用户对UI的描述

        Returns:
            生成的UI实例

        Raises:
            ValueError: 如果生成的配置无效
            RuntimeError: 如果LLM调用失败
        """
        # 调用LLM生成配置
        response = self.llm_client.generate_ui_config_sync(
            user_description=user_description,
            system_prompt=self.SYSTEM_PROMPT
        )

        # 提取JSON内容
        json_str = self._extract_json(response)

        # 解析JSON
        try:
            config_dict = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"无法解析LLM返回的JSON: {e}\n内容: {json_str}")

        # 转换为UIInstance
        try:
            ui_instance = UIInstance.model_validate(config_dict)
            return ui_instance
        except Exception as e:
            # 提供更友好的错误信息
            error_msg = f"生成的UI配置无效:\n{e}\n\n"
            error_msg += "常见问题:\n"
            error_msg += "1. Dropdown/Button/Label等组件不能有children/layout/padding/spacing属性\n"
            error_msg += "2. 只有Container组件才能包含children\n"
            error_msg += "3. 检查组件的type字段是否正确\n\n"
            error_msg += f"生成的配置:\n{json.dumps(config_dict, indent=2, ensure_ascii=False)}"
            raise ValueError(error_msg)

    def _extract_json(self, text: str) -> str:
        """从文本中提取JSON内容

        Args:
            text: 可能包含JSON的文本

        Returns:
            提取的JSON字符串
        """
        # 移除markdown代码块标记
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)

        # 尝试找到JSON对象
        text = text.strip()

        # 如果以{开头, 直接返回
        if text.startswith('{'):
            return text

        # 否则尝试查找第一个{和最后一个}之间的内容
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]

        return text
