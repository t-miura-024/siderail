import { findTabByUrl as pickTabByUrl } from '../url';
import type { Unsubscribe } from './events';
import { subscribeToEvents } from './events';

export type Tab = chrome.tabs.Tab;

/**
 * 現在のウィンドウのタブを Chrome のタブストリップと同じ順序で返す。
 */
export async function getCurrentWindowTabs(): Promise<Tab[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return [...tabs].sort((a, b) => a.index - b.index);
}

export async function activateTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true });
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId);
}

/** タブを現在のウィンドウ内の指定位置へ移動する。`index` は移動後の位置。 */
export async function moveTab(tabId: number, index: number): Promise<void> {
  await chrome.tabs.move(tabId, { index });
}

export async function createTab(url?: string): Promise<Tab> {
  return chrome.tabs.create(url === undefined ? {} : { url });
}

/** ブックマークに対応するタブを、Chrome のピン留めタブとして開く。 */
export async function createPinnedTab(url: string): Promise<Tab> {
  return chrome.tabs.create({ url, pinned: true, active: true });
}

/** タブをピン留めする。Chrome のタブストリップ上ではピン留め領域の末尾へ移動する。 */
export async function pinTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { pinned: true });
}

/** タブのピン留めを解除する。 */
export async function unpinTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { pinned: false });
}

/** タブを指定した URL へ戻す。ピン元の URL へのリセットに使う。 */
export async function resetTabUrl(tabId: number, url: string): Promise<void> {
  await chrome.tabs.update(tabId, { url });
}

/** タブのミュート状態を変更する。 */
export async function setTabMuted(tabId: number, muted: boolean): Promise<void> {
  await chrome.tabs.update(tabId, { muted });
}

/** タブを取得する。存在しない場合は undefined を返す。 */
export async function getTab(tabId: number): Promise<Tab | undefined> {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return undefined;
  }
}

/**
 * 現在のウィンドウ内で URL に一致するタブを返す。一致が複数ある場合はタブ順で最初のタブを返す。
 */
export async function findTabByUrl(url: string): Promise<Tab | undefined> {
  return pickTabByUrl(await getCurrentWindowTabs(), url);
}

export function onTabsChanged(listener: () => void): Unsubscribe {
  // ウィンドウ間のタブ移動では onRemoved / onMoved が発火せず、onDetached / onAttached だけが発火する。
  return subscribeToEvents(
    [
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onActivated,
      chrome.tabs.onMoved,
      chrome.tabs.onUpdated,
      chrome.tabs.onAttached,
      chrome.tabs.onDetached,
    ],
    listener,
  );
}
