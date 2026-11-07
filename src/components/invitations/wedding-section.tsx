import type { Json, WeddingEvent, WeddingSection } from '@/types/database';
import { parseMediaUrls } from '@/lib/validations/media';
import { Countdown } from './countdown';
import { PublicEventList } from './public-event-list';

export type CoupleContext = {
  one: string;
  two: string;
  date: string | null;
  initials: string | null;
};

function asRecord(content: Json): Record<string, Json> {
  return content && typeof content === 'object' && !Array.isArray(content) ? content : {};
}

function str(content: Record<string, Json>, key: string): string {
  const v = content[key];
  return typeof v === 'string' ? v : '';
}

function urls(content: Record<string, Json>, key: string): string[] {
  return parseMediaUrls(str(content, key));
}

function Body({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mx-auto max-w-2xl whitespace-pre-line text-center leading-relaxed opacity-90">{text}</p>;
}

export function WeddingSectionView({
  section,
  couple,
  events = [],
  locale = 'en',
}: {
  section: WeddingSection;
  couple: CoupleContext;
  events?: WeddingEvent[];
  locale?: string;
}) {
  const c = asRecord(section.content);
  const title = section.title;

  const heading = title ? (
    <h2 className="font-display mb-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
  ) : null;

  let body: React.ReactNode = null;

  switch (section.type) {
    case 'hero':
      body = (
        <div className="text-center">
          {str(c, 'imageUrl') && (
            // eslint-disable-next-line @next/next/no-img-element -- same-origin media proxy streams the original asset
            <img
              src={str(c, 'imageUrl')}
              alt={`${couple.one} & ${couple.two}`}
              className="mx-auto mb-8 max-h-[420px] w-full max-w-2xl rounded-2xl object-cover shadow-lg"
            />
          )}
          <p className="text-sm uppercase tracking-[0.3em] opacity-70">{str(c, 'headline') || 'We are getting married'}</p>
          <p className="font-display mt-4 text-4xl font-semibold sm:text-6xl">
            {couple.one} <span className="opacity-60">&amp;</span> {couple.two}
          </p>
          {couple.date && <p className="mt-4 text-lg opacity-80">{couple.date}</p>}
          {str(c, 'subheadline') && <p className="mx-auto mt-4 max-w-xl opacity-80">{str(c, 'subheadline')}</p>}
        </div>
      );
      break;
    case 'couple_intro':
      body = (
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="text-center">
            <h3 className="font-display text-xl font-semibold">{couple.one}</h3>
            <Body text={str(c, 'partnerOneBio')} />
          </div>
          <div className="text-center">
            <h3 className="font-display text-xl font-semibold">{couple.two}</h3>
            <Body text={str(c, 'partnerTwoBio')} />
          </div>
        </div>
      );
      break;
    case 'countdown':
      body = couple.date ? <Countdown date={couple.date} /> : null;
      break;
    case 'contact':
      body = (
        <div className="text-center text-sm opacity-90">
          {str(c, 'email') && <p>{str(c, 'email')}</p>}
          {str(c, 'phone') && <p className="mt-1">{str(c, 'phone')}</p>}
        </div>
      );
      break;
    case 'invitation_message':
      body = <Body text={str(c, 'message')} />;
      break;
    case 'photo_gallery': {
      const images = urls(c, 'images');
      body =
        images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- same-origin media proxy streams the original asset
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`${couple.one} & ${couple.two} — photo ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover shadow-sm"
              />
            ))}
          </div>
        ) : (
          <Body text={str(c, 'body')} />
        );
      break;
    }
    case 'video_gallery': {
      const videos = urls(c, 'videos');
      body =
        videos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {videos.map((src, i) => (
              <video
                key={`${src}-${i}`}
                src={src}
                controls
                preload="metadata"
                className="w-full rounded-xl shadow-sm"
              />
            ))}
          </div>
        ) : (
          <Body text={str(c, 'body')} />
        );
      break;
    }
    case 'events':
      body =
        events.length > 0 ? (
          <PublicEventList events={events} locale={locale} />
        ) : (
          <Body text={str(c, 'body')} />
        );
      break;
    case 'gift_registry':
    case 'wishes':
    case 'rsvp':
      body = <Body text={str(c, 'body')} />;
      break;
    default:
      body = <Body text={str(c, 'body')} />;
  }

  if (!body && !heading) return null;

  return (
    <section className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {section.type !== 'hero' && heading}
        {body}
      </div>
    </section>
  );
}