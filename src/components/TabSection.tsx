import { Fragment, useEffect, useRef } from 'react';
import { useDragContext } from '@/features/drag/DragProvider';
import { useDropPreviewGlide } from '@/features/drag/useDropPreviewGlide';
import { useRowGlide } from '@/features/drag/useRowGlide';
import type { DraggedPin, DropPosition } from '@/features/drag/types';
import type { TabManagementMode } from '@/features/mode/mode';
import { getReorderedTabIndex } from '@/features/tabs/tabs';
import type { Tab } from '@/lib/chrome';
import { moveTab } from '@/lib/chrome';
import { DropPreview as DropPreviewRow } from './DropPreview';
import { NewTabRow } from './NewTabRow';
import { TabRow } from './TabRow';

interface TabSectionProps {
  tabs: readonly Tab[];
  mode: TabManagementMode;
  onUnpinPin?: (pin: DraggedPin) => void;
}

export function TabSection({ tabs, mode, onUnpinPin }: TabSectionProps) {
  const { payload, preview, setDropHandler } = useDragContext();
  const sectionRef = useRef<HTMLElement>(null);
  const { ghostRef, spacerRef } = useDropPreviewGlide(sectionRef);

  // Arc 方式ではピン留めタブを Pinned 側に任せ、Today には出さない。
  const visibleTabs = mode === 'arc' ? tabs.filter((tab) => !tab.pinned) : tabs;

  useRowGlide({
    scopeRef: sectionRef,
    rowSelector: '[data-tab-row-id]',
    rowIdKey: 'tabRowId',
    structureSignature: visibleTabs.map((tab) => tab.id ?? tab.index).join('|'),
    previewKey:
      preview?.section === 'tab'
        ? `${preview.dragType}:${preview.targetId}:${preview.position}`
        : null,
  });

  useEffect(() => {
    setDropHandler('tab', (payload, target) => {
      if (payload.kind === 'pin') {
        onUnpinPin?.(payload.pin);
        return;
      }

      if (payload.kind !== 'tab' || payload.tab.id === undefined) {
        return;
      }

      const sourceIndex = tabs.findIndex((tab) => tab.id === payload.tab.id);
      const targetIndex = tabs.findIndex((tab) => String(tab.id ?? tab.index) === target.targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return;
      }

      const position = target.position === 'after' ? 'after' : 'before';
      const destination = getReorderedTabIndex(sourceIndex, targetIndex, position);
      if (destination === sourceIndex) {
        return;
      }

      void moveTab(payload.tab.id, destination).catch((error: unknown) => {
        console.error('タブを移動できませんでした', error);
      });
    });

    return () => {
      setDropHandler('tab', null);
    };
  }, [tabs, onUnpinPin, setDropHandler]);

  const hasPreview = (targetId: string, position: DropPosition): boolean =>
    preview?.section === 'tab' && preview.targetId === targetId && preview.position === position;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-1.5 pt-2 pb-1">
        <NewTabRow />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5">
        <section
          ref={sectionRef}
          aria-label={mode === 'arc' ? '今日のタブ' : 'タブ'}
          className="relative flex flex-col gap-1"
        >
          {visibleTabs.map((tab) => {
            const targetId = String(tab.id ?? tab.index);

            return (
              <Fragment key={tab.id ?? tab.index}>
                {payload !== null && hasPreview(targetId, 'before') && (
                  <div ref={spacerRef} aria-hidden="true" className="h-8 w-full" />
                )}
                <TabRow tab={tab} targetId={targetId} />
                {payload !== null && hasPreview(targetId, 'after') && (
                  <div ref={spacerRef} aria-hidden="true" className="h-8 w-full" />
                )}
              </Fragment>
            );
          })}
          {payload !== null && preview?.section === 'tab' && (
            <DropPreviewRow depth={0} payload={payload} nodeRef={ghostRef} />
          )}
        </section>
      </div>
    </div>
  );
}
