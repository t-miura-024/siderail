import { describe, expect, it } from 'vitest';
import { buildBookmarkTree, type BookmarkTreeNode } from './tree';

function folder(id: string, title: string, children: BookmarkTreeNode[] = []): BookmarkTreeNode {
  return { id, title, children };
}

function bookmark(id: string, title: string, url: string): BookmarkTreeNode {
  return { id, title, url };
}

const collapsed = (...ids: string[]) => new Set(ids);

describe('buildBookmarkTree', () => {
  it('Chrome の順序どおりにフォルダとブックマークをネストして返す', () => {
    const tree = [
      folder('folder-1', '💬 Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
        bookmark('bookmark-2', 'X', 'https://x.com/'),
      ]),
      bookmark('bookmark-3', 'Calendar', 'https://calendar.example.com/week'),
    ];

    expect(buildBookmarkTree(tree, collapsed(), '1')).toEqual([
      {
        kind: 'folder',
        id: 'folder-1',
        title: '💬 Communicate',
        depth: 0,
        parentId: '1',
        index: 0,
        expanded: true,
        children: [
          {
            kind: 'bookmark',
            id: 'bookmark-1',
            title: 'Mail',
            url: 'https://mail.example.com/inbox',
            depth: 1,
            parentId: 'folder-1',
            index: 0,
          },
          {
            kind: 'bookmark',
            id: 'bookmark-2',
            title: 'X',
            url: 'https://x.com/',
            depth: 1,
            parentId: 'folder-1',
            index: 1,
          },
        ],
      },
      {
        kind: 'bookmark',
        id: 'bookmark-3',
        title: 'Calendar',
        url: 'https://calendar.example.com/week',
        depth: 0,
        parentId: '1',
        index: 1,
      },
    ]);
  });

  it('保存状態がないフォルダは開いた状態で返す', () => {
    const tree = [
      folder('folder-1', 'Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
      ]),
    ];

    expect(buildBookmarkTree(tree, collapsed(), '1')).toEqual([
      {
        kind: 'folder',
        id: 'folder-1',
        title: 'Communicate',
        depth: 0,
        parentId: '1',
        index: 0,
        expanded: true,
        children: [
          {
            kind: 'bookmark',
            id: 'bookmark-1',
            title: 'Mail',
            url: 'https://mail.example.com/inbox',
            depth: 1,
            parentId: 'folder-1',
            index: 0,
          },
        ],
      },
    ]);
  });

  it('閉じたフォルダも子孫を保持し、expanded を false にする', () => {
    const tree = [
      folder('folder-1', 'Communicate', [
        bookmark('bookmark-1', 'Mail', 'https://mail.example.com/inbox'),
      ]),
      bookmark('bookmark-2', 'Calendar', 'https://calendar.example.com/week'),
    ];

    expect(buildBookmarkTree(tree, collapsed('folder-1'), '1')).toEqual([
      {
        kind: 'folder',
        id: 'folder-1',
        title: 'Communicate',
        depth: 0,
        parentId: '1',
        index: 0,
        expanded: false,
        children: [
          {
            kind: 'bookmark',
            id: 'bookmark-1',
            title: 'Mail',
            url: 'https://mail.example.com/inbox',
            depth: 1,
            parentId: 'folder-1',
            index: 0,
          },
        ],
      },
      {
        kind: 'bookmark',
        id: 'bookmark-2',
        title: 'Calendar',
        url: 'https://calendar.example.com/week',
        depth: 0,
        parentId: '1',
        index: 1,
      },
    ]);
  });

  it('入れ子のフォルダを再帰的にネストし、深さを増やす', () => {
    const tree = [
      folder('folder-1', 'Develop', [
        folder('folder-2', '🛠 Tools', [bookmark('bookmark-1', 'GitHub', 'https://github.com/')]),
      ]),
    ];

    expect(buildBookmarkTree(tree, collapsed(), '1')).toEqual([
      {
        kind: 'folder',
        id: 'folder-1',
        title: 'Develop',
        depth: 0,
        parentId: '1',
        index: 0,
        expanded: true,
        children: [
          {
            kind: 'folder',
            id: 'folder-2',
            title: '🛠 Tools',
            depth: 1,
            parentId: 'folder-1',
            index: 0,
            expanded: true,
            children: [
              {
                kind: 'bookmark',
                id: 'bookmark-1',
                title: 'GitHub',
                url: 'https://github.com/',
                depth: 2,
                parentId: 'folder-2',
                index: 0,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('空のフォルダは children が空のフォルダ行を返す', () => {
    const tree = [folder('folder-1', 'Empty')];

    expect(buildBookmarkTree(tree, collapsed(), '1')).toEqual([
      {
        kind: 'folder',
        id: 'folder-1',
        title: 'Empty',
        depth: 0,
        parentId: '1',
        index: 0,
        expanded: true,
        children: [],
      },
    ]);
  });
});
