-- ============================================================================
-- 0002_storage.sql — private bucket for RFQ attachments + access policies
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_read"   on storage.objects;
drop policy if exists "attachments_write"  on storage.objects;
drop policy if exists "attachments_modify" on storage.objects;
drop policy if exists "attachments_delete" on storage.objects;

-- Any authenticated user may read attachment files (row metadata is gated by
-- rfq_attachments RLS). Only procurement staff may upload / change them.
create policy "attachments_read" on storage.objects for select to authenticated
  using ( bucket_id = 'attachments' );

create policy "attachments_write" on storage.objects for insert to authenticated
  with check ( bucket_id = 'attachments'
    and public.current_user_role() in ('admin','procurement_officer') );

create policy "attachments_modify" on storage.objects for update to authenticated
  using ( bucket_id = 'attachments'
    and public.current_user_role() in ('admin','procurement_officer') );

create policy "attachments_delete" on storage.objects for delete to authenticated
  using ( bucket_id = 'attachments'
    and public.current_user_role() in ('admin','procurement_officer') );
