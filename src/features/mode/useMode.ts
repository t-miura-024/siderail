import { useEffect, useState } from 'react';
import { getStoredValue, onLocalStorageChanged, setStoredValue } from '@/lib/chrome';
import { MODE_STORAGE_KEY, parseMode, type TabManagementMode } from './mode';

export interface UseModeResult {
  mode: TabManagementMode;
  /** 保存値の読み込みが終わるまでは false。 */
  ready: boolean;
}

/**
 * 選択中のタブ管理モードを購読する。options ページでの変更は storage イベントで即座に反映される。
 */
export function useMode(): UseModeResult {
  const [mode, setMode] = useState<TabManagementMode>(parseMode(undefined));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getStoredValue<unknown>(MODE_STORAGE_KEY)
      .then((stored) => {
        if (!cancelled) {
          setMode(parseMode(stored));
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        console.error('タブ管理モードを読み込めませんでした', error);
        if (!cancelled) {
          setReady(true);
        }
      });

    const unsubscribe = onLocalStorageChanged((changes) => {
      if (!(MODE_STORAGE_KEY in changes)) {
        return;
      }
      setMode(parseMode(changes[MODE_STORAGE_KEY]?.newValue));
      setReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { mode, ready };
}

/** 選択中のモードを保存する。 */
export async function saveMode(mode: TabManagementMode): Promise<void> {
  await setStoredValue(MODE_STORAGE_KEY, mode);
}
