import { BookmarkSection } from './BookmarkSection';
import { NewTabRow } from './NewTabRow';
import { TabSection } from './TabSection';

export function Sidebar() {
  return (
    <div className="h-dvh overflow-y-auto bg-sidebar-bg text-sidebar-text">
      <div className="flex min-h-full flex-col px-1.5 py-1.5">
        <BookmarkSection />
        <hr className="mx-2.5 my-4 h-px shrink-0 border-0 bg-sidebar-line" />
        <NewTabRow />
        <TabSection />
      </div>
    </div>
  );
}
