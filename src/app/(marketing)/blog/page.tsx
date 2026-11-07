import type { Metadata } from 'next';
import { PageHero } from '@/components/shared/page-hero';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Wedding inspiration & guides"
        subtitle="Planning tips, real weddings and product updates."
      />
      <section className="container max-w-3xl py-16">
        <EmptyState
          title="No articles yet"
          description="Our blog launches with real content in Phase 8. We never publish placeholder or fake posts."
        />
      </section>
    </>
  );
}