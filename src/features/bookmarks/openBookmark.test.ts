import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activateTab, createTab, findTabByUrl } from '../../lib/chrome';
import { openBookmarkUrl } from './openBookmark';

vi.mock('../../lib/chrome', () => ({
  activateTab: vi.fn(),
  createTab: vi.fn(),
  findTabByUrl: vi.fn(),
}));

const findTabByUrlMock = vi.mocked(findTabByUrl);
const activateTabMock = vi.mocked(activateTab);
const createTabMock = vi.mocked(createTab);

describe('openBookmarkUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activateTabMock.mockResolvedValue(undefined);
    createTabMock.mockResolvedValue({} as chrome.tabs.Tab);
  });

  it('現在のウィンドウに同じ URL のタブがあればそのタブへ切り替える', async () => {
    findTabByUrlMock.mockResolvedValue({ id: 42 } as chrome.tabs.Tab);

    await openBookmarkUrl('https://mail.example.com/inbox');

    expect(findTabByUrlMock).toHaveBeenCalledWith('https://mail.example.com/inbox');
    expect(activateTabMock).toHaveBeenCalledWith(42);
    expect(createTabMock).not.toHaveBeenCalled();
  });

  it('現在のウィンドウに同じ URL のタブがなければ新しいタブで開く', async () => {
    findTabByUrlMock.mockResolvedValue(undefined);

    await openBookmarkUrl('https://mail.example.com/inbox');

    expect(createTabMock).toHaveBeenCalledWith('https://mail.example.com/inbox');
    expect(activateTabMock).not.toHaveBeenCalled();
  });

  it('id を持たないタブは切り替え対象にせず新しいタブで開く', async () => {
    findTabByUrlMock.mockResolvedValue({} as chrome.tabs.Tab);

    await openBookmarkUrl('https://mail.example.com/inbox');

    expect(createTabMock).toHaveBeenCalledWith('https://mail.example.com/inbox');
    expect(activateTabMock).not.toHaveBeenCalled();
  });
});
