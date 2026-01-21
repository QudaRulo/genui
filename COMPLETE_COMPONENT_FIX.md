# 所有组件的 get_value/set_value 全面修复

## 修复概述

全面修复了所有 UI 组件的 `get_value()` 和 `set_value()` 支持，确保每个组件都能正确地读取和设置值。

## 修复的组件

### 1. **TextInput** ✅
- **单行输入** (multiline=false): Entry widget
  - `get_value()`: 返回文本字符串
  - `set_value()`: 设置文本内容
- **多行输入** (multiline=true): Text widget
  - `get_value()`: 返回文本字符串（自动处理 "1.0", "end-1c" 参数）
  - `set_value()`: 设置文本内容

### 2. **Checkbox** ✅ (新修复)
- 使用 `tk.BooleanVar` 存储状态
- `get_value()`: 返回布尔值 `True` 或 `False`
- `set_value()`: 接受 `True/False` 或 `1/0`
- **修复前**: 无法获取/设置选中状态
- **修复后**: 完全支持，类型正确

### 3. **RadioGroup** ✅ (新修复)
- 使用 `tk.StringVar` 存储选中项
- `get_value()`: 返回选中的选项文本（如 "Small", "Medium", "Large"）
- `set_value()`: 设置选中的选项（必须是 options 中的一个）
- **修复前**: 无法获取/设置选中项
- **修复后**: 完全支持

### 4. **Dropdown** ✅ (新修复)
- 使用 `tk.StringVar` 存储选中项
- `get_value()`: 返回选中的选项文本
- `set_value()`: 设置选中的选项
- **修复前**: 无法可靠地获取/设置选中项
- **修复后**: 完全支持

### 5. **Label** ✅
- `get_value()`: 返回显示的文本
- `set_value()`: 设置显示的文本
- **状态**: 已经正常工作

### 6. **Container** N/A
- 容器组件不需要 get/set value

### 7. **Button** N/A
- 按钮组件不需要 get/set value

## 技术实现

### 核心改进

#### 1. 新增变量存储字典
```python
def __init__(self):
    self.component_widgets: Dict[str, Any] = {}     # widget映射
    self.component_variables: Dict[str, Any] = {}   # 变量映射（新增）
```

#### 2. 渲染时保存变量

**Checkbox**:
```python
def _render_checkbox(self, component, parent, event_handlers):
    var = tk.BooleanVar(value=component.checked)
    self.component_variables[component.id] = var  # 保存变量
    checkbox = tk.Checkbutton(parent, variable=var, ...)
```

**RadioGroup**:
```python
def _render_radio_group(self, component, parent, event_handlers):
    var = tk.StringVar(value=component.selected or "")
    self.component_variables[component.id] = var  # 保存变量
    for option in component.options:
        rb = tk.Radiobutton(parent, variable=var, value=option, ...)
```

**Dropdown**:
```python
def _render_dropdown(self, component, parent):
    var = tk.StringVar(value=component.selected or "")
    self.component_variables[component.id] = var  # 保存变量
    dropdown = ttk.Combobox(parent, textvariable=var, ...)
```

#### 3. 更新 get_value() 函数

```python
def get_value(component_id: str) -> Any:
    # 优先检查变量（Checkbox、RadioGroup、Dropdown）
    if component_id in self.component_variables:
        var = self.component_variables[component_id]
        return var.get()  # 直接从变量获取

    # 否则检查 widget
    widget = self.get_widget_by_id(component_id)
    if widget:
        if isinstance(widget, tk.Text):
            return widget.get("1.0", "end-1c")
        elif isinstance(widget, (tk.Entry, ttk.Combobox)):
            return widget.get()
        elif isinstance(widget, tk.Label):
            return widget.cget('text')
    return None
```

#### 4. 更新 set_value() 函数

```python
def set_value(component_id: str, value: Any) -> None:
    # 优先检查变量（Checkbox、RadioGroup、Dropdown）
    if component_id in self.component_variables:
        var = self.component_variables[component_id]
        var.set(value)  # 直接设置变量
        return

    # 否则检查 widget
    widget = self.get_widget_by_id(component_id)
    if widget:
        if isinstance(widget, tk.Entry):
            widget.delete(0, tk.END)
            widget.insert(0, str(value))
        elif isinstance(widget, tk.Text):
            widget.delete("1.0", tk.END)
            widget.insert("1.0", str(value))
        elif isinstance(widget, tk.Label):
            widget.config(text=str(value))
```

### 为什么需要保存变量？

Tkinter 中，某些组件（Checkbox、RadioGroup、Dropdown）使用变量（BooleanVar、StringVar）来管理状态：

```python
# 错误的做法（修复前）
var = tk.BooleanVar(value=True)  # 创建变量
checkbox = tk.Checkbutton(parent, variable=var)
# var 没有保存，超出作用域后可能被回收
# 无法通过 widget 直接获取变量

# 正确的做法（修复后）
var = tk.BooleanVar(value=True)
self.component_variables[component.id] = var  # 保存引用
checkbox = tk.Checkbutton(parent, variable=var)
# 可以随时通过 component.id 访问变量
```

## 测试验证

### 测试文件: `test_all_components.py`

测试了所有组件的完整交互：
1. 读取所有组件的初始值
2. 手动修改组件值
3. 读取修改后的值
4. 程序设置新值
5. 重置所有值

### 测试结果

```
✅ 编译完成, 成功: 3/3

✅ Read All Values:
   - Checkbox is: True (type: bool)
   - Radio is: Medium
   - Dropdown is: Green

✅ 手动修改后:
   - Radio is: Small  (手动改为 Small)
   - Dropdown is: Red (手动改为 Red)

✅ Modify All Values:
   - Checkbox is: False (type: bool)
   - Radio is: Large
   - Dropdown is: Blue

✅ Reset All:
   - Checkbox is: True (type: bool)
   - Radio is: Medium
   - Dropdown is: Green

Test completed successfully!
```

## 更新的提示词

在 `genui/generator/ui_generator.py` 中更新了文档：

### 支持的组件列表

```python
# 获取各种组件的值
text = get_value("input_id")           # TextInput (返回字符串)
is_checked = get_value("checkbox_id")  # Checkbox (返回 True/False)
selected = get_value("radio_id")       # RadioGroup (返回选中的文本)
option = get_value("dropdown_id")      # Dropdown (返回选中的文本)

# 设置各种组件的值
set_value("input_id", "新文本")        # TextInput
set_value("checkbox_id", True)        # Checkbox
set_value("radio_id", "选项2")        # RadioGroup
set_value("dropdown_id", "选项B")     # Dropdown
set_value("result_label", "结果: 42") # Label
```

## 影响的文件

### 核心修复
- `genui/adapters/tkinter_adapter.py`
  - 添加 `component_variables` 字典
  - 更新 `_render_checkbox()` - 保存 BooleanVar
  - 更新 `_render_radio_group()` - 保存 StringVar
  - 更新 `_render_dropdown()` - 保存 StringVar
  - 更新 `get_value()` - 优先使用变量
  - 更新 `set_value()` - 优先使用变量

### 文档更新
- `genui/generator/ui_generator.py`
  - 更新 `get_value()` 说明
  - 更新 `set_value()` 说明
  - 添加所有组件的使用示例

### 测试文件
- `test_all_components.py` - 完整测试所有组件
- `test_text_simple.py` - Text 组件专项测试
- `test_text_fix.py` - Text 组件完整测试

## 使用示例

### 表单验证（使用所有组件类型）

```python
def handle_submit():
    # 读取所有组件值
    username = get_value('username_input')      # TextInput
    agree = get_value('terms_checkbox')         # Checkbox
    plan = get_value('plan_radio')              # RadioGroup
    country = get_value('country_dropdown')     # Dropdown

    # 验证
    if not agree:
        set_value('message', 'Please accept terms')
        return

    if not username:
        set_value('message', 'Username required')
        return

    # 成功
    result = f'Registered: {username}, Plan: {plan}, Country: {country}'
    set_value('message', result)
    display('Registration successful')
```

### 动态问卷（展示所有组件）

```python
def handle_analyze():
    # 读取问卷答案
    feedback = get_value('feedback_text')       # 多行文本
    satisfied = get_value('satisfied_checkbox') # 是否满意
    rating = get_value('rating_radio')          # 评分（1-5星）
    category = get_value('category_dropdown')   # 分类

    # 分析结果
    score = 100 if satisfied else 50
    score += int(rating) * 10

    result = f'''Analysis:
- Satisfied: {satisfied}
- Rating: {rating}
- Category: {category}
- Score: {score}/100
- Feedback: {feedback[:50]}...'''

    set_value('result_label', result)
```

## 对比表

| 组件类型 | 修复前 | 修复后 | 返回类型 |
|---------|--------|--------|---------|
| TextInput (单行) | ✅ | ✅ | str |
| TextInput (多行) | ❌ TypeError | ✅ | str |
| Checkbox | ❌ 无法获取 | ✅ | bool |
| RadioGroup | ❌ 无法获取 | ✅ | str |
| Dropdown | ❌ 不可靠 | ✅ | str |
| Label | ✅ | ✅ | str |

## 优势

### 1. 统一接口
所有组件都使用相同的 `get_value()` 和 `set_value()` 接口，无需关心底层实现。

### 2. 类型正确
- Checkbox 返回真正的布尔类型 `bool`
- 其他组件返回字符串 `str`

### 3. 自动处理
- 自动选择正确的获取方法（变量 vs widget）
- 自动处理 Text 组件的特殊语法
- 自动转换类型

### 4. 向后兼容
不影响已有代码，只是增强功能。

## 总结

### 修复前的问题
- ❌ 无法获取 Checkbox 的选中状态
- ❌ 无法获取 RadioGroup 的选中项
- ❌ Dropdown 获取值不可靠
- ❌ Text 组件会报 TypeError
- ❌ 交互功能不完整

### 修复后的优势
- ✅ **所有组件**都支持 `get_value()` 和 `set_value()`
- ✅ 类型正确（Checkbox 返回 bool，其他返回 str）
- ✅ 接口统一，使用简单
- ✅ 自动处理各种细节
- ✅ 完整的交互支持

现在 genui 库提供了**完整、统一、易用**的组件交互接口！🎉
