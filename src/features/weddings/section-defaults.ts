import type { SectionType } from '@/types/database';

export type SectionDefault = {
  type: SectionType;
  title: string;
  content: Record<string, string>;
  is_enabled: boolean;
};

/** Sensible starting sections for a new wedding website. Couples reorder/edit/disable these. */
export const DEFAULT_SECTIONS: SectionDefault[] = [
  { type: 'hero', title: 'Welcome', content: { headline: 'We are getting married', subheadline: 'Join us as we celebrate our wedding.' }, is_enabled: true },
  { type: 'couple_intro', title: 'The Couple', content: { partnerOneBio: '', partnerTwoBio: '' }, is_enabled: true },
  { type: 'story', title: 'Our Story', content: { body: 'Tell guests how your story began.' }, is_enabled: true },
  { type: 'events', title: 'Celebrations', content: { body: 'Event details will appear here once you add your events.' }, is_enabled: true },
  { type: 'countdown', title: 'Countdown', content: {}, is_enabled: true },
  { type: 'venue', title: 'Venue', content: { body: 'Add your venue and directions.' }, is_enabled: true },
  { type: 'photo_gallery', title: 'Gallery', content: {}, is_enabled: false },
  { type: 'dress_code', title: 'Dress Code', content: { body: '' }, is_enabled: false },
  { type: 'invitation_message', title: 'A Message for You', content: { message: 'We would be honoured by your presence.' }, is_enabled: true },
  { type: 'rsvp', title: 'RSVP', content: { body: 'Let us know if you can make it.' }, is_enabled: true },
  { type: 'gift_registry', title: 'Gift Registry', content: {}, is_enabled: false },
  { type: 'wishes', title: 'Guest Wishes', content: {}, is_enabled: false },
  { type: 'contact', title: 'Contact', content: { email: '', phone: '' }, is_enabled: true },
];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  couple_intro: 'Couple Introduction',
  family_intro: 'Family Introduction',
  story: 'Wedding Story',
  events: 'Events',
  countdown: 'Countdown',
  venue: 'Venue & Location',
  photo_gallery: 'Photo Gallery',
  video_gallery: 'Video Gallery',
  dress_code: 'Dress Code',
  invitation_message: 'Invitation Message',
  rsvp: 'RSVP',
  gift_registry: 'Gift Registry',
  wishes: 'Guest Wishes',
  contact: 'Contact',
};