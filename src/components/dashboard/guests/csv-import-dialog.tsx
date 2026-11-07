'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Download, Loader2, Upload } from 'lucide-react';
import { importGuestsAction } from '@/features/weddings/guest-actions';
import { guestCsvHeaders, parseGuestCsv } from '@/lib/validations/guest';
import { toCsv } from '@/lib/csv';
import type { GuestGroup, Wedding } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function downloadTemplate() {
  const blob = new Blob([toCsv([[...guestCsvHeaders]])], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'vowora-guests-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CsvImportDialog({
  wedding,
  groups,
  trigger,
}: {
  wedding: Wedding;
  groups: GuestGroup[];
  trigger: ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const preview = useMemo(() => (csv.trim() ? parseGuestCsv(csv, groups) : null), [csv, groups]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setCsv(text);
      setResult(null);
      setError(null);
    });
  }

  function submit() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('csv', csv);
    startTransition(async () => {
      const res = await importGuestsAction(null, data);
      if (res.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
      else {
        setError(null);
        setResult({ imported: res.imported, skipped: res.skipped });
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import guests from CSV</DialogTitle>
          <DialogDescription>
            The first row must be headers. Unknown categories default to “other”; the group column
            matches an existing group by name. Invalid rows are skipped and reported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download template
          </Button>
          <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
            <Upload className="h-4 w-4" /> Choose CSV file
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-text">CSV content</Label>
          <Textarea
            id="csv-text"
            rows={8}
            value={csv}
            placeholder={`${guestCsvHeaders.join(',')}\nAisha Khan,aisha@example.com,+923001234567,family,3,Khan Family,,Vegetarian,true`}
            onChange={(e) => {
              setCsv(e.target.value);
              setResult(null);
              setError(null);
            }}
            className="font-mono text-xs"
          />
        </div>

        {preview && (
          <p className="text-sm text-muted-foreground">
            {preview.guests.length} valid {preview.guests.length === 1 ? 'guest' : 'guests'} ready to import
            {preview.errors.length > 0 && ` · ${preview.errors.length} invalid ${preview.errors.length === 1 ? 'row' : 'rows'} will be skipped`}
            .
          </p>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {result && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Imported {result.imported} {result.imported === 1 ? 'guest' : 'guests'}
            {result.skipped > 0 && ` · skipped ${result.skipped}`}.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={pending || !preview || preview.guests.length === 0}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import guests
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}