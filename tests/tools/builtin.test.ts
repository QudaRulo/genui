import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllBuiltinTools } from '../../src/tools/builtin/index.js';
import { calculateTool, convertUnitTool } from '../../src/tools/builtin/calculator.js';
import { getWeatherTool, getCurrentTimeTool } from '../../src/tools/builtin/query.js';

// 抑制日志输出
beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('内置工具', () => {
  describe('getAllBuiltinTools', () => {
    it('应该至少有 6 个内置工具', () => {
      const tools = getAllBuiltinTools();
      expect(tools.length).toBeGreaterThanOrEqual(6);
    });

    it('每个工具都应该有 name, description, parameters, execute', () => {
      const tools = getAllBuiltinTools();
      for (const tool of tools) {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.parameters).toBeDefined();
        expect(typeof tool.execute).toBe('function');
      }
    });
  });

  describe('calculate (表达式计算)', () => {
    it('应该正确计算加法', async () => {
      const result = await calculateTool.execute({ expression: '2 + 3' });
      expect(result).toEqual({ result: 5 });
    });

    it('应该正确计算乘法', async () => {
      const result = await calculateTool.execute({ expression: '4 * 5' });
      expect(result).toEqual({ result: 20 });
    });

    it('应该正确计算复杂表达式', async () => {
      const result = await calculateTool.execute({ expression: '(2 + 3) * 4' });
      expect(result).toEqual({ result: 20 });
    });

    it('应该支持幂运算(^)', async () => {
      const result = await calculateTool.execute({ expression: '2 ^ 10' });
      expect(result).toEqual({ result: 1024 });
    });

    it('应该支持取余运算(%)', async () => {
      const result = await calculateTool.execute({ expression: '10 % 3' });
      expect(result).toEqual({ result: 1 });
    });

    it('应该支持小数', async () => {
      const result = await calculateTool.execute({ expression: '1.5 + 2.3' });
      expect(result).toEqual({ result: 3.8 });
    });

    it('应该拒绝不安全的表达式', async () => {
      await expect(
        calculateTool.execute({ expression: 'alert("xss")' }),
      ).rejects.toThrow('不安全');
    });

    it('应该拒绝包含变量的表达式', async () => {
      await expect(
        calculateTool.execute({ expression: 'x + 1' }),
      ).rejects.toThrow('不安全');
    });

    it('应该拒绝除以零(结果非有限数)', async () => {
      await expect(
        calculateTool.execute({ expression: '1 / 0' }),
      ).rejects.toThrow('无效');
    });
  });

  describe('convert_unit (单位转换)', () => {
    describe('长度单位转换', () => {
      it('应该正确转换 km 到 m', async () => {
        const result = await convertUnitTool.execute({
          value: 1,
          from_unit: 'km',
          to_unit: 'm',
        }) as { result: number };
        expect(result.result).toBe(1000);
      });

      it('应该正确转换 m 到 km', async () => {
        const result = await convertUnitTool.execute({
          value: 5000,
          from_unit: 'm',
          to_unit: 'km',
        }) as { result: number };
        expect(result.result).toBe(5);
      });

      it('应该正确转换 mile 到 km', async () => {
        const result = await convertUnitTool.execute({
          value: 1,
          from_unit: 'mile',
          to_unit: 'km',
        }) as { result: number };
        expect(result.result).toBeCloseTo(1.609344, 4);
      });

      it('应该正确转换 ft 到 m', async () => {
        const result = await convertUnitTool.execute({
          value: 1,
          from_unit: 'ft',
          to_unit: 'm',
        }) as { result: number };
        expect(result.result).toBeCloseTo(0.3048, 4);
      });

      it('应该正确转换 inch 到 ft', async () => {
        const result = await convertUnitTool.execute({
          value: 12,
          from_unit: 'inch',
          to_unit: 'ft',
        }) as { result: number };
        expect(result.result).toBeCloseTo(1, 4);
      });
    });

    describe('温度单位转换', () => {
      it('应该正确转换摄氏度到华氏度', async () => {
        const result = await convertUnitTool.execute({
          value: 0,
          from_unit: 'celsius',
          to_unit: 'fahrenheit',
        }) as { result: number };
        expect(result.result).toBe(32);
      });

      it('应该正确转换华氏度到摄氏度', async () => {
        const result = await convertUnitTool.execute({
          value: 212,
          from_unit: 'fahrenheit',
          to_unit: 'celsius',
        }) as { result: number };
        expect(result.result).toBe(100);
      });

      it('应该正确转换摄氏度到开尔文', async () => {
        const result = await convertUnitTool.execute({
          value: 0,
          from_unit: 'celsius',
          to_unit: 'kelvin',
        }) as { result: number };
        expect(result.result).toBeCloseTo(273.15, 2);
      });

      it('应该正确转换开尔文到摄氏度', async () => {
        const result = await convertUnitTool.execute({
          value: 273.15,
          from_unit: 'kelvin',
          to_unit: 'celsius',
        }) as { result: number };
        expect(result.result).toBeCloseTo(0, 2);
      });
    });

    it('不支持的单位转换应抛出错误', async () => {
      await expect(
        convertUnitTool.execute({
          value: 1,
          from_unit: 'kg',
          to_unit: 'm',
        }),
      ).rejects.toThrow('不支持');
    });
  });

  describe('get_weather (天气查询)', () => {
    it('应该返回北京的天气数据', async () => {
      const result = await getWeatherTool.execute({ city: '北京' }) as {
        city: string;
        weather: string;
        temperature: number;
      };
      expect(result.city).toBe('北京');
      expect(result.weather).toBe('晴');
      expect(result.temperature).toBe(22.0);
    });

    it('应该返回上海的天气数据', async () => {
      const result = await getWeatherTool.execute({ city: '上海' }) as {
        city: string;
        weather: string;
        temperature: number;
      };
      expect(result.city).toBe('上海');
      expect(result.weather).toBe('多云');
      expect(result.temperature).toBe(25.0);
    });

    it('应该返回广州的天气数据', async () => {
      const result = await getWeatherTool.execute({ city: '广州' }) as {
        city: string;
        weather: string;
        temperature: number;
      };
      expect(result.city).toBe('广州');
      expect(result.weather).toBe('阵雨');
    });

    it('应该返回深圳的天气数据', async () => {
      const result = await getWeatherTool.execute({ city: '深圳' }) as {
        city: string;
        weather: string;
        temperature: number;
      };
      expect(result.city).toBe('深圳');
      expect(result.weather).toBe('多云转晴');
    });

    it('未知城市应返回默认天气数据', async () => {
      const result = await getWeatherTool.execute({ city: '成都' }) as {
        city: string;
        weather: string;
        temperature: number;
      };
      expect(result.city).toBe('成都');
      expect(result.weather).toBe('晴');
      expect(result.temperature).toBe(20.0);
    });
  });

  describe('get_current_time (获取当前时间)', () => {
    it('应该返回格式为 YYYY-MM-DD HH:MM:SS 的时间字符串', async () => {
      const result = await getCurrentTimeTool.execute({}) as { time: string };
      expect(result.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('返回的时间应该与当前时间接近', async () => {
      const before = new Date();
      const result = await getCurrentTimeTool.execute({}) as { time: string };
      const after = new Date();

      // 解析返回的时间
      const [datePart, timePart] = result.time.split(' ');
      expect(datePart).toBeDefined();
      expect(timePart).toBeDefined();

      // 验证日期部分与今天一致
      const year = before.getFullYear();
      const month = String(before.getMonth() + 1).padStart(2, '0');
      const day = String(before.getDate()).padStart(2, '0');
      expect(datePart).toBe(`${year}-${month}-${day}`);
    });
  });
});
