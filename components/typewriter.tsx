'use client';

import { TypeAnimation } from 'react-type-animation';

interface TypewriterProps {
  sequence: (string | number)[];
  className?: string;
  repeat?: number;
  wrapper?: 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

export function Typewriter({ sequence, className, repeat = Infinity, wrapper = 'div' }: TypewriterProps) {
  return (
    <TypeAnimation
      sequence={sequence}
      wrapper={wrapper}
      speed={50}
      repeat={repeat}
      className={className}
    />
  );
}