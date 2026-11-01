import type { Ref } from 'react';
import type { DragPayload } from '@/features/drag/types';
import { Favicon } from './Favicon';

interface DropPreviewProps {
  depth: number;
  payload: DragPayload;
  nodeRef?: Ref<HTMLDivElement> | undefined;
}

/**
 * ドラッグ中のゴースト行。ドラッグしている項目そのものの favicon とタイトルを
 * 元の行と同じレイアウト・半透明で表示する。
 *
 * ドラッグ自体は DragProvider が Pointer Events で処理するため、この要素は
 * 見た目だけを担当する（pointer-events-none）。
 */
export function DropPreview({ depth, payload, nodeRef }: DropPreviewProps) {
  const item =
    payload.kind === 'tab' ? payload.tab : payload.kind === 'pin' ? payload.pin : payload.bookmark;

  return (
    <div
      ref={nodeRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 flex h-8 items-center rounded-lg border border-dashed border-sidebar-muted/60 bg-sidebar-hover/60 pr-2 select-none"
      data-drop-preview=""
      style={{ paddingLeft: `${8 + depth * 24}px` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 opacity-80">
        <Favicon key={item.url} url={item.url} />
        <span className="truncate text-[15px] text-sidebar-text">{item.title}</span>
      </div>
    </div>
  );
}
