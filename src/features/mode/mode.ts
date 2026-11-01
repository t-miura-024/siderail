/**
 * タブ管理の方式。
 *
 * - `chrome`: ブックマークとタブをそのまま並べる Chrome 標準の方式
 * - `arc`: ブックマークを Pinned、ピン留めしていないタブを Today として扱う方式
 */
export type TabManagementMode = 'chrome' | 'arc';

/** 選択中のモードを保存する `chrome.storage.local` のキー。 */
export const MODE_STORAGE_KEY = 'tabManagementMode';

/** 保存値がないときのモード。 */
export const DEFAULT_MODE: TabManagementMode = 'arc';

/**
 * 保存された値をモードへ変換する。`chrome` 以外の未知の値は既定モードとして扱う。
 */
export function parseMode(value: unknown): TabManagementMode {
  return value === 'chrome' ? 'chrome' : DEFAULT_MODE;
}
