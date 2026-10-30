/**
 * ブックマークツリーの平坦化に使うノード。Chrome の `chrome.bookmarks.BookmarkTreeNode` と
 * 構造的に互換な最小限の形だけを持つ。
 */
export interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string | undefined;
  children?: readonly BookmarkTreeNode[] | undefined;
}

interface BookmarkRowBase {
  id: string;
  title: string;
  depth: number;
}

export interface BookmarkFolderRowData extends BookmarkRowBase {
  kind: 'folder';
  expanded: boolean;
}

export interface BookmarkItemRowData extends BookmarkRowBase {
  kind: 'bookmark';
  url: string;
}

export type BookmarkRowData = BookmarkFolderRowData | BookmarkItemRowData;

/**
 * ブックマークツリーを Chrome の順序のまま行の一覧へ平坦化する。
 *
 * - URL を持つノードをブックマーク行、持たないノードをフォルダ行として扱う
 * - `collapsedFolderIds` に含まれないフォルダは開いた状態（保存状態がないフォルダの既定）
 * - 閉じたフォルダの子孫は一覧に含めない
 * - 子項目の `depth` は親フォルダより 1 大きい
 */
export function flattenBookmarkTree(
  nodes: readonly BookmarkTreeNode[],
  collapsedFolderIds: ReadonlySet<string>,
): BookmarkRowData[] {
  const rows: BookmarkRowData[] = [];

  const walk = (items: readonly BookmarkTreeNode[], depth: number): void => {
    for (const node of items) {
      if (node.url !== undefined) {
        rows.push({ kind: 'bookmark', id: node.id, title: node.title, url: node.url, depth });
        continue;
      }

      const expanded = !collapsedFolderIds.has(node.id);
      rows.push({ kind: 'folder', id: node.id, title: node.title, depth, expanded });
      if (expanded) {
        walk(node.children ?? [], depth + 1);
      }
    }
  };

  walk(nodes, 0);
  return rows;
}
