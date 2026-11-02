import { X } from 'lucide-react';

/**
 * 閉じるボタン用の × アイコン。
 * テキストの `×` はフォントのメトリクスで上下中央からずれるため、SVG で描く。
 */
export function CloseIcon() {
  return <X aria-hidden="true" strokeWidth={1.75} className="size-4" />;
}
