# genui v0.2 使用指南

## 新功能概览

v0.2 版本在 v0.1 基础上大幅增强了 UI 交互功能，现在可以生成**完全可交互**的用户界面。

## 快速开始

### 基本用法（与 v0.1 相同）

```python
from genui import UIGenerator, Renderer

# 描述你想要的UI
description = "创建一个计算器，包含两个输入框、一个下拉框选择运算符、一个计算按钮和一个结果标签"

# 生成UI
generator = UIGenerator()
ui_instance = generator.generate(description)

# 显示UI
renderer = Renderer()
renderer.render(ui_instance)
```

## v0.2 新特性

### 1. 完整的交互支持

现在生成的UI包含**真实的交互逻辑**，而不只是简单的占位代码。

**v0.1 生成的代码**:
```python
def handle_login():
    print('登录')  # 只是占位代码
```

**v0.2 生成的代码**:
```python
def handle_login():
    username = get_value('username')
    password = get_value('password')

    if username and password:
        set_value('result_label', f'欢迎, {username}!')
        display(f'用户 {username} 登录成功')
    else:
        set_value('result_label', '请填写用户名和密码')
```

### 2. 便捷函数

v0.2 提供了多个便捷函数，让事件处理代码更简洁：

#### `get_value(component_id)` - 获取组件值
```python
# 自动识别组件类型并获取值
username = get_value('username_input')
selected_option = get_value('dropdown')
```

#### `set_value(component_id, value)` - 设置组件值
```python
# 自动识别组件类型并设置值
set_value('result_label', '操作成功')
set_value('input_box', '')  # 清空输入框
```

#### `update_widget(component_id, **kwargs)` - 更新组件属性
```python
# 更新任意属性
update_widget('error_label', text='错误信息', fg='red', font=('Arial', 12))
update_widget('success_label', text='成功', fg='green')
```

#### `display(message)` - 显示消息
```python
# 在控制台显示消息并记录到日志
display('计算完成')
```

#### `get_widget(component_id)` - 获取原始 widget
```python
# 直接操作 Tkinter widget（高级用法）
widget = get_widget('input_id')
widget.config(state='disabled')
```

### 3. 更智能的提示

在描述UI时，可以明确要求交互行为：

```python
description = """
创建一个表单验证应用:
- 用户名输入框（至少3个字符）
- 邮箱输入框（必须包含@）
- 密码输入框（至少6个字符）
- 提交按钮，点击后验证所有输入
- 如果验证失败，显示红色错误信息
- 如果验证成功，显示绿色成功信息并清空表单
"""
```

LLM 会生成包含完整验证逻辑的代码。

## 实用示例

### 示例1: 计算器

```python
from genui import UIGenerator, Renderer

description = """
创建计算器:
- 两个数字输入框
- 运算符下拉框(+, -, *, /)
- 计算按钮：获取两个数字和运算符，计算结果，显示在结果标签
- 清空按钮：清除所有输入和结果
- 处理错误情况（无效输入、除以0）
"""

generator = UIGenerator()
ui = generator.generate(description)

renderer = Renderer()
renderer.render(ui)
```

### 示例2: 表单验证

```python
description = """
创建注册表单:
- 用户名输入框
- 邮箱输入框
- 密码输入框
- 提交按钮：
  * 验证用户名至少3个字符
  * 验证邮箱包含@符号
  * 验证密码至少6个字符
  * 如果验证失败，在消息标签显示红色错误信息
  * 如果验证成功，显示绿色成功信息并清空表单
"""

generator = UIGenerator()
ui = generator.generate(description)

renderer = Renderer()
renderer.render(ui)
```

### 示例3: 待办事项列表

```python
description = """
创建待办事项应用:
- 任务输入框
- 添加按钮：获取输入框内容，显示在下方的任务标签中，清空输入框
- 任务标签：显示当前任务
- 完成按钮：清除任务标签内容
"""

generator = UIGenerator()
ui = generator.generate(description)

renderer = Renderer()
renderer.render(ui)
```

## 运行示例

项目包含多个示例文件：

```bash
# 基础示例（v0.1）
uv run python examples/demo.py

# v0.2 交互示例
uv run python examples/demo_v0.2.py

# 测试交互功能
uv run python test_interactive_ui.py

# 测试 display 函数
uv run python test_display_fix.py
```

## 日志查看

v0.2 自动创建日志文件，记录所有操作：

```bash
# 查看最新日志
ls -lt logs/ | head -n 5

# 查看日志内容
cat logs/2026-01-21T23-01-11-296038.log
```

日志包含：
- 适配器初始化
- 事件处理函数编译过程
- 所有 display() 调用
- 编译错误和详细代码

## 编写描述的最佳实践

### 1. 明确交互行为

❌ 不好的描述:
```
创建一个计算器，有输入框和按钮
```

✓ 好的描述:
```
创建计算器:
- 两个输入框输入数字
- 下拉框选择运算符
- 计算按钮：获取输入，计算结果，显示在结果标签
- 清空按钮：清除所有输入
```

### 2. 指定错误处理

❌ 不好的描述:
```
点击按钮进行计算
```

✓ 好的描述:
```
点击计算按钮:
- 获取两个数字和运算符
- 如果输入无效，显示"错误: 请输入有效数字"
- 如果除数为0，显示"错误: 除数不能为0"
- 否则显示计算结果
```

### 3. 说明UI反馈

❌ 不好的描述:
```
验证表单输入
```

✓ 好的描述:
```
验证表单:
- 检查用户名、邮箱、密码
- 如果验证失败，在消息标签显示红色错误信息
- 如果验证成功，显示绿色"注册成功"并清空表单
```

## 技术细节

### 事件处理函数执行环境

LLM 生成的事件处理函数在受控环境中执行，可以访问：

**工具函数**:
- `get_value(id)` - 获取组件值
- `set_value(id, value)` - 设置组件值
- `update_widget(id, **kwargs)` - 更新组件属性
- `get_widget(id)` - 获取原始 widget
- `display(msg)` - 显示消息
- `print(msg)` - 标准输出

**Tkinter 常量**:
- `tk` - tkinter 模块
- `END` - tk.END
- `NORMAL` - tk.NORMAL
- `DISABLED` - tk.DISABLED

**Python 内置**:
- `str`, `int`, `float`, `bool`
- `len`, `range`
- 所有标准内置函数

### 组件ID访问

每个组件都有唯一的 ID，通过 ID 访问组件：

```python
# 在 UI 配置中
{
  "id": "username_input",
  "type": "text_input",
  "placeholder": "用户名"
}

# 在事件处理函数中
username = get_value('username_input')
```

## 故障排除

### 问题: UI 显示但按钮点击无反应

**原因**: LLM 可能生成了简单的占位代码

**解决**: 在描述中明确要求交互行为，例如：
```
点击按钮后，必须获取输入框的值，进行计算，并更新结果标签
```

### 问题: 提示 NameError

**原因**: 使用了未定义的变量或函数

**解决**: 确保只使用允许的函数（`get_value`、`set_value` 等）

### 问题: 日志文件过多

**解决**: 定期清理 logs 目录
```bash
rm logs/*.log
```

## 更多信息

- 查看 `CHANGELOG_v0.2.md` 了解详细的改进内容
- 查看 `test_interactive_ui.py` 了解完整的测试用例
- 查看 `genui/generator/ui_generator.py` 了解提示词详情

## 版本对比

| 功能 | v0.1 | v0.2 |
|------|------|------|
| UI 展示 | ✓ | ✓ |
| 基本交互 | ✗ | ✓ |
| 便捷函数 | ✗ | ✓ |
| 完整示例 | ✗ | ✓ |
| 错误处理 | ✗ | ✓ |
| 日志记录 | 基础 | 完整 |
| 提示词质量 | 简单 | 详细 |

v0.2 是一个**功能完整**的版本，可以生成真正可用的交互式UI！
