'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

export function AnimatedCoin({ value }: { value: number }) {
  const display = useCountUp(value);
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-transform duration-300 ${
        pulse ? 'scale-125' : 'scale-100'
      }`}
    >
      <img
        src="/buzz-coin.jpeg"
        alt="Buzz Coin"
        className={`h-5 w-5 rounded-full ${pulse ? 'animate-bounce' : ''}`}
      />
      {display}
    </span>
  );
}
