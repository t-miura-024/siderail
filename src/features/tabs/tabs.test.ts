import { describe, expect, it } from 'vitest';
import { getReorderedTabIndex, getTabTitle, sortTabs } from './tabs';

describe('sortTabs', () => {
  it('index の昇順（Chrome のタブストリップ順）に並べ替える', () => {
    const tabs = [
      { index: 2, id: 3 },
      { index: 0, id: 1 },
      { index: 1, id: 2 },
    ];

    expect(sortTabs(tabs).map((tab) => tab.id)).toEqual([1, 2, 3]);
  });

  it('渡された配列を変更しない', () => {
    const tabs = [
      { index: 1, id: 2 },
      { index: 0, id: 1 },
    ];

    sortTabs(tabs);

    expect(tabs.map((tab) => tab.id)).toEqual([2, 1]);
  });
});

describe('getReorderedTabIndex', () => {
  it('前方向への移動は、元の位置より前のぶんだけ詰めて返す', () => {
    expect(getReorderedTabIndex(0, 2, 'before')).toBe(1);
    expect(getReorderedTabIndex(0, 2, 'after')).toBe(2);
  });

  it('後ろ方向への移動は、対象の位置をそのまま使う', () => {
    expect(getReorderedTabIndex(3, 1, 'before')).toBe(1);
    expect(getReorderedTabIndex(3, 1, 'after')).toBe(2);
  });

  it('同じ位置への移動は元のインデックスを返す', () => {
    expect(getReorderedTabIndex(1, 1, 'before')).toBe(1);
    expect(getReorderedTabIndex(1, 1, 'after')).toBe(1);
    expect(getReorderedTabIndex(0, 0, 'before')).toBe(0);
  });
});

describe('getTabTitle', () => {
  it('タブのタイトルを返す', () => {
    expect(getTabTitle({ title: 'GitHub Docs', url: 'https://docs.github.com/' })).toBe(
      'GitHub Docs',
    );
  });

  it('タイトルが空の場合は URL を返す', () => {
    expect(getTabTitle({ title: '   ', url: 'https://example.com/' })).toBe('https://example.com/');
  });

  it('タイトルも URL もない場合は New Tab を返す', () => {
    expect(getTabTitle({})).toBe('New Tab');
  });
});
