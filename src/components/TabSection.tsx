import { useEffect, useState } from 'react';
import { sortTabs } from '@/features/tabs/tabs';
import type { Tab } from '@/lib/chrome';
import { getCurrentWindowTabs, onTabsChanged } from '@/lib/chrome';
import { TabRow } from './TabRow';

export function TabSection() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getCurrentWindowTabs()
        .then((nextTabs) => {
          if (!cancelled) {
            setTabs(sortTabs(nextTabs));
          }
        })
        .catch((error: unknown) => {
          console.error('タブ一覧の取得に失敗しました', error);
        });
    };

    refresh();
    const unsubscribe = onTabsChanged(refresh);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <section aria-label="タブ" className="mt-1 flex flex-col gap-1">
      {tabs.map((tab) => (
        <TabRow key={tab.id ?? tab.index} tab={tab} />
      ))}
    </section>
  );
}
