import Link from 'next/link';
import { Mail } from 'lucide-react';
import { InformationShell } from '@/components/information/information-shell';

export const metadata = { title: 'Contact Us — Atlasat', description: 'Get in touch with the Atlasat team.' };

const emailHref = 'mailto:morad.zaroual@gmail.com?subject=Atlasat%20Enquiry';

export default function ContactPage() {
  return (
    <InformationShell eyebrow="Contact Atlasat" title="Get in touch" intro="Have a question, spotted an incorrect frequency, or want to suggest an improvement? We would like to hear from you.">
      <div className="rounded-3xl border border-[#c4dacb] bg-white/60 p-6 shadow-[0_16px_50px_rgba(6,61,41,0.06)] md:p-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#063d29]">
            <Mail className="h-6 w-6 text-[#78d9a5]" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl leading-tight tracking-[-0.02em] text-[#063d29]">Email us</h2>
            <p className="mt-2 max-w-md text-[15px] leading-7 text-[#37624c]">Click the button below to open your email application with a pre-filled subject line, or copy the address directly.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          <a href={emailHref} className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#063d29] px-6 py-3.5 text-[14px] font-semibold text-[#f8f7f2] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#126344] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">
            <Mail className="h-4 w-4" aria-hidden />
            Email us
          </a>
          <div className="flex items-center gap-2 text-[14px] text-[#37624c]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#126344]">Or copy</span>
            <span className="select-text font-medium text-[#063d29]">morad.zaroual@gmail.com</span>
          </div>
        </div>
        <p className="mt-8 max-w-md text-[12px] leading-5 text-[#37624c]">Your details will be used to respond to your enquiry. <Link href="/privacy" className="font-semibold underline underline-offset-4">Read our Privacy Policy.</Link></p>
      </div>
    </InformationShell>
  );
}
