import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { resolveInvitationTheme } from '@/features/invitations/theme';

const { mockReduceMotion } = vi.hoisted(() => ({ mockReduceMotion: { current: false } }));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => mockReduceMotion.current,
    // Passthrough so phase changes render immediately; animation timing is framer-motion's
    // concern (verified in a real browser), not this unit test's.
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
  };
});

// Imported after the mock so the component picks up the controlled hook.
import { EnvelopeExperience } from './envelope-experience';

const theme = resolveInvitationTheme(null);
const couple = { one: 'Aisha', two: 'Omar', initials: 'A&O', date: '2026-12-12' };

beforeEach(() => {
  mockReduceMotion.current = false;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe('EnvelopeExperience', () => {
  it('renders the sealed envelope with the couple names and monogram', () => {
    render(<EnvelopeExperience couple={couple} theme={theme} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: 'Open your invitation' })).toBeInTheDocument();
    expect(screen.getByText('Tap to open')).toBeInTheDocument();
    expect(screen.getByText('A&O')).toBeInTheDocument();
  });

  it('never autoplays music: the toggle starts paused and no audio element exists', () => {
    render(<EnvelopeExperience couple={couple} theme={theme} musicUrl="/api/media/x/y.mp3" onOpen={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Play music' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelectorAll('audio')).toHaveLength(0);
  });

  it('begins the opening sequence on a user gesture', () => {
    render(<EnvelopeExperience couple={couple} theme={theme} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open your invitation' }));
    expect(screen.getByText('Opening…')).toBeInTheDocument();
  });

  it('opens immediately for reduced-motion users (no animation timers)', () => {
    mockReduceMotion.current = true;
    const onOpen = vi.fn();
    render(<EnvelopeExperience couple={couple} theme={theme} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open your invitation' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('contained preview reveals the card and replays back to the sealed envelope', () => {
    mockReduceMotion.current = true;
    const onOpen = vi.fn();
    render(<EnvelopeExperience contained couple={couple} theme={theme} introMessage="Together with their families." onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open your invitation' }));
    expect(screen.getByText('You are cordially invited')).toBeInTheDocument();
    expect(screen.getByText('Together with their families.')).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Replay invitation' }));
    expect(screen.getByRole('button', { name: 'Open your invitation' })).toBeInTheDocument();
  });

  it('greets the invited guest by name on the personalized card', () => {
    mockReduceMotion.current = true;
    render(<EnvelopeExperience contained couple={{ ...couple, guestName: 'Omar' }} theme={theme} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open your invitation' }));
    expect(screen.getByText('Omar')).toBeInTheDocument();
  });

  it('shows no guest greeting on the public (non-personalized) card', () => {
    mockReduceMotion.current = true;
    render(<EnvelopeExperience contained couple={couple} theme={theme} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open your invitation' }));
    expect(screen.getByText('You are cordially invited')).toBeInTheDocument();
    expect(screen.queryByText('Omar')).not.toBeInTheDocument();
  });
});