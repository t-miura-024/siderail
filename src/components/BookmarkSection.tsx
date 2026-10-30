import { openBookmarkUrl } from '@/features/bookmarks/openBookmark';
import { useBookmarks } from '@/features/bookmarks/useBookmarks';
import { BookmarkFolderRow, BookmarkRow } from './BookmarkRow';

function reportError(error: unknown): void {
  console.error('ブックマークを開けませんでした', error);
}

export function BookmarkSection() {
  const { rows, toggleFolder } = useBookmarks();

  return (
    <section aria-label="ブックマーク" className="flex flex-col gap-1">
      {rows.map((row) =>
        row.kind === 'folder' ? (
          <BookmarkFolderRow
            key={row.id}
            title={row.title}
            depth={row.depth}
            expanded={row.expanded}
            onToggle={() => {
              toggleFolder(row.id);
            }}
          />
        ) : (
          <BookmarkRow
            key={row.id}
            title={row.title}
            url={row.url}
            depth={row.depth}
            onClick={() => {
              void openBookmarkUrl(row.url).catch(reportError);
            }}
          />
        ),
      )}
    </section>
  );
}
