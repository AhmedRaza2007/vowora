import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({
  name,
  logoUrl,
  href = '/',
  className,
}: {
  name: string;
  logoUrl?: string | null;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-8 w-8 rounded-md object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
          {name.charAt(0)}
        </span>
      )}
      <span className="font-display text-xl font-semibold tracking-tight">{name}</span>
    </Link>
  );
}