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

你可以使用以下UI组件:

1. **Button** (按钮)
   - text: 按钮文本
   - on_click: 点击事件处理函数名(可选)
   - enabled: 是否启用(默认true)
   - width, height: 尺寸(可选)

2. **TextInput** (文本输入框)
   - placeholder: 占位符
   - default_value: 默认值
   - multiline: 是否多行(默认false)
   - width, height: 尺寸(可选)

3. **Label** (文本标签)
   - text: 标签文本
   - font_size: 字体大小(默认12)
   - bold: 是否加粗(默认false)
   - color: 颜色hex值(可选)

4. **Container** (容器)
   - layout: 布局方式("vertical"垂直, "horizontal"水平, "grid"网格)
   - children: 子组件列表
   - padding: 内边距(默认10)
   - spacing: 组件间距(默认5)
   - width, height: 尺寸(可选)

5. **Checkbox** (复选框)
   - label: 标签
   - checked: 是否选中(默认false)
   - on_change: 状态变化事件处理函数名(可选)

6. **RadioGroup** (单选按钮组)
   - label: 组标签
   - options: 选项列表
   - selected: 当前选中项(可选)
   - on_change: 变化事件处理函数名(可选)

7. **Dropdown** (下拉选择框)
   - label: 标签
   - options: 选项列表
   - selected: 当前选中项(可选)
   - width: 宽度(可选)

每个组件必须有唯一的id字段和type字段(对应组件类型名的snake_case形式, 如button, text_input等).

如果组件需要事件处理, 在event_handlers字段中提供Python函数代码(使用def定义, 函数名要和组件中的on_click/on_change对应).

请以JSON格式输出, 包含以下字段:
- title: 窗口标题
- width: 窗口宽度(默认600)
- height: 窗口高度(默认400)
- root: 根组件(通常是Container)
- event_handlers: 事件处理函数字典(key为函数名, value为函数代码字符串)

**重要**:
1. 只输出JSON, 不要有任何其他文字
2. JSON要符合规范, 可以被正确解析
3. 组件的type字段使用snake_case, 如"button", "text_input", "radio_group"等
4. 确保所有组件都有唯一的id
5. 事件处理函数要是完整的Python函数定义, 包含def关键字

示例输出:
{
  "title": "计算器",
  "width": 400,
  "height": 300,
  "root": {
    "id": "main_container",
    "type": "container",
    "layout": "vertical",
    "children": [
      {
        "id": "display",
        "type": "label",
        "text": "0",
        "font_size": 24
      },
      {
        "id": "btn_calculate",
        "type": "button",
        "text": "计算",
        "on_click": "handle_calculate"
      }
    ]
  },
  "event_handlers": {
    "handle_calculate": "def handle_calculate():\\n    print('计算按钮被点击')"
  }
}
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
            raise ValueError(f"生成的UI配置无效: {e}\n配置: {config_dict}")

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
