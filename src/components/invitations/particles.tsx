'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { AnimationVariant } from '@/features/invitations/theme';

/**
 * Ambient celebration effects shown after the envelope opens. Positions are deterministic
 * (index-based) so server and client renders match. Renders nothing for reduced-motion users
 * or for the calm `soft-fade` variant.
 */
export function Particles({
  variant,
  accent,
  active,
}: {
  variant: AnimationVariant;
  accent: string;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce || !active || variant === 'soft-fade') return null;

  const petals = variant === 'petal-drift';
  const count = petals ? 14 : 18;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 73) % 100;
        const delay = (i % 7) * 0.4;
        const duration = petals ? 6 + (i % 5) : 3 + (i % 4);
        const size = petals ? 12 + (i % 3) * 4 : 4 + (i % 3) * 2;
        return (
          <motion.span
            key={i}
            className="absolute top-[-5%] block"
            style={{
              left: `${left}%`,
              width: size,
              height: petals ? size * 0.7 : size,
              borderRadius: petals ? '60% 40% 60% 40%' : '9999px',
              background: accent,
              opacity: 0,
            }}
            animate={
              petals
                ? { y: ['0vh', '110vh'], x: [0, i % 2 ? 30 : -30], opacity: [0, 0.8, 0], rotate: [0, 180] }
                : { y: ['0vh', '100vh'], opacity: [0, 0.9, 0], scale: [0.6, 1, 0.6] }
            }
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}