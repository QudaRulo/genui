// -*- coding: utf-8 -*-
// genui-ts logger - 带颜色输出和可配置日志级别的日志模块

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

/**
 * 日志接口, 提供 debug/info/warn/error 四个方法
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/** ANSI 颜色码映射 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',   // cyan
  [LogLevel.INFO]: '\x1b[32m',    // green
  [LogLevel.WARNING]: '\x1b[33m', // yellow
  [LogLevel.ERROR]: '\x1b[31m',   // red
};

/** 日志级别名称映射 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARNING]: 'WARNING',
  [LogLevel.ERROR]: 'ERROR',
};

/** ANSI 颜色重置码 */
const RESET = '\x1b[0m';

/**
 * 获取格式化的时间戳
 * @returns 格式为 YYYY-MM-DD HH:MM:SS 的字符串
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日志消息
 * @param name - 日志名称
 * @param level - 日志级别
 * @param message - 日志内容
 * @returns 带颜色的格式化字符串
 */
function formatMessage(name: string, level: LogLevel, message: string): string {
  const color = LEVEL_COLORS[level];
  const levelName = LEVEL_NAMES[level];
  const timestamp = getTimestamp();
  return `${color}[${timestamp}] ${name} - ${levelName} - ${message}${RESET}`;
}

/**
 * 创建日志实例
 * @param name - 日志名称, 用于标识日志来源
 * @param level - 最低日志级别, 低于此级别的消息将被忽略, 默认为 INFO
 * @returns Logger 实例
 */
export function createLogger(name: string, level: LogLevel = LogLevel.INFO): Logger {
  const log = (
    msgLevel: LogLevel,
    consoleFn: (...args: unknown[]) => void,
    message: string,
    ...args: unknown[]
  ): void => {
    if (msgLevel < level) {
      return;
    }
    const formatted = formatMessage(name, msgLevel, message);
    consoleFn(formatted, ...args);
  };

  return {
    debug(message: string, ...args: unknown[]): void {
      log(LogLevel.DEBUG, console.debug, message, ...args);
    },
    info(message: string, ...args: unknown[]): void {
      log(LogLevel.INFO, console.info, message, ...args);
    },
    warn(message: string, ...args: unknown[]): void {
      log(LogLevel.WARNING, console.warn, message, ...args);
    },
    error(message: string, ...args: unknown[]): void {
      log(LogLevel.ERROR, console.error, message, ...args);
    },
  };
}

/**
 * 解析日志级别字符串
 * @param value - 日志级别字符串, 支持 DEBUG/INFO/WARNING/ERROR (不区分大小写)
 * @returns 对应的 LogLevel, 无效值返回 INFO
 */
export function parseLogLevel(value?: string): LogLevel {
  if (!value) {
    return LogLevel.INFO;
  }

  const upper = value.toUpperCase();
  const mapping: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARNING: LogLevel.WARNING,
    ERROR: LogLevel.ERROR,
  };

  return mapping[upper] ?? LogLevel.INFO;
}
