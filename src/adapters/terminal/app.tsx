// -*- coding: utf-8 -*-
// Terminal适配器的Ink根组件

import React from 'react';
import { Box, Text } from 'ink';
import { GenuiComponent } from './components.js';
import type { ComponentType } from '../../core/component.js';
import type { ComponentStore } from './store.js';

/** App组件的Props */
interface AppProps {
  /** 窗口标题 */
  title: string;
  /** 根组件 */
  root: ComponentType;
  /** 状态存储 */
  store: ComponentStore;
  /** 编译后的事件处理器 */
  handlers: Map<string, () => void>;
}

/**
 * Terminal UI根组件.
 * 渲染标题栏 + 组件树 + 操作提示.
 */
export function App({ title, root, store, handlers }: AppProps): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      {/* 标题栏 */}
      <Box borderStyle="double" borderColor="magenta" paddingLeft={1} paddingRight={1} justifyContent="center">
        <Text bold color="magenta">{title}</Text>
      </Box>

      {/* 组件树 */}
      <Box flexDirection="column" marginTop={1}>
        <GenuiComponent component={root} store={store} handlers={handlers} />
      </Box>

      {/* 操作提示 */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>Tab 切换 │ Enter 确认 │ Space 选择 │ Ctrl+C 退出</Text>
      </Box>
    </Box>
  );
}
