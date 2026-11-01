import { describe, expect, it } from 'vitest';
import { reconcilePins } from './pins';

interface TestTab {
  id: number;
  url: string;
  pinned: boolean;
  title: string;
}

const bookmarks = [
  { id: 'github', url: 'https://github.com/' },
  { id: 'mail', url: 'https://mail.google.com/' },
];

function tab(id: number, url: string, pinned: boolean): TestTab {
  return { id, url, pinned, title: url };
}

describe('reconcilePins', () => {
  it('マップされたピン留めタブをライブタブとして返す', () => {
    const tabs = [tab(10, 'https://github.com/', true)];
    const result = reconcilePins(bookmarks, tabs, { github: 10 });

    expect(result.liveByBookmarkId.get('github')).toEqual(tabs[0]);
    expect(result.unmappedTabs).toEqual([]);
    expect(result.changed).toBe(false);
  });

  it('マップがピン留めされていないタブを指していたら捨てる', () => {
    const tabs = [tab(10, 'https://github.com/', false)];
    const result = reconcilePins(bookmarks, tabs, { github: 10 });

    expect(result.liveByBookmarkId.size).toBe(0);
    expect(result.map).toEqual({});
    expect(result.changed).toBe(true);
  });

  it('URL が一致する未マップのピン留めタブを再バインドする', () => {
    const tabs = [tab(20, 'https://mail.google.com', true)];
    const result = reconcilePins(bookmarks, tabs, {});

    expect(result.map).toEqual({ mail: 20 });
    expect(result.liveByBookmarkId.get('mail')).toEqual(tabs[0]);
    expect(result.changed).toBe(true);
  });

  it('対応するブックマークがないピン留めタブは未マップとして返す', () => {
    const tabs = [tab(30, 'https://example.com/', true)];
    const result = reconcilePins(bookmarks, tabs, {});

    expect(result.map).toEqual({});
    expect(result.unmappedTabs).toEqual(tabs);
  });

  it('ブックマークが消えたエントリを捨てる', () => {
    const tabs = [tab(10, 'https://github.com/', true)];
    const result = reconcilePins([], tabs, { github: 10 });

    expect(result.map).toEqual({});
    expect(result.unmappedTabs).toEqual(tabs);
    expect(result.changed).toBe(true);
  });
});
