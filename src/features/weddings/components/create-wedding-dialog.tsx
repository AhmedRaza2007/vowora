'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Plus, Loader2 } from 'lucide-react';
import { createWeddingSchema, type CreateWeddingInput } from '@/lib/validations/wedding';
import { createWeddingAction } from '@/features/weddings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CreateWeddingDialog() {
  const t = useTranslations();
  const td = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWeddingInput>({
    resolver: zodResolver(createWeddingSchema),
    defaultValues: { timezone: 'UTC', currency: 'USD', locale: 'en' },
  });

  const onSubmit = (values: CreateWeddingInput) => {
    setError(null);
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '') fd.set(key, String(value));
    });
    startTransition(async () => {
      const res = await createWeddingAction(null, fd);
      if (res?.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
    });
  };

  const fieldError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{t(message)}</p> : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {td('createWedding')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{td('createWedding')}</DialogTitle>
          <DialogDescription>
            Start with your names and date — you can customize everything afterwards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Wedding title</Label>
            <Input id="title" placeholder="Ahmed & Ayesha" {...register('title')} />
            {fieldError(errors.title?.message)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partnerOneName">Partner one</Label>
              <Input id="partnerOneName" {...register('partnerOneName')} />
              {fieldError(errors.partnerOneName?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerTwoName">Partner two</Label>
              <Input id="partnerTwoName" {...register('partnerTwoName')} />
              {fieldError(errors.partnerTwoName?.message)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Date (optional)</Label>
              <Input id="weddingDate" type="date" {...register('weddingDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" maxLength={3} placeholder="USD" {...register('currency')} />
            </div>
          </div>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}