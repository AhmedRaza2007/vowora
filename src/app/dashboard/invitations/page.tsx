import type { Metadata } from 'next';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { getMyWeddings } from '@/features/weddings/queries';
import { CreateWeddingDialog } from '@/features/weddings/components/create-wedding-dialog';
import { EmptyState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Invitations' };

export default async function InvitationsIndexPage() {
  const weddings = await getMyWeddings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">
          Choose a wedding to generate and deliver secure, personal invitation links to your guests.
        </p>
      </div>

      {weddings.length === 0 ? (
        <EmptyState
          title="No weddings yet"
          description="Create a wedding to start sending invitations."
          action={<CreateWeddingDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((w) => (
            <Card key={w.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{w.title}</p>
                  <Badge variant={w.status === 'published' ? 'success' : 'secondary'}>{w.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {w.partner_one_name} &amp; {w.partner_two_name}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/weddings/${w.id}/invitations`}>
                    <Send className="h-4 w-4" /> Manage invitations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}