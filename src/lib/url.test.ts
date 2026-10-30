import { describe, expect, it } from 'vitest';
import { findTabByUrl, normalizeUrl } from './url';

describe('normalizeUrl', () => {
  it('末尾スラッシュを無視する', () => {
    expect(normalizeUrl('https://example.com/week/')).toBe(
      normalizeUrl('https://example.com/week'),
    );
  });

  it('#hash を無視する', () => {
    expect(normalizeUrl('https://example.com/week#top')).toBe(
      normalizeUrl('https://example.com/week'),
    );
  });

  it('末尾スラッシュと #hash の両方を無視する', () => {
    expect(normalizeUrl('https://calendar.example.com/week/#top')).toBe(
      normalizeUrl('https://calendar.example.com/week'),
    );
  });

  it('クエリ文字列は比較対象として保持する', () => {
    expect(normalizeUrl('https://example.com/search?q=a')).not.toBe(
      normalizeUrl('https://example.com/search?q=b'),
    );
  });

  it('scheme は比較対象として保持する', () => {
    expect(normalizeUrl('http://example.com/')).not.toBe(normalizeUrl('https://example.com/'));
  });

  it('URL として解釈できない文字列はそのまま返す', () => {
    expect(normalizeUrl('not a url')).toBe('not a url');
  });
});

describe('findTabByUrl', () => {
  const mailUrl = 'https://mail.example.com/inbox';

  it('末尾スラッシュと #hash の違いを無視して一致するタブを返す', () => {
    const tab = { id: 1, index: 0, url: 'https://mail.example.com/inbox/#top' };

    expect(findTabByUrl([tab], mailUrl)).toBe(tab);
  });

  it('同じ URL のタブが複数ある場合は渡された順（Chrome のタブ順）で最初のタブを返す', () => {
    const first = { id: 1, index: 0, url: mailUrl };
    const second = { id: 2, index: 1, url: `${mailUrl}/` };

    expect(findTabByUrl([first, second], mailUrl)).toBe(first);
  });

  it('クエリ文字列が異なるタブとは一致しない', () => {
    const tab = { id: 1, index: 0, url: `${mailUrl}?label=unread` };

    expect(findTabByUrl([tab], mailUrl)).toBeUndefined();
  });

  it('scheme が異なるタブとは一致しない', () => {
    const tab = { id: 1, index: 0, url: 'http://mail.example.com/inbox' };

    expect(findTabByUrl([tab], mailUrl)).toBeUndefined();
  });

  it('URL を持たないタブは一致しない', () => {
    const tab = { id: 1, index: 0, url: undefined };

    expect(findTabByUrl([tab], mailUrl)).toBeUndefined();
  });

  it('一致するタブがなければ undefined を返す', () => {
    const tab = { id: 1, index: 0, url: 'https://example.com/' };

    expect(findTabByUrl([tab], mailUrl)).toBeUndefined();
  });
});
