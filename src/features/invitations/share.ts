export interface InvitationShareInput {
  coupleOne: string;
  coupleTwo: string;
  date?: string | null;
  url: string;
  message?: string | null;
  /** Personalize the greeting with the invited guest's name (per-guest invitations). */
  guestName?: string | null;
  /** Optional recipient phone (any common format) to target a specific WhatsApp chat. */
  phone?: string | null;
}

export interface InvitationShare {
  text: string;
  whatsappUrl: string;
}

/** Normalize a phone to wa.me's digits-only international form; null if too short to be valid. */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/**
 * Build a WhatsApp native share link and message from real couple data. Uses the official
 * wa.me share scheme (no Business API credentials required). The URL must be absolute.
 * When a guest phone is supplied the link opens that guest's chat directly.
 */
export function buildInvitationShare(input: InvitationShareInput): InvitationShare {
  const names = `${input.coupleOne} & ${input.coupleTwo}`;
  const when = input.date ? ` on ${input.date}` : '';
  const greeting = input.guestName ? `Dear ${input.guestName}, ` : '';
  const text =
    input.message && input.message.trim().length > 0
      ? `${input.message.trim()} ${input.url}`
      : `${greeting}you are cordially invited to the wedding of ${names}${when}. Open your invitation: ${input.url}`;
  const phone = normalizeWhatsAppPhone(input.phone);
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  return { text, whatsappUrl };
}