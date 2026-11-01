import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPinnedTab,
  getTab,
  onTabsChanged,
  pinTab,
  resetTabUrl,
  setTabMuted,
  unpinTab,
} from './tabs';

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

describe('Pin 用のタブ操作', () => {
  it('createPinnedTab はピン留めしてアクティブなタブを開く', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    vi.stubGlobal('chrome', { tabs: { create } });

    await createPinnedTab('https://example.com/');

    expect(create).toHaveBeenCalledWith({
      url: 'https://example.com/',
      pinned: true,
      active: true,
    });
  });

  it('pinTab は pinned: true を渡す', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    vi.stubGlobal('chrome', { tabs: { update } });

    await pinTab(1);

    expect(update).toHaveBeenCalledWith(1, { pinned: true });
  });

  it('unpinTab は pinned: false を渡す', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    vi.stubGlobal('chrome', { tabs: { update } });

    await unpinTab(1);

    expect(update).toHaveBeenCalledWith(1, { pinned: false });
  });

  it('resetTabUrl は URL を更新する', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    vi.stubGlobal('chrome', { tabs: { update } });

    await resetTabUrl(1, 'https://example.com/');

    expect(update).toHaveBeenCalledWith(1, { url: 'https://example.com/' });
  });

  it('setTabMuted はミュート状態を更新する', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    vi.stubGlobal('chrome', { tabs: { update } });

    await setTabMuted(1, true);

    expect(update).toHaveBeenCalledWith(1, { muted: true });
  });

  it('getTab は存在しないタブに対して undefined を返す', async () => {
    const get = vi.fn().mockRejectedValue(new Error('not found'));
    vi.stubGlobal('chrome', { tabs: { get } });

    await expect(getTab(1)).resolves.toBeUndefined();
  });
});
