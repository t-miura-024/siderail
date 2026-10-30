import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onBookmarksChanged } from './bookmarks';

type Listener = () => void;

interface MockEvent {
  addListener: Mock<(listener: Listener) => void>;
  removeListener: Mock<(listener: Listener) => void>;
}

const BOOKMARK_EVENT_NAMES = [
  'onCreated',
  'onRemoved',
  'onChanged',
  'onMoved',
  'onChildrenReordered',
] as const;

type BookmarkEventName = (typeof BOOKMARK_EVENT_NAMES)[number];

function createMockEvent(): MockEvent {
  return {
    addListener: vi.fn<(listener: Listener) => void>(),
    removeListener: vi.fn<(listener: Listener) => void>(),
  };
}

function createBookmarkEvents(): Record<BookmarkEventName, MockEvent> {
  return {
    onCreated: createMockEvent(),
    onRemoved: createMockEvent(),
    onChanged: createMockEvent(),
    onMoved: createMockEvent(),
    onChildrenReordered: createMockEvent(),
  };
}

function setupChrome(): Record<BookmarkEventName, MockEvent> {
  const events = createBookmarkEvents();
  vi.stubGlobal('chrome', { bookmarks: events });
  return events;
}

function getRegisteredListener(event: MockEvent): Listener {
  const listener = event.addListener.mock.calls[0]?.[0];
  if (listener === undefined) {
    throw new Error('リスナーが登録されていません');
  }
  return listener;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('onBookmarksChanged', () => {
  it('ブックマークの追加・削除・変更・移動・並べ替えを購読する', () => {
    const events = setupChrome();

    onBookmarksChanged(() => {});

    for (const name of BOOKMARK_EVENT_NAMES) {
      expect(events[name].addListener).toHaveBeenCalledTimes(1);
    }
  });

  it('フォルダ内の並べ替え（onChildrenReordered）でもリスナーを呼ぶ', () => {
    const events = setupChrome();
    const listener = vi.fn<Listener>();

    onBookmarksChanged(listener);

    getRegisteredListener(events.onChildrenReordered)();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe で購読したすべてのイベントからリスナーを解除する', () => {
    const events = setupChrome();

    const unsubscribe = onBookmarksChanged(() => {});
    const listener = getRegisteredListener(events.onCreated);

    unsubscribe();

    for (const name of BOOKMARK_EVENT_NAMES) {
      expect(events[name].removeListener).toHaveBeenCalledWith(listener);
    }
  });
});
