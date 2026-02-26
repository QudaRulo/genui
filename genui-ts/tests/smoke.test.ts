import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('smoke test', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
