// -*- coding: utf-8 -*-
// 核心模块入口, 导出组件类型和UI实例模型

export {
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
} from './component.js';

export {
  UIInstanceSchema,
  listAllComponents,
  findComponentById,
  type UIInstance,
} from './ui-instance.js';
