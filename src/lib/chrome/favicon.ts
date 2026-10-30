const DEFAULT_FAVICON_SIZE = 32;

/**
 * `favicon` permission と Chrome の `_favicon` API を使った favicon URL を組み立てる。
 */
export function getFaviconUrl(pageUrl: string, size = DEFAULT_FAVICON_SIZE): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.toString();
}
