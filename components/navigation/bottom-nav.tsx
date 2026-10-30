'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Tv, Globe, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/channels', label: 'Channels', icon: Tv },
  { href: '/coverage', label: 'Coverage', icon: Globe },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/blog', label: 'Blog', icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden backdrop-header bg-background/85 border-t border-border/60 safe-bottom"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex items-stretch justify-around px-2">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 transition-colors duration-150',
                active ? 'text-teal' : 'text-muted-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}