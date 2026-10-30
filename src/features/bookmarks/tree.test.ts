import { describe, expect, it } from 'vitest';
import { flattenBookmarkTree, type BookmarkTreeNode } from './tree';

function folder(id: string, title: string, children: BookmarkTreeNode[] = []): BookmarkTreeNode {
  return { id, title, children };
}

function bookmark(id: string, title: string, url: string): BookmarkTreeNode {
  return { id, title, url };
}

const collapsed = (...ids: string[]) => new Set(ids);

describe('flattenBookmarkTree', () => {
  it('Chrome の順序どおりにフォルダとブックマークを深さ付きで平坦化する', () => {
    const tree = [
      folder('folder-1', '💬 Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
        bookmark('bookmark-2', 'X', 'https://x.com/'),
      ]),
      bookmark('bookmark-3', 'Calendar', 'https://calendar.example.com/week'),
    ];

    expect(flattenBookmarkTree(tree, collapsed())).toEqual([
      { kind: 'folder', id: 'folder-1', title: '💬 Communicate', depth: 0, expanded: true },
      {
        kind: 'bookmark',
        id: 'bookmark-1',
        title: 'Mail',
        url: 'https://mail.example.com/inbox',
        depth: 1,
      },
      { kind: 'bookmark', id: 'bookmark-2', title: 'X', url: 'https://x.com/', depth: 1 },
      {
        kind: 'bookmark',
        id: 'bookmark-3',
        title: 'Calendar',
        url: 'https://calendar.example.com/week',
        depth: 0,
      },
    ]);
  });

  it('保存状態がないフォルダは開いた状態で子項目を表示する', () => {
    const tree = [
      folder('folder-1', 'Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
      ]),
    ];

    expect(flattenBookmarkTree(tree, collapsed())).toEqual([
      { kind: 'folder', id: 'folder-1', title: 'Communicate', depth: 0, expanded: true },
      {
        kind: 'bookmark',
        id: 'bookmark-1',
        title: 'Mail',
        url: 'https://mail.example.com/inbox',
        depth: 1,
      },
    ]);
  });

  it('閉じたフォルダ配下の子項目を表示しない', () => {
    const tree = [
      folder('folder-1', 'Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
      ]),
      bookmark('bookmark-2', 'Calendar', 'https://calendar.example.com/week'),
    ];

    expect(flattenBookmarkTree(tree, collapsed('folder-1'))).toEqual([
      { kind: 'folder', id: 'folder-1', title: 'Communicate', depth: 0, expanded: false },
      {
        kind: 'bookmark',
        id: 'bookmark-2',
        title: 'Calendar',
        url: 'https://calendar.example.com/week',
        depth: 0,
      },
    ]);
  });

  it('入れ子のフォルダを再帰的に展開し、深さを増やす', () => {
    const tree = [
      folder('folder-1', 'Develop', [
        folder('folder-2', '🛠 Tools', [bookmark('bookmark-1', 'GitHub', 'https://github.com/')]),
      ]),
    ];

    expect(flattenBookmarkTree(tree, collapsed())).toEqual([
      { kind: 'folder', id: 'folder-1', title: 'Develop', depth: 0, expanded: true },
      { kind: 'folder', id: 'folder-2', title: '🛠 Tools', depth: 1, expanded: true },
      { kind: 'bookmark', id: 'bookmark-1', title: 'GitHub', url: 'https://github.com/', depth: 2 },
    ]);
  });

  it('閉じた入れ子フォルダの子だけを隠し、兄弟は表示する', () => {
    const tree = [
      folder('folder-1', 'Develop', [
        folder('folder-2', '🛠 Tools', [bookmark('bookmark-1', 'GitHub', 'https://github.com/')]),
        bookmark('bookmark-2', 'Docs', 'https://developer.mozilla.org/'),
      ]),
    ];

    expect(flattenBookmarkTree(tree, collapsed('folder-2'))).toEqual([
      { kind: 'folder', id: 'folder-1', title: 'Develop', depth: 0, expanded: true },
      { kind: 'folder', id: 'folder-2', title: '🛠 Tools', depth: 1, expanded: false },
      {
        kind: 'bookmark',
        id: 'bookmark-2',
        title: 'Docs',
        url: 'https://developer.mozilla.org/',
        depth: 1,
      },
    ]);
  });

  it('空のフォルダはフォルダ行だけを返す', () => {
    const tree = [folder('folder-1', 'Empty')];

    expect(flattenBookmarkTree(tree, collapsed())).toEqual([
      { kind: 'folder', id: 'folder-1', title: 'Empty', depth: 0, expanded: true },
    ]);
  });
});
