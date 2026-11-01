import { normalizeUrl } from '../../lib/url';

/** `bookmarkId -> tabId` のマップを保存する `chrome.storage.session` のキー。 */
export const PINNED_TAB_MAP_STORAGE_KEY = 'pinnedTabMap';

export type PinnedTabMap = Readonly<Record<string, number>>;

export interface TabIdentity {
  id?: number | undefined;
  url?: string | undefined;
  pinned: boolean;
}

export interface BookmarkIdentity {
  id: string;
  url: string;
}

/**
 * 保存されたマップを読み取り可能な形へ変換する。壊れた値は空のマップとして扱う。
 */
export function parsePinnedTabMap(value: unknown): Record<string, number> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [bookmarkId, tabId] of Object.entries(value)) {
    if (typeof tabId === 'number' && Number.isInteger(tabId)) {
      result[bookmarkId] = tabId;
    }
  }
  return result;
}

/**
 * 存在しないブックマークや、ピン留めされていないタブを指すエントリを取り除く。
 */
export function prunePinnedTabMap(
  map: PinnedTabMap,
  bookmarkIds: ReadonlySet<string>,
  tabs: readonly TabIdentity[],
): Record<string, number> {
  const pinnedTabIds = new Set(
    tabs.filter((tab) => tab.pinned && tab.id !== undefined).map((tab) => tab.id as number),
  );

  const result: Record<string, number> = {};
  for (const [bookmarkId, tabId] of Object.entries(map)) {
    if (bookmarkIds.has(bookmarkId) && pinnedTabIds.has(tabId)) {
      result[bookmarkId] = tabId;
    }
  }
  return result;
}

/**
 * マップに載っていないピン留めタブを、URL が一致するブックマークへ結びつける。
 *
 * ブラウザ再起動でタブ ID が変わったときの復元に使う。同じ URL のブックマークが
 * 複数ある場合は誤った対応を避けるため結びつけない。
 */
export function bindUnmappedPins(
  map: PinnedTabMap,
  bookmarks: readonly BookmarkIdentity[],
  tabs: readonly TabIdentity[],
): Record<string, number> {
  const mappedTabIds = new Set(Object.values(map));
  const mappedBookmarkIds = new Set(Object.keys(map));
  const result: Record<string, number> = { ...map };

  for (const tab of tabs) {
    if (!tab.pinned || tab.id === undefined || tab.url === undefined || mappedTabIds.has(tab.id)) {
      continue;
    }

    const normalizedTabUrl = normalizeUrl(tab.url);
    const candidates = bookmarks.filter(
      (bookmark) =>
        !mappedBookmarkIds.has(bookmark.id) && normalizeUrl(bookmark.url) === normalizedTabUrl,
    );

    if (candidates.length !== 1) {
      continue;
    }

    const candidate = candidates[0];
    if (candidate === undefined) {
      continue;
    }

    result[candidate.id] = tab.id;
    mappedTabIds.add(tab.id);
    mappedBookmarkIds.add(candidate.id);
  }

  return result;
}

/** 2つのマップが同じエントリを持つかを返す。 */
export function pinnedTabMapsEqual(a: PinnedTabMap, b: PinnedTabMap): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key]);
}
