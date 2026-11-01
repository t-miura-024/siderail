import { useEffect, useState } from 'react';
import {
  findBookmarkRow,
  type BookmarkFolderRowData,
  type BookmarkItemRowData,
  type BookmarkRowData,
} from '@/features/bookmarks/tree';
import type { ContextMenuPosition } from '@/components/BookmarkRow';
import { useDragContext } from '@/features/drag/DragProvider';
import type { DraggedPin, DropPosition } from '@/features/drag/types';
import type { UsePinsResult } from '@/features/pins/usePins';
import {
  BOOKMARK_BAR_ID,
  activateTab,
  closeTab,
  createBookmark,
  moveBookmark,
  type Tab,
} from '@/lib/chrome';
import { normalizeUrl } from '@/lib/url';
import { BookmarkDialog, type BookmarkDialogRequest } from './BookmarkDialog';
import { BookmarkToolbar } from './BookmarkToolbar';
import { BookmarkTreeRows } from './BookmarkTreeRows';
import { ContextMenu, type ContextMenuAction } from './ContextMenu';
import { PinRow } from './PinRow';
import { UnmappedPinRow } from './UnmappedPinRow';

type PinMenuState =
  | ({ kind: 'pin'; row: BookmarkItemRowData; liveTab?: Tab | undefined } & ContextMenuPosition)
  | ({ kind: 'folder'; row: BookmarkFolderRowData } & ContextMenuPosition)
  | ({ kind: 'unmapped'; tab: Tab } & ContextMenuPosition);

interface PinSectionProps {
  items: readonly BookmarkRowData[];
  pins: UsePinsResult;
  onToggleFolder: (folderId: string) => void;
  onUnpin: (pin: DraggedPin) => void;
}

function getInsertionIndex(row: BookmarkRowData, position: DropPosition): number {
  return row.index + (position === 'after' ? 1 : 0);
}

function reportError(message: string): (error: unknown) => void {
  return (error: unknown) => {
    console.error(message, error);
  };
}

/**
 * Arc 方式の Pinned 一覧。ブックマークバー配下をピンとして表示し、ライブタブの状態を重ねる。
 */
export function PinSection({ items, pins, onToggleFolder, onUnpin }: PinSectionProps) {
  const [contextMenu, setContextMenu] = useState<PinMenuState | null>(null);
  const [dialog, setDialog] = useState<BookmarkDialogRequest | null>(null);
  const { setDropHandler } = useDragContext();

  useEffect(() => {
    setDropHandler('pin', (payload, target) => {
      const row = findBookmarkRow(items, target.targetId);
      if (row === undefined) {
        return;
      }

      if (payload.kind === 'tab') {
        const insideFolder = row.kind === 'folder' && target.position === 'inside';
        const parentId = insideFolder ? row.id : row.parentId;
        const index = insideFolder ? 0 : getInsertionIndex(row, target.position);

        void createBookmark(parentId, payload.tab.title, payload.tab.url, index)
          .then(async (created) => {
            if (payload.tab.id !== undefined) {
              await pins.pinTabToBookmark(created.id, payload.tab.id);
            }
            if (insideFolder && row.kind === 'folder' && !row.expanded) {
              onToggleFolder(row.id);
            }
          })
          .catch(reportError('ピンを作成できませんでした'));
        return;
      }

      if (payload.kind !== 'pin') {
        return;
      }

      if (payload.pin.bookmarkId === row.id) {
        return;
      }

      if (row.kind === 'folder' && target.position === 'inside') {
        void moveBookmark(payload.pin.bookmarkId, row.id, 0).catch(
          reportError('ピンを移動できませんでした'),
        );
        if (!row.expanded) {
          onToggleFolder(row.id);
        }
        return;
      }

      void moveBookmark(
        payload.pin.bookmarkId,
        row.parentId,
        getInsertionIndex(row, target.position),
      ).catch(reportError('ピンを移動できませんでした'));
    });

    return () => {
      setDropHandler('pin', null);
    };
  }, [items, pins, onToggleFolder, setDropHandler]);

  const openDialog = (request: BookmarkDialogRequest) => {
    setDialog(request);
    setContextMenu(null);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const renderPin = (row: BookmarkItemRowData) => {
    const liveTab = pins.liveByBookmarkId.get(row.id);
    const canReset =
      liveTab !== undefined && normalizeUrl(liveTab.url ?? '') !== normalizeUrl(row.url);

    const activate = () => {
      if (liveTab?.id !== undefined) {
        void activateTab(liveTab.id).catch(reportError('タブを切り替えられませんでした'));
        return;
      }
      void pins.openPin(row).catch(reportError('ピンを開けませんでした'));
    };

    const handleFaviconClick = () => {
      if (liveTab?.id === undefined) {
        void pins.openPin(row).catch(reportError('ピンを開けませんでした'));
        return;
      }
      if (canReset) {
        void pins
          .resetPin(liveTab.id, row.url)
          .catch(reportError('ピン元の URL に戻せませんでした'));
        return;
      }
      void activateTab(liveTab.id).catch(reportError('タブを切り替えられませんでした'));
    };

    return (
      <PinRow
        row={row}
        liveTab={liveTab}
        canReset={canReset}
        onActivate={activate}
        onFaviconClick={handleFaviconClick}
        onClose={() => {
          if (liveTab?.id !== undefined) {
            void pins.closePin(row.id, liveTab.id).catch(reportError('タブを閉じられませんでした'));
          }
        }}
        onToggleMute={(muted) => {
          if (liveTab?.id !== undefined) {
            void pins.toggleMute(liveTab.id, muted).catch(reportError('ミュートできませんでした'));
          }
        }}
        onOpenContextMenu={(position) => {
          setContextMenu({ kind: 'pin', row, liveTab, ...position });
        }}
      />
    );
  };

  const footer =
    pins.unmappedTabs.length === 0 ? undefined : (
      <div className="flex flex-col gap-1 pt-1">
        <p className="px-2 pt-1 text-[11px] tracking-wide text-sidebar-muted">未マップのピン</p>
        {pins.unmappedTabs.map((tab) => {
          return (
            <UnmappedPinRow
              key={tab.id ?? tab.index}
              tab={tab}
              onActivate={() => {
                if (tab.id !== undefined) {
                  void activateTab(tab.id).catch(reportError('タブを切り替えられませんでした'));
                }
              }}
              onClose={() => {
                if (tab.id !== undefined) {
                  void closeTab(tab.id).catch(reportError('タブを閉じられませんでした'));
                }
              }}
              onToggleMute={(muted) => {
                if (tab.id !== undefined) {
                  void pins
                    .toggleMute(tab.id, muted)
                    .catch(reportError('ミュートできませんでした'));
                }
              }}
              onOpenContextMenu={(position) => {
                setContextMenu({ kind: 'unmapped', tab, ...position });
              }}
            />
          );
        })}
      </div>
    );

  const pinMenu = contextMenu?.kind === 'pin' ? contextMenu : null;
  const folderMenu = contextMenu?.kind === 'folder' ? contextMenu : null;
  const unmappedMenu = contextMenu?.kind === 'unmapped' ? contextMenu : null;

  const pinActions: readonly ContextMenuAction[] =
    pinMenu === null
      ? []
      : (() => {
          const actions: ContextMenuAction[] = [
            {
              label: '名前を変更',
              onSelect: () => {
                openDialog({
                  kind: 'edit-bookmark',
                  bookmarkId: pinMenu.row.id,
                  title: pinMenu.row.title,
                  url: pinMenu.row.url,
                });
              },
            },
          ];

          if (pinMenu.liveTab?.id !== undefined) {
            const tabId = pinMenu.liveTab.id;
            const muted = pinMenu.liveTab.mutedInfo?.muted === true;

            if (normalizeUrl(pinMenu.liveTab.url ?? '') !== normalizeUrl(pinMenu.row.url)) {
              actions.push({
                label: 'ピン元の URL に戻す',
                onSelect: () => {
                  closeContextMenu();
                  void pins
                    .resetPin(tabId, pinMenu.row.url)
                    .catch(reportError('ピン元の URL に戻せませんでした'));
                },
              });
            }

            actions.push({
              label: muted ? 'ミュートを解除' : 'ミュート',
              onSelect: () => {
                closeContextMenu();
                void pins
                  .toggleMute(tabId, !muted)
                  .catch(reportError('ミュートを変更できませんでした'));
              },
            });
          }

          actions.push({
            label: 'ピン解除',
            destructive: true,
            onSelect: () => {
              closeContextMenu();
              onUnpin({
                bookmarkId: pinMenu.row.id,
                parentId: pinMenu.row.parentId,
                index: pinMenu.row.index,
                title: pinMenu.row.title,
                url: pinMenu.row.url,
                tabId: pinMenu.liveTab?.id,
              });
            },
          });

          return actions;
        })();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-1.5 pt-1.5">
        <BookmarkToolbar
          addBookmarkLabel="ピンを追加"
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
          label="ピン"
          items={items}
          dropSection="pin"
          footer={footer}
          onToggleFolder={onToggleFolder}
          onOpenFolderContextMenu={(row, position) => {
            setContextMenu({ kind: 'folder', row, ...position });
          }}
          renderLeaf={renderPin}
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
                  folderId: folderMenu.row.id,
                  title: folderMenu.row.title,
                });
              },
            },
            {
              label: 'フォルダを追加',
              onSelect: () => {
                if (!folderMenu.row.expanded) {
                  onToggleFolder(folderMenu.row.id);
                }
                openDialog({ kind: 'create-folder', parentId: folderMenu.row.id });
              },
            },
            {
              label: 'ピンを追加',
              onSelect: () => {
                if (!folderMenu.row.expanded) {
                  onToggleFolder(folderMenu.row.id);
                }
                openDialog({ kind: 'create-bookmark', parentId: folderMenu.row.id });
              },
            },
            {
              label: '削除',
              destructive: true,
              onSelect: () => {
                openDialog({
                  kind: 'delete-folder',
                  folderId: folderMenu.row.id,
                  title: folderMenu.row.title,
                });
              },
            },
          ]}
        />
      )}

      {pinMenu !== null && (
        <ContextMenu
          x={pinMenu.x}
          y={pinMenu.y}
          label="ピンの操作"
          onClose={closeContextMenu}
          actions={pinActions}
        />
      )}

      {unmappedMenu !== null && (
        <ContextMenu
          x={unmappedMenu.x}
          y={unmappedMenu.y}
          label="未マップのピンの操作"
          onClose={closeContextMenu}
          actions={[
            {
              label: 'ピンとして保存',
              onSelect: () => {
                closeContextMenu();
                void pins
                  .saveUnmappedPin(unmappedMenu.tab)
                  .catch(reportError('ピンを保存できませんでした'));
              },
            },
            {
              label: unmappedMenu.tab.mutedInfo?.muted === true ? 'ミュートを解除' : 'ミュート',
              onSelect: () => {
                closeContextMenu();
                if (unmappedMenu.tab.id !== undefined) {
                  void pins
                    .toggleMute(unmappedMenu.tab.id, unmappedMenu.tab.mutedInfo?.muted !== true)
                    .catch(reportError('ミュートを変更できませんでした'));
                }
              },
            },
            {
              label: 'タブを閉じる',
              onSelect: () => {
                closeContextMenu();
                if (unmappedMenu.tab.id !== undefined) {
                  void closeTab(unmappedMenu.tab.id).catch(
                    reportError('タブを閉じられませんでした'),
                  );
                }
              },
            },
          ]}
        />
      )}

      {dialog !== null && (
        <BookmarkDialog
          bookmarkNoun="ピン"
          request={dialog}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
