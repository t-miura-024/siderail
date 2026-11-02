import { Fragment, useRef, type ReactNode } from 'react';
import {
  findBookmarkRow,
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

interface BookmarkTreeRowsProps {
  label: string;
  items: readonly BookmarkRowData[];
  dropSection: 'bookmark' | 'pin';
  renderLeaf: (row: BookmarkItemRowData) => ReactNode;
  onToggleFolder: (folderId: string) => void;
  onOpenFolderContextMenu: (row: BookmarkFolderRowData, position: ContextMenuPosition) => void;
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
  onToggleFolder,
  onOpenFolderContextMenu,
  peekRowsByFolderId,
  footer,
}: BookmarkTreeRowsProps) {
  const listRef = useRef<HTMLElement>(null);
  const { payload, preview } = useDragContext();
  const { ghostRef, spacerRef } = useDropPreviewGlide(listRef);
  const rowHeightClass = dropSection === 'pin' ? 'h-10' : 'h-8';

  useRowGlide({
    scopeRef: listRef,
    rowSelector: ROW_SELECTOR,
    rowIdKey: ROW_ID_KEY,
    structureSignature: `${getRowLayoutSignature(items)}|peek:${getPeekSignature(peekRowsByFolderId)}`,
    previewKey:
      preview?.section === dropSection
        ? `${preview.dragType}:${preview.targetId}:${preview.position}`
        : null,
  });

  const hasPreview = (id: string, position: DropPosition): boolean =>
    preview?.section === dropSection && preview.targetId === id && preview.position === position;

  const previewRow =
    preview?.section === dropSection ? findBookmarkRow(items, preview.targetId) : undefined;
  const previewDepth =
    previewRow === undefined ? 0 : previewRow.depth + (preview?.position === 'inside' ? 1 : 0);

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
              onToggleFolder(row.id);
            }}
            onOpenContextMenu={(position) => {
              onOpenFolderContextMenu(row, position);
            }}
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
    <section ref={listRef} aria-label={label} className="relative flex flex-col gap-1">
      {items.map((row) => renderRow(row, { insideCollapsed: false }))}
      {footer}
      {payload !== null && previewRow !== undefined && (
        <DropPreviewRow
          depth={previewDepth}
          payload={payload}
          nodeRef={ghostRef}
          heightClass={rowHeightClass}
        />
      )}
    </section>
  );
}
