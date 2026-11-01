import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BookmarkItemRowData } from '@/features/bookmarks/tree';
import type { DraggedPin } from '@/features/drag/types';
import {
  BOOKMARK_BAR_ID,
  closeTab,
  createBookmark,
  createPinnedTab,
  getSessionValue,
  getTab,
  pinTab,
  removeBookmark,
  resetTabUrl,
  setSessionValue,
  setTabMuted,
  unpinTab,
  type Tab,
} from '@/lib/chrome';
import { reconcilePins } from './pins';
import { parsePinnedTabMap, PINNED_TAB_MAP_STORAGE_KEY, pinnedTabMapsEqual } from './pinnedTabMap';

/** ピン解除を取り消すために保持する情報。 */
export interface UndoPinnedTab {
  bookmark: {
    parentId: string;
    index: number;
    title: string;
    url: string;
  };
  tabId?: number | undefined;
}

export interface UsePinsResult {
  liveByBookmarkId: Map<string, Tab>;
  unmappedTabs: Tab[];
  openPin: (bookmark: BookmarkItemRowData) => Promise<void>;
  closePin: (bookmarkId: string, tabId: number) => Promise<void>;
  resetPin: (tabId: number, url: string) => Promise<void>;
  toggleMute: (tabId: number, muted: boolean) => Promise<void>;
  pinTabToBookmark: (bookmarkId: string, tabId: number) => Promise<void>;
  /** ピン解除。ブックマークを削除し、タブは Today に残す。 */
  unpinPin: (pin: DraggedPin) => Promise<UndoPinnedTab>;
  undoUnpin: (undo: UndoPinnedTab) => Promise<void>;
  /** 未マップのピン留めタブをブックマークとして保存する。 */
  saveUnmappedPin: (tab: Tab) => Promise<void>;
}

/**
 * Pinned の状態を管理する。
 *
 * マップは `chrome.storage.session` に保存し、タブ一覧が変わるたびに検証と再バインドを行う。
 * 検証結果は描画時に導出し、変化があったときだけ保存する。
 */
export function usePins(
  bookmarks: readonly BookmarkItemRowData[],
  tabs: readonly Tab[],
  ready: boolean,
): UsePinsResult {
  const [storedMap, setStoredMap] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const persistedMapRef = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getSessionValue<unknown>(PINNED_TAB_MAP_STORAGE_KEY)
      .then((stored) => {
        if (cancelled) {
          return;
        }
        setStoredMap(parsePinnedTabMap(stored));
        setLoaded(true);
      })
      .catch((error: unknown) => {
        console.error('ピン留めタブの対応を読み込めませんでした', error);
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reconciliation = useMemo(
    () => reconcilePins(ready ? bookmarks : [], ready ? tabs : [], ready ? storedMap : {}),
    [ready, bookmarks, tabs, storedMap],
  );
  const effectiveMap = reconciliation.map;

  // イベントハンドラから最新のマップを参照するための ref。
  const effectiveMapRef = useRef<Record<string, number>>(effectiveMap);
  useEffect(() => {
    effectiveMapRef.current = effectiveMap;
  }, [effectiveMap]);

  useEffect(() => {
    if (!loaded || !ready) {
      return;
    }
    if (
      persistedMapRef.current !== null &&
      pinnedTabMapsEqual(persistedMapRef.current, effectiveMap)
    ) {
      return;
    }

    persistedMapRef.current = effectiveMap;
    void setSessionValue(PINNED_TAB_MAP_STORAGE_KEY, effectiveMap).catch((error: unknown) => {
      console.error('ピン留めタブの対応を保存できませんでした', error);
    });
  }, [loaded, ready, effectiveMap]);

  const persistMap = useCallback((next: Record<string, number>) => {
    setStoredMap(next);
    persistedMapRef.current = next;
    effectiveMapRef.current = next;
    void setSessionValue(PINNED_TAB_MAP_STORAGE_KEY, next).catch((error: unknown) => {
      console.error('ピン留めタブの対応を保存できませんでした', error);
    });
  }, []);

  const openPin = useCallback(
    async (bookmark: BookmarkItemRowData) => {
      const tab = await createPinnedTab(bookmark.url);
      if (tab.id === undefined) {
        return;
      }
      persistMap({ ...effectiveMapRef.current, [bookmark.id]: tab.id });
    },
    [persistMap],
  );

  const closePin = useCallback(
    async (bookmarkId: string, tabId: number) => {
      await closeTab(tabId);
      const next = { ...effectiveMapRef.current };
      delete next[bookmarkId];
      persistMap(next);
    },
    [persistMap],
  );

  const resetPin = useCallback(async (tabId: number, url: string) => {
    await resetTabUrl(tabId, url);
  }, []);

  const toggleMute = useCallback(async (tabId: number, muted: boolean) => {
    await setTabMuted(tabId, muted);
  }, []);

  const pinTabToBookmark = useCallback(
    async (bookmarkId: string, tabId: number) => {
      await pinTab(tabId);
      persistMap({ ...effectiveMapRef.current, [bookmarkId]: tabId });
    },
    [persistMap],
  );

  const unpinPin = useCallback(
    async (pin: DraggedPin): Promise<UndoPinnedTab> => {
      const undo: UndoPinnedTab = {
        bookmark: {
          parentId: pin.parentId,
          index: pin.index,
          title: pin.title,
          url: pin.url,
        },
        tabId: pin.tabId,
      };

      if (pin.tabId !== undefined) {
        await unpinTab(pin.tabId);
      }
      await removeBookmark(pin.bookmarkId);

      const next = { ...effectiveMapRef.current };
      delete next[pin.bookmarkId];
      persistMap(next);

      return undo;
    },
    [persistMap],
  );

  const undoUnpin = useCallback(
    async (undo: UndoPinnedTab) => {
      const created = await createBookmark(
        undo.bookmark.parentId,
        undo.bookmark.title,
        undo.bookmark.url,
        undo.bookmark.index,
      );

      if (undo.tabId === undefined) {
        return;
      }

      const tab = await getTab(undo.tabId);
      if (tab === undefined) {
        return;
      }

      await pinTab(undo.tabId);
      persistMap({ ...effectiveMapRef.current, [created.id]: undo.tabId });
    },
    [persistMap],
  );

  const saveUnmappedPin = useCallback(
    async (tab: Tab) => {
      if (tab.id === undefined || tab.url === undefined) {
        return;
      }

      const title = tab.title?.trim() || tab.url;
      const created = await createBookmark(BOOKMARK_BAR_ID, title, tab.url);
      persistMap({ ...effectiveMapRef.current, [created.id]: tab.id });
    },
    [persistMap],
  );

  return useMemo(
    () => ({
      liveByBookmarkId: reconciliation.liveByBookmarkId,
      unmappedTabs: reconciliation.unmappedTabs,
      openPin,
      closePin,
      resetPin,
      toggleMute,
      pinTabToBookmark,
      unpinPin,
      undoUnpin,
      saveUnmappedPin,
    }),
    [
      reconciliation,
      openPin,
      closePin,
      resetPin,
      toggleMute,
      pinTabToBookmark,
      unpinPin,
      undoUnpin,
      saveUnmappedPin,
    ],
  );
}
