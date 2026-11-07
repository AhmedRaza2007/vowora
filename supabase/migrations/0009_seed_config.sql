-- 0009_seed_config.sql
-- CONFIGURATION ONLY: branding defaults, 10 invitation themes, website templates,
-- subscription plans + feature limits. No fake users, reviews, testimonials or stats.
-- Idempotent: on conflict do nothing so admin edits are never overwritten by re-runs.
-- Prices are intentionally NULL — they are admin-configurable, not invented market prices.

-- Branding defaults (jsonb strings; read by src/lib/branding-server.ts) -------------
insert into public.platform_settings (key, value) values
  ('brand_name',    '"Vowora"'::jsonb),
  ('brand_tagline', '"Premium wedding experiences, beautifully managed."'::jsonb),
  ('support_email', '"support@vowora.example"'::jsonb)
on conflict (key) do nothing;

-- Invitation themes (the signature cinematic collection) --------------------------
insert into public.wedding_themes
  (key, name, palette, typography, envelope_config, card_config, animation_variant, min_plan_tier)
values
  ('royal-gold-burgundy', 'Royal Gold & Burgundy',
   '{"primary":"#6d1f3a","accent":"#c8a24a","background":"#fbf6ef","text":"#2b1a20"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#6d1f3a","liner":"#c8a24a","waxSeal":"gold-monogram"}'::jsonb,
   '{"border":"gold-foil","background":"#fbf6ef"}'::jsonb,
   'classic-reveal', 'premium'),

  ('emerald-green-gold', 'Emerald Green & Gold',
   '{"primary":"#0f5132","accent":"#d4af37","background":"#f4f8f4","text":"#10241a"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#0f5132","liner":"#d4af37","waxSeal":"gold-monogram"}'::jsonb,
   '{"border":"gold-foil","background":"#f4f8f4"}'::jsonb,
   'classic-reveal', 'premium'),

  ('ivory-champagne', 'Ivory & Champagne',
   '{"primary":"#b76e79","accent":"#e7c9a9","background":"#fffaf3","text":"#3a2e2a"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#e7c9a9","liner":"#b76e79","waxSeal":"rose-monogram"}'::jsonb,
   '{"border":"thin-gold","background":"#fffaf3"}'::jsonb,
   'soft-fade', 'free'),

  ('floral-blush', 'Floral Blush Romance',
   '{"primary":"#d98a9e","accent":"#9caf88","background":"#fdf4f5","text":"#402b30"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#d98a9e","liner":"#9caf88","waxSeal":"floral"}'::jsonb,
   '{"border":"floral","background":"#fdf4f5"}'::jsonb,
   'petal-drift', 'starter'),

  ('modern-minimal', 'Modern Minimal',
   '{"primary":"#1f2933","accent":"#9aa5b1","background":"#ffffff","text":"#1f2933"}'::jsonb,
   '{"heading":"Inter","body":"Inter"}'::jsonb,
   '{"color":"#1f2933","liner":"#9aa5b1","waxSeal":"minimal"}'::jsonb,
   '{"border":"none","background":"#ffffff"}'::jsonb,
   'soft-fade', 'free'),

  ('traditional-pakistani', 'Traditional Pakistani Wedding',
   '{"primary":"#7a1f2b","accent":"#d4af37","background":"#fff8ec","text":"#2d1b12"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Noto Nastaliq Urdu","urdu":true}'::jsonb,
   '{"color":"#7a1f2b","liner":"#d4af37","waxSeal":"gold-monogram"}'::jsonb,
   '{"border":"paisley-gold","background":"#fff8ec"}'::jsonb,
   'classic-reveal', 'starter'),

  ('contemporary-international', 'Contemporary International Wedding',
   '{"primary":"#2c3e50","accent":"#c0a062","background":"#f7f7f5","text":"#22303c"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#2c3e50","liner":"#c0a062","waxSeal":"minimal"}'::jsonb,
   '{"border":"thin-gold","background":"#f7f7f5"}'::jsonb,
   'soft-fade', 'starter'),

  ('royal-mughal', 'Royal Mughal Inspired',
   '{"primary":"#5b2333","accent":"#caa64b","background":"#fbf3e4","text":"#2a1620"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#5b2333","liner":"#caa64b","waxSeal":"mughal-arch"}'::jsonb,
   '{"border":"mughal-arch","background":"#fbf3e4"}'::jsonb,
   'classic-reveal', 'luxury'),

  ('elegant-arabic', 'Elegant Arabic Inspired',
   '{"primary":"#123524","accent":"#c9a227","background":"#f6f2e9","text":"#1c2b21"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#123524","liner":"#c9a227","waxSeal":"geometric"}'::jsonb,
   '{"border":"geometric-gold","background":"#f6f2e9"}'::jsonb,
   'classic-reveal', 'luxury'),

  ('modern-black-gold', 'Modern Luxury Black & Gold',
   '{"primary":"#111111","accent":"#d4af37","background":"#0d0d0d","text":"#f5f0e6"}'::jsonb,
   '{"heading":"Cormorant Garamond","body":"Inter"}'::jsonb,
   '{"color":"#111111","liner":"#d4af37","waxSeal":"gold-monogram"}'::jsonb,
   '{"border":"gold-foil","background":"#0d0d0d"}'::jsonb,
   'cinematic-zoom', 'luxury')
on conflict (key) do nothing;

-- Website templates ---------------------------------------------------------------
insert into public.templates (key, name, description, category, min_plan_tier, sort_order) values
  ('luxury-gold', 'Luxury Gold', 'Opulent gold-foil layout with cinematic invitation.', 'luxury', 'premium', 1),
  ('emerald-luxury', 'Emerald Luxury', 'Deep emerald and gold editorial layout.', 'luxury', 'premium', 2),
  ('traditional', 'Traditional', 'Warm, culturally rich layout with Urdu support.', 'traditional', 'starter', 3),
  ('modern-minimal', 'Modern Minimal', 'Clean, typography-first minimal layout.', 'minimal', 'free', 4)
on conflict (key) do nothing;

-- Subscription plans (prices NULL = admin-configurable) ---------------------------
insert into public.subscription_plans (key, name, description, tier, is_custom, sort_order) values
  ('free',    'Free',    'Basic wedding website with limited templates and guests.', 0, false, 1),
  ('starter', 'Starter', 'More templates, personalized invitations and basic RSVP analytics.', 1, false, 2),
  ('premium', 'Premium', 'Premium themes, advanced animations, budget planner and guest management.', 2, false, 3),
  ('luxury',  'Luxury',  'Full premium collection, advanced planning and more wedding projects.', 3, false, 4),
  ('custom',  'Custom Design', 'Professionally designed wedding website and invitation by our team.', 4, true, 5)
on conflict (key) do nothing;

-- Per-plan feature limits (enforced server-side) ----------------------------------
insert into public.plan_feature_limits (plan_id, feature_key, limit_value)
select p.id, v.feature_key, v.limit_value
from public.subscription_plans p
join (values
  ('free',    'max_guests',                '50'),
  ('free',    'max_events',                '3'),
  ('free',    'max_weddings',              '1'),
  ('free',    'premium_themes',            'false'),
  ('free',    'personalized_invitations',  'false'),
  ('free',    'rsvp_analytics',            'false'),
  ('free',    'budget_planner',            'false'),
  ('free',    'ai_assistant',              'false'),
  ('free',    'advanced_animations',       'false'),
  ('free',    'custom_domain',             'false'),
  ('starter', 'max_guests',                '200'),
  ('starter', 'max_events',                '10'),
  ('starter', 'max_weddings',              '1'),
  ('starter', 'premium_themes',            'false'),
  ('starter', 'personalized_invitations',  'true'),
  ('starter', 'rsvp_analytics',            'true'),
  ('starter', 'budget_planner',            'false'),
  ('starter', 'ai_assistant',              'false'),
  ('starter', 'advanced_animations',       'false'),
  ('starter', 'custom_domain',             'false'),
  ('premium', 'max_guests',                '1000'),
  ('premium', 'max_events',                'unlimited'),
  ('premium', 'max_weddings',              '3'),
  ('premium', 'premium_themes',            'true'),
  ('premium', 'personalized_invitations',  'true'),
  ('premium', 'rsvp_analytics',            'true'),
  ('premium', 'budget_planner',            'true'),
  ('premium', 'ai_assistant',              'true'),
  ('premium', 'advanced_animations',       'true'),
  ('premium', 'seating_planner',           'true'),
  ('premium', 'custom_domain',             'false'),
  ('luxury',  'max_guests',                'unlimited'),
  ('luxury',  'max_events',                'unlimited'),
  ('luxury',  'max_weddings',              '10'),
  ('luxury',  'premium_themes',            'true'),
  ('luxury',  'personalized_invitations',  'true'),
  ('luxury',  'rsvp_analytics',            'true'),
  ('luxury',  'budget_planner',            'true'),
  ('luxury',  'ai_assistant',              'true'),
  ('luxury',  'advanced_animations',       'true'),
  ('luxury',  'seating_planner',           'true'),
  ('luxury',  'custom_domain',             'true'),
  ('luxury',  'priority_support',          'true'),
  ('custom',  'max_guests',                'unlimited'),
  ('custom',  'max_events',                'unlimited'),
  ('custom',  'max_weddings',              'unlimited'),
  ('custom',  'premium_themes',            'true'),
  ('custom',  'personalized_invitations',  'true'),
  ('custom',  'rsvp_analytics',            'true'),
  ('custom',  'budget_planner',            'true'),
  ('custom',  'ai_assistant',              'true'),
  ('custom',  'advanced_animations',       'true'),
  ('custom',  'seating_planner',           'true'),
  ('custom',  'custom_domain',             'true'),
  ('custom',  'priority_support',          'true'),
  ('custom',  'custom_design',             'true')
) as v(plan_key, feature_key, limit_value) on v.plan_key = p.key
on conflict (plan_id, feature_key) do nothing;