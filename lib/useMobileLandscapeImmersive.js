'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * True when the device looks like a phone/tablet in small portrait; used to gate auto-immersive.
 */
function isMobileish() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const narrow = Math.min(window.screen?.width || 0, window.screen?.height || 0) <= 900;
  return coarse || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (narrow && window.innerWidth <= 900);
}

function isLandscapeNow() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * YouTube-style: on phones, rotating to landscape expands the player edge-to-edge.
 * Uses CSS fixed layout; optionally tries Fullscreen API (may require prior gesture on some browsers).
 */
export function useMobileLandscapeImmersive() {
  const [immersiveLandscape, setImmersiveLandscape] = useState(false);
  const shellRef = useRef(null);
  const triedFsRef = useRef(false);

  const sync = useCallback(() => {
    const land = isLandscapeNow();
    const mobile = isMobileish();
    setImmersiveLandscape(mobile && land);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('orientationchange', sync);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('orientationchange', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (immersiveLandscape) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [immersiveLandscape]);

  /** Call after entering immersive (next frame) — best-effort Fullscreen API */
  useEffect(() => {
    if (!immersiveLandscape || !shellRef.current || triedFsRef.current) return;
    const el = shellRef.current;
    const id = requestAnimationFrame(() => {
      const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.msRequestFullscreen;
      if (typeof req === 'function') {
        Promise.resolve(req.call(el)).catch(() => {});
      }
      triedFsRef.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [immersiveLandscape]);

  useEffect(() => {
    if (!immersiveLandscape) {
      triedFsRef.current = false;
    }
  }, [immersiveLandscape]);

  useEffect(() => {
    if (immersiveLandscape) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (fsEl && shellRef.current && fsEl === shellRef.current) {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen;
      Promise.resolve(exit?.call(document)).catch(() => {});
    }
  }, [immersiveLandscape]);

  return { immersiveLandscape, shellRef };
}
