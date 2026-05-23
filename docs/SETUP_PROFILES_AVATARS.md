# Setup: profiles table and avatars bucket

One-time setup that has to be applied to the Supabase project before the
profile photo feature works. Apply via the Supabase Dashboard (SQL editor +
Storage section). Once applied, every new signup gets a `profiles` row
automatically, and the mobile app can upload avatars to the `avatars` bucket.

> Long term this SQL should live as a versioned migration in `forward-infra`.
> For now we apply it manually so it can be reviewed before hitting prod.

## 1. Create the `profiles` table and signup trigger

Run this in the Supabase SQL editor:

```sql
-- Table: one row per authenticated user, keyed by auth.users.id
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  dealer_id text,
  updated_at timestamptz default now()
);

-- RLS: users can read every profile (avatars are public)
-- but can only update their own row.
alter table public.profiles enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users that do not yet have a profile row.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data->>'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
```

## 2. Create the `avatars` storage bucket

In the Supabase Dashboard:

1. Storage → New bucket
2. Name: `avatars`
3. **Public bucket**: ON (avatars are read by anyone with the URL)
4. File size limit: 2 MB (optional but recommended)
5. Allowed MIME types: `image/jpeg, image/png, image/webp` (optional)

## 3. Apply storage policies

After creating the bucket, run this SQL to allow authenticated users to
upload only into their own folder:

```sql
-- Anyone (signed in or not) can read avatars — bucket is public read by config.
-- Only authenticated users can write, and only into their own user-id folder.

create policy "avatars are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "users can upload into their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 4. Verify

After applying both blocks:

- Open SQL editor and run `select * from public.profiles limit 1;` — should not error.
- Storage → `avatars` bucket should be visible and marked Public.
- Sign in via the mobile app and try uploading an avatar from the Profile
  screen. The file should appear under `avatars/<your-user-id>/avatar.jpg`
  and the public URL should render in the avatar circle.

## Notes

- `avatar_url` stored in `profiles` is the **public URL plus a cache-buster**
  (e.g. `https://<proj>.supabase.co/storage/v1/object/public/avatars/<id>/avatar.jpg?v=1700000000`).
  The cache buster forces the device CDN to re-fetch on upload — otherwise
  the same URL stays cached and the new photo does not show until reinstall.
- The `dealer_id` column is reserved for the upcoming dealer-selection
  onboarding flow. Safe to leave NULL for now.
