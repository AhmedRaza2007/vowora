/**
 * Configurable branding. "Vowora" is a working name only. Runtime values come from the
 * `platform_settings` table; these defaults apply until an admin overrides them, so the
 * brand can change without rewriting the application.
 */
export type Branding = {
  name: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  primaryColor: string | null;
};

export const defaultBranding: Branding = {
  name: 'Vowora',
  tagline: 'Premium wedding experiences, beautifully managed.',
  logoUrl: null,
  supportEmail: 'support@vowora.example',
  primaryColor: null,
};

export const marketingNav = [
  { key: 'features', href: '/features' },
  { key: 'templates', href: '/templates' },
  { key: 'pricing', href: '/pricing' },
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'about', href: '/about' },
  { key: 'faq', href: '/faq' },
] as const;

export const dashboardNav = [
  { key: 'overview', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'myWeddings', href: '/dashboard/weddings', icon: 'Heart' },
  { key: 'websiteBuilder', href: '/dashboard/builder', icon: 'LayoutTemplate' },
  { key: 'invitationDesigner', href: '/dashboard/invitation', icon: 'Mail' },
  { key: 'events', href: '/dashboard/events', icon: 'CalendarDays' },
  { key: 'guests', href: '/dashboard/guests', icon: 'Users' },
  { key: 'invitations', href: '/dashboard/invitations', icon: 'Send' },
  { key: 'rsvp', href: '/dashboard/rsvp', icon: 'ClipboardCheck' },
  { key: 'gallery', href: '/dashboard/gallery', icon: 'Images' },
  { key: 'budget', href: '/dashboard/budget', icon: 'Wallet' },
  { key: 'vendors', href: '/dashboard/vendors', icon: 'Store' },
  { key: 'venues', href: '/dashboard/venues', icon: 'MapPin' },
  { key: 'seating', href: '/dashboard/seating', icon: 'Armchair' },
  { key: 'checklists', href: '/dashboard/checklists', icon: 'ListChecks' },
  { key: 'aiAssistant', href: '/dashboard/ai', icon: 'Sparkles' },
  { key: 'settings', href: '/dashboard/settings', icon: 'Settings' },
  { key: 'billing', href: '/dashboard/billing', icon: 'CreditCard' },
] as const;

export const adminNav = [
  { key: 'customers', href: '/admin', icon: 'Users' },
  { key: 'weddings', href: '/admin/weddings', icon: 'Heart' },
  { key: 'templates', href: '/admin/templates', icon: 'LayoutTemplate' },
  { key: 'subscriptions', href: '/admin/subscriptions', icon: 'CreditCard' },
  { key: 'payments', href: '/admin/payments', icon: 'Receipt' },
  { key: 'customOrders', href: '/admin/custom-orders', icon: 'Paintbrush' },
  { key: 'vendors', href: '/admin/vendors', icon: 'Store' },
  { key: 'venues', href: '/admin/venues', icon: 'MapPin' },
  { key: 'support', href: '/admin/support', icon: 'LifeBuoy' },
  { key: 'reports', href: '/admin/reports', icon: 'BarChart3' },
  { key: 'settings', href: '/admin/settings', icon: 'Settings' },
  { key: 'activityLogs', href: '/admin/activity', icon: 'ScrollText' },
] as const;