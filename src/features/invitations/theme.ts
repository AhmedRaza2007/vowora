import type { Json, WeddingTheme } from '@/types/database';

export const waxSealStyles = [
  'gold-monogram',
  'rose-monogram',
  'floral',
  'minimal',
  'mughal-arch',
  'geometric',
] as const;
export type WaxSealStyle = (typeof waxSealStyles)[number];

export const cardBorderStyles = [
  'gold-foil',
  'thin-gold',
  'floral',
  'none',
  'paisley-gold',
  'mughal-arch',
  'geometric-gold',
] as const;
export type CardBorderStyle = (typeof cardBorderStyles)[number];

export const animationVariants = [
  'classic-reveal',
  'soft-fade',
  'petal-drift',
  'cinematic-zoom',
] as const;
export type AnimationVariant = (typeof animationVariants)[number];

/** Fully resolved, serializable invitation theme passed to client components. */
export interface ResolvedInvitationTheme {
  key: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  envelopeColor: string;
  envelopeLiner: string;
  waxSeal: WaxSealStyle;
  cardBorder: CardBorderStyle;
  cardBackground: string;
  animation: AnimationVariant;
  urdu: boolean;
}

/** Per-wedding customization stored in weddings.invitation_config (all optional). */
export interface InvitationConfig {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  envelopeColor?: string;
  envelopeLiner?: string;
  waxSeal?: WaxSealStyle;
  cardBorder?: CardBorderStyle;
  animation?: AnimationVariant;
  introMessage?: string;
  musicUrl?: string;
}

const DEFAULT_THEME: ResolvedInvitationTheme = {
  key: 'default',
  name: 'Classic',
  primary: '#6d1f3a',
  accent: '#c8a24a',
  background: '#fbf6ef',
  text: '#2b1a20',
  headingFont: 'Cormorant Garamond',
  bodyFont: 'Inter',
  envelopeColor: '#6d1f3a',
  envelopeLiner: '#c8a24a',
  waxSeal: 'gold-monogram',
  cardBorder: 'gold-foil',
  cardBackground: '#fbf6ef',
  animation: 'classic-reveal',
  urdu: false,
};

function record(value: Json): Record<string, Json> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function str(value: Json, key: string, fallback: string): string {
  const v = record(value)[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Resolve a wedding theme row plus optional per-wedding overrides into a concrete,
 * serializable theme. Unknown/missing fields fall back to elegant defaults so the
 * envelope always renders even without an assigned theme.
 */
export function resolveInvitationTheme(
  theme: WeddingTheme | null,
  overrides?: InvitationConfig | null,
): ResolvedInvitationTheme {
  const o = overrides ?? {};
  if (!theme) {
    return {
      ...DEFAULT_THEME,
      primary: o.primaryColor ?? DEFAULT_THEME.primary,
      accent: o.accentColor ?? DEFAULT_THEME.accent,
      background: o.backgroundColor ?? DEFAULT_THEME.background,
      text: o.textColor ?? DEFAULT_THEME.text,
      headingFont: o.headingFont ?? DEFAULT_THEME.headingFont,
      bodyFont: o.bodyFont ?? DEFAULT_THEME.bodyFont,
      envelopeColor: o.envelopeColor ?? DEFAULT_THEME.envelopeColor,
      envelopeLiner: o.envelopeLiner ?? DEFAULT_THEME.envelopeLiner,
      waxSeal: o.waxSeal ?? DEFAULT_THEME.waxSeal,
      cardBorder: o.cardBorder ?? DEFAULT_THEME.cardBorder,
      animation: o.animation ?? DEFAULT_THEME.animation,
    };
  }

  const palette = record(theme.palette);
  const typography = record(theme.typography);
  const envelope = record(theme.envelope_config);
  const card = record(theme.card_config);

  const primary = o.primaryColor ?? str(palette, 'primary', DEFAULT_THEME.primary);
  const accent = o.accentColor ?? str(palette, 'accent', DEFAULT_THEME.accent);
  const background = o.backgroundColor ?? str(palette, 'background', DEFAULT_THEME.background);

  return {
    key: theme.key,
    name: theme.name,
    primary,
    accent,
    background,
    text: o.textColor ?? str(palette, 'text', DEFAULT_THEME.text),
    headingFont: o.headingFont ?? str(typography, 'heading', DEFAULT_THEME.headingFont),
    bodyFont: o.bodyFont ?? str(typography, 'body', DEFAULT_THEME.bodyFont),
    envelopeColor: o.envelopeColor ?? str(envelope, 'color', primary),
    envelopeLiner: o.envelopeLiner ?? str(envelope, 'liner', accent),
    waxSeal: o.waxSeal ?? pick(envelope.waxSeal, waxSealStyles, DEFAULT_THEME.waxSeal),
    cardBorder: o.cardBorder ?? pick(card.border, cardBorderStyles, DEFAULT_THEME.cardBorder),
    cardBackground: str(card, 'background', background),
    animation: o.animation ?? pick(theme.animation_variant, animationVariants, DEFAULT_THEME.animation),
    urdu: typography.urdu === true,
  };
}