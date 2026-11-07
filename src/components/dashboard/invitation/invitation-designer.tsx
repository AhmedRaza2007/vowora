'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Mail, Palette, RotateCcw, UserRound } from 'lucide-react';
import {
  selectThemeAction,
  updateCoupleAction,
  updateInvitationAction,
  type InvitationResult,
} from '@/features/weddings/invitation-actions';
import {
  animationVariants,
  cardBorderStyles,
  resolveInvitationTheme,
  waxSealStyles,
  type AnimationVariant,
  type CardBorderStyle,
  type InvitationConfig,
  type WaxSealStyle,
} from '@/features/invitations/theme';
import { EnvelopeExperience } from '@/components/invitations/envelope-experience';
import type { Wedding, WeddingTheme } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Action = (prev: unknown, formData: FormData) => Promise<InvitationResult>;

function useInvitationAction(action: Action) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(formData: FormData) {
    startTransition(async () => {
      const res = await action(null, formData);
      if (res.error) setError(res.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  }
  return { pending, error, run };
}

const WAX_SEAL_LABELS: Record<WaxSealStyle, string> = {
  'gold-monogram': 'Gold monogram',
  'rose-monogram': 'Rose monogram',
  floral: 'Floral',
  minimal: 'Minimal',
  'mughal-arch': 'Mughal arch',
  geometric: 'Geometric',
};

const CARD_BORDER_LABELS: Record<CardBorderStyle, string> = {
  'gold-foil': 'Gold foil',
  'thin-gold': 'Thin gold',
  floral: 'Floral',
  none: 'None',
  'paisley-gold': 'Paisley gold',
  'mughal-arch': 'Mughal arch',
  'geometric-gold': 'Geometric gold',
};

const ANIMATION_LABELS: Record<AnimationVariant, string> = {
  'classic-reveal': 'Classic reveal',
  'soft-fade': 'Soft fade',
  'petal-drift': 'Petal drift',
  'cinematic-zoom': 'Cinematic zoom',
};

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function InvitationDesigner({ wedding, themes }: { wedding: Wedding; themes: WeddingTheme[] }) {
  const [themeId, setThemeId] = useState<string | null>(wedding.theme_id);
  const [config, setConfig] = useState<InvitationConfig>((wedding.invitation_config ?? {}) as InvitationConfig);
  const [couple, setCouple] = useState({
    one: wedding.partner_one_name,
    two: wedding.partner_two_name,
    initials: wedding.couple_initials ?? '',
  });
  const [replayKey, setReplayKey] = useState(0);

  const saveConfig = useInvitationAction(updateInvitationAction);
  const selectTheme = useInvitationAction(selectThemeAction);
  const saveCouple = useInvitationAction(updateCoupleAction);

  const currentTheme = themes.find((t) => t.id === themeId) ?? null;
  const resolved = resolveInvitationTheme(currentTheme, config);
  const dir = wedding.locale === 'ur' ? 'rtl' : 'ltr';
  const publicUrl = `/w/${wedding.slug}`;

  function setField<K extends keyof InvitationConfig>(key: K, value: InvitationConfig[K] | undefined) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function submitConfig() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.length > 0) data.set(key, value);
    }
    saveConfig.run(data);
  }

  function submitCouple() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('partnerOneName', couple.one);
    data.set('partnerTwoName', couple.two);
    if (couple.initials) data.set('coupleInitials', couple.initials);
    saveCouple.run(data);
  }

  function chooseTheme(id: string) {
    setThemeId(id);
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('themeId', id);
    selectTheme.run(data);
  }

  const anyPending = saveConfig.pending || selectTheme.pending || saveCouple.pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Invitation Designer</h1>
            <Badge variant={wedding.status === 'published' ? 'success' : 'secondary'}>{wedding.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{wedding.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/weddings/${wedding.id}`}>Back</Link>
          </Button>
          {wedding.status === 'published' && (
            <Button asChild size="sm">
              <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View live
              </Link>
            </Button>
          )}
        </div>
      </div>

      {anyPending && <p className="text-sm text-muted-foreground">Saving changes…</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Theme</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick a premium theme as your starting point, then fine-tune every detail below.
              </p>
              {selectTheme.error && <p className="text-sm text-destructive">{selectTheme.error}</p>}
              {themes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No themes are available yet. The classic default is used until themes are seeded.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {themes.map((t) => {
                    const palette = (t.palette ?? {}) as Record<string, string>;
                    const selected = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => chooseTheme(t.id)}
                        disabled={selectTheme.pending}
                        className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                          selected ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{t.name}</span>
                          {selected && <Badge variant="success">Selected</Badge>}
                        </div>
                        <div className="mt-3 flex gap-1.5">
                          {['primary', 'accent', 'background'].map((k) => (
                            <span
                              key={k}
                              className="h-5 w-5 rounded-full border"
                              style={{ backgroundColor: palette[k] ?? '#ccc' }}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs capitalize text-muted-foreground">{t.min_plan_tier} plan</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Couple</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partnerOneName">Partner one</Label>
                  <Input
                    id="partnerOneName"
                    value={couple.one}
                    onChange={(e) => setCouple((c) => ({ ...c, one: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerTwoName">Partner two</Label>
                  <Input
                    id="partnerTwoName"
                    value={couple.two}
                    onChange={(e) => setCouple((c) => ({ ...c, two: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupleInitials">Monogram initials</Label>
                  <Input
                    id="coupleInitials"
                    value={couple.initials}
                    maxLength={8}
                    placeholder="A&O"
                    onChange={(e) => setCouple((c) => ({ ...c, initials: e.target.value }))}
                  />
                </div>
              </div>
              {saveCouple.error && <p className="text-sm text-destructive">{saveCouple.error}</p>}
              <Button onClick={submitCouple} disabled={saveCouple.pending}>
                {saveCouple.pending ? 'Saving…' : 'Save couple'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Envelope &amp; card</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Primary color" value={config.primaryColor} fallback={resolved.primary} onChange={(v) => setField('primaryColor', v)} />
                <ColorField label="Accent color" value={config.accentColor} fallback={resolved.accent} onChange={(v) => setField('accentColor', v)} />
                <ColorField label="Background color" value={config.backgroundColor} fallback={resolved.background} onChange={(v) => setField('backgroundColor', v)} />
                <ColorField label="Text color" value={config.textColor} fallback={resolved.text} onChange={(v) => setField('textColor', v)} />
                <ColorField label="Envelope color" value={config.envelopeColor} fallback={resolved.envelopeColor} onChange={(v) => setField('envelopeColor', v)} />
                <ColorField label="Envelope liner" value={config.envelopeLiner} fallback={resolved.envelopeLiner} onChange={(v) => setField('envelopeLiner', v)} />
                <div className="space-y-2">
                  <Label htmlFor="headingFont">Heading font</Label>
                  <Input id="headingFont" value={config.headingFont ?? ''} placeholder={resolved.headingFont} onChange={(e) => setField('headingFont', e.target.value || undefined)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFont">Body font</Label>
                  <Input id="bodyFont" value={config.bodyFont ?? ''} placeholder={resolved.bodyFont} onChange={(e) => setField('bodyFont', e.target.value || undefined)} />
                </div>
                <SelectField label="Wax seal" value={config.waxSeal} options={waxSealStyles} labels={WAX_SEAL_LABELS} onChange={(v) => setField('waxSeal', v as WaxSealStyle | undefined)} />
                <SelectField label="Card border" value={config.cardBorder} options={cardBorderStyles} labels={CARD_BORDER_LABELS} onChange={(v) => setField('cardBorder', v as CardBorderStyle | undefined)} />
                <SelectField label="Animation" value={config.animation} options={animationVariants} labels={ANIMATION_LABELS} onChange={(v) => setField('animation', v as AnimationVariant | undefined)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="introMessage">Intro message</Label>
                <Textarea
                  id="introMessage"
                  rows={3}
                  value={config.introMessage ?? ''}
                  placeholder="Together with their families…"
                  onChange={(e) => setField('introMessage', e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="musicUrl">Background music URL (optional)</Label>
                <Input id="musicUrl" value={config.musicUrl ?? ''} placeholder="https://… or /api/media/…" onChange={(e) => setField('musicUrl', e.target.value || undefined)} />
                <p className="text-xs text-muted-foreground">Music never autoplays; guests control playback.</p>
              </div>
              {saveConfig.error && <p className="text-sm text-destructive">{saveConfig.error}</p>}
              <Button onClick={submitConfig} disabled={saveConfig.pending}>
                {saveConfig.pending ? 'Saving…' : 'Save invitation'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">Live preview</h2>
                <Button variant="outline" size="sm" onClick={() => setReplayKey((k) => k + 1)}>
                  <RotateCcw className="h-4 w-4" /> Replay
                </Button>
              </div>
              <div className="h-[560px] overflow-hidden rounded-lg border">
                <EnvelopeExperience
                  key={replayKey}
                  contained
                  couple={{ one: couple.one, two: couple.two, initials: couple.initials || null, date: wedding.wedding_date }}
                  theme={resolved}
                  introMessage={config.introMessage}
                  musicUrl={config.musicUrl}
                  onOpen={() => {}}
                  dir={dir}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tap the envelope to preview the opening sequence. Changes appear here instantly; save to
                publish them to your guests.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={/^#([0-9a-fA-F]{6})$/.test(value ?? '') ? (value as string) : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border"
        />
        <Input value={value ?? ''} placeholder={fallback} onChange={(e) => onChange(e.target.value || undefined)} />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string | undefined) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={selectClass} value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">Theme default</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}