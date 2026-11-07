import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/shared/page-hero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Premium, independently customizable wedding invitation themes.',
};

const themes = [
  { name: 'Royal Gold & Burgundy', colors: ['#7a1f2b', '#c9a227', '#f7f1e3'], mood: 'Regal & classic' },
  { name: 'Emerald Green & Gold', colors: ['#0f5132', '#c9a227', '#f3f6f0'], mood: 'Lush & elegant' },
  { name: 'Ivory & Champagne', colors: ['#f6f1e7', '#d8c3a5', '#8a7968'], mood: 'Soft & timeless' },
  { name: 'Floral Blush Romance', colors: ['#f4d7d7', '#d98c9c', '#6b4f4f'], mood: 'Romantic & delicate' },
  { name: 'Modern Minimal', colors: ['#ffffff', '#1a1a1a', '#b0b0b0'], mood: 'Clean & contemporary' },
  { name: 'Traditional Pakistani', colors: ['#0b6e4f', '#d4af37', '#7a1f2b'], mood: 'Cultural & vibrant' },
  { name: 'Contemporary International', colors: ['#2c3e50', '#c0a062', '#ecf0f1'], mood: 'Global & refined' },
  { name: 'Royal Mughal Inspired', colors: ['#5b2a86', '#d4af37', '#f5ecd7'], mood: 'Ornate & majestic' },
  { name: 'Elegant Arabic Inspired', colors: ['#0f3d3e', '#c9a227', '#f8f5ef'], mood: 'Graceful & geometric' },
  { name: 'Modern Luxury Black & Gold', colors: ['#111111', '#d4af37', '#f5f5f5'], mood: 'Bold & luxurious' },
];

export default function TemplatesPage() {
  return (
    <>
      <PageHero
        eyebrow="Templates"
        title="Premium invitation themes"
        subtitle="Ten signature themes, each with its own envelope, card, typography, palette and opening animation — independently customizable."
      />
      <section className="container py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Card key={theme.name} className="overflow-hidden">
              <div className="flex h-28 items-center justify-center gap-2" style={{ background: theme.colors[2] }}>
                {theme.colors.map((c) => (
                  <span
                    key={c}
                    className="h-12 w-12 rounded-full border shadow-sm"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{theme.name}</h2>
                </div>
                <Badge variant="secondary" className="mt-2">
                  {theme.mood}
                </Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  Envelope, wax seal, card reveal and cinematic opening — fully customizable.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/register">Design your invitation</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            The interactive envelope experience arrives in Phase 3.
          </p>
        </div>
      </section>
    </>
  );
}