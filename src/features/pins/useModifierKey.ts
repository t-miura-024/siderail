import { useEffect, useState } from 'react';

/**
 * Meta（macOS の ⌘）または Control が押されているかを購読する。
 */
export function useModifierKey(): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const update = (event: KeyboardEvent) => {
      if (event.key === 'Meta' && event.type === 'keyup') {
        setHeld(event.ctrlKey);
        return;
      }
      if (event.key === 'Control' && event.type === 'keyup') {
        setHeld(event.metaKey);
        return;
      }
      setHeld(event.metaKey || event.ctrlKey);
    };

    const reset = () => {
      setHeld(false);
    };

    window.addEventListener('keydown', update);
    window.addEventListener('keyup', update);
    window.addEventListener('blur', reset);

    return () => {
      window.removeEventListener('keydown', update);
      window.removeEventListener('keyup', update);
      window.removeEventListener('blur', reset);
    };
  }, []);

  return held;
}
