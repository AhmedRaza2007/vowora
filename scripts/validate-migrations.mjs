// Validates supabase/migrations against an embedded Postgres (PGlite) without needing
// a live Supabase project. It stubs Supabase-specific primitives (auth.users, auth.uid(),
// storage.*) and default privileges, applies every migration in order, then runs RLS and
// trigger smoke tests. This is a syntax/logic check — still run `supabase db push` against
// a real project before production. Run with: npm run db:check
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dir = join(root, 'supabase', 'migrations');
const db = new PGlite();

// Stub Supabase primitives + the default privileges Supabase applies at table creation.
await db.exec(`
  create schema if not exists auth;
  create schema if not exists storage;
  create schema if not exists extensions;
  create role anon;
  create role authenticated;
  create role service_role bypassrls;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1] $$;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);

const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let failures = 0;
for (const f of files) {
  const sql = readFileSync(join(dir, f), 'utf8');
  // pgcrypto is guaranteed on Supabase; gen_random_uuid() is core in PG15, so the
  // extension statement is environment-specific and skipped under PGlite only.
  if (f.startsWith('0001')) {
    console.log(`SKIP  ${f} (pgcrypto is a Supabase guarantee; gen_random_uuid is core)`);
    continue;
  }
  try {
    await db.exec(sql);
    console.log(`OK    ${f}`);
  } catch (e) {
    failures++;
    console.log(`FAIL  ${f}\n      ${e.message}`);
  }
}

await db.exec(`
  grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant execute on function storage.foldername(text) to anon, authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
`);

async function check(label, fn) {
  try { await fn(); console.log(`PASS  ${label}`); }
  catch (e) { failures++; console.log(`FAIL  ${label}: ${e.message}`); }
}

await check('seed counts: 10 themes, 4 templates, 5 plans', async () => {
  const t = await db.query('select count(*)::int c from wedding_themes');
  const tp = await db.query('select count(*)::int c from templates');
  const p = await db.query('select count(*)::int c from subscription_plans');
  const l = await db.query('select count(*)::int c from plan_feature_limits');
  if (t.rows[0].c !== 10) throw new Error(`themes=${t.rows[0].c}`);
  if (tp.rows[0].c !== 4) throw new Error(`templates=${tp.rows[0].c}`);
  if (p.rows[0].c !== 5) throw new Error(`plans=${p.rows[0].c}`);
  if (l.rows[0].c < 50) throw new Error(`limits=${l.rows[0].c}`);
});

await check('handle_new_user trigger creates profile', async () => {
  await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('11111111-1111-1111-1111-111111111111', '{"full_name":"Test User"}')`);
  const r = await db.query(`select full_name from profiles where id='11111111-1111-1111-1111-111111111111'`);
  if (r.rows.length !== 1 || r.rows[0].full_name !== 'Test User') throw new Error('profile not created');
});

await check('handle_new_wedding trigger adds owner membership', async () => {
  await db.exec(`set app.uid = '11111111-1111-1111-1111-111111111111'`);
  await db.exec(`insert into weddings (created_by, slug, title, partner_one_name, partner_two_name) values ('11111111-1111-1111-1111-111111111111','test-wedding','Test','A','B')`);
  const r = await db.query(`select role::text role from wedding_members wm join weddings w on w.id=wm.wedding_id where w.slug='test-wedding'`);
  if (r.rows.length !== 1 || r.rows[0].role !== 'owner') throw new Error('owner membership missing');
});

await check('RLS: anon cannot read weddings table directly', async () => {
  await db.exec(`reset app.uid`);
  await db.exec(`set role anon`);
  const r = await db.query(`select count(*)::int c from weddings`);
  await db.exec(`reset role`);
  if (r.rows[0].c !== 0) throw new Error(`anon saw ${r.rows[0].c} weddings`);
});

await check('RLS: member reads own wedding; stranger does not', async () => {
  await db.exec(`insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222')`);
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '11111111-1111-1111-1111-111111111111'`);
  const own = await db.query(`select count(*)::int c from weddings`);
  await db.exec(`set app.uid = '22222222-2222-2222-2222-222222222222'`);
  const other = await db.query(`select count(*)::int c from weddings`);
  await db.exec(`reset role`);
  if (own.rows[0].c !== 1) throw new Error(`owner saw ${own.rows[0].c}`);
  if (other.rows[0].c !== 0) throw new Error(`stranger saw ${other.rows[0].c}`);
});

await check('RLS: authenticated cannot escalate platform_role', async () => {
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '11111111-1111-1111-1111-111111111111'`);
  let denied = false;
  try {
    await db.exec(`update profiles set platform_role='admin' where id='11111111-1111-1111-1111-111111111111'`);
  } catch { denied = true; }
  await db.exec(`reset role`);
  const r = await db.query(`select platform_role::text role from profiles where id='11111111-1111-1111-1111-111111111111'`);
  if (!denied || r.rows[0].role !== 'customer') throw new Error(`escalation allowed or role=${r.rows[0].role}`);
});

await check('RLS: member can update own profile name (self-service allowed)', async () => {
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '11111111-1111-1111-1111-111111111111'`);
  await db.exec(`update profiles set full_name='Renamed' where id='11111111-1111-1111-1111-111111111111'`);
  await db.exec(`reset role`);
  const r = await db.query(`select full_name from profiles where id='11111111-1111-1111-1111-111111111111'`);
  if (r.rows[0].full_name !== 'Renamed') throw new Error('self-update failed');
});

await check('RLS: anon reads branding but not secret_ keys', async () => {
  await db.exec(`reset role`);
  await db.exec(`reset app.uid`);
  await db.exec(`insert into platform_settings (key, value) values ('secret_smtp', '"hidden"'::jsonb)`);
  await db.exec(`set role anon`);
  const r = await db.query(`select key from platform_settings`);
  await db.exec(`reset role`);
  const keys = r.rows.map((x) => x.key);
  if (!keys.includes('brand_name')) throw new Error('brand_name not public');
  if (keys.includes('secret_smtp')) throw new Error('secret key exposed to anon');
});

await check('RLS: service_role can promote platform_role (admin path works)', async () => {
  await db.exec(`set role service_role`);
  await db.exec(`update profiles set platform_role='admin' where id='22222222-2222-2222-2222-222222222222'`);
  await db.exec(`reset role`);
  const r = await db.query(`select platform_role::text role from profiles where id='22222222-2222-2222-2222-222222222222'`);
  if (r.rows[0].role !== 'admin') throw new Error('service_role promotion blocked');
});

await check('RPC: anon reads published wedding; draft/missing return null', async () => {
  await db.exec(`reset role`);
  await db.exec(`reset app.uid`);
  await db.exec(`insert into wedding_sections (wedding_id, type, title, sort_order) select id, 'hero', 'Welcome', 0 from weddings where slug='test-wedding'`);
  await db.exec(`update weddings set status='published' where slug='test-wedding'`);
  await db.exec(`insert into weddings (created_by, slug, title, partner_one_name, partner_two_name, status) values ('11111111-1111-1111-1111-111111111111','draft-wedding','Draft','A','B','draft')`);
  await db.exec(`set role anon`);
  const pub = await db.query(`select public.get_published_wedding('test-wedding') as w`);
  const draft = await db.query(`select public.get_published_wedding('draft-wedding') as w`);
  const missing = await db.query(`select public.get_published_wedding('does-not-exist') as w`);
  await db.exec(`reset role`);
  if (!pub.rows[0].w || pub.rows[0].w.title !== 'Test') throw new Error('published wedding not readable');
  if (!Array.isArray(pub.rows[0].w.sections) || pub.rows[0].w.sections.length !== 1) throw new Error('sections not aggregated');
  if (draft.rows[0].w !== null) throw new Error('draft wedding exposed');
  if (missing.rows[0].w !== null) throw new Error('missing slug did not return null');
});

// ---- Phase 4: events, guests, secure invitations ---------------------------------
const OWNER = '11111111-1111-1111-1111-111111111111';
let wedId, ev1, ev2, guestA, guestB;
const tokenA = 'a'.repeat(43), tokenB = 'b'.repeat(43);
const revokedToken = 'r'.repeat(43), expiredToken = 'e'.repeat(43);

await check('Phase 4 setup: events, guests, guest_events, invitations', async () => {
  await db.exec(`reset role`);
  wedId = (await db.query(`select id from weddings where slug='test-wedding'`)).rows[0].id;
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '${OWNER}'`);
  ev1 = (await db.query(`insert into events (wedding_id,name,event_type,event_date,timezone,sort_order) values ('${wedId}','Mehndi','mehndi','2026-12-10','UTC',0) returning id`)).rows[0].id;
  ev2 = (await db.query(`insert into events (wedding_id,name,event_type,event_date,timezone,sort_order) values ('${wedId}','Nikah','nikah','2026-12-11','UTC',1) returning id`)).rows[0].id;
  await db.query(`insert into events (wedding_id,name,event_type,event_date,timezone,sort_order) values ('${wedId}','Walima','walima','2026-12-12','UTC',2)`);
  guestA = (await db.query(`insert into guests (wedding_id,name,category,max_attendees) values ('${wedId}','Guest A','family',2) returning id`)).rows[0].id;
  guestB = (await db.query(`insert into guests (wedding_id,name,category,max_attendees) values ('${wedId}','Guest B','friend',1) returning id`)).rows[0].id;
  await db.query(`insert into guest_events (guest_id,event_id,wedding_id,allowed_attendees) values ('${guestA}','${ev1}','${wedId}',2)`);
  await db.query(`insert into guest_events (guest_id,event_id,wedding_id) values ('${guestB}','${ev2}','${wedId}')`);
  await db.query(`insert into invitations (wedding_id,guest_id,token,status) values ('${wedId}','${guestA}','${tokenA}','active')`);
  await db.query(`insert into invitations (wedding_id,guest_id,token,status) values ('${wedId}','${guestB}','${tokenB}','active')`);
  await db.query(`insert into invitations (wedding_id,guest_id,token,status,revoked_at) values ('${wedId}','${guestA}','${revokedToken}','revoked',now())`);
  await db.query(`insert into invitations (wedding_id,guest_id,token,status,expires_at) values ('${wedId}','${guestA}','${expiredToken}','active','2000-01-01')`);
  await db.exec(`reset role`);
});

await check('RLS: anon cannot read guests/events/invitations directly', async () => {
  await db.exec(`reset app.uid`);
  await db.exec(`set role anon`);
  const g = await db.query(`select count(*)::int c from guests`);
  const e = await db.query(`select count(*)::int c from events`);
  const i = await db.query(`select count(*)::int c from invitations`);
  await db.exec(`reset role`);
  if (g.rows[0].c !== 0 || e.rows[0].c !== 0 || i.rows[0].c !== 0) throw new Error('anon read private tables');
});

await check('RLS: member reads own guests; a non-member stranger does not', async () => {
  await db.exec(`reset role`);
  await db.exec(`insert into auth.users (id) values ('33333333-3333-3333-3333-333333333333')`);
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '${OWNER}'`);
  const own = await db.query(`select count(*)::int c from guests`);
  await db.exec(`set app.uid = '33333333-3333-3333-3333-333333333333'`);
  const other = await db.query(`select count(*)::int c from guests`);
  await db.exec(`reset role`);
  if (own.rows[0].c !== 2) throw new Error(`owner saw ${own.rows[0].c} guests`);
  if (other.rows[0].c !== 0) throw new Error(`stranger saw ${other.rows[0].c} guests`);
});

await check('Limits: free plan caps events at 3 (4th insert rejected)', async () => {
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '${OWNER}'`);
  let denied = false;
  try {
    await db.query(`insert into events (wedding_id,name,event_type,event_date,timezone) values ('${wedId}','Extra','custom','2026-12-13','UTC')`);
  } catch { denied = true; }
  await db.exec(`reset role`);
  if (!denied) throw new Error('event limit not enforced');
});

await check('guest_events rejects a cross-wedding guest/event pairing', async () => {
  await db.exec(`set role authenticated`);
  await db.exec(`set app.uid = '${OWNER}'`);
  const draftId = (await db.query(`select id from weddings where slug='draft-wedding'`)).rows[0].id;
  const otherEv = (await db.query(`insert into events (wedding_id,name,event_type,event_date,timezone) values ('${draftId}','Other','custom','2026-12-14','UTC') returning id`)).rows[0].id;
  let denied = false;
  try {
    await db.query(`insert into guest_events (guest_id,event_id,wedding_id) values ('${guestA}','${otherEv}','${wedId}')`);
  } catch { denied = true; }
  await db.exec(`reset role`);
  if (!denied) throw new Error('cross-wedding guest_events allowed');
});

await check('RPC: get_invitation reveals only the authorized guest events', async () => {
  await db.exec(`reset app.uid`);
  await db.exec(`set role anon`);
  const a = (await db.query(`select public.get_invitation('${tokenA}') as w`)).rows[0].w;
  const b = (await db.query(`select public.get_invitation('${tokenB}') as w`)).rows[0].w;
  await db.exec(`reset role`);
  if (!a || a.guest.name !== 'Guest A') throw new Error('guest A not resolved');
  if (!Array.isArray(a.events) || a.events.length !== 1 || a.events[0].name !== 'Mehndi') throw new Error('guest A events not filtered');
  if (a.events[0].allowed_attendees !== 2) throw new Error('allowed_attendees override missing');
  if (!b || b.guest.name !== 'Guest B' || b.events.length !== 1 || b.events[0].name !== 'Nikah') throw new Error('guest B events wrong');
  if (a.events[0].id === b.events[0].id) throw new Error('cross-guest event leak');
  if (!Array.isArray(a.sections)) throw new Error('public wedding fields missing');
  if (a.guest.email !== undefined || a.guest.phone !== undefined) throw new Error('private guest contact exposed');
});

await check('RPC: revoked/expired/invalid/unknown tokens return null', async () => {
  await db.exec(`set role anon`);
  const revoked = (await db.query(`select public.get_invitation('${revokedToken}') as w`)).rows[0].w;
  const expired = (await db.query(`select public.get_invitation('${expiredToken}') as w`)).rows[0].w;
  const invalid = (await db.query(`select public.get_invitation('short') as w`)).rows[0].w;
  const unknown = (await db.query(`select public.get_invitation('${'z'.repeat(43)}') as w`)).rows[0].w;
  await db.exec(`reset role`);
  if (revoked !== null || expired !== null || invalid !== null || unknown !== null) throw new Error('invalid token not rejected generically');
});

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);