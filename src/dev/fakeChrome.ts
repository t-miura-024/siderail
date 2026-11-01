import { bookmarkBar, createFixtureTab, initialTabs } from './fixtures';

type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;
type StorageChanges = Record<string, chrome.storage.StorageChange>;
type EventListener<TArgs extends unknown[]> = (...args: TArgs) => void;

function createEvent<TArgs extends unknown[] = []>() {
  const listeners = new Set<EventListener<TArgs>>();

  return {
    addListener(listener: EventListener<TArgs>): void {
      listeners.add(listener);
    },
    removeListener(listener: EventListener<TArgs>): void {
      listeners.delete(listener);
    },
    trigger(...args: TArgs): void {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}

function cloneBookmarkNode(node: BookmarkNode): BookmarkNode {
  return node.children === undefined
    ? { ...node }
    : { ...node, children: node.children.map(cloneBookmarkNode) };
}

/**
 * 開発ハーネス用の chrome.* モックをインストールする。
 * 本物の拡張機能（chrome-extension://）では呼ばれない。
 */
export function installFakeChrome(): void {
  const bookmarkEvents = {
    onCreated: createEvent<[string, BookmarkNode]>(),
    onRemoved: createEvent<[string, unknown]>(),
    onChanged: createEvent<[string, unknown]>(),
    onMoved: createEvent<[string, unknown]>(),
    onChildrenReordered: createEvent<[string, unknown]>(),
  };
  const tabEvents = {
    onCreated: createEvent<[chrome.tabs.Tab]>(),
    onRemoved: createEvent<[number, chrome.tabs.OnRemovedInfo]>(),
    onActivated: createEvent<[chrome.tabs.OnActivatedInfo]>(),
    onMoved: createEvent<[number, chrome.tabs.OnMovedInfo]>(),
    onUpdated: createEvent<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(),
    onAttached: createEvent<[number, chrome.tabs.OnAttachedInfo]>(),
    onDetached: createEvent<[number, chrome.tabs.OnDetachedInfo]>(),
  };
  const storageEvents = createEvent<[StorageChanges, chrome.storage.AreaName]>();
  const storageData = new Map<string, unknown>();
  const sessionData = new Map<string, unknown>();

  let tabs = initialTabs.map((tab) => ({ ...tab }));
  let nextTabId = Math.max(0, ...tabs.map((tab) => tab.id ?? 0)) + 1;

  /** ピン留めタブが先頭、それ以外が後ろになるように並べ直す。 */
  function reorderTabs(): void {
    tabs = [...tabs]
      .sort((a, b) => {
        if (a.pinned === b.pinned) {
          return a.index - b.index;
        }
        return a.pinned ? -1 : 1;
      })
      .map((tab, index) => ({ ...tab, index }));
  }

  let nextBookmarkId = 1;
  const rootNode: BookmarkNode = {
    id: '0',
    title: '',
    syncing: false,
    children: [
      {
        id: '1',
        title: 'Bookmarks bar',
        syncing: false,
        children: bookmarkBar.map(cloneBookmarkNode),
      },
    ],
  };

  function findBookmarkNode(
    id: string,
    nodes: readonly BookmarkNode[] = [rootNode],
  ): BookmarkNode | undefined {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }

      const found = node.children === undefined ? undefined : findBookmarkNode(id, node.children);
      if (found !== undefined) {
        return found;
      }
    }

    return undefined;
  }

  function findBookmarkParent(
    id: string,
    nodes: readonly BookmarkNode[] = [rootNode],
  ): BookmarkNode | undefined {
    for (const node of nodes) {
      if (node.children?.some((child) => child.id === id) === true) {
        return node;
      }

      const found = node.children === undefined ? undefined : findBookmarkParent(id, node.children);
      if (found !== undefined) {
        return found;
      }
    }

    return undefined;
  }

  function removeBookmarkNode(id: string): void {
    const parent = findBookmarkParent(id);
    if (parent === undefined) {
      throw new Error(`ブックマークが見つかりません: ${id}`);
    }

    const children = parent.children ?? [];
    const index = children.findIndex((node) => node.id === id);
    if (index === -1) {
      throw new Error(`ブックマークが見つかりません: ${id}`);
    }

    const node = children[index];
    if (node === undefined) {
      throw new Error(`ブックマークが見つかりません: ${id}`);
    }

    children.splice(index, 1);
    bookmarkEvents.onRemoved.trigger(id, { parentId: parent.id, index, node });
  }

  function createStorageArea(data: Map<string, unknown>, areaName: chrome.storage.AreaName) {
    return {
      async get(
        keys?: string | string[] | Record<string, unknown> | null,
      ): Promise<Record<string, unknown>> {
        if (keys === undefined || keys === null) {
          return Object.fromEntries(data);
        }

        if (typeof keys === 'string') {
          return data.has(keys) ? { [keys]: data.get(keys) } : {};
        }

        if (Array.isArray(keys)) {
          return Object.fromEntries(
            keys.filter((key) => data.has(key)).map((key) => [key, data.get(key)]),
          );
        }

        return Object.fromEntries(
          Object.entries(keys).map(([key, defaultValue]) => [
            key,
            data.has(key) ? data.get(key) : defaultValue,
          ]),
        );
      },

      async set(items: Record<string, unknown>): Promise<void> {
        const changes: StorageChanges = {};

        for (const [key, newValue] of Object.entries(items)) {
          changes[key] = { oldValue: data.get(key), newValue };
          data.set(key, newValue);
        }

        storageEvents.trigger(changes, areaName);
      },

      async remove(keys: string | string[]): Promise<void> {
        const keysToRemove = typeof keys === 'string' ? [keys] : keys;
        const changes: StorageChanges = {};

        for (const key of keysToRemove) {
          if (!data.has(key)) {
            continue;
          }

          changes[key] = { oldValue: data.get(key), newValue: undefined };
          data.delete(key);
        }

        if (Object.keys(changes).length > 0) {
          storageEvents.trigger(changes, areaName);
        }
      },

      async clear(): Promise<void> {
        const changes: StorageChanges = {};

        for (const [key, oldValue] of data) {
          changes[key] = { oldValue, newValue: undefined };
        }

        data.clear();

        if (Object.keys(changes).length > 0) {
          storageEvents.trigger(changes, areaName);
        }
      },
    };
  }

  const local = createStorageArea(storageData, 'local');
  const session = createStorageArea(sessionData, 'session');

  const bookmarks = {
    async getTree(): Promise<BookmarkNode[]> {
      return [cloneBookmarkNode(rootNode)];
    },

    async create(details: chrome.bookmarks.CreateDetails): Promise<BookmarkNode> {
      const parentId = details.parentId ?? '1';
      const parent = findBookmarkNode(parentId);
      if (parent === undefined || parent.url !== undefined) {
        throw new Error(`ブックマークの親が見つかりません: ${parentId}`);
      }

      const node: BookmarkNode =
        details.url === undefined
          ? {
              id: `mock-folder-${nextBookmarkId}`,
              title: details.title ?? '',
              syncing: false,
              children: [],
            }
          : {
              id: `mock-bookmark-${nextBookmarkId}`,
              title: details.title ?? '',
              syncing: false,
              url: details.url,
            };
      nextBookmarkId += 1;

      const children = (parent.children ??= []);
      const index = Math.min(Math.max(details.index ?? children.length, 0), children.length);
      children.splice(index, 0, node);
      bookmarkEvents.onCreated.trigger(node.id, cloneBookmarkNode(node));

      return cloneBookmarkNode(node);
    },

    async update(id: string, changes: chrome.bookmarks.UpdateChanges): Promise<BookmarkNode> {
      const node = findBookmarkNode(id);
      if (node === undefined) {
        throw new Error(`ブックマークが見つかりません: ${id}`);
      }

      if (changes.title !== undefined) {
        node.title = changes.title;
      }
      if (changes.url !== undefined) {
        node.url = changes.url;
      }

      bookmarkEvents.onChanged.trigger(id, { title: node.title, url: node.url });
      return cloneBookmarkNode(node);
    },

    async move(id: string, destination: chrome.bookmarks.MoveDestination): Promise<BookmarkNode> {
      const node = findBookmarkNode(id);
      const oldParent = findBookmarkParent(id);
      if (node === undefined || oldParent === undefined) {
        throw new Error(`ブックマークが見つかりません: ${id}`);
      }

      const newParentId = destination.parentId ?? oldParent.id;
      const newParent = findBookmarkNode(newParentId);
      if (newParent === undefined || newParent.url !== undefined) {
        throw new Error(`移動先のフォルダが見つかりません: ${newParentId}`);
      }

      const oldChildren = oldParent.children ?? [];
      const oldIndex = oldChildren.indexOf(node);
      if (oldIndex === -1) {
        throw new Error(`ブックマークが見つかりません: ${id}`);
      }

      const newChildren = newParent.children ?? [];
      let index = Math.min(
        Math.max(destination.index ?? newChildren.length, 0),
        newChildren.length,
      );

      if (oldParent === newParent) {
        if (index === oldIndex || index === oldIndex + 1) {
          return cloneBookmarkNode(node);
        }
        if (index > oldIndex) {
          index -= 1;
        }
      }

      oldChildren.splice(oldIndex, 1);
      (newParent.children ??= []).splice(index, 0, node);
      bookmarkEvents.onMoved.trigger(id, {
        parentId: newParent.id,
        index,
        oldParentId: oldParent.id,
        oldIndex,
      });

      return cloneBookmarkNode(node);
    },

    async remove(id: string): Promise<void> {
      removeBookmarkNode(id);
    },

    async removeTree(id: string): Promise<void> {
      removeBookmarkNode(id);
    },

    ...bookmarkEvents,
  };

  const tabsApi = {
    async query(): Promise<chrome.tabs.Tab[]> {
      return tabs.map((tab) => ({ ...tab }));
    },

    async update(
      tabId: number,
      updateProperties: chrome.tabs.UpdateProperties,
    ): Promise<chrome.tabs.Tab | undefined> {
      const tab = tabs.find((item) => item.id === tabId);
      if (tab === undefined) {
        return undefined;
      }

      if (updateProperties.active === true) {
        for (const item of tabs) {
          item.active = item.id === tabId;
        }
        tabEvents.onActivated.trigger({ tabId, windowId: tab.windowId });
      }

      if (updateProperties.url !== undefined) {
        tab.url = updateProperties.url;
      }

      if (updateProperties.pinned !== undefined) {
        tab.pinned = updateProperties.pinned;
        reorderTabs();
      }

      if (updateProperties.muted !== undefined) {
        tab.mutedInfo = { muted: updateProperties.muted };
      }

      tabEvents.onUpdated.trigger(tabId, {}, { ...tab });

      return { ...tab };
    },

    async get(tabId: number): Promise<chrome.tabs.Tab> {
      const tab = tabs.find((item) => item.id === tabId);
      if (tab === undefined) {
        throw new Error(`タブが見つかりません: ${tabId}`);
      }

      return { ...tab };
    },

    async move(
      tabId: number,
      moveProperties: chrome.tabs.MoveProperties,
    ): Promise<chrome.tabs.Tab> {
      const fromIndex = tabs.findIndex((tab) => tab.id === tabId);
      if (fromIndex === -1) {
        throw new Error(`タブが見つかりません: ${tabId}`);
      }

      let toIndex = moveProperties.index;
      if (toIndex < 0 || toIndex >= tabs.length) {
        toIndex = tabs.length - 1;
      }

      if (toIndex !== fromIndex) {
        const [moved] = tabs.splice(fromIndex, 1);
        if (moved === undefined) {
          throw new Error(`タブが見つかりません: ${tabId}`);
        }
        tabs.splice(toIndex, 0, moved);
        tabs = tabs.map((tab, index) => ({ ...tab, index }));
        tabEvents.onMoved.trigger(tabId, {
          fromIndex,
          toIndex,
          windowId: moved.windowId,
        });
      }

      const movedTab = tabs.find((tab) => tab.id === tabId);
      if (movedTab === undefined) {
        throw new Error(`タブが見つかりません: ${tabId}`);
      }

      return { ...movedTab };
    },

    async remove(tabId: number): Promise<void> {
      const index = tabs.findIndex((tab) => tab.id === tabId);
      if (index === -1) {
        return;
      }

      const [removed] = tabs.splice(index, 1);
      tabs = tabs.map((tab, nextIndex) => ({ ...tab, index: nextIndex }));

      tabEvents.onRemoved.trigger(tabId, { windowId: 1, isWindowClosing: false });

      if (removed?.active === true) {
        const nextActive = tabs[index] ?? tabs[index - 1];
        if (nextActive?.id !== undefined) {
          for (const tab of tabs) {
            tab.active = tab.id === nextActive.id;
          }
          tabEvents.onActivated.trigger({ tabId: nextActive.id, windowId: nextActive.windowId });
        }
      }
    },

    async create(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
      const active = createProperties.active !== false;
      if (active) {
        for (const tab of tabs) {
          tab.active = false;
        }
      }

      const tab = createFixtureTab({
        id: nextTabId,
        index: tabs.length,
        title: createProperties.url === undefined ? 'New Tab' : '',
        url: createProperties.url,
        active,
        pinned: createProperties.pinned === true,
      });
      nextTabId += 1;
      tabs.push(tab);
      reorderTabs();

      const created = tabs.find((item) => item.id === tab.id) ?? tab;
      tabEvents.onCreated.trigger({ ...created });

      if (created.active) {
        tabEvents.onActivated.trigger({ tabId: created.id ?? -1, windowId: created.windowId });
      }

      return { ...created };
    },

    ...tabEvents,
  };

  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    writable: true,
    value: {
      bookmarks,
      tabs: tabsApi,
      storage: {
        local,
        session,
        onChanged: storageEvents,
      },
      runtime: {
        id: 'siderail-dev-harness',
        getURL(path: string): string {
          return new URL(path, window.location.origin).toString();
        },
      },
    },
  });
}
