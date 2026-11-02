import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  findBookmarkRow,
  flattenBookmarkItems,
  hasBookmarkItem,
  type BookmarkFolderRowData,
  type BookmarkItemRowData,
  type BookmarkRowData,
} from '@/features/bookmarks/tree';
import { useDragContext } from '@/features/drag/DragProvider';
import { useDropPreviewGlide } from '@/features/drag/useDropPreviewGlide';
import { useRowGlide } from '@/features/drag/useRowGlide';
import type { DropPosition } from '@/features/drag/types';
import { BookmarkFolderRow, type ContextMenuPosition } from './BookmarkRow';
import { DropPreview as DropPreviewRow } from './DropPreview';
import { FolderPreview } from './FolderPreview';

const FOLDER_PREVIEW_OPEN_DELAY_MS = 500;
const FOLDER_PREVIEW_CLOSE_DELAY_MS = 150;

interface BookmarkTreeRowsProps {
  label: string;
  items: readonly BookmarkRowData[];
  dropSection: 'bookmark' | 'pin';
  renderLeaf: (row: BookmarkItemRowData) => ReactNode;
  /** Folder Preview の行を描画する。省略時はプレビューを出さない。 */
  renderPreviewLeaf?: (row: BookmarkItemRowData, closePreview: () => void) => ReactNode;
  onToggleFolder: (folderId: string) => void;
  onOpenFolderContextMenu: (row: BookmarkFolderRowData, position: ContextMenuPosition) => void;
  /** 右クリックメニュー表示中は Folder Preview を出さない。 */
  contextMenuOpen?: boolean;
  /**
   * 折りたたみフォルダの直下に peek 表示する、開いている子孫ピン。
   * キーはフォルダ ID、値はツリー順のピン行。
   */
  peekRowsByFolderId?: ReadonlyMap<string, readonly BookmarkItemRowData[]> | undefined;
  /** ツリーの末尾に表示する追加行（未マップのピンなど）。 */
  footer?: ReactNode;
}

interface RenderContext {
  /** 折りたたまれた祖先の内側にいるか。 */
  insideCollapsed: boolean;
  /** 折りたたまれた祖先が peek 表示しているピンの ID。 */
  hiddenIds?: ReadonlySet<string> | undefined;
}

const ROW_SELECTOR = '[data-bookmark-row-id]';
const ROW_ID_KEY = 'bookmarkRowId';

function getRowLayoutSignature(items: readonly BookmarkRowData[]): string {
  return items
    .map((row) =>
      row.kind === 'folder'
        ? `f:${row.id}@${row.parentId}:${row.index}[${getRowLayoutSignature(row.children)}]`
        : `b:${row.id}@${row.parentId}:${row.index}`,
    )
    .join('|');
}

function getPeekSignature(
  peekRowsByFolderId: ReadonlyMap<string, readonly BookmarkItemRowData[]> | undefined,
): string {
  if (peekRowsByFolderId === undefined) {
    return '';
  }

  return [...peekRowsByFolderId.entries()]
    .map(([folderId, rows]) => `${folderId}:${rows.map((row) => row.id).join(',')}`)
    .join('|');
}

/**
 * ブックマークツリーの描画。Chrome 方式のブックマーク一覧と Arc 方式の Pinned 一覧で共有する。
 * 行の中身は `renderLeaf` に委ね、フォルダの開閉・ドロップ位置・移動アニメーション・
 * 折りたたみフォルダの peek 表示を担う。
 */
export function BookmarkTreeRows({
  label,
  items,
  dropSection,
  renderLeaf,
  renderPreviewLeaf,
  onToggleFolder,
  onOpenFolderContextMenu,
  contextMenuOpen = false,
  peekRowsByFolderId,
  footer,
}: BookmarkTreeRowsProps) {
  const listRef = useRef<HTMLElement>(null);
  const { payload, preview: dropPreview } = useDragContext();
  const { ghostRef, spacerRef } = useDropPreviewGlide(listRef);
  const rowHeightClass = 'h-10';
  const [folderPreview, setFolderPreview] = useState<{
    folderId: string;
    anchor: DOMRect;
  } | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeFolderPreview = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setFolderPreview(null);
  }, [clearCloseTimer, clearOpenTimer]);

  /** renderPreviewLeaf から呼ぶ用。レンダー中に ref を触らないようタイマー操作を含めない。 */
  const closeFolderPreviewFromRow = useCallback(() => {
    setFolderPreview(null);
  }, []);

  useEffect(() => {
    if (folderPreview === null) {
      clearCloseTimer();
    }
  }, [folderPreview, clearCloseTimer]);

  useEffect(() => {
    if (folderPreview === null) {
      return;
    }

    const row = findBookmarkRow(items, folderPreview.folderId);
    if (
      row !== undefined &&
      row.kind === 'folder' &&
      !row.expanded &&
      hasBookmarkItem(row.children)
    ) {
      return;
    }

    const timer = window.setTimeout(closeFolderPreview, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [items, folderPreview, closeFolderPreview]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleFolderPreviewEnter = useCallback(
    (row: BookmarkFolderRowData, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== 'mouse' || payload !== null || contextMenuOpen) {
        return;
      }
      if (row.expanded || !hasBookmarkItem(row.children)) {
        return;
      }
      if (folderPreview?.folderId === row.id) {
        clearOpenTimer();
        clearCloseTimer();
        return;
      }

      clearOpenTimer();
      const anchor = event.currentTarget.getBoundingClientRect();
      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null;
        setFolderPreview({ folderId: row.id, anchor });
      }, FOLDER_PREVIEW_OPEN_DELAY_MS);
    },
    [clearCloseTimer, clearOpenTimer, contextMenuOpen, folderPreview?.folderId, payload],
  );

  const handleFolderPreviewLeave = useCallback(() => {
    clearOpenTimer();
    if (folderPreview === null) {
      return;
    }

    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setFolderPreview(null);
    }, FOLDER_PREVIEW_CLOSE_DELAY_MS);
  }, [clearCloseTimer, clearOpenTimer, folderPreview]);

  const handleFolderPreviewPointerEnter = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
  }, [clearCloseTimer, clearOpenTimer]);

  const handleFolderPreviewPointerLeave = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setFolderPreview(null);
    }, FOLDER_PREVIEW_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useRowGlide({
    scopeRef: listRef,
    rowSelector: ROW_SELECTOR,
    rowIdKey: ROW_ID_KEY,
    structureSignature: `${getRowLayoutSignature(items)}|peek:${getPeekSignature(peekRowsByFolderId)}`,
    previewKey:
      dropPreview?.section === dropSection
        ? `${dropPreview.dragType}:${dropPreview.targetId}:${dropPreview.position}`
        : null,
  });

  const hasPreview = (id: string, position: DropPosition): boolean =>
    dropPreview?.section === dropSection &&
    dropPreview.targetId === id &&
    dropPreview.position === position;

  const dropPreviewRow =
    dropPreview?.section === dropSection ? findBookmarkRow(items, dropPreview.targetId) : undefined;
  const dropPreviewDepth =
    dropPreviewRow === undefined
      ? 0
      : dropPreviewRow.depth + (dropPreview?.position === 'inside' ? 1 : 0);

  const folderPreviewRow =
    folderPreview === null ? undefined : findBookmarkRow(items, folderPreview.folderId);
  const folderPreviewItems =
    folderPreviewRow?.kind === 'folder' ? flattenBookmarkItems(folderPreviewRow.children) : [];

  const renderSpacer = (): ReactNode => (
    <div ref={spacerRef} aria-hidden="true" className={`${rowHeightClass} w-full`} />
  );

  const renderRow = (row: BookmarkRowData, context: RenderContext): ReactNode => {
    if (row.kind === 'bookmark') {
      if (context.hiddenIds?.has(row.id) === true) {
        return null;
      }

      return (
        <Fragment key={row.id}>
          {payload !== null && hasPreview(row.id, 'before') && renderSpacer()}
          {renderLeaf(row)}
          {payload !== null && hasPreview(row.id, 'after') && renderSpacer()}
        </Fragment>
      );
    }

    const isInsidePreview = hasPreview(row.id, 'inside');
    const ownPeekRows = peekRowsByFolderId?.get(row.id);
    const ownPeekIds =
      ownPeekRows === undefined ? undefined : new Set(ownPeekRows.map((peekRow) => peekRow.id));
    const visiblePeekRows = !row.expanded && !context.insideCollapsed ? ownPeekRows : undefined;
    const peeked = !row.expanded && (ownPeekRows?.length ?? 0) > 0;

    const childHiddenIds = row.expanded || context.insideCollapsed ? context.hiddenIds : ownPeekIds;
    const childInsideCollapsed = context.insideCollapsed || !row.expanded;

    return (
      <Fragment key={row.id}>
        {payload !== null && hasPreview(row.id, 'before') && renderSpacer()}
        <div className="flex flex-col">
          <BookmarkFolderRow
            id={row.id}
            title={row.title}
            depth={row.depth}
            expanded={row.expanded}
            isDropTarget={isInsidePreview}
            peeked={peeked}
            dropSection={dropSection}
            heightClass={rowHeightClass}
            onToggle={() => {
              closeFolderPreview();
              onToggleFolder(row.id);
            }}
            onOpenContextMenu={(position) => {
              closeFolderPreview();
              onOpenFolderContextMenu(row, position);
            }}
            onPreviewEnter={(event) => {
              handleFolderPreviewEnter(row, event);
            }}
            onPreviewLeave={handleFolderPreviewLeave}
          />
          {visiblePeekRows !== undefined && visiblePeekRows.length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              {visiblePeekRows.map((peekRow) => (
                <Fragment key={peekRow.id}>
                  {payload !== null && hasPreview(peekRow.id, 'before') && renderSpacer()}
                  {renderLeaf(peekRow)}
                  {payload !== null && hasPreview(peekRow.id, 'after') && renderSpacer()}
                </Fragment>
              ))}
            </div>
          )}
          {payload !== null && isInsidePreview && !row.expanded && (
            <div className="pt-1">{renderSpacer()}</div>
          )}
          <div
            className={[
              'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
              row.expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            ].join(' ')}
          >
            <div className="min-h-0 overflow-hidden" inert={!row.expanded}>
              <div className="flex flex-col gap-1 pt-1">
                {payload !== null && isInsidePreview && row.expanded && (
                  <div className="pt-1">{renderSpacer()}</div>
                )}
                {row.children.map((child) =>
                  renderRow(child, {
                    insideCollapsed: childInsideCollapsed,
                    hiddenIds: childHiddenIds,
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
        {payload !== null && hasPreview(row.id, 'after') && renderSpacer()}
      </Fragment>
    );
  };

  return (
    <section
      ref={listRef}
      aria-label={label}
      className="relative flex flex-col gap-1"
      onContextMenu={() => {
        closeFolderPreview();
      }}
    >
      {items.map((row) => renderRow(row, { insideCollapsed: false }))}
      {footer}
      {payload !== null && dropPreviewRow !== undefined && (
        <DropPreviewRow
          depth={dropPreviewDepth}
          payload={payload}
          nodeRef={ghostRef}
          heightClass={rowHeightClass}
        />
      )}
      {folderPreview !== null &&
        payload === null &&
        !contextMenuOpen &&
        folderPreviewRow !== undefined &&
        folderPreviewRow.kind === 'folder' &&
        !folderPreviewRow.expanded &&
        folderPreviewItems.length > 0 &&
        renderPreviewLeaf !== undefined && (
          <FolderPreview
            key={folderPreview.folderId}
            anchor={folderPreview.anchor}
            label={`${folderPreviewRow.title} の${label}`}
            itemCount={folderPreviewItems.length}
            onPointerEnter={handleFolderPreviewPointerEnter}
            onPointerLeave={handleFolderPreviewPointerLeave}
            onClose={closeFolderPreview}
          >
            {folderPreviewItems.map((row) => (
              <Fragment key={row.id}>{renderPreviewLeaf(row, closeFolderPreviewFromRow)}</Fragment>
            ))}
          </FolderPreview>
        )}
    </section>
  );
}
