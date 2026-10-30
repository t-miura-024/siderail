import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'wxt';

const FAVICON_PATH = '/_favicon/';
const SIDEPANEL_DEV_PATH = '/src/entrypoints/sidepanel/index.html';
const DEV_HARNESS_PATHS = new Set(['/', '/sidepanel.html']);

/**
 * 開発ハーネス用の小さな dev サーバー拡張。
 *
 * - `/` と `/sidepanel.html` を実際の HTML エントリポイントへリダイレクトする
 * - `chrome-extension://` の `_favicon` API の代わりに、実サイトの favicon へリダイレクトする
 */
function devHarnessPlugin(): Plugin {
  return {
    name: 'siderail-dev-harness',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === undefined) {
          next();
          return;
        }

        const url = new URL(request.url, 'http://localhost');

        if (DEV_HARNESS_PATHS.has(url.pathname)) {
          response.statusCode = 302;
          response.setHeader('Location', SIDEPANEL_DEV_PATH);
          response.end();
          return;
        }

        if (!url.pathname.startsWith(FAVICON_PATH)) {
          next();
          return;
        }

        const pageUrl = url.searchParams.get('pageUrl');
        if (pageUrl === null) {
          response.statusCode = 400;
          response.end('pageUrl is required');
          return;
        }

        let hostname: string;
        try {
          hostname = new URL(pageUrl).hostname;
        } catch {
          response.statusCode = 400;
          response.end('pageUrl is invalid');
          return;
        }

        if (hostname === '') {
          response.statusCode = 404;
          response.end();
          return;
        }

        response.statusCode = 302;
        response.setHeader(
          'Location',
          `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
        );
        response.end();
      });
    },
  };
}

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  outDir: 'dist',
  vite: () => ({
    plugins: [tailwindcss(), devHarnessPlugin()],
    // dist 配下の生成済み HTML まで依存スキャンに含めない。
    optimizeDeps: {
      entries: ['src/entrypoints/**/*.html'],
    },
  }),
  manifest: {
    name: 'Siderail',
    description: 'Chrome のサイドパネルに、ブックマークとタブを縦に並べる',
    permissions: ['sidePanel', 'bookmarks', 'tabs', 'storage', 'favicon'],
    minimum_chrome_version: '114',
    action: {
      default_title: 'Siderail',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        96: 'icon/96.png',
        128: 'icon/128.png',
      },
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
});
