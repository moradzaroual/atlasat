'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { OrbitSymbol } from '@/components/shared/orbit-symbol';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/channels', label: 'Channels' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/blog', label: 'Blog' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-200',
        scrolled
          ? 'backdrop-header bg-background/80 border-b border-border/60'
          : 'bg-background/40 border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:h-16 md:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground"
          aria-label="Atlasat home"
        >
          <OrbitSymbol size={22} className="text-teal" />
          <span className="font-semibold tracking-tight text-[17px] md:text-[18px]">
            Atlasat
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative px-3 py-2 text-[14px] font-medium transition-colors duration-150 rounded-md',
                isActive(item.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-teal rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Search"
            onClick={() => {
              window.location.href = '/channels';
            }}
          >
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <ThemeToggle />

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <OrbitSymbol size={20} className="text-teal" />
                  Atlasat
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-3 text-[15px] font-medium rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}