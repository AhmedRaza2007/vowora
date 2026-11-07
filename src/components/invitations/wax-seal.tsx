import type { WaxSealStyle } from '@/features/invitations/theme';

/**
 * Decorative wax seal rendered with CSS gradients + SVG motifs. Presentational (no hooks)
 * so it works in both the client envelope and server-rendered previews.
 */
export function WaxSeal({
  initials,
  variant,
  color,
  accent,
  size = 96,
}: {
  initials: string | null;
  variant: WaxSealStyle;
  color: string;
  accent: string;
  size?: number;
}) {
  const monogram = initials?.trim() || '♥';
  const serif = variant !== 'minimal';

  return (
    <div
      aria-hidden
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${lighten(color)}, ${color} 60%, ${darken(color)})`,
        boxShadow: `0 6px 18px rgba(0,0,0,0.35), inset 0 2px 6px rgba(255,255,255,0.25), inset 0 -3px 8px rgba(0,0,0,0.3)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        opacity={0.9}
      >
        <circle cx="50" cy="50" r="44" />
        {variant === 'gold-monogram' || variant === 'rose-monogram' ? (
          <circle cx="50" cy="50" r="38" strokeDasharray="2 3" />
        ) : null}
        {variant === 'floral' ? (
          <g>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI) / 4;
              const x = 50 + 40 * Math.cos(angle);
              const y = 50 + 40 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3" fill={accent} stroke="none" />;
            })}
          </g>
        ) : null}
        {variant === 'geometric' ? (
          <polygon points="50,8 79,21 92,50 79,79 50,92 21,79 8,50 21,21" />
        ) : null}
        {variant === 'mughal-arch' ? (
          <path d="M25 70 V45 Q25 22 50 18 Q75 22 75 45 V70" />
        ) : null}
      </svg>
      <span
        className="relative z-10 select-none text-center leading-none"
        style={{
          color: accent,
          fontFamily: serif ? 'var(--font-serif), Georgia, serif' : 'var(--font-sans), sans-serif',
          fontSize: size * (monogram.length > 2 ? 0.26 : 0.34),
          fontWeight: 600,
          letterSpacing: '0.05em',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {monogram}
      </span>
    </div>
  );
}

/** Lighten a hex color toward white by a fixed amount (no external dependency). */
function lighten(hex: string): string {
  return mix(hex, '#ffffff', 0.28);
}

function darken(hex: string): string {
  return mix(hex, '#000000', 0.3);
}

function mix(hex: string, target: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(target);
  if (!a || !b) return hex;
  const c = a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}