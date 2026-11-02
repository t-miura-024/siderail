/**
 * 閉じるボタン用の × アイコン。
 * テキストの `×` はフォントのメトリクスで上下中央からずれるため、SVG で描く。
 */
export function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
