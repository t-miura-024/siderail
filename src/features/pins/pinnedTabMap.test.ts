import { describe, expect, it } from 'vitest';
import {
  bindUnmappedPins,
  parsePinnedTabMap,
  pinnedTabMapsEqual,
  prunePinnedTabMap,
} from './pinnedTabMap';

describe('parsePinnedTabMap', () => {
  it('数値のタブ ID だけを残す', () => {
    expect(parsePinnedTabMap({ a: 1, b: '2', c: 3.5, d: 4 })).toEqual({ a: 1, d: 4 });
  });

  it('配列や null は空のマップとして扱う', () => {
    expect(parsePinnedTabMap(null)).toEqual({});
    expect(parsePinnedTabMap([1, 2])).toEqual({});
    expect(parsePinnedTabMap('x')).toEqual({});
  });
});

describe('prunePinnedTabMap', () => {
  const tabs = [
    { id: 1, pinned: true },
    { id: 2, pinned: false },
  ];

  it('存在しないブックマークのエントリを捨てる', () => {
    expect(prunePinnedTabMap({ missing: 1 }, new Set(['known']), tabs)).toEqual({});
  });

  it('ピン留めされていないタブのエントリを捨てる', () => {
    expect(prunePinnedTabMap({ known: 2 }, new Set(['known']), tabs)).toEqual({});
  });

  it('有効なエントリは残す', () => {
    expect(prunePinnedTabMap({ known: 1 }, new Set(['known']), tabs)).toEqual({ known: 1 });
  });
});

describe('bindUnmappedPins', () => {
  const bookmarks = [
    { id: 'a', url: 'https://example.com/' },
    { id: 'b', url: 'https://example.com/duplicate' },
    { id: 'c', url: 'https://example.com/duplicate' },
  ];

  it('URL が一致するブックマークが1件だけなら結びつける', () => {
    const tabs = [{ id: 10, url: 'https://example.com', pinned: true }];
    expect(bindUnmappedPins({}, bookmarks, tabs)).toEqual({ a: 10 });
  });

  it('同じ URL のブックマークが複数ある場合は結びつけない', () => {
    const tabs = [{ id: 11, url: 'https://example.com/duplicate', pinned: true }];
    expect(bindUnmappedPins({}, bookmarks, tabs)).toEqual({});
  });

  it('すでにマップ済みのタブは対象外にする', () => {
    const tabs = [{ id: 10, url: 'https://example.com/', pinned: true }];
    expect(bindUnmappedPins({ a: 10 }, bookmarks, tabs)).toEqual({ a: 10 });
  });

  it('ピン留めされていないタブは対象外にする', () => {
    const tabs = [{ id: 12, url: 'https://example.com/', pinned: false }];
    expect(bindUnmappedPins({}, bookmarks, tabs)).toEqual({});
  });
});

describe('pinnedTabMapsEqual', () => {
  it('同じエントリなら true を返す', () => {
    expect(pinnedTabMapsEqual({ a: 1 }, { a: 1 })).toBe(true);
  });

  it('件数や値が違えば false を返す', () => {
    expect(pinnedTabMapsEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(pinnedTabMapsEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});
