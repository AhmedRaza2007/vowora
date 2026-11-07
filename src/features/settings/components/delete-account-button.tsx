'use client';

import { useState, useTransition } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { requestAccountDeletion } from '@/features/settings/actions';
import { Button } from '@/components/ui/button';

export function DeleteAccountButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Request received. Our team will process your deletion securely.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await requestAccountDeletion();
            if (res.error) setError(res.error);
            else setDone(true);
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Request account deletion
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}