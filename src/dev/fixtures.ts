type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

function folder(id: string, title: string, children: readonly BookmarkNode[]): BookmarkNode {
  return { id, title, syncing: false, children: [...children] };
}

function bookmark(id: string, title: string, url: string): BookmarkNode {
  return { id, title, syncing: false, url };
}

/**
 * 開発ハーネスで表示するブックマークバー配下の固定データ。
 * このファイルを編集すると、ブラウザで確認する内容を差し替えられる。
 */
export const bookmarkBar: readonly BookmarkNode[] = [
  folder('folder-communicate', '💬 Communicate', [
    bookmark('bookmark-mail', 'Mail', 'https://mail.google.com/'),
    bookmark('bookmark-x', 'X', 'https://x.com/'),
    bookmark('bookmark-slack', 'Slack', 'https://app.slack.com/'),
  ]),
  folder('folder-tools', '🛠 Tools', [
    bookmark('bookmark-github', 'GitHub', 'https://github.com/'),
    bookmark('bookmark-linear', 'Linear', 'https://linear.app/'),
    folder('folder-design', 'Design', [
      bookmark('bookmark-figma', 'Figma', 'https://www.figma.com/files/'),
      bookmark('bookmark-dribbble', 'Dribbble', 'https://dribbble.com/'),
    ]),
  ]),
  folder('folder-read', '📚 Read', [
    bookmark('bookmark-mdn', 'MDN', 'https://developer.mozilla.org/'),
    bookmark(
      'bookmark-chrome-docs',
      'Chrome Extensions',
      'https://developer.chrome.com/docs/extensions/',
    ),
  ]),
  bookmark('bookmark-calendar', 'Calendar', 'https://calendar.google.com/'),
];

interface FixtureTabInput {
  id: number;
  index: number;
  title?: string | undefined;
  url?: string | undefined;
  active?: boolean | undefined;
}

/**
 * Chrome の Tab 型を満たす最小限のタブを作る。UI が参照しないフィールドは固定値で埋める。
 */
export function createFixtureTab({
  id,
  index,
  title,
  url,
  active = false,
}: FixtureTabInput): chrome.tabs.Tab {
  return {
    id,
    index,
    title,
    url,
    active,
    pinned: false,
    highlighted: false,
    windowId: 1,
    frozen: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    lastAccessed: 0,
  };
}

export const initialTabs: readonly chrome.tabs.Tab[] = [
  createFixtureTab({
    id: 101,
    index: 0,
    title: 'GitHub',
    url: 'https://github.com/',
    active: true,
  }),
  createFixtureTab({ id: 102, index: 1, title: 'Google', url: 'https://www.google.com/' }),
  createFixtureTab({ id: 103, index: 2, title: 'Figma', url: 'https://www.figma.com/files/' }),
  createFixtureTab({
    id: 104,
    index: 3,
    title: 'Chrome Extensions',
    url: 'https://developer.chrome.com/docs/extensions/',
  }),
  createFixtureTab({
    id: 105,
    index: 4,
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
  }),
];
