import { useLayoutEffect, useRef, type RefObject } from 'react';

const GLIDE_DURATION = 180;
const GLIDE_ANIMATION_ID = 'drop-preview-glide';
const GLIDE_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

/**
 * ドロップ位置を示すゴースト行を、リスト内の1つの要素として安定させる。
 *
 * ゴースト自体は絶対配置でリストの上に重ね、ドロップ位置には同じ高さの
 * スペーサーだけを差し込む。プレビュー対象が変わってもゴーストは
 * 再マウントされないため、ちらつかずに現在位置から次の位置へスライドする。
 *
 * @returns ゴースト本体と、ドロップ位置に置くスペーサーの ref。
 */
export function useDropPreviewGlide(sectionRef: RefObject<HTMLElement | null>): {
  ghostRef: RefObject<HTMLDivElement | null>;
  spacerRef: RefObject<HTMLDivElement | null>;
} {
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const prevTargetRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const ghost = ghostRef.current;
    const spacer = spacerRef.current;
    const section = sectionRef.current;
    if (ghost === null || spacer === null || section === null) {
      prevTargetRef.current = null;
      return;
    }

    const targetTop = spacer.getBoundingClientRect().top;
    const previousTarget = prevTargetRef.current;
    prevTargetRef.current = targetTop;

    // 目的地が変わっていない更新では、進行中のアニメーションを止めない。
    if (previousTarget !== null && Math.abs(previousTarget - targetTop) < 0.5) {
      return;
    }

    const startTop = ghost.getBoundingClientRect().top;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (const animation of ghost.getAnimations()) {
      if (animation.id === GLIDE_ANIMATION_ID) {
        animation.cancel();
      }
    }

    ghost.style.top = `${targetTop - section.getBoundingClientRect().top}px`;

    // 初出時はその場に表示する。2回目以降は直前の表示位置から滑らせる。
    if (previousTarget === null || reduced) {
      return;
    }

    const from = startTop - targetTop;
    if (Math.abs(from) < 0.5) {
      return;
    }

    const animation = ghost.animate(
      [{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }],
      { duration: GLIDE_DURATION, easing: GLIDE_EASING },
    );
    animation.id = GLIDE_ANIMATION_ID;
  });

  return { ghostRef, spacerRef };
}
