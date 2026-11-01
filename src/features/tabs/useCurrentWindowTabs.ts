import { useEffect, useState } from 'react';
import { getCurrentWindowTabs, onTabsChanged, type Tab } from '@/lib/chrome';
import { sortTabs } from './tabs';

export interface UseCurrentWindowTabsResult {
  tabs: Tab[];
  /** 最初のタブ取得が終わったか。 */
  ready: boolean;
}

/**
 * 現在のウィンドウのタブを購読する。並び順は Chrome のタブストリップと同じ `index` 昇順。
 */
export function useCurrentWindowTabs(): UseCurrentWindowTabsResult {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getCurrentWindowTabs()
        .then((nextTabs) => {
          if (!cancelled) {
            setTabs(sortTabs(nextTabs));
            setReady(true);
          }
        })
        .catch((error: unknown) => {
          console.error('タブ一覧の取得に失敗しました', error);
          if (!cancelled) {
            setReady(true);
          }
        });
    };

    refresh();
    const unsubscribe = onTabsChanged(refresh);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { tabs, ready };
}
