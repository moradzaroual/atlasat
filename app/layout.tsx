import './globals.css';
import type { Metadata } from 'next';
import { Manrope, Instrument_Serif } from 'next/font/google';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { SiteHeader } from '@/components/navigation/site-header';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { QueryProvider } from '@/components/shared/query-provider';
import { SiteFooter } from '@/components/navigation/site-footer';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
  weight: '400',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'Atlasat — A clearer view of satellite television',
  description:
    'Explore satellite channel lineups, transmission details, beam coverage, and program schedules with Atlasat.',
  openGraph: {
    title: 'Atlasat — A clearer view of satellite television',
    description:
      'Explore satellite channel lineups, transmission details, beam coverage, and program schedules.',
    siteName: 'Atlasat',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <SiteFooter />
              <BottomNav />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
