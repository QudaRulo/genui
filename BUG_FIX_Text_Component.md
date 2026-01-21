# Text 组件 Bug 修复说明

## 问题描述

用户报告在使用多行文本输入框（`multiline=true` 的 `TextInput`）时，点击按钮触发事件处理函数时出现错误：

```
TypeError: Text.get() missing 1 required positional argument: 'index1'
```

## 问题根源

### Tkinter 组件差异

在 Tkinter 中，文本输入有两种不同的 widget：

1. **Entry** (单行输入)
   - 使用 `widget.get()` 获取值（无参数）
   - 使用 `widget.delete(0, "end")` 清空
   - `TextInput` 组件的 `multiline=false` 时使用

2. **Text** (多行输入)
   - 使用 `widget.get("1.0", "end-1c")` 获取值（**需要两个参数**）
   - 使用 `widget.delete("1.0", "end")` 清空
   - `TextInput` 组件的 `multiline=true` 时使用

### 原始代码的问题

在 `genui/adapters/tkinter_adapter.py` 的 `get_value()` 函数中：

```python
def get_value(component_id: str) -> Any:
    widget = self.get_widget_by_id(component_id)
    if widget:
        if hasattr(widget, 'get'):
            return widget.get()  # ❌ 对 Text 组件会失败
```

这个实现对 `Entry` 组件有效，但对 `Text` 组件会失败，因为 `Text.get()` 必须提供起始和结束索引。

## 解决方案

### 修改的代码

更新 `get_value()` 函数，明确区分不同的 widget 类型：

```python
def get_value(component_id: str) -> Any:
    """获取widget值的便捷函数"""
    widget = self.get_widget_by_id(component_id)
    if widget:
        # 根据widget类型获取值
        if isinstance(widget, tk.Text):
            # Text组件需要指定范围
            return widget.get("1.0", "end-1c")
        elif isinstance(widget, (tk.Entry, ttk.Combobox)):
            # Entry和Combobox使用无参数get()
            return widget.get()
        elif isinstance(widget, tk.Label):
            # Label获取text属性
            return widget.cget('text')
        elif hasattr(widget, 'get'):
            # 其他有get方法的widget
            try:
                return widget.get()
            except TypeError:
                # 如果get()需要参数，返回None
                return None
    return None
```

### 优先级顺序

1. **Text** - 首先检查，使用特殊语法 `get("1.0", "end-1c")`
2. **Entry/Combobox** - 使用无参数 `get()`
3. **Label** - 使用 `cget('text')`
4. **其他** - 尝试调用 `get()`，如果失败则返回 None

## 更新的提示词

同时更新了 `genui/generator/ui_generator.py` 中的提示词：

### 1. 明确 TextInput 的两种模式

```
3. **TextInput** (文本输入框)
   必需: id, type="text_input"
   专属属性:
   - multiline: boolean (是否多行, 默认false)
     * multiline=false: 生成单行Entry组件
     * multiline=true: 生成多行Text组件
```

### 2. 更新 get_value() 说明

```
2. **get_value(component_id)** - 获取组件的值(便捷函数)
   - 自动根据组件类型获取值
   - 适用于Entry（单行输入）, Text（多行输入）, Label, Dropdown等
   - 对于multiline=true的TextInput，会自动处理Text组件的特殊语法
```

### 3. 添加使用示例

在"方式2 - 直接操作widget"中，明确说明不同组件的差异：

```python
# 获取Entry的值
widget = get_widget("input_id")
value = widget.get()

# 获取Text的值（多行输入框）
widget = get_widget("textarea_id")
value = widget.get("1.0", "end-1c")  # Text组件需要指定范围
```

并强调：**推荐使用方式1的便捷函数，它会自动处理不同组件类型的差异。**

## 测试验证

### 测试文件

创建了 `test_text_simple.py` 来验证修复：

```python
# 测试功能：
# 1. Count Lines - 使用 get_value() 读取 Text 组件
# 2. Clear - 使用 set_value() 清空 Text 组件
# 3. To Upper - 同时使用 get_value() 和 set_value()
```

### 测试结果

```
[INFO] 成功编译处理函数: handle_count
[INFO] 成功编译处理函数: handle_clear
[INFO] 成功编译处理函数: handle_upper
[INFO] 编译完成, 成功: 3/3

Count: 3 lines, 20 chars
Text cleared
Converted to uppercase
```

✅ **所有测试通过**，没有出现 `TypeError`。

## 影响的文件

### 核心修复
- `genui/adapters/tkinter_adapter.py` - 修复 `get_value()` 函数

### 提示词改进
- `genui/generator/ui_generator.py` - 更新文档和示例

### 测试文件
- `test_text_simple.py` - 简单测试（通过）
- `test_text_fix.py` - 完整测试（通过，但有编码问题）

## 使用建议

### 对于用户

使用 `get_value()` 和 `set_value()` 便捷函数，无需关心底层 widget 类型：

```python
# ✅ 推荐：使用便捷函数
text = get_value('editor')  # 自动处理 Entry 和 Text
set_value('editor', 'new text')  # 自动处理 Entry 和 Text

# ❌ 不推荐：直接操作 widget
widget = get_widget('editor')
if isinstance(widget, tk.Text):
    text = widget.get("1.0", "end-1c")
else:
    text = widget.get()
```

### 对于 LLM

LLM 生成的事件处理函数应该使用便捷函数：

```python
def handle_action():
    # 使用 get_value() - 自动处理所有类型
    text = get_value('input_id')

    # 处理文本
    processed = text.upper()

    # 使用 set_value() - 自动处理所有类型
    set_value('result_label', processed)
```

## 其他改进

### set_value() 函数

虽然 `set_value()` 之前就正确处理了 Text 组件，但为了一致性，也进行了代码审查：

```python
def set_value(component_id: str, value: Any) -> None:
    widget = self.get_widget_by_id(component_id)
    if widget:
        if isinstance(widget, tk.Entry):
            widget.delete(0, tk.END)
            widget.insert(0, str(value))
        elif isinstance(widget, tk.Text):
            widget.delete("1.0", tk.END)  # ✅ 已正确处理
            widget.insert("1.0", str(value))
        elif isinstance(widget, tk.Label):
            widget.config(text=str(value))
```

## 总结

### 修复前
- ❌ multiline=true 的 TextInput 无法使用 get_value()
- ❌ 点击按钮会报 TypeError
- ❌ 多行文本输入框实际不可用

### 修复后
- ✅ get_value() 自动识别 Entry 和 Text
- ✅ set_value() 正确处理所有类型
- ✅ 多行文本输入框完全可用
- ✅ 提示词更加清晰明确
- ✅ 用户体验更好

这个修复确保了 genui 库对单行和多行文本输入的完整支持，用户和 LLM 都可以使用统一的便捷函数，无需关心底层实现细节。
