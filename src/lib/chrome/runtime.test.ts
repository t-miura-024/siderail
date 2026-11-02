import { afterEach, describe, expect, it, vi } from 'vitest';
import { openOptionsPage } from './runtime';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('openOptionsPage', () => {
  it('chrome.runtime.openOptionsPage を呼ぶ', async () => {
    const openOptionsPageMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('chrome', { runtime: { openOptionsPage: openOptionsPageMock } });

    await openOptionsPage();

    expect(openOptionsPageMock).toHaveBeenCalledOnce();
  });
});
