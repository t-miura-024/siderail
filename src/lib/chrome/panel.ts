/**
 * ツールバーの拡張アイコンクリックでサイドパネルが開くように設定する。
 */
export async function configureSidePanel(): Promise<void> {
  if (typeof chrome.sidePanel?.setPanelBehavior !== 'function') {
    throw new Error(
      'chrome.sidePanel.setPanelBehavior が利用できません。サイドパネル API に対応した Chrome で実行してください。',
    );
  }

  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}
