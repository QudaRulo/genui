import { describe, it, expect } from 'vitest';
import {
  ButtonSchema,
  TextInputSchema,
  LabelSchema,
  ContainerSchema,
  CheckboxSchema,
  RadioGroupSchema,
  DropdownSchema,
  ComponentSchema,
  type Button,
  type TextInput,
  type Label,
  type Container,
  type Checkbox,
  type RadioGroup,
  type Dropdown,
  type ComponentType,
} from '../../src/core/component.js';

describe('ButtonSchema', () => {
  it('应该解析包含全部字段的按钮', () => {
    const data = {
      id: 'btn-1',
      type: 'button',
      text: '点击我',
      on_click: 'handleClick',
      enabled: false,
      width: 100,
      height: 40,
    };
    const result: Button = ButtonSchema.parse(data);
    expect(result.id).toBe('btn-1');
    expect(result.type).toBe('button');
    expect(result.text).toBe('点击我');
    expect(result.on_click).toBe('handleClick');
    expect(result.enabled).toBe(false);
    expect(result.width).toBe(100);
    expect(result.height).toBe(40);
  });

  it('应该使用默认值', () => {
    const data = { id: 'btn-2', type: 'button', text: '确定' };
    const result = ButtonSchema.parse(data);
    expect(result.enabled).toBe(true);
    expect(result.on_click).toBeUndefined();
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });
});

describe('TextInputSchema', () => {
  it('应该解析包含全部字段的文本输入框', () => {
    const data = {
      id: 'input-1',
      type: 'text_input',
      placeholder: '请输入...',
      default_value: '默认文本',
      multiline: true,
      width: 200,
      height: 80,
    };
    const result: TextInput = TextInputSchema.parse(data);
    expect(result.id).toBe('input-1');
    expect(result.type).toBe('text_input');
    expect(result.placeholder).toBe('请输入...');
    expect(result.default_value).toBe('默认文本');
    expect(result.multiline).toBe(true);
    expect(result.width).toBe(200);
    expect(result.height).toBe(80);
  });

  it('应该使用默认值', () => {
    const data = { id: 'input-2', type: 'text_input' };
    const result = TextInputSchema.parse(data);
    expect(result.placeholder).toBe('');
    expect(result.default_value).toBe('');
    expect(result.multiline).toBe(false);
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });
});

describe('LabelSchema', () => {
  it('应该解析包含全部字段的标签', () => {
    const data = {
      id: 'lbl-1',
      type: 'label',
      text: '标题文本',
      font_size: 24,
      bold: true,
      color: '#FF0000',
    };
    const result: Label = LabelSchema.parse(data);
    expect(result.id).toBe('lbl-1');
    expect(result.type).toBe('label');
    expect(result.text).toBe('标题文本');
    expect(result.font_size).toBe(24);
    expect(result.bold).toBe(true);
    expect(result.color).toBe('#FF0000');
  });

  it('应该使用默认值', () => {
    const data = { id: 'lbl-2', type: 'label', text: '普通文本' };
    const result = LabelSchema.parse(data);
    expect(result.font_size).toBe(12);
    expect(result.bold).toBe(false);
    expect(result.color).toBeUndefined();
  });
});

describe('ContainerSchema', () => {
  it('应该解析包含全部字段的容器', () => {
    const data = {
      id: 'cont-1',
      type: 'container',
      layout: 'horizontal',
      children: [
        { id: 'btn-1', type: 'button', text: '按钮' },
        { id: 'lbl-1', type: 'label', text: '文本' },
      ],
      padding: 20,
      spacing: 10,
      width: 800,
      height: 600,
    };
    const result: Container = ContainerSchema.parse(data);
    expect(result.id).toBe('cont-1');
    expect(result.type).toBe('container');
    expect(result.layout).toBe('horizontal');
    expect(result.children).toHaveLength(2);
    expect(result.padding).toBe(20);
    expect(result.spacing).toBe(10);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('应该使用默认值', () => {
    const data = { id: 'cont-2', type: 'container' };
    const result = ContainerSchema.parse(data);
    expect(result.layout).toBe('vertical');
    expect(result.children).toEqual([]);
    expect(result.padding).toBe(10);
    expect(result.spacing).toBe(5);
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });

  it('应该支持嵌套容器(递归)', () => {
    const data = {
      id: 'outer',
      type: 'container',
      children: [
        {
          id: 'inner',
          type: 'container',
          children: [
            { id: 'btn-nested', type: 'button', text: '嵌套按钮' },
          ],
        },
      ],
    };
    const result = ContainerSchema.parse(data);
    expect(result.children).toHaveLength(1);
    const inner = result.children[0] as Container;
    expect(inner.type).toBe('container');
    expect(inner.children).toHaveLength(1);
    expect(inner.children[0].type).toBe('button');
  });

  it('应该支持grid布局', () => {
    const data = { id: 'cont-grid', type: 'container', layout: 'grid' };
    const result = ContainerSchema.parse(data);
    expect(result.layout).toBe('grid');
  });
});

describe('CheckboxSchema', () => {
  it('应该解析包含全部字段的复选框', () => {
    const data = {
      id: 'chk-1',
      type: 'checkbox',
      label: '同意条款',
      checked: true,
      on_change: 'handleCheck',
    };
    const result: Checkbox = CheckboxSchema.parse(data);
    expect(result.id).toBe('chk-1');
    expect(result.type).toBe('checkbox');
    expect(result.label).toBe('同意条款');
    expect(result.checked).toBe(true);
    expect(result.on_change).toBe('handleCheck');
  });

  it('应该使用默认值', () => {
    const data = { id: 'chk-2', type: 'checkbox', label: '选项' };
    const result = CheckboxSchema.parse(data);
    expect(result.checked).toBe(false);
    expect(result.on_change).toBeUndefined();
  });
});

describe('RadioGroupSchema', () => {
  it('应该解析包含全部字段的单选组', () => {
    const data = {
      id: 'radio-1',
      type: 'radio_group',
      label: '选择颜色',
      options: ['红色', '蓝色', '绿色'],
      selected: '蓝色',
      on_change: 'handleRadio',
    };
    const result: RadioGroup = RadioGroupSchema.parse(data);
    expect(result.id).toBe('radio-1');
    expect(result.type).toBe('radio_group');
    expect(result.label).toBe('选择颜色');
    expect(result.options).toEqual(['红色', '蓝色', '绿色']);
    expect(result.selected).toBe('蓝色');
    expect(result.on_change).toBe('handleRadio');
  });

  it('应该使用默认值', () => {
    const data = {
      id: 'radio-2',
      type: 'radio_group',
      label: '选项',
      options: ['A', 'B'],
    };
    const result = RadioGroupSchema.parse(data);
    expect(result.selected).toBeUndefined();
    expect(result.on_change).toBeUndefined();
  });
});

describe('DropdownSchema', () => {
  it('应该解析包含全部字段的下拉框', () => {
    const data = {
      id: 'dd-1',
      type: 'dropdown',
      label: '选择国家',
      options: ['中国', '美国', '日本'],
      selected: '中国',
      width: 150,
    };
    const result: Dropdown = DropdownSchema.parse(data);
    expect(result.id).toBe('dd-1');
    expect(result.type).toBe('dropdown');
    expect(result.label).toBe('选择国家');
    expect(result.options).toEqual(['中国', '美国', '日本']);
    expect(result.selected).toBe('中国');
    expect(result.width).toBe(150);
  });

  it('应该使用默认值', () => {
    const data = {
      id: 'dd-2',
      type: 'dropdown',
      options: ['X', 'Y'],
    };
    const result = DropdownSchema.parse(data);
    expect(result.label).toBe('');
    expect(result.selected).toBeUndefined();
    expect(result.width).toBeUndefined();
  });
});

describe('ComponentSchema', () => {
  it('应该解析任意有效组件', () => {
    const buttonData = { id: 'btn', type: 'button', text: '按钮' };
    const labelData = { id: 'lbl', type: 'label', text: '标签' };
    const inputData = { id: 'inp', type: 'text_input' };
    const checkData = { id: 'chk', type: 'checkbox', label: '选项' };
    const radioData = {
      id: 'rad',
      type: 'radio_group',
      label: '单选',
      options: ['A'],
    };
    const dropData = { id: 'dd', type: 'dropdown', options: ['A'] };
    const contData = { id: 'cont', type: 'container' };

    expect(ComponentSchema.parse(buttonData).type).toBe('button');
    expect(ComponentSchema.parse(labelData).type).toBe('label');
    expect(ComponentSchema.parse(inputData).type).toBe('text_input');
    expect(ComponentSchema.parse(checkData).type).toBe('checkbox');
    expect(ComponentSchema.parse(radioData).type).toBe('radio_group');
    expect(ComponentSchema.parse(dropData).type).toBe('dropdown');
    expect(ComponentSchema.parse(contData).type).toBe('container');
  });

  it('应该拒绝无效的组件类型', () => {
    const invalidData = { id: 'x', type: 'invalid_type', text: 'test' };
    expect(() => ComponentSchema.parse(invalidData)).toThrow();
  });

  it('应该拒绝缺少必填字段的组件', () => {
    // Button需要text字段
    const missingText = { id: 'btn', type: 'button' };
    expect(() => ComponentSchema.parse(missingText)).toThrow();
  });
});
