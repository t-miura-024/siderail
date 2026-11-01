import type { Unsubscribe } from './events';
import { subscribeToEvents } from './events';

export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

/** Chrome ブックマークツリーのブックマークバーのルート ID。 */
export const BOOKMARK_BAR_ID = '1';

/**
 * ブックマークバー直下のノード一覧を返す。他のルートは返さない。
 */
export async function getBookmarkBarTree(): Promise<BookmarkNode[]> {
  const tree = await chrome.bookmarks.getTree();
  const bookmarkBar = tree[0]?.children?.find((node) => node.id === BOOKMARK_BAR_ID);
  return bookmarkBar?.children ?? [];
}

export function onBookmarksChanged(listener: () => void): Unsubscribe {
  return subscribeToEvents(
    [
      chrome.bookmarks.onCreated,
      chrome.bookmarks.onRemoved,
      chrome.bookmarks.onChanged,
      chrome.bookmarks.onMoved,
      chrome.bookmarks.onChildrenReordered,
    ],
    listener,
  );
}

/** ブックマークバー配下の `parentId` にブックマークを追加し、作成されたノードを返す。 */
export async function createBookmark(
  parentId: string,
  title: string,
  url: string,
  index?: number,
): Promise<BookmarkNode> {
  return chrome.bookmarks.create({ parentId, title, url, index });
}

/** ブックマークバー配下の `parentId` にフォルダを追加する。 */
export async function createBookmarkFolder(parentId: string, title: string): Promise<void> {
  await chrome.bookmarks.create({ parentId, title });
}

/** フォルダの名前を変更する。 */
export async function renameBookmarkFolder(folderId: string, title: string): Promise<void> {
  await chrome.bookmarks.update(folderId, { title });
}

/** ブックマークを別のフォルダや位置へ移動する。`index` は移動前の親フォルダ内での挿入位置。 */
export async function moveBookmark(
  bookmarkId: string,
  parentId: string,
  index?: number,
): Promise<void> {
  await chrome.bookmarks.move(bookmarkId, { parentId, index });
}

/** ブックマークの名前と URL を変更する。 */
export async function updateBookmark(
  bookmarkId: string,
  title: string,
  url: string,
): Promise<void> {
  await chrome.bookmarks.update(bookmarkId, { title, url });
}

/** ブックマークを削除する。 */
export async function removeBookmark(bookmarkId: string): Promise<void> {
  await chrome.bookmarks.remove(bookmarkId);
}

/** フォルダとその中のブックマークをすべて削除する。 */
export async function removeBookmarkFolder(folderId: string): Promise<void> {
  await chrome.bookmarks.removeTree(folderId);
}
