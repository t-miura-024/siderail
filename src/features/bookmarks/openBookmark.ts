import { activateTab, createTab, findTabByUrl } from '../../lib/chrome';

/**
 * ブックマークの URL を開く。現在のウィンドウに同じ URL のタブがあればそのタブへ切り替え、
 * なければ新しいタブで開く。
 */
export async function openBookmarkUrl(url: string): Promise<void> {
  const tab = await findTabByUrl(url);
  if (tab?.id !== undefined) {
    await activateTab(tab.id);
    return;
  }
  await createTab(url);
}
