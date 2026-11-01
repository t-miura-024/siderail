import { describe, expect, it } from 'vitest';
import { DEFAULT_MODE, parseMode } from './mode';

describe('parseMode', () => {
  it('chrome をそのまま返す', () => {
    expect(parseMode('chrome')).toBe('chrome');
  });

  it('arc をそのまま返す', () => {
    expect(parseMode('arc')).toBe('arc');
  });

  it('保存値がない場合は既定モードを返す', () => {
    expect(parseMode(undefined)).toBe(DEFAULT_MODE);
  });

  it('未知の値は既定モードを返す', () => {
    expect(parseMode('unknown')).toBe(DEFAULT_MODE);
    expect(parseMode(42)).toBe(DEFAULT_MODE);
  });
});
