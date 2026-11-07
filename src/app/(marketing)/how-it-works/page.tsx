import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/shared/page-hero';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'How it works' };

const steps = [
  { n: '01', title: 'Create your wedding', body: 'Sign up, add both partners’ names and your date, then choose a premium invitation theme that matches your style and tradition.' },
  { n: '02', title: 'Design your invitation & website', body: 'Customize the envelope, wax seal, wording, colors, fonts, photos and music. Build your website with elegant sections and preview everything live on mobile and desktop.' },
  { n: '03', title: 'Add events & guests', body: 'Create your ceremonies — Mehndi, Nikah, Baraat, Walima or any custom event. Add guests and families, and set exactly which events each guest may attend.' },
  { n: '04', title: 'Share secure invitations', body: 'Send personalized links via WhatsApp, QR code, copy link or email. Each guest sees only their authorized events, with a beautiful preview when shared.' },
  { n: '05', title: 'Track RSVPs & plan', body: 'Watch responses arrive event-by-event, manage your budget, seating, checklists and vendors, and coordinate your wedding day from one dashboard.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From first draft to wedding day"
        subtitle="A simple, guided flow that scales from a single invitation to a full wedding operation."
      />
      <section className="container max-w-3xl py-16">
        <ol className="space-y-10">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-6">
              <span className="font-display text-4xl font-semibold text-gold">{s.n}</span>
              <div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}