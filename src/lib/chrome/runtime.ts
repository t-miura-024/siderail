/**
 * 拡張機能のオプション（設定）ページを新しいタブで開く。
 */
export async function openOptionsPage(): Promise<void> {
  await chrome.runtime.openOptionsPage();
}
