import Link from 'next/link';
import { InformationSection, InformationShell } from '@/components/information/information-shell';

export const metadata = { title: 'About Us — Atlasat', description: 'Learn how Atlasat makes satellite television information easier to explore.' };

export default function AboutPage() {
  return (
    <InformationShell eyebrow="About Atlasat" title="A clearer view of satellite television." intro="Atlasat is an independent satellite-information website built to make the technical side of satellite television easier to explore.">
      <InformationSection title="What Atlasat helps you explore">
        <p>Atlasat brings together satellite and channel listings, transmission information, beam coverage visualisation, football broadcast schedules and editorial articles in one place.</p>
      </InformationSection>
      <InformationSection title="How the information is maintained">
        <p>Parts of the Atlasat catalogue are maintained through connected datasets and Google Sheets. This helps keep changing transmission and schedule information organised, while recognising that satellite information can change over time.</p>
      </InformationSection>
      <InformationSection title="Corrections and feedback">
        <p>If you spot an incorrect frequency, listing or other detail, please <Link href="/contact" className="font-semibold text-[#126344] underline decoration-[#78d9a5] underline-offset-4 hover:text-[#063d29]">contact us</Link> with the relevant information so it can be reviewed.</p>
      </InformationSection>
      <InformationSection title="A note about listings">
        <p>Atlasat lists broadcasters and reception information. A broadcaster listing does not itself provide a subscription or viewing rights. Atlasat is not presented as an official representative of listed operators, broadcasters, leagues or equipment manufacturers.</p>
      </InformationSection>
    </InformationShell>
  );
}
