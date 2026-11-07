export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b bg-grain">
      <div className="container py-16 text-center md:py-20">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}