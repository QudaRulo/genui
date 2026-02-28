// -*- coding: utf-8 -*-
// Ink终端组件, 将genui组件映射为Ink渲染元素

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Box, Text, useFocus, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { ComponentType as GenuiComponent } from '../../core/component.js';
import type { ComponentStore } from './store.js';

/** 组件通用Props */
interface ComponentProps {
  /** genui组件定义 */
  component: GenuiComponent;
  /** 状态存储 */
  store: ComponentStore;
  /** 编译后的事件处理器 */
  handlers: Map<string, () => void>;
}

/**
 * 组件分发器, 根据type渲染对应的Ink组件
 */
export function GenuiComponent({ component, store, handlers }: ComponentProps): React.ReactElement {
  switch (component.type) {
    case 'container':
      return <GenuiContainer component={component} store={store} handlers={handlers} />;
    case 'label':
      return <GenuiLabel component={component} store={store} />;
    case 'button':
      return <GenuiButton component={component} store={store} handlers={handlers} />;
    case 'text_input':
      return <GenuiTextInput component={component} store={store} />;
    case 'checkbox':
      return <GenuiCheckbox component={component} store={store} handlers={handlers} />;
    case 'radio_group':
      return <GenuiRadioGroup component={component} store={store} handlers={handlers} />;
    case 'dropdown':
      return <GenuiDropdown component={component} store={store} handlers={handlers} />;
    default:
      return <Text color="red">[未知组件]</Text>;
  }
}

// ============================================================
// 通用hook: 订阅store变更
// ============================================================

/** 订阅store中某个组件的值 */
function useStoreValue(store: ComponentStore, id: string): unknown {
  const subscribe = React.useCallback(
    (cb: () => void) => store.subscribe(cb),
    [store],
  );
  const getSnapshot = React.useCallback(
    () => store.getSnapshot(),
    [store],
  );
  // 订阅版本号变化来触发重新渲染
  useSyncExternalStore(subscribe, getSnapshot);
  return store.has(id) ? store.getValue(id) : undefined;
}

// ============================================================
// Container
// ============================================================

function GenuiContainer({ component, store, handlers }: ComponentProps & { component: GenuiComponent & { type: 'container' } }): React.ReactElement {
  const flexDirection = component.layout === 'horizontal' ? 'row' as const : 'column' as const;
  const isGrid = component.layout === 'grid';

  return (
    <Box
      flexDirection={isGrid ? 'row' : flexDirection}
      flexWrap={isGrid ? 'wrap' : 'nowrap'}
      padding={component.padding > 0 ? 1 : 0}
      gap={component.spacing > 0 ? 1 : 0}
      width={component.width}
      height={component.height}
    >
      {component.children.map((child) => (
        <GenuiComponent key={child.id} component={child} store={store} handlers={handlers} />
      ))}
    </Box>
  );
}

// ============================================================
// Label
// ============================================================

function GenuiLabel({ component, store }: { component: GenuiComponent & { type: 'label' }; store: ComponentStore }): React.ReactElement {
  const value = useStoreValue(store, component.id);
  const text = value !== undefined ? String(value) : component.text;

  return (
    <Text
      bold={component.bold}
      color={component.color ?? undefined}
    >
      {text}
    </Text>
  );
}

// ============================================================
// Button
// ============================================================

function GenuiButton({ component, handlers }: { component: GenuiComponent & { type: 'button' }; store: ComponentStore; handlers: Map<string, () => void> }): React.ReactElement {
  const { isFocused } = useFocus();

  useInput((_input, key) => {
    if (key.return && component.on_click && component.enabled !== false) {
      const handler = handlers.get(component.on_click);
      if (handler) handler();
    }
  }, { isActive: isFocused });

  const borderColor = isFocused ? 'cyan' : 'gray';
  const textColor = component.enabled === false ? 'gray' : isFocused ? 'cyan' : 'white';

  return (
    <Box borderStyle="round" borderColor={borderColor} paddingLeft={1} paddingRight={1}>
      <Text color={textColor} bold={isFocused}>
        {component.text}
      </Text>
    </Box>
  );
}

// ============================================================
// TextInput
// ============================================================

function GenuiTextInput({ component, store }: { component: GenuiComponent & { type: 'text_input' }; store: ComponentStore }): React.ReactElement {
  const { isFocused } = useFocus();
  const storeValue = useStoreValue(store, component.id);
  const [localValue, setLocalValue] = useState(String(storeValue ?? ''));

  // 当事件处理器从外部修改了store中的值时, 同步到本地状态
  useEffect(() => {
    const newValue = String(storeValue ?? '');
    if (newValue !== localValue) {
      setLocalValue(newValue);
    }
  }, [storeValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (val: string): void => {
    setLocalValue(val);
    store.setValue(component.id, val);
  };

  if (isFocused) {
    return (
      <Box borderStyle="single" borderColor="cyan" paddingLeft={1} paddingRight={1}>
        <Text color="cyan">› </Text>
        <TextInput
          value={localValue}
          onChange={handleChange}
          placeholder={component.placeholder}
          focus={true}
        />
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderColor="gray" paddingLeft={1} paddingRight={1}>
      <Text color="gray">  </Text>
      <Text color={localValue ? 'white' : 'gray'}>
        {localValue || component.placeholder || ''}
      </Text>
    </Box>
  );
}

// ============================================================
// Checkbox
// ============================================================

function GenuiCheckbox({ component, store, handlers }: { component: GenuiComponent & { type: 'checkbox' }; store: ComponentStore; handlers: Map<string, () => void> }): React.ReactElement {
  const { isFocused } = useFocus();
  const value = useStoreValue(store, component.id);
  const checked = Boolean(value);

  useInput((_input, key) => {
    if (_input === ' ' || key.return) {
      store.setValue(component.id, !checked);
      if (component.on_change) {
        const handler = handlers.get(component.on_change);
        if (handler) handler();
      }
    }
  }, { isActive: isFocused });

  const icon = checked ? '☑' : '☐';
  const color = isFocused ? 'cyan' : checked ? 'green' : 'white';

  return (
    <Text color={color} bold={isFocused}>
      {icon} {component.label}
    </Text>
  );
}

// ============================================================
// RadioGroup
// ============================================================

function GenuiRadioGroup({ component, store, handlers }: { component: GenuiComponent & { type: 'radio_group' }; store: ComponentStore; handlers: Map<string, () => void> }): React.ReactElement {
  const { isFocused } = useFocus();
  const value = useStoreValue(store, component.id);

  const items = component.options.map((opt) => ({
    label: opt,
    value: opt,
  }));

  const handleSelect = (item: { label: string; value: string }): void => {
    store.setValue(component.id, item.value);
    if (component.on_change) {
      const handler = handlers.get(component.on_change);
      if (handler) handler();
    }
  };

  // 计算初始选中项索引
  const initialIndex = value ? component.options.indexOf(String(value)) : 0;

  if (!isFocused) {
    // 未聚焦时显示紧凑摘要
    return (
      <Box>
        <Text color="gray">{component.label}: </Text>
        <Text color="white">◉ {value ? String(value) : '(未选择)'}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>{component.label}</Text>
      <SelectInput
        items={items}
        onSelect={handleSelect}
        isFocused={isFocused}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
      />
    </Box>
  );
}

// ============================================================
// Dropdown
// ============================================================

function GenuiDropdown({ component, store }: { component: GenuiComponent & { type: 'dropdown' }; store: ComponentStore; handlers: Map<string, () => void> }): React.ReactElement {
  const { isFocused } = useFocus();
  const value = useStoreValue(store, component.id);

  const items = component.options.map((opt) => ({
    label: opt,
    value: opt,
  }));

  const handleSelect = (item: { label: string; value: string }): void => {
    store.setValue(component.id, item.value);
  };

  const initialIndex = value ? component.options.indexOf(String(value)) : 0;

  if (!isFocused) {
    // 未聚焦时只显示当前选中值
    return (
      <Box>
        {component.label ? <Text color="gray">{component.label}: </Text> : null}
        <Text color="white">▼ {value ? String(value) : '(未选择)'}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {component.label ? <Text color="cyan" bold>{component.label}</Text> : null}
      <SelectInput
        items={items}
        onSelect={handleSelect}
        isFocused={isFocused}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
      />
    </Box>
  );
}
