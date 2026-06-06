-- ============================================================================
-- VendorBridge — Procurement & Vendor Management ERP
-- 0001_init.sql  |  schema · helper functions · triggers · RLS · grants
-- Safe to re-run (idempotent where practical).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin create type public.user_role as enum
  ('admin','procurement_officer','manager','vendor'); exception when duplicate_object then null; end $$;

do $$ begin create type public.vendor_status as enum
  ('active','inactive','pending','blacklisted'); exception when duplicate_object then null; end $$;

do $$ begin create type public.rfq_status as enum
  ('draft','published','closed','awarded','cancelled'); exception when duplicate_object then null; end $$;

do $$ begin create type public.quotation_status as enum
  ('draft','submitted','under_review','shortlisted','accepted','rejected'); exception when duplicate_object then null; end $$;

do $$ begin create type public.approval_status as enum
  ('pending','approved','rejected'); exception when duplicate_object then null; end $$;

do $$ begin create type public.po_status as enum
  ('issued','acknowledged','fulfilled','cancelled'); exception when duplicate_object then null; end $$;

do $$ begin create type public.invoice_status as enum
  ('draft','sent','paid','overdue','cancelled'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Vendors (defined before profiles because profiles references vendors)
create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text,
  gst_number     text,
  email          text,
  phone          text,
  contact_person text,
  address        text,
  city           text,
  status         public.vendor_status not null default 'active',
  rating         numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- User profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text,
  role        public.user_role not null default 'procurement_officer',
  vendor_id   uuid references public.vendors(id) on delete set null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RFQs
create table if not exists public.rfqs (
  id          uuid primary key default gen_random_uuid(),
  rfq_number  text unique,
  title       text not null,
  description text,
  category    text,
  status      public.rfq_status not null default 'draft',
  deadline    timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.rfq_items (
  id           uuid primary key default gen_random_uuid(),
  rfq_id       uuid not null references public.rfqs(id) on delete cascade,
  product_name text not null,
  description  text,
  quantity     numeric not null default 1 check (quantity > 0),
  unit         text not null default 'unit',
  target_price numeric,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.rfq_vendors (
  id            uuid primary key default gen_random_uuid(),
  rfq_id        uuid not null references public.rfqs(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  invited_at    timestamptz not null default now(),
  has_responded boolean not null default false,
  unique (rfq_id, vendor_id)
);

create table if not exists public.rfq_attachments (
  id          uuid primary key default gen_random_uuid(),
  rfq_id      uuid not null references public.rfqs(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,
  file_size   bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Quotations
create table if not exists public.quotations (
  id               uuid primary key default gen_random_uuid(),
  quotation_number text unique,
  rfq_id           uuid not null references public.rfqs(id) on delete cascade,
  vendor_id        uuid not null references public.vendors(id) on delete cascade,
  status           public.quotation_status not null default 'submitted',
  delivery_days    int check (delivery_days >= 0),
  notes            text,
  total_amount     numeric not null default 0,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (rfq_id, vendor_id)
);

create table if not exists public.quotation_items (
  id            uuid primary key default gen_random_uuid(),
  quotation_id  uuid not null references public.quotations(id) on delete cascade,
  rfq_item_id   uuid references public.rfq_items(id) on delete set null,
  product_name  text not null,
  quantity      numeric not null default 1,
  unit_price    numeric not null default 0,
  line_total    numeric not null default 0,
  created_at    timestamptz not null default now()
);

-- Approvals
create table if not exists public.approvals (
  id            uuid primary key default gen_random_uuid(),
  rfq_id        uuid references public.rfqs(id) on delete cascade,
  quotation_id  uuid not null references public.quotations(id) on delete cascade,
  status        public.approval_status not null default 'pending',
  remarks       text,
  requested_by  uuid references auth.users(id) on delete set null,
  decided_by    uuid references auth.users(id) on delete set null,
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Purchase Orders
create table if not exists public.purchase_orders (
  id                uuid primary key default gen_random_uuid(),
  po_number         text unique,
  quotation_id      uuid references public.quotations(id) on delete set null,
  rfq_id            uuid references public.rfqs(id) on delete set null,
  vendor_id         uuid not null references public.vendors(id) on delete restrict,
  status            public.po_status not null default 'issued',
  subtotal          numeric not null default 0,
  tax_rate          numeric not null default 18,
  tax_amount        numeric not null default 0,
  total_amount      numeric not null default 0,
  expected_delivery date,
  notes             text,
  issued_by         uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.po_items (
  id           uuid primary key default gen_random_uuid(),
  po_id        uuid not null references public.purchase_orders(id) on delete cascade,
  product_name text not null,
  quantity     numeric not null default 1,
  unit_price   numeric not null default 0,
  line_total   numeric not null default 0,
  created_at   timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  po_id          uuid references public.purchase_orders(id) on delete set null,
  vendor_id      uuid not null references public.vendors(id) on delete restrict,
  status         public.invoice_status not null default 'draft',
  subtotal       numeric not null default 0,
  tax_rate       numeric not null default 18,
  tax_amount     numeric not null default 0,
  total_amount   numeric not null default 0,
  issue_date     date not null default current_date,
  due_date       date,
  sent_at        timestamptz,
  sent_to        text,
  paid_at        timestamptz,
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity    numeric not null default 1,
  unit_price  numeric not null default 0,
  line_total  numeric not null default 0,
  created_at  timestamptz not null default now()
);

-- Activity log (audit) + notifications
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  description text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  message    text,
  type       text not null default 'info',
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they bypass RLS on profiles and avoid
-- recursive policy evaluation). Each only reads data scoped to the caller.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_vendor_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select vendor_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('admin','procurement_officer','manager')
  )
$$;

create or replace function public.can_see_rfq(p_rfq uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_staff() or exists (
    select 1 from public.rfq_vendors rv
    where rv.rfq_id = p_rfq and rv.vendor_id = public.current_vendor_id()
  )
$$;

create or replace function public.can_see_quotation(p_q uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.quotations q
    where q.id = p_q and (public.is_staff() or q.vendor_id = public.current_vendor_id())
  )
$$;

create or replace function public.owns_quotation(p_q uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.quotations q
    where q.id = p_q and q.vendor_id = public.current_vendor_id()
  )
$$;

create or replace function public.can_see_invoice(p_inv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invoices i
    where i.id = p_inv and (public.is_staff() or i.vendor_id = public.current_vendor_id())
  )
$$;

create or replace function public.can_see_po(p_po uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.purchase_orders p
    where p.id = p_po and (public.is_staff() or p.vendor_id = public.current_vendor_id())
  )
$$;

-- Fan-out a notification to every user with one of the given roles. SECURITY
-- DEFINER so a vendor (who cannot read staff profiles under RLS) can still
-- notify procurement staff when submitting a quotation.
create or replace function public.notify_roles(
  p_roles public.user_role[],
  p_title text,
  p_message text default null,
  p_type text default 'info',
  p_link text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, title, message, type, link)
  select id, p_title, p_message, p_type, p_link
  from public.profiles where role = any(p_roles);
end $$;

-- ----------------------------------------------------------------------------
-- Document numbering (RFQ-2026-0001, QUO-…, PO-…, INV-…)
-- ----------------------------------------------------------------------------
create sequence if not exists public.rfq_number_seq;
create sequence if not exists public.quotation_number_seq;
create sequence if not exists public.po_number_seq;
create sequence if not exists public.invoice_number_seq;

create or replace function public.set_rfq_number() returns trigger language plpgsql as $$
begin
  if new.rfq_number is null then
    new.rfq_number := 'RFQ-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.rfq_number_seq')::text, 4, '0');
  end if; return new;
end $$;

create or replace function public.set_quotation_number() returns trigger language plpgsql as $$
begin
  if new.quotation_number is null then
    new.quotation_number := 'QUO-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.quotation_number_seq')::text, 4, '0');
  end if; return new;
end $$;

create or replace function public.set_po_number() returns trigger language plpgsql as $$
begin
  if new.po_number is null then
    new.po_number := 'PO-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.po_number_seq')::text, 4, '0');
  end if; return new;
end $$;

create or replace function public.set_invoice_number() returns trigger language plpgsql as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 4, '0');
  end if; return new;
end $$;

-- ----------------------------------------------------------------------------
-- New auth user -> profile (+ auto vendor record for vendor signups)
-- First ever user is bootstrapped as admin; role is otherwise constrained so a
-- self-signup cannot escalate to admin.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'procurement_officer');
  assigned  public.user_role;
  is_first  boolean;
  v_id      uuid;
  vname     text;
begin
  select not exists (select 1 from public.profiles) into is_first;

  if is_first then
    assigned := 'admin';
  elsif requested in ('procurement_officer','manager','vendor') then
    assigned := requested::public.user_role;
  else
    assigned := 'procurement_officer';
  end if;

  if assigned = 'vendor' then
    vname := coalesce(
      nullif(new.raw_user_meta_data ->> 'company_name',''),
      nullif(new.raw_user_meta_data ->> 'full_name',''),
      split_part(coalesce(new.email,'vendor'),'@',1)
    );
    insert into public.vendors (name, email, status, created_by, contact_person)
    values (vname, new.email, 'active', new.id, new.raw_user_meta_data ->> 'full_name')
    returning id into v_id;
  end if;

  insert into public.profiles (id, email, full_name, role, vendor_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name',''), assigned, v_id);

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from changing their own role / vendor link via update
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    new.role := old.role;
    new.vendor_id := old.vendor_id;
  end if;
  return new;
end $$;

-- When a vendor submits a quotation, mark their RFQ invitation as responded
-- (vendors cannot update rfq_vendors directly under RLS).
create or replace function public.set_rfq_responded()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.rfq_vendors
    set has_responded = true
    where rfq_id = new.rfq_id and vendor_id = new.vendor_id;
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- Attach triggers
-- ----------------------------------------------------------------------------
drop trigger if exists trg_vendors_updated   on public.vendors;
drop trigger if exists trg_profiles_updated   on public.profiles;
drop trigger if exists trg_rfqs_updated        on public.rfqs;
drop trigger if exists trg_quotations_updated  on public.quotations;
drop trigger if exists trg_approvals_updated   on public.approvals;
drop trigger if exists trg_po_updated          on public.purchase_orders;
drop trigger if exists trg_invoices_updated    on public.invoices;
drop trigger if exists trg_profiles_protect    on public.profiles;
drop trigger if exists trg_rfq_number          on public.rfqs;
drop trigger if exists trg_quotation_number    on public.quotations;
drop trigger if exists trg_po_number           on public.purchase_orders;
drop trigger if exists trg_invoice_number      on public.invoices;
drop trigger if exists trg_quotation_responded on public.quotations;

create trigger trg_vendors_updated   before update on public.vendors          for each row execute function public.set_updated_at();
create trigger trg_profiles_updated  before update on public.profiles         for each row execute function public.set_updated_at();
create trigger trg_rfqs_updated      before update on public.rfqs             for each row execute function public.set_updated_at();
create trigger trg_quotations_updated before update on public.quotations      for each row execute function public.set_updated_at();
create trigger trg_approvals_updated before update on public.approvals        for each row execute function public.set_updated_at();
create trigger trg_po_updated        before update on public.purchase_orders  for each row execute function public.set_updated_at();
create trigger trg_invoices_updated  before update on public.invoices         for each row execute function public.set_updated_at();
create trigger trg_profiles_protect  before update on public.profiles         for each row execute function public.protect_profile_fields();

create trigger trg_rfq_number        before insert on public.rfqs             for each row execute function public.set_rfq_number();
create trigger trg_quotation_number  before insert on public.quotations       for each row execute function public.set_quotation_number();
create trigger trg_po_number         before insert on public.purchase_orders  for each row execute function public.set_po_number();
create trigger trg_invoice_number    before insert on public.invoices         for each row execute function public.set_invoice_number();
create trigger trg_quotation_responded after insert on public.quotations       for each row execute function public.set_rfq_responded();

-- ----------------------------------------------------------------------------
-- Indexes (foreign keys + common filters)
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_vendor        on public.profiles(vendor_id);
create index if not exists idx_vendors_status         on public.vendors(status);
create index if not exists idx_vendors_created_by     on public.vendors(created_by);
create index if not exists idx_rfqs_status            on public.rfqs(status);
create index if not exists idx_rfqs_created_by        on public.rfqs(created_by);
create index if not exists idx_rfq_items_rfq          on public.rfq_items(rfq_id);
create index if not exists idx_rfq_vendors_rfq        on public.rfq_vendors(rfq_id);
create index if not exists idx_rfq_vendors_vendor     on public.rfq_vendors(vendor_id);
create index if not exists idx_rfq_attach_rfq         on public.rfq_attachments(rfq_id);
create index if not exists idx_quotations_rfq         on public.quotations(rfq_id);
create index if not exists idx_quotations_vendor      on public.quotations(vendor_id);
create index if not exists idx_quotations_status      on public.quotations(status);
create index if not exists idx_quotation_items_q      on public.quotation_items(quotation_id);
create index if not exists idx_approvals_quotation    on public.approvals(quotation_id);
create index if not exists idx_approvals_status       on public.approvals(status);
create index if not exists idx_po_vendor              on public.purchase_orders(vendor_id);
create index if not exists idx_po_status              on public.purchase_orders(status);
create index if not exists idx_po_items_po            on public.po_items(po_id);
create index if not exists idx_invoices_vendor        on public.invoices(vendor_id);
create index if not exists idx_invoices_po            on public.invoices(po_id);
create index if not exists idx_invoices_status        on public.invoices(status);
create index if not exists idx_invoice_items_inv      on public.invoice_items(invoice_id);
create index if not exists idx_activity_actor         on public.activity_logs(actor_id);
create index if not exists idx_activity_created       on public.activity_logs(created_at desc);
create index if not exists idx_notifications_user     on public.notifications(user_id, is_read);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.vendors          enable row level security;
alter table public.profiles         enable row level security;
alter table public.rfqs             enable row level security;
alter table public.rfq_items        enable row level security;
alter table public.rfq_vendors      enable row level security;
alter table public.rfq_attachments  enable row level security;
alter table public.quotations       enable row level security;
alter table public.quotation_items  enable row level security;
alter table public.approvals        enable row level security;
alter table public.purchase_orders  enable row level security;
alter table public.po_items         enable row level security;
alter table public.invoices         enable row level security;
alter table public.invoice_items    enable row level security;
alter table public.activity_logs    enable row level security;
alter table public.notifications    enable row level security;

-- Drop any existing public policies first so this section is re-runnable.
do $$
declare r record;
begin
  for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles -------------------------------------------------------------------
create policy "profiles_select" on public.profiles for select to authenticated
  using ( id = (select auth.uid()) or public.is_staff() );
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ( id = (select auth.uid()) ) with check ( id = (select auth.uid()) );
create policy "profiles_admin_all" on public.profiles for all to authenticated
  using ( public.current_user_role() = 'admin' )
  with check ( public.current_user_role() = 'admin' );

-- vendors --------------------------------------------------------------------
create policy "vendors_select" on public.vendors for select to authenticated
  using ( public.is_staff() or id = public.current_vendor_id() );
create policy "vendors_manage" on public.vendors for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- rfqs -----------------------------------------------------------------------
create policy "rfqs_select" on public.rfqs for select to authenticated
  using ( public.can_see_rfq(id) );
create policy "rfqs_manage" on public.rfqs for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- rfq_items ------------------------------------------------------------------
create policy "rfq_items_select" on public.rfq_items for select to authenticated
  using ( public.can_see_rfq(rfq_id) );
create policy "rfq_items_manage" on public.rfq_items for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- rfq_vendors ----------------------------------------------------------------
create policy "rfq_vendors_select" on public.rfq_vendors for select to authenticated
  using ( public.is_staff() or vendor_id = public.current_vendor_id() );
create policy "rfq_vendors_manage" on public.rfq_vendors for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- rfq_attachments ------------------------------------------------------------
create policy "rfq_attach_select" on public.rfq_attachments for select to authenticated
  using ( public.can_see_rfq(rfq_id) );
create policy "rfq_attach_manage" on public.rfq_attachments for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- quotations -----------------------------------------------------------------
create policy "quotations_select" on public.quotations for select to authenticated
  using ( public.is_staff() or vendor_id = public.current_vendor_id() );
create policy "quotations_vendor_insert" on public.quotations for insert to authenticated
  with check (
    vendor_id = public.current_vendor_id()
    and exists (
      select 1 from public.rfq_vendors rv
      where rv.rfq_id = rfq_id and rv.vendor_id = public.current_vendor_id()
    )
  );
create policy "quotations_vendor_update" on public.quotations for update to authenticated
  using ( vendor_id = public.current_vendor_id() )
  with check ( vendor_id = public.current_vendor_id() );
create policy "quotations_staff_insert" on public.quotations for insert to authenticated
  with check ( public.current_user_role() in ('admin','procurement_officer') );
create policy "quotations_staff_update" on public.quotations for update to authenticated
  using ( public.is_staff() ) with check ( public.is_staff() );
create policy "quotations_delete" on public.quotations for delete to authenticated
  using ( public.current_user_role() = 'admin' or vendor_id = public.current_vendor_id() );

-- quotation_items ------------------------------------------------------------
create policy "quotation_items_rw" on public.quotation_items for all to authenticated
  using ( public.is_staff() or public.owns_quotation(quotation_id) )
  with check ( public.is_staff() or public.owns_quotation(quotation_id) );

-- approvals ------------------------------------------------------------------
create policy "approvals_select" on public.approvals for select to authenticated
  using ( public.is_staff() );
create policy "approvals_insert" on public.approvals for insert to authenticated
  with check ( public.current_user_role() in ('admin','procurement_officer','manager') );
create policy "approvals_update" on public.approvals for update to authenticated
  using ( public.current_user_role() in ('admin','manager') )
  with check ( public.current_user_role() in ('admin','manager') );
create policy "approvals_delete" on public.approvals for delete to authenticated
  using ( public.current_user_role() = 'admin' );

-- purchase_orders ------------------------------------------------------------
create policy "po_select" on public.purchase_orders for select to authenticated
  using ( public.is_staff() or vendor_id = public.current_vendor_id() );
create policy "po_manage" on public.purchase_orders for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- po_items -------------------------------------------------------------------
create policy "po_items_select" on public.po_items for select to authenticated
  using ( public.can_see_po(po_id) );
create policy "po_items_manage" on public.po_items for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- invoices -------------------------------------------------------------------
create policy "invoices_select" on public.invoices for select to authenticated
  using ( public.is_staff() or vendor_id = public.current_vendor_id() );
create policy "invoices_manage" on public.invoices for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- invoice_items --------------------------------------------------------------
create policy "invoice_items_select" on public.invoice_items for select to authenticated
  using ( public.can_see_invoice(invoice_id) );
create policy "invoice_items_manage" on public.invoice_items for all to authenticated
  using ( public.current_user_role() in ('admin','procurement_officer') )
  with check ( public.current_user_role() in ('admin','procurement_officer') );

-- activity_logs --------------------------------------------------------------
create policy "logs_select" on public.activity_logs for select to authenticated
  using ( public.is_staff() or actor_id = (select auth.uid()) );
create policy "logs_insert" on public.activity_logs for insert to authenticated
  with check ( actor_id = (select auth.uid()) );

-- notifications --------------------------------------------------------------
-- NOTE: insert is open to any authenticated user so server actions can create
-- cross-user notifications without the service-role key. Rows are only readable
-- by their owner. Acceptable for this app; tighten with an auth hook in prod.
create policy "notif_select" on public.notifications for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "notif_insert" on public.notifications for insert to authenticated
  with check ( true );
create policy "notif_update" on public.notifications for update to authenticated
  using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
create policy "notif_delete" on public.notifications for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- ----------------------------------------------------------------------------
-- Grants (RLS still gates every row; authenticated role is used by logged-in
-- requests via the user's JWT).
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
