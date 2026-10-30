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

  let tabs = initialTabs.map((tab) => ({ ...tab }));
  let nextTabId = Math.max(0, ...tabs.map((tab) => tab.id ?? 0)) + 1;

  const local = {
    async get(
      keys?: string | string[] | Record<string, unknown> | null,
    ): Promise<Record<string, unknown>> {
      if (keys === undefined || keys === null) {
        return Object.fromEntries(storageData);
      }

      if (typeof keys === 'string') {
        return storageData.has(keys) ? { [keys]: storageData.get(keys) } : {};
      }

      if (Array.isArray(keys)) {
        return Object.fromEntries(
          keys.filter((key) => storageData.has(key)).map((key) => [key, storageData.get(key)]),
        );
      }

      return Object.fromEntries(
        Object.entries(keys).map(([key, defaultValue]) => [
          key,
          storageData.has(key) ? storageData.get(key) : defaultValue,
        ]),
      );
    },

    async set(items: Record<string, unknown>): Promise<void> {
      const changes: StorageChanges = {};

      for (const [key, newValue] of Object.entries(items)) {
        changes[key] = { oldValue: storageData.get(key), newValue };
        storageData.set(key, newValue);
      }

      storageEvents.trigger(changes, 'local');
    },

    async remove(keys: string | string[]): Promise<void> {
      const keysToRemove = typeof keys === 'string' ? [keys] : keys;
      const changes: StorageChanges = {};

      for (const key of keysToRemove) {
        if (!storageData.has(key)) {
          continue;
        }

        changes[key] = { oldValue: storageData.get(key), newValue: undefined };
        storageData.delete(key);
      }

      if (Object.keys(changes).length > 0) {
        storageEvents.trigger(changes, 'local');
      }
    },

    async clear(): Promise<void> {
      const changes: StorageChanges = {};

      for (const [key, oldValue] of storageData) {
        changes[key] = { oldValue, newValue: undefined };
      }

      storageData.clear();

      if (Object.keys(changes).length > 0) {
        storageEvents.trigger(changes, 'local');
      }
    },
  };

  const bookmarks = {
    async getTree(): Promise<BookmarkNode[]> {
      return [
        {
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
        },
      ];
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

      return { ...tab };
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
      for (const tab of tabs) {
        tab.active = false;
      }

      const tab = createFixtureTab({
        id: nextTabId,
        index: tabs.length,
        title: createProperties.url === undefined ? 'New Tab' : '',
        url: createProperties.url,
        active: true,
      });
      nextTabId += 1;
      tabs.push(tab);

      tabEvents.onCreated.trigger(tab);
      tabEvents.onActivated.trigger({ tabId: tab.id ?? -1, windowId: tab.windowId });

      return { ...tab };
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
