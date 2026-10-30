import type { ReactNode } from 'react';

export function InformationShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#f8f7f2] px-4 py-14 md:px-6 md:py-24">
      <div className="mx-auto max-w-[780px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#126344]">{eyebrow}</p>
        <h1 className="mt-5 max-w-2xl font-serif text-5xl leading-[1.05] tracking-[-0.04em] text-[#063d29] md:text-7xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[#37624c]">{intro}</p>
        <div className="mt-14 space-y-12 text-[15px] leading-8 text-[#244b39]">{children}</div>
      </div>
    </div>
  );
}

export function InformationSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="font-serif text-3xl leading-tight tracking-[-0.025em] text-[#063d29]">{title}</h2><div className="mt-4">{children}</div></section>;
}
