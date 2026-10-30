import { useState } from 'react';
import { getFaviconUrl } from '@/lib/chrome';

interface BookmarkRowProps {
  title: string;
  url: string;
  depth: number;
  onClick: () => void;
}

interface BookmarkFolderRowProps {
  title: string;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
}

const ROW_CLASS_NAME =
  'flex h-[46px] w-full items-center rounded-xl pr-2 text-left text-[15px] transition-colors hover:bg-sidebar-hover';

function rowStyle(depth: number): { paddingLeft: string } {
  return { paddingLeft: `${8 + depth * 24}px` };
}

function Favicon({ url }: { url: string }) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>(undefined);

  if (failedUrl === url) {
    return (
      <span aria-hidden="true" className="size-5 shrink-0 rounded-[4px] bg-sidebar-skeleton" />
    );
  }

  return (
    <img
      src={getFaviconUrl(url)}
      alt=""
      className="size-5 shrink-0 object-contain"
      onError={() => {
        setFailedUrl(url);
      }}
    />
  );
}

function FolderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-8 shrink-0"
    >
      <path
        d="M2.5 6.5a2 2 0 0 1 2-2h4.2l2 2h8.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookmarkRow({ title, url, depth, onClick }: BookmarkRowProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${ROW_CLASS_NAME} gap-3 text-sidebar-text`}
      style={rowStyle(depth)}
    >
      <Favicon url={url} />
      <span className="truncate">{title}</span>
    </button>
  );
}

export function BookmarkFolderRow({ title, depth, expanded, onToggle }: BookmarkFolderRowProps) {
  return (
    <button
      type="button"
      title={title}
      aria-expanded={expanded}
      onClick={onToggle}
      className={`${ROW_CLASS_NAME} gap-1.5 font-semibold text-sidebar-text`}
      style={rowStyle(depth)}
    >
      <FolderIcon />
      <span className="truncate">{title}</span>
    </button>
  );
}
