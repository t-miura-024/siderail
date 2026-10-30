import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onTabsChanged } from './tabs';

type Listener = () => void;

interface MockEvent {
  addListener: Mock<(listener: Listener) => void>;
  removeListener: Mock<(listener: Listener) => void>;
}

const TAB_EVENT_NAMES = [
  'onCreated',
  'onRemoved',
  'onActivated',
  'onMoved',
  'onUpdated',
  'onAttached',
  'onDetached',
] as const;

type TabEventName = (typeof TAB_EVENT_NAMES)[number];

function createMockEvent(): MockEvent {
  return {
    addListener: vi.fn<(listener: Listener) => void>(),
    removeListener: vi.fn<(listener: Listener) => void>(),
  };
}

function createTabsEvents(): Record<TabEventName, MockEvent> {
  return {
    onCreated: createMockEvent(),
    onRemoved: createMockEvent(),
    onActivated: createMockEvent(),
    onMoved: createMockEvent(),
    onUpdated: createMockEvent(),
    onAttached: createMockEvent(),
    onDetached: createMockEvent(),
  };
}

function setupChrome(): Record<TabEventName, MockEvent> {
  const events = createTabsEvents();
  vi.stubGlobal('chrome', { tabs: events });
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

describe('onTabsChanged', () => {
  it('タブの追加・削除・アクティブ変更・並べ替え・更新・ウィンドウ間移動を購読する', () => {
    const events = setupChrome();

    onTabsChanged(() => {});

    for (const name of TAB_EVENT_NAMES) {
      expect(events[name].addListener).toHaveBeenCalledTimes(1);
    }
  });

  it('ウィンドウ間の移動（onDetached / onAttached）でもリスナーを呼ぶ', () => {
    const events = setupChrome();
    const listener = vi.fn<Listener>();

    onTabsChanged(listener);

    getRegisteredListener(events.onDetached)();
    getRegisteredListener(events.onAttached)();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe で購読したすべてのイベントからリスナーを解除する', () => {
    const events = setupChrome();

    const unsubscribe = onTabsChanged(() => {});
    const listener = getRegisteredListener(events.onCreated);

    unsubscribe();

    for (const name of TAB_EVENT_NAMES) {
      expect(events[name].removeListener).toHaveBeenCalledWith(listener);
    }
  });
});
