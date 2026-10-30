import { InformationSection, InformationShell } from '@/components/information/information-shell';

export const metadata = { title: 'Privacy Policy — Atlasat', description: 'Atlasat privacy policy draft.' };

export default function PrivacyPage() {
  return (
    <InformationShell eyebrow="Privacy" title="Privacy, clearly explained." intro="This is a practical privacy-policy draft for Atlasat. The site owner should review it and confirm the provider and retention details before launch. Last updated: October 30, 2026.">
      <InformationSection title="Information you submit">
        <p>The contact page opens your own email application with a pre-filled subject line. Any information you include in that email is handled by your email provider and the recipient, morad.zaroual@gmail.com. Atlasat does not collect or store contact-form submissions on its own servers. Please avoid sending sensitive information that is not needed for your enquiry.</p>
      </InformationSection>
      <InformationSection title="Technical request data">
        <p>Hosting and the website infrastructure may process technical request information such as an IP address, browser details and timestamps to provide, protect and troubleshoot the service. The contact page does not send form data to a server; it opens your email application directly.</p>
      </InformationSection>
      <InformationSection title="Cookies and browser storage">
        <p>The website uses browser storage associated with the appearance theme so your light or dark mode preference can be remembered. The site also uses temporary in-memory interface state for features such as map controls and filters. No analytics service is currently installed, and no user account or ratings system is implemented.</p>
      </InformationSection>
      <InformationSection title="External services and links">
        <p>Atlasat requests catalogue, beam, schedule and article data from connected Google Sheets datasets. The coverage map can request map tiles and map data from external mapping services, including OpenStreetMap-related services. Social links and other external links take you to third-party websites with their own policies. Atlasat does not control those services or their retention practices.</p>
      </InformationSection>
      <InformationSection title="Your choices and requests">
        <p>You can request access to, correction of or deletion of personal information submitted through the contact form where applicable. To ask a privacy question or make a request, email <a href="mailto:morad.zaroual@gmail.com" className="font-semibold text-[#126344] underline decoration-[#78d9a5] underline-offset-4">morad.zaroual@gmail.com</a>. The owner should confirm the final retention periods, email provider, hosting provider and any applicable legal requirements before publishing this policy.</p>
      </InformationSection>
    </InformationShell>
  );
}
