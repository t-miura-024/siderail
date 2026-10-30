/** フォルダの開閉状態（閉じているフォルダの ID 一覧）を保存する `chrome.storage.local` のキー。 */
export const COLLAPSED_FOLDERS_STORAGE_KEY = 'collapsedBookmarkFolders';

/**
 * 保存された開閉状態を読み取り可能な形へ変換する。壊れた値は「保存状態なし」として扱う。
 */
export function parseCollapsedFolderIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * フォルダの開閉状態を反転した新しい配列を返す。元の配列は変更しない。
 */
export function toggleCollapsedFolder(
  collapsedFolderIds: readonly string[],
  folderId: string,
): string[] {
  return collapsedFolderIds.includes(folderId)
    ? collapsedFolderIds.filter((id) => id !== folderId)
    : [...collapsedFolderIds, folderId];
}
