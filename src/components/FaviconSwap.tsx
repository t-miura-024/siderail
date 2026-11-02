import { Favicon } from './Favicon';

interface FaviconSwapProps {
  /** ライブタブが現在表示している URL。 */
  currentUrl: string;
  /** ピン元の URL。 */
  pinnedUrl: string;
}

/**
 * 現在のページの favicon を表示し、親の `group/favicon` へのホバーで
 * ピン元の favicon にクロスフェードする。
 */
export function FaviconSwap({ currentUrl, pinnedUrl }: FaviconSwapProps) {
  return (
    <span className="relative block size-5 shrink-0">
      <span className="absolute inset-0 transition-opacity duration-150 group-hover/favicon:opacity-0 motion-reduce:transition-none">
        <Favicon key={currentUrl} url={currentUrl} />
      </span>
      <span className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover/favicon:opacity-100 motion-reduce:transition-none">
        <Favicon key={pinnedUrl} url={pinnedUrl} />
      </span>
    </span>
  );
}
