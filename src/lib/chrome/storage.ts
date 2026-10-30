import type { Unsubscribe } from './events';

export type StorageChanges = Record<string, chrome.storage.StorageChange>;

export async function getStoredValue<T>(key: string): Promise<T | undefined> {
  const stored = await chrome.storage.local.get(key);
  return stored[key] as T | undefined;
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export function onLocalStorageChanged(listener: (changes: StorageChanges) => void): Unsubscribe {
  const handler = (changes: StorageChanges, areaName: chrome.storage.AreaName) => {
    if (areaName === 'local') {
      listener(changes);
    }
  };

  chrome.storage.onChanged.addListener(handler);
  return () => {
    chrome.storage.onChanged.removeListener(handler);
  };
}
