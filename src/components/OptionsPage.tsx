import { useState } from 'react';
import type { TabManagementMode } from '@/features/mode/mode';
import { saveMode, useMode } from '@/features/mode/useMode';

interface ModeOption {
  value: TabManagementMode;
  label: string;
  description: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    value: 'arc',
    label: 'Arc 方式',
    description:
      'ブックマークを Pinned、ピン留めしていないタブを Today として表示します。Pinned から開いたタブは Chrome のピン留めタブになります。',
  },
  {
    value: 'chrome',
    label: 'Chrome 方式',
    description: 'ブックマークとタブをそのまま並べます。従来の Siderail の表示です。',
  },
];

/**
 * options ページ。タブ管理の方式を切り替える。
 */
export function OptionsPage() {
  const { mode, ready } = useMode();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: TabManagementMode) => {
    setError(null);
    void saveMode(next).catch((failure: unknown) => {
      console.error('タブ管理モードを保存できませんでした', failure);
      setError('設定を保存できませんでした');
    });
  };

  return (
    <div className="h-dvh overflow-y-auto">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-sidebar-text">Siderail の設定</h1>
          <p className="text-sm text-sidebar-muted">サイドパネルのタブ管理の方式を選びます。</p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-sidebar-text">タブ管理</h2>

          <div className="flex flex-col gap-2" role="radiogroup" aria-label="タブ管理の方式">
            {MODE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={[
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                  mode === option.value
                    ? 'border-sidebar-muted/60 bg-sidebar-hover'
                    : 'border-white/10 hover:bg-sidebar-hover/60',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="tab-management-mode"
                  value={option.value}
                  checked={mode === option.value}
                  disabled={!ready}
                  onChange={() => {
                    handleChange(option.value);
                  }}
                  className="mt-1 accent-[#ececee]"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-[15px] text-sidebar-text">{option.label}</span>
                  <span className="text-[13px] leading-relaxed text-sidebar-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {error !== null && (
            <p role="alert" className="text-[12px] text-[#f08383]">
              {error}
            </p>
          )}

          <p className="text-[12px] text-sidebar-muted">
            変更は開いているサイドパネルにすぐ反映されます。
          </p>
        </section>
      </main>
    </div>
  );
}
