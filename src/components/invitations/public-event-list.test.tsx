import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WeddingEvent, WeddingSection } from '@/types/database';
import { PublicEventList } from './public-event-list';
import { WeddingSectionView } from './wedding-section';

function makeEvent(overrides: Partial<WeddingEvent> = {}): WeddingEvent {
  return {
    id: 'e1',
    wedding_id: 'w1',
    name: 'Nikah Ceremony',
    event_type: 'nikah',
    description: 'The signing ceremony',
    event_date: '2026-12-01',
    start_time: '11:00:00',
    end_time: '13:30:00',
    timezone: 'Asia/Karachi',
    venue_name: 'Grand Hall',
    venue_id: null,
    address: '123 Main St, Karachi',
    maps_url: 'https://maps.google.com/?q=hall',
    lat: null,
    lng: null,
    cover_image_url: null,
    dress_code: 'Formal',
    instructions: 'Arrive early',
    artwork_config: {},
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const couple = { one: 'Aisha', two: 'Omar', date: '2026-12-12', initials: 'A&O' };

afterEach(() => cleanup());

describe('PublicEventList', () => {
  it('renders event details and a safe external map link', () => {
    render(<PublicEventList events={[makeEvent()]} locale="en" />);
    expect(screen.getByText('Nikah Ceremony')).toBeInTheDocument();
    expect(screen.getByText('Nikah')).toBeInTheDocument();
    expect(screen.getByText('Grand Hall')).toBeInTheDocument();
    expect(screen.getByText(/Formal/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /View map/ });
    expect(link).toHaveAttribute('href', 'https://maps.google.com/?q=hall');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a cover image with the event name as alt text', () => {
    render(<PublicEventList events={[makeEvent({ cover_image_url: '/api/media/w1/cover.jpg' })]} locale="en" />);
    const img = screen.getByRole('img', { name: 'Nikah Ceremony' });
    expect(img).toHaveAttribute('src', '/api/media/w1/cover.jpg');
  });

  it('omits the map link when no maps URL is set', () => {
    render(<PublicEventList events={[makeEvent({ maps_url: null })]} locale="en" />);
    expect(screen.queryByRole('link', { name: /View map/ })).not.toBeInTheDocument();
  });

  it('renders every event in the provided order', () => {
    render(
      <PublicEventList
        events={[makeEvent({ id: 'a', name: 'Mehndi' }), makeEvent({ id: 'b', name: 'Walima' })]}
        locale="en"
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Mehndi', 'Walima']);
  });

  it('renders for the Urdu locale without crashing', () => {
    render(<PublicEventList events={[makeEvent()]} locale="ur" />);
    expect(screen.getByText('Nikah Ceremony')).toBeInTheDocument();
  });
});

describe('WeddingSectionView events section', () => {
  const section: WeddingSection = {
    id: 's1',
    wedding_id: 'w1',
    type: 'events',
    title: 'Wedding Events',
    content: { body: 'Join us for the celebrations' },
    is_enabled: true,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('renders the event cards when events are present', () => {
    render(<WeddingSectionView section={section} couple={couple} events={[makeEvent()]} locale="en" />);
    expect(screen.getByText('Wedding Events')).toBeInTheDocument();
    expect(screen.getByText('Nikah Ceremony')).toBeInTheDocument();
  });

  it('falls back to the section body when there are no events', () => {
    render(<WeddingSectionView section={section} couple={couple} events={[]} locale="en" />);
    expect(screen.getByText('Join us for the celebrations')).toBeInTheDocument();
    expect(screen.queryByText('Nikah Ceremony')).not.toBeInTheDocument();
  });
});