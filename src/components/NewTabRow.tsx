import { createTab } from '@/lib/chrome';

export function NewTabRow() {
  const handleClick = () => {
    createTab().catch((error: unknown) => {
      console.error('新しいタブを開けませんでした', error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 w-full items-center gap-3 rounded-lg px-2 text-left text-[15px] text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
    >
      <span
        aria-hidden="true"
        className="flex size-5 items-center justify-center text-lg leading-none"
      >
        +
      </span>
      <span>New Tab</span>
    </button>
  );
}
