import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  outDir: 'dist',
  vite: () => ({
    plugins: [tailwindcss()],
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
