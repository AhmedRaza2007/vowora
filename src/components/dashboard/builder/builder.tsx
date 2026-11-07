'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  GripVertical,
  LayoutTemplate,
  MessageCircle,
  Monitor,
  Palette,
  Plus,
  Rocket,
  Smartphone,
} from 'lucide-react';
import {
  addSectionAction,
  deleteSectionAction,
  publishWeddingAction,
  reorderSectionsAction,
  selectTemplateAction,
  unpublishWeddingAction,
  updateDesignAction,
  updateSectionAction,
  updateSeoAction,
  type BuilderResult,
} from '@/features/weddings/builder-actions';
import { SECTION_LABELS } from '@/features/weddings/section-defaults';
import { buildInvitationShare } from '@/features/invitations/share';
import { appUrl } from '@/lib/env';
import { sectionTypes } from '@/lib/validations/builder';
import type { Json, Template, Wedding, WeddingSection } from '@/types/database';
import { WeddingSectionView } from '@/components/invitations/wedding-section';
import { SectionEditor } from './section-editor';
import { SortableSectionList } from './sortable-section-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Action = (prev: unknown, formData: FormData) => Promise<BuilderResult>;

function useBuilderAction(action: Action) {
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

function fd(weddingId: string, entries: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set('weddingId', weddingId);
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function str(config: Json, key: string): string {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const v = (config as Record<string, Json>)[key];
    if (typeof v === 'string') return v;
  }
  return '';
}

type Tab = 'sections' | 'design' | 'template' | 'publish' | 'preview';

const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
  { key: 'sections', label: 'Sections', icon: GripVertical },
  { key: 'design', label: 'Design', icon: Palette },
  { key: 'template', label: 'Template', icon: LayoutTemplate },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'publish', label: 'SEO & Publish', icon: Rocket },
];

export function Builder({
  wedding,
  sections,
  templates,
}: {
  wedding: Wedding;
  sections: WeddingSection[];
  templates: Template[];
}) {
  const [tab, setTab] = useState<Tab>('sections');
  const addSection = useBuilderAction(addSectionAction);
  const updateSection = useBuilderAction(updateSectionAction);
  const deleteSection = useBuilderAction(deleteSectionAction);
  const reorder = useBuilderAction(reorderSectionsAction);
  const design = useBuilderAction(updateDesignAction);
  const template = useBuilderAction(selectTemplateAction);
  const seo = useBuilderAction(updateSeoAction);
  const publish = useBuilderAction(publishWeddingAction);
  const unpublish = useBuilderAction(unpublishWeddingAction);

  const anyPending =
    addSection.pending || updateSection.pending || deleteSection.pending || reorder.pending ||
    design.pending || template.pending || seo.pending || publish.pending || unpublish.pending;

  const publicUrl = `/w/${wedding.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Website Builder</h1>
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

      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {anyPending && <p className="text-sm text-muted-foreground">Saving changes…</p>}

      {tab === 'sections' && (
        <SectionsPanel
          weddingId={wedding.id}
          sections={sections}
          onAdd={(type) => addSection.run(fd(wedding.id, { type }))}
          onToggle={(s) => updateSection.run(fd(wedding.id, { sectionId: s.id, is_enabled: String(!s.is_enabled) }))}
          onDelete={(s) => deleteSection.run(fd(wedding.id, { sectionId: s.id }))}
          onMove={(ids) => reorder.run(fd(wedding.id, { ids: JSON.stringify(ids) }))}
          addError={addSection.error}
        />
      )}

      {tab === 'design' && <DesignPanel wedding={wedding} action={design} />}
      {tab === 'template' && (
        <TemplatePanel wedding={wedding} templates={templates} action={template} />
      )}
      {tab === 'preview' && <PreviewPanel wedding={wedding} sections={sections} />}
      {tab === 'publish' && (
        <PublishPanel
          wedding={wedding}
          seo={seo}
          publish={publish}
          unpublish={unpublish}
          publicUrl={publicUrl}
        />
      )}
    </div>
  );
}

function SectionsPanel({
  weddingId,
  sections,
  onAdd,
  onToggle,
  onDelete,
  onMove,
  addError,
}: {
  weddingId: string;
  sections: WeddingSection[];
  onAdd: (type: string) => void;
  onToggle: (section: WeddingSection) => void;
  onDelete: (section: WeddingSection) => void;
  onMove: (ids: string[]) => void;
  addError: string | null;
}) {
  const [editing, setEditing] = useState<WeddingSection | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag the handle to reorder sections, or use the arrows. Enable, edit and delete sections.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            {sectionTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
                {SECTION_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {addError && <p className="text-sm text-destructive">{addError}</p>}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No sections yet. Add your first section to start building.
          </CardContent>
        </Card>
      ) : (
        <SortableSectionList
          sections={sections}
          handlers={{ onMove, onToggle, onDelete, onEdit: setEditing }}
        />
      )}

      {editing && (
        <SectionEditor
          key={editing.id}
          section={editing}
          weddingId={weddingId}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function DesignPanel({ wedding, action }: { wedding: Wedding; action: ReturnType<typeof useBuilderAction> }) {
  const d = wedding.design_config;
  return (
    <Card>
      <CardContent className="p-6">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="weddingId" value={wedding.id} />
          <ColorField name="primaryColor" label="Primary color" defaultValue={str(d, 'primaryColor')} />
          <ColorField name="accentColor" label="Accent color" defaultValue={str(d, 'accentColor')} />
          <ColorField name="backgroundColor" label="Background color" defaultValue={str(d, 'backgroundColor')} />
          <ColorField name="textColor" label="Text color" defaultValue={str(d, 'textColor')} />
          <div className="space-y-2">
            <Label htmlFor="headingFont">Heading font</Label>
            <Input id="headingFont" name="headingFont" defaultValue={str(d, 'headingFont')} placeholder="Cormorant Garamond" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyFont">Body font</Label>
            <Input id="bodyFont" name="bodyFont" defaultValue={str(d, 'bodyFont')} placeholder="Inter" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invitationMessage">Invitation message</Label>
            <Textarea id="invitationMessage" name="invitationMessage" defaultValue={str(d, 'invitationMessage')} rows={3} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="musicUrl">Background music URL (optional)</Label>
            <Input id="musicUrl" name="musicUrl" defaultValue={str(d, 'musicUrl')} placeholder="https://…" />
            <p className="text-xs text-muted-foreground">Music never autoplays; guests control playback.</p>
          </div>
          {action.error && <p className="text-sm text-destructive sm:col-span-2">{action.error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={action.pending}>{action.pending ? 'Saving…' : 'Save design'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          defaultValue={defaultValue || '#6d1f3a'}
          onChange={(e) => {
            const input = document.getElementById(name) as HTMLInputElement | null;
            if (input) input.value = e.target.value;
          }}
          className="h-10 w-12 cursor-pointer rounded border"
        />
        <Input id={name} name={name} defaultValue={defaultValue} placeholder="#6d1f3a" />
      </div>
    </div>
  );
}

function TemplatePanel({
  wedding,
  templates,
  action,
}: {
  wedding: Wedding;
  templates: Template[];
  action: ReturnType<typeof useBuilderAction>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose a layout template for your wedding website.</p>
      {action.error && <p className="text-sm text-destructive">{action.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const selected = wedding.template_id === t.id;
          return (
            <Card key={t.id} className={selected ? 'ring-2 ring-primary' : ''}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t.name}</p>
                  {selected && <Badge variant="success">Selected</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <Button
                  size="sm"
                  variant={selected ? 'outline' : 'default'}
                  disabled={action.pending}
                  onClick={() => action.run(fd(wedding.id, { templateId: t.id }))}
                >
                  {selected ? 'Selected' : 'Use template'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PreviewPanel({ wedding, sections }: { wedding: Wedding; sections: WeddingSection[] }) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');
  const enabled = sections.filter((s) => s.is_enabled);
  const couple = {
    one: wedding.partner_one_name,
    two: wedding.partner_two_name,
    date: wedding.wedding_date,
    initials: wedding.couple_initials,
  };
  const background = str(wedding.design_config, 'backgroundColor') || '#fffaf3';
  const text = str(wedding.design_config, 'textColor') || '#2b1a20';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={device === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setDevice('desktop')}>
          <Monitor className="h-4 w-4" /> Desktop
        </Button>
        <Button variant={device === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setDevice('mobile')}>
          <Smartphone className="h-4 w-4" /> Mobile
        </Button>
        <p className="ml-2 text-xs text-muted-foreground">Live preview of enabled sections.</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4">
        <div
          className={`mx-auto overflow-hidden rounded-lg border shadow-sm transition-all ${
            device === 'mobile' ? 'max-w-[390px]' : 'max-w-3xl'
          }`}
          style={{ backgroundColor: background, color: text }}
        >
          {enabled.length === 0 ? (
            <p className="p-10 text-center text-sm opacity-70">No enabled sections to preview.</p>
          ) : (
            enabled.map((section) => <WeddingSectionView key={section.id} section={section} couple={couple} />)
          )}
        </div>
      </div>
    </div>
  );
}

function PublishPanel({
  wedding,
  seo,
  publish,
  unpublish,
  publicUrl,
}: {
  wedding: Wedding;
  seo: ReturnType<typeof useBuilderAction>;
  publish: ReturnType<typeof useBuilderAction>;
  unpublish: ReturnType<typeof useBuilderAction>;
  publicUrl: string;
}) {
  const isPublished = wedding.status === 'published';
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display mb-4 text-lg font-semibold">Search &amp; sharing</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              seo.run(new FormData(e.currentTarget));
            }}
          >
            <input type="hidden" name="weddingId" value={wedding.id} />
            <div className="space-y-2">
              <Label htmlFor="seo-title">Page title</Label>
              <Input id="seo-title" name="title" defaultValue={str(wedding.seo_config, 'title')} placeholder={`${wedding.partner_one_name} & ${wedding.partner_two_name}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-description">Description</Label>
              <Textarea id="seo-description" name="description" defaultValue={str(wedding.seo_config, 'description')} rows={3} />
            </div>
            {seo.error && <p className="text-sm text-destructive">{seo.error}</p>}
            <Button type="submit" disabled={seo.pending}>{seo.pending ? 'Saving…' : 'Save SEO'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Publication</h2>
          <p className="text-sm text-muted-foreground">
            {isPublished
              ? 'Your website is live. Guests can open the link below.'
              : 'Your website is not public yet. Publish when you are ready.'}
          </p>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Public link: </span>
            <span className="font-medium">{publicUrl}</span>
          </div>
          {isPublished ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open
                </Link>
              </Button>
              <Button
                variant="outline"
                disabled={unpublish.pending}
                onClick={() => unpublish.run(fd(wedding.id))}
              >
                {unpublish.pending ? 'Working…' : 'Unpublish'}
              </Button>
            </div>
          ) : (
            <Button disabled={publish.pending} onClick={() => publish.run(fd(wedding.id))}>
              <Rocket className="h-4 w-4" /> {publish.pending ? 'Publishing…' : 'Publish website'}
            </Button>
          )}
          {(publish.error || unpublish.error) && (
            <p className="text-sm text-destructive">{publish.error || unpublish.error}</p>
          )}
        </CardContent>
      </Card>

      <ShareCard wedding={wedding} publicUrl={publicUrl} />
    </div>
  );
}

function ShareCard({ wedding, publicUrl }: { wedding: Wedding; publicUrl: string }) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = `${appUrl}${publicUrl}`;
  const share = buildInvitationShare({
    coupleOne: wedding.partner_one_name,
    coupleTwo: wedding.partner_two_name,
    date: wedding.wedding_date,
    url: absoluteUrl,
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardContent className="space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Share invitation</h2>
        <p className="text-sm text-muted-foreground">
          Send a beautiful invitation link to your guests. The link preview shows your couple
          names and celebration details.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={share.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        <p className="break-all text-xs text-muted-foreground">{absoluteUrl}</p>
      </CardContent>
    </Card>
  );
}