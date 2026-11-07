'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { Check, Copy, Download, Loader2, Mail, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import {
  issueInvitationAction,
  markDeliveredAction,
  sendInvitationEmailAction,
} from '@/features/invitations/invitation-manage-actions';
import { buildInvitationShare } from '@/features/invitations/share';
import type { DeliveryChannel } from '@/lib/validations/invitation-delivery';
import type { Guest, Invitation, Wedding } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Secure per-guest delivery. The capability token URL is only ever shared with the invited
 * guest (WhatsApp deep-link, clipboard, locally-rendered QR, or their own email). The QR is
 * generated in-browser so the token never leaves the device to a third-party QR service.
 */
export function DeliveryDialog({
  wedding,
  guest,
  invitation,
  baseUrl,
  emailConfigured,
  trigger,
}: {
  wedding: Wedding;
  guest: Guest;
  invitation: Invitation | null;
  baseUrl: string;
  emailConfigured: boolean;
  trigger: ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const token = invitation?.token ?? null;
  const url = token ? `${baseUrl.replace(/\/+$/, '')}/i/${token}` : null;
  const share = url
    ? buildInvitationShare({
        coupleOne: wedding.partner_one_name,
        coupleTwo: wedding.partner_two_name,
        date: wedding.wedding_date,
        url,
        guestName: guest.name,
        phone: guest.phone,
      })
    : null;

  useEffect(() => {
    if (!open) {
      setQr(null);
      setCopied(false);
      setError(null);
    }
  }, [open]);

  function showError(message: string) {
    setError(message.startsWith('errors.') ? t(message) : message);
  }

  function issue(regenerate: boolean) {
    setError(null);
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('guestId', guest.id);
    if (regenerate) data.set('regenerate', 'true');
    if (expiresAt) data.set('expiresAt', expiresAt);
    if (maxUses) data.set('maxUses', maxUses);
    startTransition(async () => {
      const res = await issueInvitationAction(null, data);
      if (res.error) showError(res.error);
      else router.refresh();
    });
  }

  function mark(channel: DeliveryChannel) {
    if (!invitation) return;
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('invitationId', invitation.id);
    data.set('channel', channel);
    startTransition(async () => {
      const res = await markDeliveredAction(null, data);
      if (res.error) showError(res.error);
      else router.refresh();
    });
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      mark('copy');
    } catch {
      showError('errors.generic');
    }
  }

  async function showQr() {
    if (!url) return;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M' });
      setQr(dataUrl);
      mark('qr');
    } catch {
      showError('errors.generic');
    }
  }

  function sendEmail() {
    if (!invitation) return;
    setError(null);
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('invitationId', invitation.id);
    startTransition(async () => {
      const res = await sendInvitationEmailAction(null, data);
      if (res.error) showError(res.error);
      else router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deliver invitation — {guest.name}</DialogTitle>
          <DialogDescription>
            A secure, personal link for {guest.name}. Only this guest can open it; revoking it
            instantly disables access.
          </DialogDescription>
        </DialogHeader>

        {!token ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`expires-${guest.id}`}>Expires (optional)</Label>
                <Input
                  id={`expires-${guest.id}`}
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`uses-${guest.id}`}>Max opens (optional)</Label>
                <Input
                  id={`uses-${guest.id}`}
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => issue(false)} disabled={pending} className="w-full">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Generate secure link
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Personal invitation link</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={url ?? ''} className="font-mono text-xs" aria-label="Invitation link" />
                <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {invitation?.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  {invitation.max_uses ? ` · ${invitation.use_count}/${invitation.max_uses} opens` : ''}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" onClick={() => mark('whatsapp')} disabled={!share}>
                <a href={share?.whatsappUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button variant="outline" onClick={showQr}>
                <QrCode className="h-4 w-4" /> QR code
              </Button>
            </div>

            {qr && (
              <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`Invitation QR code for ${guest.name}`} width={220} height={220} />
                <Button asChild variant="outline" size="sm">
                  <a href={qr} download={`vowora-invitation-${guest.name.replace(/\s+/g, '-').toLowerCase()}.png`}>
                    <Download className="h-4 w-4" /> Download QR
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Generated on your device — the link is never sent to a third-party QR service.
                </p>
              </div>
            )}

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Email delivery</p>
                {emailConfigured ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="secondary">Pending setup</Badge>
                )}
              </div>
              {emailConfigured ? (
                guest.email ? (
                  <Button variant="outline" size="sm" onClick={sendEmail} disabled={pending} className="w-full">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send to {guest.email}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This guest has no email address. Add one in Guests, or share via WhatsApp.
                  </p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Connect Resend (RESEND_API_KEY + EMAIL_FROM) to send invitations by email. WhatsApp,
                  copy and QR work now.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {invitation?.delivered_at
                  ? `Delivered via ${invitation.delivered_via ?? 'link'}`
                  : 'Not delivered yet'}
              </p>
              <Button variant="ghost" size="sm" onClick={() => issue(true)} disabled={pending}>
                <RefreshCw className="h-4 w-4" /> New link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}