/**
 * ブックマークツリーの表示に使うノード。Chrome の `chrome.bookmarks.BookmarkTreeNode` と
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
  parentId: string;
}

export interface BookmarkFolderRowData extends BookmarkRowBase {
  kind: 'folder';
  expanded: boolean;
  index: number;
  children: BookmarkRowData[];
}

export interface BookmarkItemRowData extends BookmarkRowBase {
  kind: 'bookmark';
  url: string;
  index: number;
}

export type BookmarkRowData = BookmarkFolderRowData | BookmarkItemRowData;

/**
 * ブックマークツリーを表示用のネスト構造へ変換する。
 *
 * - URL を持つノードをブックマーク行、持たないノードをフォルダ行として扱う
 * - `collapsedFolderIds` に含まれないフォルダは開いた状態（保存状態がないフォルダの既定）
 * - 閉じたフォルダも子孫を保持する（開閉アニメーションと移動先の件数計算に使う）
 * - 子項目の `depth` は親フォルダより 1 大きい
 */
export function buildBookmarkTree(
  nodes: readonly BookmarkTreeNode[],
  collapsedFolderIds: ReadonlySet<string>,
  rootParentId: string,
): BookmarkRowData[] {
  const walk = (
    items: readonly BookmarkTreeNode[],
    depth: number,
    parentId: string,
  ): BookmarkRowData[] =>
    items.map((node, index) => {
      if (node.url !== undefined) {
        return {
          kind: 'bookmark',
          id: node.id,
          title: node.title,
          url: node.url,
          depth,
          parentId,
          index,
        };
      }

      return {
        kind: 'folder',
        id: node.id,
        title: node.title,
        depth,
        parentId,
        index,
        expanded: !collapsedFolderIds.has(node.id),
        children: walk(node.children ?? [], depth + 1, node.id),
      };
    });

  return walk(nodes, 0, rootParentId);
}

/** 行一覧から ID に一致する行を探す。フォルダの中も再帰的に探す。 */
export function findBookmarkRow(
  items: readonly BookmarkRowData[],
  id: string,
): BookmarkRowData | undefined {
  for (const row of items) {
    if (row.id === id) {
      return row;
    }
    if (row.kind === 'folder') {
      const found = findBookmarkRow(row.children, id);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

/** 開閉状態に関係なく、すべてのブックマーク行を平坦な配列で返す。 */
export function flattenBookmarkItems(items: readonly BookmarkRowData[]): BookmarkItemRowData[] {
  const result: BookmarkItemRowData[] = [];

  const walk = (rows: readonly BookmarkRowData[]): void => {
    for (const row of rows) {
      if (row.kind === 'bookmark') {
        result.push(row);
      } else {
        walk(row.children);
      }
    }
  };

  walk(items);
  return result;
}
