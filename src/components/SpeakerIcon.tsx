import { Volume2, VolumeX } from 'lucide-react';

/** ミュート状態に応じたスピーカーアイコン。 */
export function SpeakerIcon({ muted }: { muted: boolean }) {
  const Icon = muted ? VolumeX : Volume2;
  return <Icon aria-hidden="true" strokeWidth={1.5} className="size-4" />;
}
