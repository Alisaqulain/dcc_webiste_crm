'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AUTOPLAY_MS = 5000;

export default function HomeHeroSlider({ slides = [] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const trackRef = useRef(null);

  const count = slides.length;

  const goTo = useCallback(
    (index) => {
      if (count === 0) return;
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, isPaused]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) next();
    else if (distance < -50) prev();
  };

  if (count === 0) return null;

  return (
    <section
      className="relative w-full bg-slate-900"
      aria-roledescription="carousel"
      aria-label="Homepage banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="relative w-full overflow-hidden h-[240px] sm:h-[380px] md:h-[460px] lg:h-[520px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide track — horizontal slide like LeadsGuru */}
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id ?? index}
              className="relative min-w-full h-full shrink-0"
              aria-hidden={index !== current}
            >
              <Image
                src={slide.image}
                alt={slide.alt || `Banner ${index + 1}`}
                fill
                unoptimized
                priority={index === 0}
                className="object-cover object-center select-none pointer-events-none"
                sizes="100vw"
                draggable={false}
              />
              {/* Subtle bottom gradient for dots readability */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Previous / Next — LeadsGuru-style side controls */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg shadow-black/20 border border-white/80 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <FaChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg shadow-black/20 border border-white/80 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 sm:gap-2.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id ?? index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current ? 'true' : undefined}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === current
                    ? 'w-8 sm:w-10 h-2.5 bg-red-600 shadow-md shadow-red-600/40'
                    : 'w-2.5 h-2.5 bg-white/70 hover:bg-white hover:scale-110'
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide counter (optional, subtle) */}
        {count > 1 && (
          <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center rounded-full bg-black/35 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
            {current + 1} / {count}
          </div>
        )}
      </div>
    </section>
  );
}
