import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureSidePanel } from './panel';

interface PanelBehavior {
  openPanelOnActionClick: boolean;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('configureSidePanel', () => {
  it('ツールバーアイコンクリックでサイドパネルが開くように設定する', async () => {
    const setPanelBehavior = vi
      .fn<(behavior: PanelBehavior) => Promise<void>>()
      .mockResolvedValue(undefined);
    vi.stubGlobal('chrome', { sidePanel: { setPanelBehavior } });

    await configureSidePanel();

    expect(setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  });

  it('setPanelBehavior が利用できない場合は明確なエラーで reject する', async () => {
    vi.stubGlobal('chrome', { sidePanel: {} });

    await expect(configureSidePanel()).rejects.toThrow(/setPanelBehavior/);
  });
});
