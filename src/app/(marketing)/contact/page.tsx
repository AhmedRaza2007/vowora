import type { Metadata } from 'next';
import { Mail, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/shared/page-hero';
import { getBranding } from '@/lib/branding-server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const branding = await getBranding();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        subtitle="Questions about your wedding experience, custom design, or support — reach out."
      />
      <section className="container max-w-2xl py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold">Email us</h2>
              <p className="mt-2 text-sm text-muted-foreground">{branding.supportEmail}</p>
              <Button asChild variant="outline" className="mt-4">
                <a href={`mailto:${branding.supportEmail}`}>Send an email</a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold">Custom design service</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Want a professionally designed wedding website? Create an account and request a
                custom design order.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <a href="/register">Request custom design</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}