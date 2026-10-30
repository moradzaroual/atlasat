'use client';

import Link from 'next/link';
import { Facebook, Mail, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { OrbitSymbol } from '@/components/shared/orbit-symbol';
import { BackToTop } from './back-to-top';

const exploreLinks = [
  { href: '/', label: 'Home' },
  { href: '/channels', label: 'Channels' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/blog', label: 'Blog' },
];

const informationLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/privacy', label: 'Privacy Policy' },
];

const externalLinks = [
  { href: 'https://www.facebook.com/rachid.elattar.16/', label: 'Facebook', icon: Facebook },
  { href: 'https://t.me/moradzaroual', label: 'Telegram', icon: Send },
];

export function SiteFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const isCoverage = pathname === '/coverage';

  return (
    <>
      <footer className={`bg-[#063d29] text-[#f8f7f2] ${isCoverage ? 'px-4 py-5 md:px-6' : 'px-4 py-14 md:px-6 md:py-20'}`}>
        <div className="mx-auto max-w-[1400px]">
          {isCoverage ? (
            <div className="flex flex-col gap-3 text-[12px] text-[#b7ddc5] sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="inline-flex items-center gap-2 font-semibold text-[#f8f7f2]">
                <OrbitSymbol size={18} className="text-[#78d9a5]" /> Atlasat
              </Link>
              <span>© {year} Atlasat. All rights reserved.</span>
            </div>
          ) : (
            <>
              <div className="grid gap-12 border-b border-[#78d9a5]/20 pb-14 md:grid-cols-[1.6fr_1fr_1fr_1.35fr] md:gap-8 md:pb-16">
                <div className="max-w-sm">
                  <Link href="/" className="inline-flex items-center gap-2 text-[18px] font-semibold tracking-tight">
                    <OrbitSymbol size={24} className="text-[#78d9a5]" /> Atlasat
                  </Link>
                  <p className="mt-5 text-[14px] leading-7 text-[#b7ddc5]">
                    Explore satellite channels, discover beam coverage, follow football broadcast schedules and stay informed about satellite television.
                  </p>
                </div>
                <FooterLinkGroup title="Explore" links={exploreLinks} />
                <FooterLinkGroup title="Information" links={informationLinks} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#78d9a5]">Contact & social</p>
                  <a href="mailto:morad.zaroual@gmail.com" className="mt-5 flex w-fit items-center gap-2 text-[14px] text-[#f8f7f2] transition-colors hover:text-[#78d9a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">
                    <Mail className="h-4 w-4 text-[#78d9a5]" aria-hidden />
                    <span className="select-text">morad.zaroual@gmail.com</span>
                  </a>
                  <div className="mt-5 flex items-center gap-3">
                    {externalLinks.map(({ href, label, icon: Icon }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#78d9a5]/30 text-[#b7ddc5] transition-colors hover:border-[#78d9a5] hover:bg-[#126344] hover:text-[#f8f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">
                        <Icon className="h-4 w-4" aria-hidden />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-6 text-[12px] text-[#b7ddc5] sm:flex-row sm:items-center sm:justify-between">
                <span>© {year} Atlasat. All rights reserved.</span>
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex w-fit items-center gap-2 font-semibold text-[#f8f7f2] transition-colors hover:text-[#78d9a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">Back to top <span aria-hidden>↑</span></button>
              </div>
            </>
          )}
        </div>
      </footer>
      <BackToTop />
    </>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#78d9a5]">{title}</p>
      <nav className="mt-5 flex flex-col items-start gap-3" aria-label={title}>
        {links.map((link) => <Link key={link.href} href={link.href} className="text-[14px] text-[#b7ddc5] transition-colors hover:text-[#f8f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">{link.label}</Link>)}
      </nav>
    </div>
  );
}
