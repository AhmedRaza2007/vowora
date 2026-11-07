import type { Metadata } from 'next';
import { PageHero } from '@/components/shared/page-hero';

export const metadata: Metadata = { title: 'FAQ' };

const faqs = [
  { q: 'What makes the invitation different?', a: 'Guests open a luxury envelope with an animated wax seal and card reveal — a cinematic experience, not an ordinary link. It is shared on WhatsApp with a beautiful personalized preview.' },
  { q: 'Can guests only see the events they are invited to?', a: 'Yes. Every guest receives a secure personalized link and sees only the events they are authorized to attend. Private guest data is never exposed publicly.' },
  { q: 'Which wedding traditions are supported?', a: 'Events are fully configurable — Mehndi, Nikah, Baraat, Walima, Reception, Engagement and any custom ceremony, across cultures, timezones and currencies.' },
  { q: 'Is Urdu supported?', a: 'Yes. The platform supports English and Urdu with right-to-left layouts, plus international date formats, timezones and currencies.' },
  { q: 'Do guests need an account to RSVP?', a: 'No. Guests respond through their secure invitation link without creating an account.' },
  { q: 'Can I use my own domain?', a: 'Custom URLs and supported custom domains are part of the website builder, delivered in Phase 2.' },
  { q: 'How does pricing work?', a: 'Start free and upgrade through configurable plans. Pricing and feature limits are managed from the admin panel; secure checkout arrives in Phase 6.' },
  { q: 'Is my data secure?', a: 'Security is foundational: database-level Row Level Security, role-based access, unguessable invitation tokens, private file storage and webhook-verified payments.' },
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" />
      <section className="container max-w-3xl py-16">
        <div className="divide-y rounded-lg border">
          {faqs.map((f) => (
            <details key={f.q} className="group p-6">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}