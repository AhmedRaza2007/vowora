import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Mail,
  LayoutTemplate,
  Users,
  ClipboardCheck,
  Wallet,
  Sparkles,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import { HomeHero } from '@/components/shared/home-hero';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { icon: Mail, title: 'Cinematic invitations', body: 'A luxury envelope-opening experience with wax seal, animation and music — shared beautifully on WhatsApp.' },
  { icon: LayoutTemplate, title: 'Wedding website builder', body: 'Fifteen elegant sections, premium themes, live preview, drag-and-drop ordering and one-click publishing.' },
  { icon: Users, title: 'Smart guest management', body: 'Families, groups, categories and per-event permissions with secure personalized links for every guest.' },
  { icon: ClipboardCheck, title: 'Event-wise RSVP', body: 'Accept, decline or maybe per ceremony, with attendee limits, dietary preferences and live attendance analytics.' },
  { icon: Wallet, title: 'Budget planner', body: 'Event and category budgets, expense tracking, vendor payments, alerts and exportable reports.' },
  { icon: CalendarDays, title: 'Events & traditions', body: 'Mehndi, Nikah, Baraat, Walima, Reception and unlimited custom ceremonies across cultures and timezones.' },
  { icon: MapPin, title: 'Vendors & venues', body: 'Discover and compare venues and wedding vendors with portfolios, packages, reviews and enquiries.' },
  { icon: Sparkles, title: 'AI wedding assistant', body: 'Planning help, invitation wording, checklists and recommendations — using only your authorized wedding data.' },
];

const steps = [
  { n: '01', title: 'Create your wedding', body: 'Add your names, date and choose a premium invitation theme.' },
  { n: '02', title: 'Design & customize', body: 'Build your website and invitation with live preview, then publish.' },
  { n: '03', title: 'Invite & manage', body: 'Share secure personalized links, track RSVPs and plan every detail.' },
];

export default async function HomePage() {
  const t = await getTranslations('marketing');

  return (
    <>
      <HomeHero />

      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t('featuresTitle')}
          </h2>
          <p className="mt-3 text-muted-foreground">
            One elegant platform for your invitation, website, guests and planning.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/70 transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first draft to wedding day in three simple steps.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <span className="font-display text-5xl font-semibold text-gold">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="relative overflow-hidden rounded-2xl border bg-primary px-8 py-16 text-center text-primary-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(50% 60% at 50% 0%, hsl(40 62% 62%), transparent 70%)',
            }}
          />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Begin your wedding story
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Create a free account and design an invitation your guests will love to open.
          </p>
          <Button asChild size="lg" variant="gold" className="relative mt-8">
            <Link href="/register">{t('heroCta')}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}