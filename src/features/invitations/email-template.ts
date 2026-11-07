export interface InvitationEmailInput {
  guestName: string;
  coupleOne: string;
  coupleTwo: string;
  date?: string | null;
  url: string;
  message?: string | null;
}

export interface InvitationEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a premium, email-client-safe invitation email from real couple + guest data. All
 * dynamic content is HTML-escaped and the link is only emitted for http(s) URLs, so guest
 * names or custom messages cannot inject markup or unsafe schemes.
 */
export function buildInvitationEmail(input: InvitationEmailInput): InvitationEmail {
  const names = `${input.coupleOne} & ${input.coupleTwo}`;
  const when = input.date ? ` on ${input.date}` : '';
  const body =
    input.message && input.message.trim().length > 0
      ? input.message.trim()
      : `You are cordially invited to the wedding of ${names}${when}.`;
  const safeUrl = /^https?:\/\//i.test(input.url) ? input.url : '';
  const subject = `You're invited — ${names}`;

  const text = `Dear ${input.guestName},\n\n${body}\n\nOpen your invitation: ${safeUrl}\n\nWith love,\n${names}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#fffaf3;font-family:Georgia,'Times New Roman',serif;color:#2b1a20;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf3;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8d9c5;border-radius:16px;padding:40px 32px;">
        <tr><td align="center" style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a7b4f;">You are cordially invited</td></tr>
        <tr><td align="center" style="padding-top:16px;font-size:28px;line-height:1.3;color:#6d1f3a;">${escapeHtml(input.coupleOne)}<br/><span style="font-size:18px;color:#9a7b4f;">&amp;</span><br/>${escapeHtml(input.coupleTwo)}</td></tr>
        ${input.date ? `<tr><td align="center" style="padding-top:12px;font-size:14px;color:#6b5560;">${escapeHtml(input.date)}</td></tr>` : ''}
        <tr><td align="center" style="padding-top:24px;font-size:15px;line-height:1.6;">Dear ${escapeHtml(input.guestName)},<br/>${escapeHtml(body)}</td></tr>
        ${safeUrl ? `<tr><td align="center" style="padding-top:28px;"><a href="${escapeHtml(safeUrl)}" style="display:inline-block;background:#6d1f3a;color:#ffffff;text-decoration:none;font-size:14px;padding:12px 28px;border-radius:999px;">Open your invitation</a></td></tr>` : ''}
        <tr><td align="center" style="padding-top:24px;font-size:12px;color:#9a8a90;">With love, ${escapeHtml(names)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}