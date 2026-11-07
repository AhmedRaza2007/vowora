import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PageHero } from '@/components/shared/page-hero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types/database';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Configurable subscription plans for every wedding.',
};

const tiers = [
  { key: 'free', name: 'Free', features: ['Basic wedding website', 'Limited templates', 'Limited guests', 'Basic invitation sharing'] },
  { key: 'starter', name: 'Starter', features: ['More templates', 'More guests', 'Personalized invitations', 'Basic RSVP analytics'] },
  { key: 'premium', name: 'Premium', popular: true, features: ['Premium themes', 'Advanced animations', 'More customization', 'Budget planner', 'Advanced guest management'] },
  { key: 'luxury', name: 'Luxury', features: ['Premium design collection', 'Advanced customization', 'More wedding projects', 'Advanced planning features'] },
  { key: 'custom', name: 'Custom Design', features: ['Professionally designed website', 'Custom invitation design', 'Personalized branding', 'Additional design services'] },
];

async function getPlans(): Promise<SubscriptionPlan[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('tier');
    return (data ?? []) as SubscriptionPlan[];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const plans = await getPlans();
  const priceFor = (key: string) => plans.find((p) => p.key === key);

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple, elegant pricing"
        subtitle="Start free and upgrade as your wedding grows. Pricing and feature limits are configurable."
      />
      <section className="container py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tiers.map((tier) => {
            const plan = priceFor(tier.key);
            return (
              <Card
                key={tier.key}
                className={tier.popular ? 'relative border-primary shadow-md' : 'relative'}
              >
                {tier.popular ? (
                  <Badge className="absolute -top-3 start-1/2 -translate-x-1/2">Popular</Badge>
                ) : null}
                <CardContent className="flex h-full flex-col p-6">
                  <h2 className="font-semibold">{tier.name}</h2>
                  <p className="mt-3 font-display text-2xl font-semibold">
                    {tier.key === 'free'
                      ? 'Free'
                      : plan?.price_monthly != null
                        ? formatCurrency(plan.price_monthly, plan.currency)
                        : 'Configurable'}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={tier.popular ? 'default' : 'outline'}
                    className="mt-6 w-full"
                  >
                    <Link href="/register">{tier.key === 'custom' ? 'Request design' : 'Get started'}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          These are initial product tiers. Live prices appear once plans are configured in the
          admin panel; secure checkout arrives in Phase 6.
        </p>
      </section>
    </>
  );
}