interface BookmarkToolbarProps {
  onAddFolder: () => void;
  onAddBookmark: () => void;
  addFolderLabel?: string;
  addBookmarkLabel?: string;
}

const BUTTON_CLASS_NAME =
  'flex size-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text';

function FolderPlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
    >
      <path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v6M9 13h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkPlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
    >
      <path
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 8v4M10 10h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * ブックマークバー直下にフォルダやブックマークを追加するための最上部ツールバー。
 */
export function BookmarkToolbar({
  onAddFolder,
  onAddBookmark,
  addFolderLabel = 'フォルダを追加',
  addBookmarkLabel = 'ブックマークを追加',
}: BookmarkToolbarProps) {
  return (
    <div className="flex items-center justify-end gap-0.5 pb-1">
      <button
        type="button"
        onClick={onAddFolder}
        aria-label={addFolderLabel}
        title={addFolderLabel}
        className={BUTTON_CLASS_NAME}
      >
        <FolderPlusIcon />
      </button>
      <button
        type="button"
        onClick={onAddBookmark}
        aria-label={addBookmarkLabel}
        title={addBookmarkLabel}
        className={BUTTON_CLASS_NAME}
      >
        <BookmarkPlusIcon />
      </button>
    </div>
  );
}
