import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getCurrentProfile, requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { DeleteAccountButton } from '@/features/settings/components/delete-account-button';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const t = await getTranslations('dashboard');
  const user = await requireUser('/dashboard/settings');
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{profile?.platform_role ?? 'customer'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
          <CardDescription>English or Urdu (right-to-left).</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Request deletion of your account and associated data. Requests are reviewed and
            processed securely; full automated deletion is finalized in Phase 8.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}