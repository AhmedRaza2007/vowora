import 'server-only';

/**
 * Minimal Resend transactional-email sender using the REST API directly (no SDK dependency).
 * Returns a typed result; when RESEND_API_KEY / EMAIL_FROM are absent it reports `pending`
 * so the UI can honestly show email delivery as not configured rather than pretending to send.
 * The API key is read only here, server-side, and never sent to the client.
 */
export type SendEmailResult = { ok: true; id: string | null } | { ok: false; reason: 'pending' | 'error' };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: false, reason: 'pending' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    });
    if (!res.ok) return { ok: false, reason: 'error' };
    const body = (await res.json()) as { id?: string };
    return { ok: true, id: body.id ?? null };
  } catch {
    return { ok: false, reason: 'error' };
  }
}