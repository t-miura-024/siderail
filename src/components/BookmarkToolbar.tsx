import { BookmarkPlus, FolderPlus, Settings } from 'lucide-react';
import { openOptionsPage } from '@/lib/chrome';

interface BookmarkToolbarProps {
  onAddFolder: () => void;
  onAddBookmark: () => void;
  addFolderLabel?: string;
  addBookmarkLabel?: string;
}

const BUTTON_CLASS_NAME =
  'flex size-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text';

const ICON_PROPS = { 'aria-hidden': 'true', strokeWidth: 1.5, className: 'size-5' } as const;

/**
 * サイドバー最上部のツールバー。ブックマークの追加操作と設定ページへの導線を並べる。
 */
export function BookmarkToolbar({
  onAddFolder,
  onAddBookmark,
  addFolderLabel = 'フォルダを追加',
  addBookmarkLabel = 'ブックマークを追加',
}: BookmarkToolbarProps) {
  const handleOpenSettings = () => {
    void openOptionsPage().catch((error: unknown) => {
      console.error('設定ページを開けませんでした', error);
    });
  };

  return (
    <div className="flex items-center justify-end gap-0.5 pb-1">
      <button
        type="button"
        onClick={onAddFolder}
        aria-label={addFolderLabel}
        title={addFolderLabel}
        className={BUTTON_CLASS_NAME}
      >
        <FolderPlus {...ICON_PROPS} />
      </button>
      <button
        type="button"
        onClick={onAddBookmark}
        aria-label={addBookmarkLabel}
        title={addBookmarkLabel}
        className={BUTTON_CLASS_NAME}
      >
        <BookmarkPlus {...ICON_PROPS} />
      </button>
      <button
        type="button"
        onClick={handleOpenSettings}
        aria-label="設定を開く"
        title="設定を開く"
        className={BUTTON_CLASS_NAME}
      >
        <Settings {...ICON_PROPS} />
      </button>
    </div>
  );
}
