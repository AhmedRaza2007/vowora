import type { Metadata } from 'next';
import { PageHero } from '@/components/shared/page-hero';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Weddings, beautifully managed"
        subtitle="A premium global wedding experience and planning platform."
      />
      <section className="container max-w-3xl space-y-6 py-16 text-muted-foreground">
        <p>
          We believe a wedding invitation should feel like opening a real luxury invitation —
          emotional, cinematic and memorable. And we believe planning a wedding should feel
          calm and organized, not chaotic.
        </p>
        <p>
          Our platform brings both together: a signature digital invitation experience shared
          through WhatsApp, a complete wedding website builder, and a powerful dashboard for
          guests, events, RSVPs, budgets, seating, vendors and wedding-day coordination.
        </p>
        <p>
          We build for couples across Pakistan, India, UAE, UK, USA and beyond — supporting
          multiple languages (including Urdu with right-to-left layouts), currencies, timezones
          and wedding traditions through configurable events.
        </p>
        <p>
          Security and privacy are foundational: every guest receives a secure personalized
          link, private guest data is never exposed publicly, and access is protected at the
          database level.
        </p>
      </section>
    </>
  );
}