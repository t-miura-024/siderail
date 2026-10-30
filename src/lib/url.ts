export interface UrlBearingTab {
  url?: string | undefined;
}

/**
 * URL 照合用の正規化。
 *
 * - `#hash` を無視する
 * - パス末尾のスラッシュを無視する
 * - クエリ文字列と scheme は比較対象として保持する
 *
 * URL として解釈できない文字列はそのまま返す。
 */
export function normalizeUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  url.hash = '';
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

/**
 * URL に一致するタブを、渡された順序（Chrome のタブ順）で最初に見つかったものから返す。
 */
export function findTabByUrl<T extends UrlBearingTab>(
  tabs: readonly T[],
  url: string,
): T | undefined {
  const target = normalizeUrl(url);
  return tabs.find((tab) => tab.url !== undefined && normalizeUrl(tab.url) === target);
}
