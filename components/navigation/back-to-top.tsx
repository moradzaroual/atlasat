'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY >= 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-[5.5rem] right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[#78d9a5]/35 bg-[#063d29] text-[#f8f7f2] shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#126344] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5] md:bottom-6 md:right-6 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      <ArrowUp className="h-4 w-4" aria-hidden />
    </button>
  );
}
