'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeHero() {
  const t = useTranslations('marketing');
  const reduce = useReducedMotion();

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: 'easeOut' },
      };

  return (
    <section className="relative overflow-hidden bg-grain">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, hsl(38 44% 90% / 0.7), transparent 70%)',
        }}
      />
      <div className="container flex flex-col items-center py-24 text-center md:py-32">
        <motion.div {...fade}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Premium wedding experiences
          </span>
        </motion.div>

        <motion.h1
          {...fade}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.1 }}
          className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
        >
          {t('heroTitle')}
        </motion.h1>

        <motion.p
          {...fade}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 }}
          className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
        >
          {t('heroSubtitle')}
        </motion.p>

        <motion.div
          {...fade}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.3 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/register">
              {t('heroCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/templates">{t('heroSecondary')}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}