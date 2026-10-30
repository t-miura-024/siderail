import { describe, expect, it } from 'vitest';
import { getTabTitle, sortTabs } from './tabs';

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
