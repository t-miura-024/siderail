export const FOLDER_PREVIEW_MAX_WIDTH = 320;
export const FOLDER_PREVIEW_VIEWPORT_MARGIN = 8;
export const FOLDER_PREVIEW_ANCHOR_GAP = 4;
export const FOLDER_PREVIEW_ROW_HEIGHT = 40;
export const FOLDER_PREVIEW_ROW_GAP = 4;
export const FOLDER_PREVIEW_PADDING = 6;
export const FOLDER_PREVIEW_BORDER = 1;

export interface FolderPreviewAnchor {
  left: number;
  top: number;
  bottom: number;
}

export interface FolderPreviewContainer {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FolderPreviewLayout {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  above: boolean;
}

/** 指定した行数の Folder Preview が取る高さの見積もり。 */
export function getFolderPreviewContentHeight(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }

  return (
    itemCount * FOLDER_PREVIEW_ROW_HEIGHT +
    (itemCount - 1) * FOLDER_PREVIEW_ROW_GAP +
    FOLDER_PREVIEW_PADDING * 2 +
    FOLDER_PREVIEW_BORDER * 2
  );
}

/**
 * Folder Preview をサイドパネル内に収める位置を計算する。
 * `anchor` はフォルダ行、`container` はサイドパネルの矩形（どちらも viewport 座標）。
 * 下に内容が入りきらず、上の方が広い場合はカードを上へ反転する。
 */
export function computeFolderPreviewLayout(
  anchor: FolderPreviewAnchor,
  container: FolderPreviewContainer,
  itemCount: number,
): FolderPreviewLayout {
  const width = Math.min(
    FOLDER_PREVIEW_MAX_WIDTH,
    Math.max(0, container.width - FOLDER_PREVIEW_VIEWPORT_MARGIN * 2),
  );
  const minLeft = container.left + FOLDER_PREVIEW_VIEWPORT_MARGIN;
  const maxLeft = Math.max(
    minLeft,
    container.left + container.width - width - FOLDER_PREVIEW_VIEWPORT_MARGIN,
  );
  const left = Math.min(Math.max(anchor.left, minLeft), maxLeft);

  const spaceBelow =
    container.top +
    container.height -
    anchor.bottom -
    FOLDER_PREVIEW_VIEWPORT_MARGIN -
    FOLDER_PREVIEW_ANCHOR_GAP;
  const spaceAbove =
    anchor.top - container.top - FOLDER_PREVIEW_VIEWPORT_MARGIN - FOLDER_PREVIEW_ANCHOR_GAP;
  const above = spaceBelow < getFolderPreviewContentHeight(itemCount) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(0, above ? spaceAbove : spaceBelow);
  const top = above
    ? anchor.top - FOLDER_PREVIEW_ANCHOR_GAP
    : anchor.bottom + FOLDER_PREVIEW_ANCHOR_GAP;

  return { left, top, width, maxHeight, above };
}
