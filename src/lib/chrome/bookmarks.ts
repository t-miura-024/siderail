import type { Unsubscribe } from './events';
import { subscribeToEvents } from './events';

export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

/** Chrome ブックマークツリーのブックマークバーのルート ID。 */
const BOOKMARK_BAR_ID = '1';

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
