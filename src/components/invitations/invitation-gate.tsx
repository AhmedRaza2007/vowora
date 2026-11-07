'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ResolvedInvitationTheme } from '@/features/invitations/theme';
import { EnvelopeExperience, type EnvelopeCouple } from './envelope-experience';

/**
 * Wraps the public wedding website. The website content stays server-rendered in the DOM
 * (crawlable) beneath an opaque envelope overlay; opening the invitation fades the envelope
 * away to reveal the site. When `enabled` is false the site shows directly.
 */
export function InvitationGate({
  couple,
  theme,
  introMessage,
  musicUrl,
  dir = 'ltr',
  enabled = true,
  children,
}: {
  couple: EnvelopeCouple;
  theme: ResolvedInvitationTheme;
  introMessage?: string;
  musicUrl?: string;
  dir?: 'ltr' | 'rtl';
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(!enabled);
  const handleOpen = useCallback(() => setOpened(true), []);

  return (
    <>
      <div aria-hidden={!opened}>{children}</div>
      <AnimatePresence>
        {!opened && (
          <motion.div key="envelope" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
            <EnvelopeExperience
              couple={couple}
              theme={theme}
              introMessage={introMessage}
              musicUrl={musicUrl}
              onOpen={handleOpen}
              dir={dir}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}