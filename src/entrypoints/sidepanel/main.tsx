import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from '@/components/Sidebar';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('#root が見つかりません');
}

/**
 * WXT の dev サーバー上で開いたときだけ、Chrome API のモックとリサイズ枠を有効にする。
 * 拡張機能のサイドパネル（chrome-extension://）や本番ビルドでは無効。
 */
const isWebHarness = import.meta.env.DEV && location.protocol === 'http:';

async function render(container: HTMLElement): Promise<void> {
  let content: ReactNode = <Sidebar />;

  if (isWebHarness) {
    const [{ installFakeChrome }, { HarnessFrame }] = await Promise.all([
      import('@/dev/fakeChrome'),
      import('@/dev/HarnessFrame'),
    ]);

    installFakeChrome();
    content = (
      <HarnessFrame>
        <Sidebar />
      </HarnessFrame>
    );
  }

  createRoot(container).render(<StrictMode>{content}</StrictMode>);
}

void render(rootElement).catch((error: unknown) => {
  console.error('画面を描画できませんでした', error);
});
