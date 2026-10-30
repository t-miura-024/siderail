export type Unsubscribe = () => void;

interface ChromeEvent {
  addListener(listener: () => void): void;
  removeListener(listener: () => void): void;
}

/**
 * 複数の Chrome イベントをまとめて購読し、まとめて解除する関数を返す。
 * イベントの引数は使わず、変更があったことだけを通知する。
 */
export function subscribeToEvents(
  events: readonly ChromeEvent[],
  listener: () => void,
): Unsubscribe {
  const handler = () => {
    listener();
  };

  for (const event of events) {
    event.addListener(handler);
  }

  return () => {
    for (const event of events) {
      event.removeListener(handler);
    }
  };
}
