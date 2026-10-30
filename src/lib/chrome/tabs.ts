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

export async function createTab(url?: string): Promise<Tab> {
  return chrome.tabs.create(url === undefined ? {} : { url });
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
