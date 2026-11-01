import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  createBookmark,
  createBookmarkFolder,
  removeBookmark,
  removeBookmarkFolder,
  renameBookmarkFolder,
  updateBookmark,
} from '@/lib/chrome';

export type BookmarkDialogRequest =
  | { kind: 'create-folder'; parentId: string }
  | { kind: 'create-bookmark'; parentId: string }
  | { kind: 'rename-folder'; folderId: string; title: string }
  | { kind: 'delete-folder'; folderId: string; title: string }
  | { kind: 'edit-bookmark'; bookmarkId: string; title: string; url: string }
  | { kind: 'delete-bookmark'; bookmarkId: string; title: string };

interface BookmarkDialogProps {
  request: BookmarkDialogRequest;
  onClose: () => void;
  /** 「ブックマーク」の代わりに表示する名詞。Arc 方式では「ピン」。 */
  bookmarkNoun?: string;
}

const INPUT_CLASS_NAME =
  'w-full rounded-md border border-white/10 bg-sidebar-bg px-2 py-1.5 text-sm text-sidebar-text outline-none focus:border-sidebar-muted';

const CANCEL_BUTTON_CLASS_NAME =
  'rounded-md px-3 py-1.5 text-[13px] text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-text';

const PRIMARY_BUTTON_CLASS_NAME =
  'rounded-md bg-sidebar-active px-3 py-1.5 text-[13px] text-sidebar-text transition-colors hover:bg-white/20 disabled:opacity-50';

function getHeading(request: BookmarkDialogRequest, bookmarkNoun: string): string {
  switch (request.kind) {
    case 'create-folder':
      return 'フォルダを追加';
    case 'create-bookmark':
      return `${bookmarkNoun}を追加`;
    case 'rename-folder':
      return 'フォルダ名を変更';
    case 'delete-folder':
      return 'フォルダを削除';
    case 'edit-bookmark':
      return `${bookmarkNoun}を編集`;
    case 'delete-bookmark':
      return `${bookmarkNoun}を削除`;
  }
}

/**
 * ブックマークの追加・フォルダの名前変更・削除に使う小さなダイアログ。
 */
export function BookmarkDialog({
  request,
  onClose,
  bookmarkNoun = 'ブックマーク',
}: BookmarkDialogProps) {
  const [title, setTitle] = useState(
    request.kind === 'rename-folder' ||
      request.kind === 'delete-folder' ||
      request.kind === 'edit-bookmark' ||
      request.kind === 'delete-bookmark'
      ? request.title
      : '',
  );
  const [url, setUrl] = useState(request.kind === 'edit-bookmark' ? request.url : '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);

    if (request.kind === 'delete-folder' || request.kind === 'delete-bookmark') {
      setSubmitting(true);
      try {
        if (request.kind === 'delete-folder') {
          await removeBookmarkFolder(request.folderId);
        } else {
          await removeBookmark(request.bookmarkId);
        }
        onClose();
      } catch (failure) {
        console.error('ブックマークを削除できませんでした', failure);
        setError('削除できませんでした');
        setSubmitting(false);
      }
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      setError('名前を入力してください');
      return;
    }

    const isUrlEditable = request.kind === 'create-bookmark' || request.kind === 'edit-bookmark';
    const trimmedUrl = isUrlEditable ? url.trim() : '';
    if (isUrlEditable && trimmedUrl === '') {
      setError('URL を入力してください');
      return;
    }

    setSubmitting(true);

    try {
      switch (request.kind) {
        case 'create-folder':
          await createBookmarkFolder(request.parentId, trimmedTitle);
          break;
        case 'create-bookmark':
          await createBookmark(request.parentId, trimmedTitle, trimmedUrl);
          break;
        case 'rename-folder':
          await renameBookmarkFolder(request.folderId, trimmedTitle);
          break;
        case 'edit-bookmark':
          await updateBookmark(request.bookmarkId, trimmedTitle, trimmedUrl);
          break;
      }
      onClose();
    } catch (failure) {
      console.error('ブックマークを保存できませんでした', failure);
      setError('保存できませんでした');
      setSubmitting(false);
    }
  };

  const heading = getHeading(request, bookmarkNoun);
  const isDelete = request.kind === 'delete-folder' || request.kind === 'delete-bookmark';
  const sidebarRect = document.querySelector('[data-siderail-sidebar]')?.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed z-50 flex items-center justify-center bg-black/50 p-4"
      style={
        sidebarRect === undefined
          ? { inset: 0 }
          : {
              left: sidebarRect.left,
              top: sidebarRect.top,
              width: sidebarRect.width,
              height: sidebarRect.height,
            }
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-dialog-title"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="w-full max-w-[280px] rounded-xl border border-white/10 bg-sidebar-hover p-3 shadow-xl"
      >
        <h2 id="bookmark-dialog-title" className="text-sm font-semibold text-sidebar-text">
          {heading}
        </h2>

        {isDelete ? (
          <p className="mt-2 text-[13px] text-sidebar-muted">
            {request.kind === 'delete-folder'
              ? `「${request.title}」と中の${bookmarkNoun}をすべて削除します。`
              : `「${request.title}」を削除します。`}
          </p>
        ) : (
          <>
            <label className="mt-3 flex flex-col gap-1 text-[12px] text-sidebar-muted">
              名前
              <input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                className={INPUT_CLASS_NAME}
              />
            </label>

            {(request.kind === 'create-bookmark' || request.kind === 'edit-bookmark') && (
              <label className="mt-2 flex flex-col gap-1 text-[12px] text-sidebar-muted">
                URL
                <input
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                  }}
                  placeholder="https://example.com/"
                  className={INPUT_CLASS_NAME}
                />
              </label>
            )}
          </>
        )}

        {error !== null && (
          <p role="alert" className="mt-2 text-[12px] text-[#f08383]">
            {error}
          </p>
        )}

        <div className="mt-3 flex justify-end gap-1">
          <button type="button" onClick={onClose} className={CANCEL_BUTTON_CLASS_NAME}>
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={
              isDelete
                ? 'rounded-md bg-[#b3373b] px-3 py-1.5 text-[13px] text-white transition-colors hover:bg-[#c94045] disabled:opacity-50'
                : PRIMARY_BUTTON_CLASS_NAME
            }
          >
            {isDelete
              ? '削除'
              : request.kind === 'rename-folder' || request.kind === 'edit-bookmark'
                ? '変更'
                : '追加'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
