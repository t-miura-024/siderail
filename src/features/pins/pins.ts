import {
  bindUnmappedPins,
  pinnedTabMapsEqual,
  prunePinnedTabMap,
  type BookmarkIdentity,
  type PinnedTabMap,
  type TabIdentity,
} from './pinnedTabMap';

export interface PinReconciliation<T extends TabIdentity> {
  /** 検証と再バインドを経たマップ。 */
  map: Record<string, number>;
  /** ブックマーク ID からライブタブへの対応。 */
  liveByBookmarkId: Map<string, T>;
  /** どのブックマークにも対応しないピン留めタブ。 */
  unmappedTabs: T[];
  /** 保存済みのマップから変化したか。 */
  changed: boolean;
}

/**
 * ブックマーク・タブ・保存済みマップから、Pinned の表示に必要な状態を組み立てる。
 *
 * 1. 存在しないブックマークやピン留めされていないタブを指すエントリを捨てる
 * 2. マップに載っていないピン留めタブを URL で再バインドする
 * 3. ライブタブと未マップのピン留めタブに振り分ける
 */
export function reconcilePins<T extends TabIdentity>(
  bookmarks: readonly BookmarkIdentity[],
  tabs: readonly T[],
  rawMap: PinnedTabMap,
): PinReconciliation<T> {
  const pruned = prunePinnedTabMap(rawMap, new Set(bookmarks.map((bookmark) => bookmark.id)), tabs);
  const map = bindUnmappedPins(pruned, bookmarks, tabs);

  const tabsById = new Map<number, T>();
  for (const tab of tabs) {
    if (tab.id !== undefined) {
      tabsById.set(tab.id, tab);
    }
  }

  const liveByBookmarkId = new Map<string, T>();
  const usedTabIds = new Set<number>();

  for (const [bookmarkId, tabId] of Object.entries(map)) {
    const tab = tabsById.get(tabId);
    if (tab?.pinned === true) {
      liveByBookmarkId.set(bookmarkId, tab);
      usedTabIds.add(tabId);
    }
  }

  const unmappedTabs = tabs.filter(
    (tab) => tab.pinned && tab.id !== undefined && !usedTabIds.has(tab.id),
  );

  return {
    map,
    liveByBookmarkId,
    unmappedTabs,
    changed: !pinnedTabMapsEqual(rawMap, map),
  };
}
