import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, createLogger, parseLogLevel } from '../src/logger.js';
import type { Logger } from '../src/logger.js';

describe('Logger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger with default INFO level', () => {
      const logger: Logger = createLogger('test');
      // logger 应该有 debug, info, warn, error 方法
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should suppress DEBUG messages at default INFO level', () => {
      const logger = createLogger('test');
      logger.debug('this should be suppressed');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('should output INFO messages at default INFO level', () => {
      const logger = createLogger('test');
      logger.info('hello world');
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('should output WARNING messages at default INFO level', () => {
      const logger = createLogger('test');
      logger.warn('warning message');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should output ERROR messages at default INFO level', () => {
      const logger = createLogger('test');
      logger.error('error message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should output DEBUG messages when level is DEBUG', () => {
      const logger = createLogger('test', LogLevel.DEBUG);
      logger.debug('debug message');
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });

    it('should suppress INFO and DEBUG messages when level is WARNING', () => {
      const logger = createLogger('test', LogLevel.WARNING);
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warning message');
      logger.error('error message');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should only allow ERROR messages when level is ERROR', () => {
      const logger = createLogger('test', LogLevel.ERROR);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should format messages with timestamp, name, and level', () => {
      const logger = createLogger('myApp');
      logger.info('test message');
      expect(infoSpy).toHaveBeenCalledTimes(1);
      const output = infoSpy.mock.calls[0][0] as string;
      // 格式: [YYYY-MM-DD HH:MM:SS] name - LEVEL - message
      expect(output).toMatch(
        /\x1b\[32m\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] myApp - INFO - test message\x1b\[0m/,
      );
    });

    it('should use cyan color for DEBUG messages', () => {
      const logger = createLogger('app', LogLevel.DEBUG);
      logger.debug('debug msg');
      const output = debugSpy.mock.calls[0][0] as string;
      expect(output).toContain('\x1b[36m');
      expect(output).toContain('\x1b[0m');
    });

    it('should use green color for INFO messages', () => {
      const logger = createLogger('app');
      logger.info('info msg');
      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toContain('\x1b[32m');
      expect(output).toContain('\x1b[0m');
    });

    it('should use yellow color for WARNING messages', () => {
      const logger = createLogger('app');
      logger.warn('warn msg');
      const output = warnSpy.mock.calls[0][0] as string;
      expect(output).toContain('\x1b[33m');
      expect(output).toContain('\x1b[0m');
    });

    it('should use red color for ERROR messages', () => {
      const logger = createLogger('app');
      logger.error('error msg');
      const output = errorSpy.mock.calls[0][0] as string;
      expect(output).toContain('\x1b[31m');
      expect(output).toContain('\x1b[0m');
    });

    it('should pass extra arguments to console methods', () => {
      const logger = createLogger('app');
      logger.info('message', 'extra1', 42);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      const args = infoSpy.mock.calls[0];
      expect(args.length).toBe(3);
      expect(args[1]).toBe('extra1');
      expect(args[2]).toBe(42);
    });
  });

  describe('parseLogLevel', () => {
    it('should parse "DEBUG" to LogLevel.DEBUG', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
    });

    it('should parse "INFO" to LogLevel.INFO', () => {
      expect(parseLogLevel('INFO')).toBe(LogLevel.INFO);
    });

    it('should parse "WARNING" to LogLevel.WARNING', () => {
      expect(parseLogLevel('WARNING')).toBe(LogLevel.WARNING);
    });

    it('should parse "ERROR" to LogLevel.ERROR', () => {
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
    });

    it('should be case-insensitive', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('Info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('warning')).toBe(LogLevel.WARNING);
      expect(parseLogLevel('error')).toBe(LogLevel.ERROR);
    });

    it('should default to INFO for undefined input', () => {
      expect(parseLogLevel(undefined)).toBe(LogLevel.INFO);
    });

    it('should default to INFO for empty string', () => {
      expect(parseLogLevel('')).toBe(LogLevel.INFO);
    });

    it('should default to INFO for invalid input', () => {
      expect(parseLogLevel('INVALID')).toBe(LogLevel.INFO);
      expect(parseLogLevel('trace')).toBe(LogLevel.INFO);
    });
  });

  describe('LogLevel enum', () => {
    it('should have correct numeric values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARNING).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });
});
