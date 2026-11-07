import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getTemplates } from '@/features/admin/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'Templates · Admin' };

export default async function AdminTemplatesPage() {
  const t = await getTranslations('admin');
  const templates = await getTemplates();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('templates')}</h1>
      {templates.length === 0 ? (
        <EmptyState description="No templates configured. Run the config seed migration." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{tpl.name}</h3>
                  <Badge variant={tpl.is_active ? 'success' : 'outline'}>
                    {tpl.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tpl.key}</p>
                <p className="mt-3 text-sm text-muted-foreground">{tpl.description}</p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="secondary">{tpl.category}</Badge>
                  <Badge variant="gold">{tpl.min_plan_tier}+</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}