import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StubCard } from './StubCard';

interface StubStackProps {
  stubs: any[];
}

export function StubStack({ stubs }: StubStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dir, setDir] = useState(1);

  // Hooks must run unconditionally on every render, so they precede the
  // empty-state early return below.
  const next = useCallback(() => {
    setDir(1);
    setCurrentIndex(prev => (prev + 1) % stubs.length);
  }, [stubs.length]);

  const prev = useCallback(() => {
    setDir(-1);
    setCurrentIndex(prev => (prev - 1 + stubs.length) % stubs.length);
  }, [stubs.length]);

  if (stubs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No stubs yet</h2>
        <p className="text-gray-500">Check back soon.</p>
      </div>
    );
  }

  const currentStub = stubs[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="flex justify-center gap-1.5 mb-6">
        {stubs.slice(0, Math.min(stubs.length, 20)).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? '24px' : '6px',
              backgroundColor: i === currentIndex ? '#f5a623' : '#2a2a2a',
            }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {currentIndex + 1} of {stubs.length}
      </p>

      {/* Card */}
      <div className="relative w-full" style={{ minHeight: '420px' }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={currentStub.id}
            className="w-full"
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -100 : 100, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <StubCard stub={currentStub} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={prev}
          className="px-5 py-2.5 rounded-xl bg-stub-card border border-stub-border text-gray-300 text-sm font-medium hover:bg-stub-border hover:text-white transition-all active:scale-95"
        >
          ← Prev
        </button>
        <span className="text-xs text-gray-600 w-16 text-center">
          {currentIndex + 1}/{stubs.length}
        </span>
        <button
          onClick={next}
          className="px-5 py-2.5 rounded-xl bg-stub-accent text-stub-black text-sm font-semibold hover:bg-stub-accent-dim transition-all active:scale-95"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
