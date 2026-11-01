export type DropSection = 'bookmark' | 'tab' | 'pin';
export type DragKind = 'tab' | 'bookmark' | 'pin';
export type DropPosition = 'before' | 'inside' | 'after';

export interface DraggedTab {
  id?: number | undefined;
  title: string;
  url: string;
}

export interface DraggedBookmark {
  id: string;
  parentId: string;
  index: number;
  title: string;
  url: string;
}

/** Pinned の行。ブックマークを実体とし、ライブタブがあれば `tabId` を持つ。 */
export interface DraggedPin {
  bookmarkId: string;
  parentId: string;
  index: number;
  title: string;
  url: string;
  tabId?: number | undefined;
}

export type DragPayload =
  | { kind: 'tab'; tab: DraggedTab }
  | { kind: 'bookmark'; bookmark: DraggedBookmark }
  | { kind: 'pin'; pin: DraggedPin };

export interface DragSource {
  section: DropSection;
  id: string;
}

export interface DropPreview {
  section: DropSection;
  dragType: DragKind;
  targetId: string;
  position: DropPosition;
}

export interface DropTarget {
  section: DropSection;
  targetId: string;
  position: DropPosition;
}

export type DropHandler = (payload: DragPayload, target: DropTarget) => void;
