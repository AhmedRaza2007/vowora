-- 0001_extensions.sql
-- Required extensions. Supabase exposes these in the `extensions` schema.
create extension if not exists pgcrypto with schema extensions;

-- gen_random_uuid() is core in PostgreSQL 13+; pgcrypto provides gen_random_bytes()
-- used for secure invitation tokens in later phases.