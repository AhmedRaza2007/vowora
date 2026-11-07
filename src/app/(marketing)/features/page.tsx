import type { Metadata } from 'next';
import {
  Mail,
  LayoutTemplate,
  Users,
  ClipboardCheck,
  Wallet,
  Sparkles,
  CalendarDays,
  MapPin,
  Armchair,
  ListChecks,
  Images,
  Plane,
} from 'lucide-react';
import { PageHero } from '@/components/shared/page-hero';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need to create, share and manage your wedding experience.',
};

const features = [
  { icon: Mail, title: 'Cinematic digital invitation', body: 'A luxury envelope-opening experience with an animated wax seal, card reveal, particles and music — built to be shared on WhatsApp with a beautiful preview.' },
  { icon: LayoutTemplate, title: 'Wedding website builder', body: 'Fifteen elegant sections, premium themes, live preview, drag-and-drop ordering, photos, video and one-click publishing.' },
  { icon: Users, title: 'Smart guest management', body: 'Individuals, families and groups with categories, attendee limits, event permissions and secure personalized links.' },
  { icon: ClipboardCheck, title: 'Event-wise RSVP', body: 'Accept, decline or maybe per ceremony, with attendee limits, dietary preferences and live attendance analytics.' },
  { icon: CalendarDays, title: 'Multi-event weddings', body: 'Mehndi, Nikah, Baraat, Walima, Reception and unlimited custom ceremonies across cultures and timezones.' },
  { icon: Wallet, title: 'Budget planner', body: 'Event and category budgets, expense tracking, vendor payments, alerts, charts and exportable reports.' },
  { icon: MapPin, title: 'Vendors & venues', body: 'Discover and compare venues and vendors with portfolios, packages, real reviews, enquiries and bookings.' },
  { icon: Armchair, title: 'Seating planner', body: 'Interactive tables, capacity, guest assignment, family grouping, VIP flags and a printable seating chart.' },
  { icon: ListChecks, title: 'Checklists & timeline', body: 'Planning tasks with deadlines, reminders and completion tracking across every stage of your wedding.' },
  { icon: Images, title: 'Gallery & memory wall', body: 'Couple galleries, guest QR uploads, wishes and a memory wall with couple approval and moderation.' },
  { icon: Plane, title: 'Destination weddings', body: 'Hotels, room allocation, travel itineraries, airport pickup and guest accommodation.' },
  { icon: Sparkles, title: 'AI wedding assistant', body: 'Planning help, invitation wording, checklists and recommendations using only your authorized data.' },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="One platform for your entire wedding"
        subtitle="From the first invitation to the wedding day, manage every detail in one elegant place."
      />
      <section className="container py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}