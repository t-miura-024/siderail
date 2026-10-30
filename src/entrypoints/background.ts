import { defineBackground } from 'wxt/utils/define-background';
import { configureSidePanel } from '@/lib/chrome';

export default defineBackground(() => {
  configureSidePanel().catch((error: unknown) => {
    console.error('サイドパネルの動作設定に失敗しました', error);
  });
});
