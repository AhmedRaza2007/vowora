/**
 * Database row types for the Phase 1 foundation. These mirror supabase/migrations and the
 * design in docs/database-schema.md. Later phases extend this file as tables are added.
 * (Can be regenerated with `supabase gen types` once a project is linked.)
 */

export type PlatformRole = 'customer' | 'vendor' | 'support' | 'admin' | 'super_admin';
export type WeddingRole = 'owner' | 'partner' | 'planner' | 'family' | 'viewer';
export type WeddingStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type SectionType =
  | 'hero'
  | 'couple_intro'
  | 'family_intro'
  | 'story'
  | 'events'
  | 'countdown'
  | 'venue'
  | 'photo_gallery'
  | 'video_gallery'
  | 'dress_code'
  | 'invitation_message'
  | 'rsvp'
  | 'gift_registry'
  | 'wishes'
  | 'contact';
export type GuestCategory = 'family' | 'friend' | 'colleague' | 'vip' | 'relative' | 'other';
export type InvitationStatus = 'active' | 'revoked' | 'expired';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  platform_role: PlatformRole;
  phone: string | null;
  locale: string;
  country: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wedding {
  id: string;
  created_by: string;
  slug: string;
  title: string;
  partner_one_name: string;
  partner_two_name: string;
  couple_initials: string | null;
  wedding_date: string | null;
  timezone: string;
  currency: string;
  locale: string;
  status: WeddingStatus;
  template_id: string | null;
  theme_id: string | null;
  design_config: Json;
  seo_config: Json;
  invitation_config: Json;
  custom_domain: string | null;
  subscription_id: string | null;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  permissions: string[];
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_image_url: string | null;
  default_config: Json;
  min_plan_tier: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingTheme {
  id: string;
  key: string;
  name: string;
  palette: Json;
  typography: Json;
  envelope_config: Json;
  card_config: Json;
  decor_elements: Json;
  animation_variant: string;
  background_url: string | null;
  wax_seal_styles: Json;
  min_plan_tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingSection {
  id: string;
  wedding_id: string;
  type: SectionType;
  title: string | null;
  content: Json;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** A ceremony/event within a wedding (Mehndi, Nikah, Walima, reception, or custom). */
export interface WeddingEvent {
  id: string;
  wedding_id: string;
  name: string;
  event_type: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  venue_name: string | null;
  venue_id: string | null;
  address: string | null;
  maps_url: string | null;
  lat: number | null;
  lng: number | null;
  cover_image_url: string | null;
  dress_code: string | null;
  instructions: string | null;
  artwork_config: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GuestGroup {
  id: string;
  wedding_id: string;
  name: string;
  notes: string | null;
  max_attendees: number;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  group_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  category: GuestCategory;
  max_attendees: number;
  notes: string | null;
  dietary_preferences: string | null;
  is_vip: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Authorization junction: which events a guest may see/RSVP, with per-event seat cap. */
export interface GuestEvent {
  id: string;
  guest_id: string;
  event_id: string;
  wedding_id: string;
  allowed_attendees: number | null;
  created_at: string;
}

/** Secure per-guest capability token; anon reads only via the get_invitation RPC. */
export interface Invitation {
  id: string;
  wedding_id: string;
  guest_id: string;
  token: string;
  status: InvitationStatus;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  delivered_via: string | null;
  delivered_at: string | null;
  last_opened_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MediaKind = 'image' | 'video' | 'audio' | 'document';
export type MediaVisibility = 'public' | 'private' | 'invitation_only';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface MediaAsset {
  id: string;
  wedding_id: string | null;
  uploaded_by: string | null;
  bucket: string;
  path: string;
  kind: MediaKind;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  moderation_status: ModerationStatus;
  visibility: MediaVisibility;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  tier: number;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  is_active: boolean;
  is_custom: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatureLimit {
  id: string;
  plan_id: string;
  feature_key: string;
  limit_value: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  provider: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  wedding_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
}

export interface PlatformSetting {
  key: string;
  value: Json;
  updated_by: string | null;
  updated_at: string;
}