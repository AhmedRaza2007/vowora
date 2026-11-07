'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import type { AnimationVariant, ResolvedInvitationTheme } from '@/features/invitations/theme';
import { WaxSeal } from './wax-seal';
import { Particles } from './particles';
import { MusicToggle } from './music-toggle';

export interface EnvelopeCouple {
  one: string;
  two: string;
  initials: string | null;
  date: string | null;
  /** Invited guest's name for personalized (/i/[token]) invitations; null on public /w links. */
  guestName?: string | null;
}

type Phase = 'sealed' | 'opening' | 'card';

const CARD_VARIANTS: Record<AnimationVariant, Variants> = {
  'classic-reveal': {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
  },
  'soft-fade': {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
  },
  'petal-drift': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  },
  'cinematic-zoom': {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
  },
};

function cardBorderStyle(border: string, accent: string): React.CSSProperties {
  switch (border) {
    case 'none':
      return { border: 'none' };
    case 'thin-gold':
      return { border: `1px solid ${accent}` };
    case 'gold-foil':
    case 'paisley-gold':
    case 'mughal-arch':
    case 'geometric-gold':
      return { border: `3px double ${accent}`, boxShadow: `0 0 0 1px ${accent}33, 0 20px 50px rgba(0,0,0,0.18)` };
    case 'floral':
      return { border: `2px solid ${accent}`, borderRadius: 24 };
    default:
      return { border: `1px solid ${accent}66` };
  }
}

/**
 * The signature cinematic invitation: a luxury sealed envelope that breaks open on a user
 * gesture, reveals an invitation card, then transitions into the wedding website. Fully
 * respects reduced-motion (static, immediate path) and never autoplays music.
 */
export function EnvelopeExperience({
  couple,
  theme,
  introMessage,
  musicUrl,
  onOpen,
  dir = 'ltr',
  contained = false,
}: {
  couple: EnvelopeCouple;
  theme: ResolvedInvitationTheme;
  introMessage?: string;
  musicUrl?: string;
  onOpen: () => void;
  dir?: 'ltr' | 'rtl';
  /** Embedded designer preview: stays in flow, keeps the card visible, and offers replay. */
  contained?: boolean;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('sealed');
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const handleOpen = useCallback(() => {
    if (reduce) {
      if (contained) setPhase('card');
      else onOpenRef.current();
      return;
    }
    setPhase((p) => (p === 'sealed' ? 'opening' : p));
  }, [reduce, contained]);

  useEffect(() => {
    if (reduce) return;
    if (phase === 'opening') {
      const t = setTimeout(() => setPhase('card'), 1100);
      return () => clearTimeout(t);
    }
    if (phase === 'card' && !contained) {
      const t = setTimeout(() => onOpenRef.current(), 3200);
      return () => clearTimeout(t);
    }
  }, [phase, reduce, contained]);

  const opening = phase === 'opening';
  const names = `${couple.one} & ${couple.two}`;

  return (
    <div
      dir={dir}
      className={
        contained
          ? 'relative grid h-full w-full place-items-center overflow-hidden px-6'
          : 'fixed inset-0 z-50 grid place-items-center overflow-hidden px-6'
      }
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        backgroundImage: `radial-gradient(70% 60% at 50% 30%, ${theme.accent}1f, transparent 70%)`,
      }}
    >
      <Particles variant={theme.animation} accent={theme.accent} active={phase === 'card'} />

      <AnimatePresence mode="wait">
        {phase !== 'card' ? (
          <motion.div
            key="envelope"
            className="flex flex-col items-center text-center"
            exit={reduce ? {} : { opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
          >
            <motion.button
              type="button"
              onClick={handleOpen}
              aria-label="Open your invitation"
              className="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ width: 'min(88vw, 380px)', aspectRatio: '1.5 / 1', perspective: 1000 }}
              whileHover={reduce ? {} : { scale: 1.02 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
            >
              {/* pocket */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: theme.envelopeColor,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                }}
              />
              {/* liner */}
              <div
                className="absolute inset-x-0 top-0 h-1/2"
                style={{
                  backgroundColor: theme.envelopeLiner,
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }}
              />
              {/* flap */}
              <motion.div
                className="absolute inset-x-0 top-0 h-1/2"
                style={{
                  backgroundColor: theme.envelopeColor,
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  transformOrigin: 'top center',
                  filter: 'brightness(1.08)',
                  backfaceVisibility: 'hidden',
                }}
                animate={opening ? { rotateX: -180, opacity: 0.6 } : { rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              />
              {/* wax seal */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={opening ? { scale: 1.4, opacity: 0, rotate: 12 } : { scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <WaxSeal
                  initials={couple.initials}
                  variant={theme.waxSeal}
                  color={theme.primary}
                  accent={theme.accent}
                  size={92}
                />
              </motion.div>
            </motion.button>

            <p className="mt-8 font-display text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
              {names}
            </p>
            {couple.date && <p className="mt-1 text-sm opacity-70">{couple.date}</p>}
            <motion.p
              className="mt-6 text-xs uppercase tracking-[0.3em] opacity-60"
              animate={reduce ? {} : { opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {opening ? 'Opening…' : 'Tap to open'}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            variants={CARD_VARIANTS[theme.animation]}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-md px-8 py-12 text-center"
            style={{ backgroundColor: theme.cardBackground, ...cardBorderStyle(theme.cardBorder, theme.accent) }}
          >
            <div className="mx-auto mb-6 grid place-items-center">
              <WaxSeal
                initials={couple.initials}
                variant={theme.waxSeal}
                color={theme.primary}
                accent={theme.accent}
                size={64}
              />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] opacity-70">You are cordially invited</p>
            {couple.guestName && (
              <p className="mt-3 font-display text-lg italic" style={{ color: theme.primary }}>
                {couple.guestName}
              </p>
            )}
            <h1
              className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif', color: theme.primary }}
            >
              {couple.one}
              <span className="mx-2 opacity-60">&amp;</span>
              {couple.two}
            </h1>
            {couple.date && <p className="mt-3 text-sm opacity-80">{couple.date}</p>}
            {introMessage && <p className="mx-auto mt-5 max-w-xs text-sm leading-relaxed opacity-80">{introMessage}</p>}
            <button
              type="button"
              onClick={() => (contained ? setPhase('sealed') : onOpenRef.current())}
              className="mt-8 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
              style={{ backgroundColor: theme.primary }}
            >
              {contained ? 'Replay invitation' : 'Open wedding website'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {musicUrl && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <MusicToggle src={musicUrl} accent={theme.accent} />
        </div>
      )}
    </div>
  );
}