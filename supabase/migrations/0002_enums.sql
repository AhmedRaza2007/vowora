-- 0002_enums.sql
-- Stable enum types for the Phase 1 foundation. Later phases add domain enums
-- (invitation_status, rsvp_status, vendor_status, etc.) in their own migrations.

do $$ begin
  create type platform_role as enum ('customer','vendor','support','admin','super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedding_role as enum ('owner','partner','planner','family','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedding_status as enum ('draft','published','unpublished','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type section_type as enum (
    'hero','couple_intro','family_intro','story','events','countdown','venue',
    'photo_gallery','video_gallery','dress_code','invitation_message','rsvp',
    'gift_registry','wishes','contact'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('trialing','active','past_due','canceled','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('image','video','audio','document');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visibility as enum ('public','private','invitation_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum ('rsvp','invitation','system','billing','task','announcement');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','succeeded','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('requested','in_review','in_progress','delivered','canceled');
exception when duplicate_object then null; end $$;