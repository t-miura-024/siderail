import { useEffect, useState } from 'react';
import { openBookmarkUrl } from '@/features/bookmarks/openBookmark';
import { findBookmarkRow, type BookmarkRowData } from '@/features/bookmarks/tree';
import { useBookmarks } from '@/features/bookmarks/useBookmarks';
import { useDragContext } from '@/features/drag/DragProvider';
import type { DropPosition } from '@/features/drag/types';
import { BOOKMARK_BAR_ID, createBookmark, moveBookmark } from '@/lib/chrome';
import { BookmarkDialog, type BookmarkDialogRequest } from './BookmarkDialog';
import { BookmarkRow, type ContextMenuPosition } from './BookmarkRow';
import { BookmarkToolbar } from './BookmarkToolbar';
import { BookmarkTreeRows } from './BookmarkTreeRows';
import { ContextMenu } from './ContextMenu';

type ContextMenuState = (
  | { kind: 'folder'; folderId: string; title: string; expanded: boolean }
  | { kind: 'bookmark'; bookmarkId: string; title: string; url: string }
) &
  ContextMenuPosition;

function reportOpenError(error: unknown): void {
  console.error('ブックマークを開けませんでした', error);
}

function reportCreateError(error: unknown): void {
  console.error('ブックマークを追加できませんでした', error);
}

function reportMoveError(error: unknown): void {
  console.error('ブックマークを移動できませんでした', error);
}

function getInsertionIndex(row: BookmarkRowData, position: DropPosition): number {
  return row.index + (position === 'after' ? 1 : 0);
}

/**
 * Chrome 方式のブックマーク一覧。ブックマークバー配下をそのまま表示する。
 */
export function BookmarkSection() {
  const { items, toggleFolder } = useBookmarks();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialog, setDialog] = useState<BookmarkDialogRequest | null>(null);
  const { setDropHandler } = useDragContext();

  useEffect(() => {
    setDropHandler('bookmark', (payload, target) => {
      const row = findBookmarkRow(items, target.targetId);
      if (row === undefined) {
        return;
      }

      if (payload.kind === 'tab') {
        if (row.kind === 'folder' && target.position === 'inside') {
          void createBookmark(row.id, payload.tab.title, payload.tab.url, 0).catch(
            reportCreateError,
          );
          if (!row.expanded) {
            toggleFolder(row.id);
          }
          return;
        }

        void createBookmark(
          row.parentId,
          payload.tab.title,
          payload.tab.url,
          getInsertionIndex(row, target.position),
        ).catch(reportCreateError);
        return;
      }

      if (payload.kind !== 'bookmark') {
        return;
      }

      const bookmark = payload.bookmark;
      if (bookmark.id === row.id) {
        return;
      }

      if (row.kind === 'folder' && target.position === 'inside') {
        void moveBookmark(bookmark.id, row.id, 0).catch(reportMoveError);
        if (!row.expanded) {
          toggleFolder(row.id);
        }
        return;
      }

      void moveBookmark(bookmark.id, row.parentId, getInsertionIndex(row, target.position)).catch(
        reportMoveError,
      );
    });

    return () => {
      setDropHandler('bookmark', null);
    };
  }, [items, setDropHandler, toggleFolder]);

  const openDialog = (request: BookmarkDialogRequest) => {
    setDialog(request);
    setContextMenu(null);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const folderMenu = contextMenu?.kind === 'folder' ? contextMenu : null;
  const bookmarkMenu = contextMenu?.kind === 'bookmark' ? contextMenu : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-1.5 pt-1.5">
        <BookmarkToolbar
          onAddFolder={() => {
            openDialog({ kind: 'create-folder', parentId: BOOKMARK_BAR_ID });
          }}
          onAddBookmark={() => {
            openDialog({ kind: 'create-bookmark', parentId: BOOKMARK_BAR_ID });
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-2">
        <BookmarkTreeRows
          label="ブックマーク"
          items={items}
          dropSection="bookmark"
          onToggleFolder={toggleFolder}
          onOpenFolderContextMenu={(row, position) => {
            setContextMenu({
              kind: 'folder',
              ...position,
              folderId: row.id,
              title: row.title,
              expanded: row.expanded,
            });
          }}
          renderLeaf={(row) => (
            <BookmarkRow
              id={row.id}
              parentId={row.parentId}
              index={row.index}
              title={row.title}
              url={row.url}
              depth={row.depth}
              onClick={() => {
                void openBookmarkUrl(row.url).catch(reportOpenError);
              }}
              onOpenContextMenu={(position) => {
                setContextMenu({
                  kind: 'bookmark',
                  ...position,
                  bookmarkId: row.id,
                  title: row.title,
                  url: row.url,
                });
              }}
            />
          )}
        />
      </div>

      {folderMenu !== null && (
        <ContextMenu
          x={folderMenu.x}
          y={folderMenu.y}
          label="フォルダの操作"
          onClose={closeContextMenu}
          actions={[
            {
              label: '名前を変更',
              onSelect: () => {
                openDialog({
                  kind: 'rename-folder',
                  folderId: folderMenu.folderId,
                  title: folderMenu.title,
                });
              },
            },
            {
              label: 'フォルダを追加',
              onSelect: () => {
                if (!folderMenu.expanded) {
                  toggleFolder(folderMenu.folderId);
                }
                openDialog({ kind: 'create-folder', parentId: folderMenu.folderId });
              },
            },
            {
              label: 'ブックマークを追加',
              onSelect: () => {
                if (!folderMenu.expanded) {
                  toggleFolder(folderMenu.folderId);
                }
                openDialog({ kind: 'create-bookmark', parentId: folderMenu.folderId });
              },
            },
            {
              label: '削除',
              destructive: true,
              onSelect: () => {
                openDialog({
                  kind: 'delete-folder',
                  folderId: folderMenu.folderId,
                  title: folderMenu.title,
                });
              },
            },
          ]}
        />
      )}

      {bookmarkMenu !== null && (
        <ContextMenu
          x={bookmarkMenu.x}
          y={bookmarkMenu.y}
          label="ブックマークの操作"
          onClose={closeContextMenu}
          actions={[
            {
              label: '編集',
              onSelect: () => {
                openDialog({
                  kind: 'edit-bookmark',
                  bookmarkId: bookmarkMenu.bookmarkId,
                  title: bookmarkMenu.title,
                  url: bookmarkMenu.url,
                });
              },
            },
            {
              label: '削除',
              destructive: true,
              onSelect: () => {
                openDialog({
                  kind: 'delete-bookmark',
                  bookmarkId: bookmarkMenu.bookmarkId,
                  title: bookmarkMenu.title,
                });
              },
            },
          ]}
        />
      )}

      {dialog !== null && (
        <BookmarkDialog
          request={dialog}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
