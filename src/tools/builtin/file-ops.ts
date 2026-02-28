// -*- coding: utf-8 -*-
// 文件操作类内置工具: 读取文本文件和列出目录

import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ToolDefinition } from '../types.js';

// ============================================================
// 读取文本文件工具
// ============================================================

const readTextFileParamsSchema = z.object({
  file_path: z.string().describe('要读取的文件路径'),
  encoding: z.string().default('utf-8').describe('文件编码, 默认 utf-8'),
});

/**
 * 读取文本文件工具.
 * 读取指定路径的文本文件并返回内容.
 */
export const readTextFileTool: ToolDefinition = {
  name: 'read_text_file',
  description: '读取指定路径的文本文件内容',
  parameters: readTextFileParamsSchema,
  async execute(params: unknown): Promise<unknown> {
    const { file_path, encoding } =
      params as z.infer<typeof readTextFileParamsSchema>;

    const resolvedPath = path.resolve(file_path);
    const content = fs.readFileSync(resolvedPath, {
      encoding: encoding as BufferEncoding,
    });
    return { file_path: resolvedPath, content };
  },
};

// ============================================================
// 列出目录工具
// ============================================================

const listDirectoryParamsSchema = z.object({
  dir_path: z.string().describe('要列出的目录路径'),
});

/**
 * 列出目录内容工具.
 * 列出指定目录下的所有文件和子目录.
 */
export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  description: '列出指定目录下的所有文件和子目录',
  parameters: listDirectoryParamsSchema,
  async execute(params: unknown): Promise<unknown> {
    const { dir_path } =
      params as z.infer<typeof listDirectoryParamsSchema>;

    const resolvedPath = path.resolve(dir_path);
    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    const items = entries.map((entry) => ({
      name: entry.name,
      is_directory: entry.isDirectory(),
    }));
    return { dir_path: resolvedPath, items };
  },
};
