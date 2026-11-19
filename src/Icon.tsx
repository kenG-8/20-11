import type { SVGProps } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Hand, RotateCcw, Send, Volume2, VolumeX, X } from 'lucide-react';

export type IconName = 'star' | 'flower' | 'butterfly' | 'crystal' | 'plane' | 'volume' | 'mute' | 'replay' | 'left' | 'right' | 'hand' | 'close' | 'book';

const paths = {
  star: <path d="M12 2v4h2v3h3v2h5v2h-5v2h-3v3h-2v4h-1v-4H9v-3H6v-2H2v-2h4V9h3V6h2V2Z" fill="currentColor" stroke="none" />,
  flower: <path d="M12 10c-5-8 5-8 0 0Zm2 1c6-7 10 2 1 2Zm0 4c8 3 1 9-2 1Zm-4 0c-2 8-10 2-2-1Zm-1-3c-9 1-6-9 1-3Zm3 3v6" />,
  butterfly: <path d="M12 13C9 3 2 3 3 8l2 6 4 1-3 3 3 2 3-4 3 4 3-2-3-3 4-1 2-6c1-5-6-5-9 5Zm0-1v6" />,
  crystal: <path d="m12 2 6 6-2 10-4 4-4-4L6 8Zm0 0-2 7 2 13 2-13Zm-6 6 4 1h4l4-1" />,
};
const icons = { plane: Send, volume: Volume2, mute: VolumeX, replay: RotateCcw, left: ArrowLeft, right: ArrowRight, hand: Hand, close: X, book: BookOpen };

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  if (name in icons) {
    const LucideIcon = icons[name as keyof typeof icons];
    return <LucideIcon strokeWidth={1.45} aria-hidden="true" {...props} />;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name as keyof typeof paths]}</svg>;
}
