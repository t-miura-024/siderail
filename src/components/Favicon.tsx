import { useState } from 'react';
import { getFaviconUrl } from '@/lib/chrome';

interface FaviconProps {
  url: string | undefined;
}

/**
 * ブックマーク・タブ・ドラッグ中のゴーストで使う favicon。
 * 取得できない場合はスケルトンの四角を表示する。
 */
export function Favicon({ url }: FaviconProps) {
  const [failed, setFailed] = useState(false);

  if (url === undefined || failed) {
    return (
      <span aria-hidden="true" className="size-5 shrink-0 rounded-[4px] bg-sidebar-skeleton" />
    );
  }

  return (
    <img
      src={getFaviconUrl(url)}
      alt=""
      draggable={false}
      className="size-5 shrink-0 object-contain"
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
