export interface IndexedTab {
  index: number;
}

export interface TitledTab {
  title?: string | undefined;
  url?: string | undefined;
}

/**
 * Chrome のタブストリップと同じ順序（index 昇順）に並べ替えた新しい配列を返す。
 */
export function sortTabs<T extends IndexedTab>(tabs: readonly T[]): T[] {
  return [...tabs].sort((a, b) => a.index - b.index);
}

/**
 * タブ行に表示するタイトルを返す。タイトルが空のタブは URL を使い、URL もなければ "New Tab" を使う。
 */
export function getTabTitle(tab: TitledTab): string {
  const title = tab.title?.trim();
  if (title) {
    return title;
  }

  return tab.url ?? 'New Tab';
}
