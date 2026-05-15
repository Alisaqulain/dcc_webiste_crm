'use client';

import { useEffect, useRef, useState } from 'react';
import { playCoinSound } from './playCoinSound';

export default function CrmAnimatedAmount({
  value = 0,
  duration = 1400,
  delay = 0,
  playSound = true,
  className = '',
  decimals = 0,
}) {
  const [display, setDisplay] = useState(0);
  const playedRef = useRef(false);
  const lastTickRef = useRef(-1);
  const target = Math.max(0, Number(value) || 0);

  useEffect(() => {
    let raf;
    let startTs;
    const startVal = 0;
    playedRef.current = false;
    lastTickRef.current = -1;

    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - p) ** 3;
      const current = startVal + (target - startVal) * eased;
      setDisplay(current);

      if (playSound && !playedRef.current && p > 0.08) {
        playedRef.current = true;
        playCoinSound();
      }

      if (playSound && target >= 1) {
        const step = target >= 50 ? 5 : 1;
        const curInt = Math.floor(current);
        const bucket = Math.floor(curInt / step) * step;
        if (bucket > 0 && bucket !== lastTickRef.current) {
          lastTickRef.current = bucket;
          playCoinSound();
        }
      }

      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay, playSound]);

  const formatted =
    decimals > 0
      ? display.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(display).toLocaleString('en-IN');

  return <span className={className}>{formatted}</span>;
}
