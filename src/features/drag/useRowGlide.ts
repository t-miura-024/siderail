import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

interface RowGlideOptions {
  /** 行を検索する範囲の要素 */
  scopeRef: RefObject<HTMLElement | null>;
  /** 行要素に付けるセレクタ（例: '[data-bookmark-row-id]'） */
  rowSelector: string;
  /** 行 ID が入る dataset キー（例: 'bookmarkRowId'） */
  rowIdKey: string;
  /** 並び・所属が変わると変わる署名 */
  structureSignature: string;
  /** ドラッグ中のプレビュー位置。なければ null */
  previewKey: string | null;
  duration?: number;
}

const GLIDE_ANIMATION_ID = 'row-glide';
const GLIDE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

function getTranslateY(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (transform === 'none') {
    return 0;
  }
  return new DOMMatrixReadOnly(transform).m42;
}

/**
 * リスト行の移動をなめらかにする FLIP アニメーション。
 *
 * ドロップ確定後の並べ替えだけでなく、ドラッグ中のプレビュー移動による
 * 行の押しのけも滑らかにする。構造もプレビューも変わらない更新
 * （フォルダ開閉・アコーディオンなど）では進行中のアニメーションに触れず、
 * レイアウト位置の記録だけを更新する。
 */
export function useRowGlide({
  scopeRef,
  rowSelector,
  rowIdKey,
  structureSignature,
  previewKey,
  duration = 240,
}: RowGlideOptions): void {
  const prevTopsRef = useRef<Map<string, number>>(new Map());
  const prevStateRef = useRef<{ signature: string; preview: string | null } | null>(null);
  /** 進行中のアニメーションが基準にしたレイアウト位置 */
  const animationBasesRef = useRef<WeakMap<HTMLElement, number>>(new WeakMap());

  // フォルダ開閉など、React の再描画を伴わずにレイアウトだけが変わる更新のあと、
  // 次回の比較用にレイアウト位置を記録し直す。これをしないと、アコーディオンを
  // 閉じた直後のドラッグで、行が古い位置から不自然に滑ってしまう。
  useEffect(() => {
    const scope = scopeRef.current;
    if (scope === null) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const scopeTop = scope.getBoundingClientRect().top;
      const tops = new Map<string, number>();
      for (const element of scope.querySelectorAll<HTMLElement>(rowSelector)) {
        const id = element.dataset[rowIdKey];
        if (id === undefined || element.getClientRects().length === 0) {
          continue;
        }
        const visualTop = element.getBoundingClientRect().top - scopeTop;
        tops.set(id, visualTop - getTranslateY(element));
      }
      if (tops.size > 0) {
        prevTopsRef.current = tops;
      }
    });
    observer.observe(scope);

    return () => {
      observer.disconnect();
    };
  }, [rowIdKey, rowSelector, scopeRef]);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (scope === null) {
      return;
    }

    const elements = [...scope.querySelectorAll<HTMLElement>(rowSelector)];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const prevState = prevStateRef.current;
    const structureChanged = prevState === null || prevState.signature !== structureSignature;
    const previewChanged = (prevState?.preview ?? null) !== previewKey;
    prevStateRef.current = { signature: structureSignature, preview: previewKey };

    const scopeTop = scope.getBoundingClientRect().top;
    const prevTops = prevTopsRef.current;
    const animationBases = animationBasesRef.current;
    const rows: {
      element: HTMLElement;
      id: string;
      translateY: number;
      visualTop: number;
      layoutTop: number;
      gliding: boolean;
    }[] = [];
    const layoutTops = new Map<string, number>();

    for (const element of elements) {
      const id = element.dataset[rowIdKey];
      if (id === undefined) {
        continue;
      }
      // 非表示中の行（ドラッグ元）はレイアウト位置が不定なので対象外にする。
      if (element.getClientRects().length === 0) {
        continue;
      }
      const visualTop = element.getBoundingClientRect().top - scopeTop;
      // transform を除いたレイアウト上の位置。アニメ中でも正しい位置を記録できる。
      const translateY = getTranslateY(element);
      const layoutTop = visualTop - translateY;
      layoutTops.set(id, layoutTop);
      rows.push({
        element,
        id,
        translateY,
        visualTop,
        layoutTop,
        gliding: element.getAnimations().some((animation) => animation.id === GLIDE_ANIMATION_ID),
      });
    }

    prevTopsRef.current = layoutTops;

    if ((!structureChanged && !previewChanged) || prevTops.size === 0 || reduced) {
      return;
    }

    for (const row of rows) {
      const oldLayoutTop = prevTops.get(row.id);
      if (oldLayoutTop === undefined) {
        if (structureChanged) {
          row.element.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 160,
            easing: 'ease-out',
          });
        }
        continue;
      }

      // 行き先が変わっていない行は、進行中のアニメーションをそのまま続ける。
      // 他の行の移動に巻き込まれて毎回アニメーションをやり直すと、
      // イージングが途中で巻き戻り、動きがカクつく。
      if (Math.abs(oldLayoutTop - row.layoutTop) < 0.5) {
        continue;
      }

      // アニメーション中にレイアウトが変わると、transform は新しいレイアウトを
      // 基準に適用される。開始時の基準位置と現在の transform から、レイアウト
      // 変化前の見た目の位置を復元する。
      const baseTop = animationBases.get(row.element);
      const startTop =
        row.gliding && baseTop !== undefined ? baseTop + row.translateY : oldLayoutTop;

      for (const animation of row.element.getAnimations()) {
        if (animation.id === GLIDE_ANIMATION_ID) {
          animation.cancel();
        }
      }
      animationBases.delete(row.element);

      const from = startTop - row.layoutTop;

      if (Math.abs(from) >= 0.5) {
        const animation = row.element.animate(
          [{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }],
          { duration, easing: GLIDE_EASING },
        );
        animation.id = GLIDE_ANIMATION_ID;
        animationBases.set(row.element, row.layoutTop);
      }
    }
  });
}
