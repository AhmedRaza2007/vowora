/**
 * Honest module catalog for the customer dashboard. Modules not yet built link to a status
 * page that states their delivery phase and planned scope — never fake data or dead buttons.
 * Descriptions mirror the master prompt so the roadmap is transparent to the customer.
 */
export type ModuleInfo = {
  slug: string;
  title: string;
  phase: string;
  description: string;
};

export const moduleCatalog: Record<string, ModuleInfo> = {
  builder: {
    slug: 'builder',
    title: 'Website Builder',
    phase: 'Phase 2',
    description:
      'Template selection, 15 customizable sections, drag-and-drop ordering, colors and fonts, photo/video upload, live mobile/desktop preview, draft and publish, custom URL and SEO settings.',
  },
  invitation: {
    slug: 'invitation',
    title: 'Invitation Designer',
    phase: 'Phase 3',
    description:
      'The signature cinematic invitation: luxury envelope, animated wax seal, card reveal, 10 premium themes, full customization, background music and live preview before publishing.',
  },
  events: {
    slug: 'events',
    title: 'Events',
    phase: 'Phase 4',
    description:
      'Standard and unlimited custom ceremonies (Mehndi, Nikah, Baraat, Walima and more) with dates, timezones, venues, maps, dress code, instructions and event-specific guest lists.',
  },
  guests: {
    slug: 'guests',
    title: 'Guests',
    phase: 'Phase 4',
    description:
      'Individuals, families and groups with categories, attendee limits, notes, event permissions, CSV import/export, search and filtering, and secure personalized invitation links.',
  },
  invitations: {
    slug: 'invitations',
    title: 'Invitations',
    phase: 'Phase 4',
    description:
      'Send and track secure personalized invitations via WhatsApp share, copy link, QR code and email, with resend, revoke and delivery status.',
  },
  rsvp: {
    slug: 'rsvp',
    title: 'RSVP',
    phase: 'Phase 5',
    description:
      'Event-wise accept/decline/maybe responses, attendee counts within limits, dietary preferences, live attendance analytics and exportable reports.',
  },
  gallery: {
    slug: 'gallery',
    title: 'Gallery',
    phase: 'Phase 5',
    description:
      'Couple photo and video galleries, guest wishes and a memory wall, with guest QR uploads, couple approval, moderation and privacy controls.',
  },
  budget: {
    slug: 'budget',
    title: 'Budget Planner',
    phase: 'Phase 7',
    description:
      'Total, event-wise and category-wise budgets, expense tracking, paid/pending payments, vendor payment tracking, alerts, charts and CSV/PDF export.',
  },
  vendors: {
    slug: 'vendors',
    title: 'Vendors',
    phase: 'Phase 7',
    description:
      'Discover wedding vendors with portfolios, packages, price ranges, real reviews, enquiries, quote comparison and booking status.',
  },
  venues: {
    slug: 'venues',
    title: 'Venues',
    phase: 'Phase 7',
    description:
      'Discover and compare venues by city, type, capacity, facilities and price range, with enquiry requests and clearly labeled estimated vs verified information.',
  },
  seating: {
    slug: 'seating',
    title: 'Seating Planner',
    phase: 'Phase 7',
    description:
      'Interactive tables with capacity, guest assignment, family grouping, VIP flags, occupancy view, printable seating chart and export.',
  },
  checklists: {
    slug: 'checklists',
    title: 'Checklists',
    phase: 'Phase 7',
    description:
      'Planning checklists and timeline with pre-wedding, vendor, clothing, invitation and wedding-day tasks, deadlines, completion status and reminders.',
  },
  ai: {
    slug: 'ai',
    title: 'AI Assistant',
    phase: 'Phase 7',
    description:
      'An AI wedding planning assistant for wording, scheduling, budget ideas, checklists and recommendations — using only your authorized wedding data, with guest privacy protected.',
  },
  billing: {
    slug: 'billing',
    title: 'Subscription & Billing',
    phase: 'Phase 6',
    description:
      'Configurable subscription plans, secure checkout, payment records, renewals, upgrades, cancellation and invoice history.',
  },
};