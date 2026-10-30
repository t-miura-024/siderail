import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBookmarkBarTree,
  getStoredValue,
  onBookmarksChanged,
  setStoredValue,
} from '../../lib/chrome';
import {
  COLLAPSED_FOLDERS_STORAGE_KEY,
  parseCollapsedFolderIds,
  toggleCollapsedFolder,
} from './folderState';
import { flattenBookmarkTree, type BookmarkRowData, type BookmarkTreeNode } from './tree';

export interface UseBookmarksResult {
  rows: BookmarkRowData[];
  toggleFolder: (folderId: string) => void;
}

function reportError(error: unknown): void {
  console.error('ブックマークの状態を読み込めませんでした', error);
}

/**
 * ブックマークバー配下のツリーとフォルダ開閉状態を購読し、表示用の行一覧を返す。
 */
export function useBookmarks(): UseBookmarksResult {
  const [tree, setTree] = useState<readonly BookmarkTreeNode[] | undefined>(undefined);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<readonly string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadTree = async (): Promise<void> => {
      const nodes = await getBookmarkBarTree();
      if (!cancelled) {
        setTree(nodes);
      }
    };

    void loadTree().catch(reportError);
    const unsubscribe = onBookmarksChanged(() => {
      void loadTree().catch(reportError);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getStoredValue<unknown>(COLLAPSED_FOLDERS_STORAGE_KEY)
      .then((stored) => {
        if (!cancelled) {
          setCollapsedFolderIds(parseCollapsedFolderIds(stored));
        }
      })
      .catch(reportError);

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFolder = useCallback(
    (folderId: string) => {
      const next = toggleCollapsedFolder(collapsedFolderIds, folderId);
      setCollapsedFolderIds(next);
      void setStoredValue(COLLAPSED_FOLDERS_STORAGE_KEY, next).catch((error: unknown) => {
        console.error('フォルダの開閉状態を保存できませんでした', error);
      });
    },
    [collapsedFolderIds],
  );

  const rows = useMemo(
    () => (tree === undefined ? [] : flattenBookmarkTree(tree, new Set(collapsedFolderIds))),
    [tree, collapsedFolderIds],
  );

  return { rows, toggleFolder };
}
