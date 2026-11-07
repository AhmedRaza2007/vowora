import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/shared/logo';
import { marketingNav } from '@/lib/branding';

export async function MarketingFooter({
  name,
  logoUrl,
  supportEmail,
}: {
  name: string;
  logoUrl?: string | null;
  supportEmail: string;
}) {
  const t = await getTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/30">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo name={name} logoUrl={logoUrl} />
          <p className="max-w-xs text-sm text-muted-foreground">
            A premium global wedding experience & planning platform. Crafted for couples
            across Pakistan, India, UAE, UK, USA and beyond.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Product</h4>
          <ul className="space-y-2">
            {marketingNav.slice(0, 4).map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                {t('about')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                {t('contact')}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                {t('faq')}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${supportEmail}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {supportEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6">
        <p className="container text-center text-xs text-muted-foreground">
          © {year} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}