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
  /** ツリーの末尾に表示する追加行（未マップのピンなど）。 */
  footer?: ReactNode;
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

/**
 * ブックマークツリーの描画。Chrome 方式のブックマーク一覧と Arc 方式の Pinned 一覧で共有する。
 * 行の中身は `renderLeaf` に委ね、フォルダの開閉・ドロップ位置・移動アニメーションを担う。
 */
export function BookmarkTreeRows({
  label,
  items,
  dropSection,
  renderLeaf,
  onToggleFolder,
  onOpenFolderContextMenu,
  footer,
}: BookmarkTreeRowsProps) {
  const listRef = useRef<HTMLElement>(null);
  const { payload, preview } = useDragContext();
  const { ghostRef, spacerRef } = useDropPreviewGlide(listRef);

  useRowGlide({
    scopeRef: listRef,
    rowSelector: ROW_SELECTOR,
    rowIdKey: ROW_ID_KEY,
    structureSignature: getRowLayoutSignature(items),
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
    <div ref={spacerRef} aria-hidden="true" className="h-8 w-full" />
  );

  const renderRow = (row: BookmarkRowData): ReactNode => {
    if (row.kind === 'bookmark') {
      return (
        <Fragment key={row.id}>
          {payload !== null && hasPreview(row.id, 'before') && renderSpacer()}
          {renderLeaf(row)}
          {payload !== null && hasPreview(row.id, 'after') && renderSpacer()}
        </Fragment>
      );
    }

    const isInsidePreview = hasPreview(row.id, 'inside');

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
            dropSection={dropSection}
            onToggle={() => {
              onToggleFolder(row.id);
            }}
            onOpenContextMenu={(position) => {
              onOpenFolderContextMenu(row, position);
            }}
          />
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
                {row.children.map(renderRow)}
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
      {items.map(renderRow)}
      {footer}
      {payload !== null && previewRow !== undefined && (
        <DropPreviewRow depth={previewDepth} payload={payload} nodeRef={ghostRef} />
      )}
    </section>
  );
}
