-- Auto-confirm emails for new users during signup to bypass Supabase's email confirmation requirement.
create or replace function public.auto_confirm_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  new.confirmed_at := coalesce(new.confirmed_at, now());
  return new;
end $$;

drop trigger if exists on_auth_user_signup on auth.users;
create trigger on_auth_user_signup
  before insert on auth.users
  for each row execute function public.auto_confirm_email();
