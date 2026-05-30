# PathWay Global

Static marketing site for PathWay Global, focused on university and scholarship consulting for students in Uzbekistan and Central Asia applying abroad.

## Stack

- Plain HTML, CSS, and vanilla JS
- Supabase for auth + live content storage
- Netlify for static hosting

## Supabase setup

### 1) Authentication settings

In Supabase Dashboard:

- Go to **Authentication → Providers → Email**
- Make sure **Confirm email** is **ON**
- After deployment, go to **Authentication → URL Configuration** and set:
  - **Site URL** = your final Netlify URL
  - **Redirect URLs** = add your final Netlify URL and the exact page URL if needed

### 2) SQL to run in Supabase SQL Editor

```sql
create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_content enable row level security;

create policy "site_content read"
on public.site_content
for select
using (true);

create policy "site_content write"
on public.site_content
for all
using (
  auth.jwt() ->> 'email' in ('mamurjonqalandarov8@gmail.com','mamurjonqalandarov40@gmail.com')
)
with check (
  auth.jwt() ->> 'email' in ('mamurjonqalandarov8@gmail.com','mamurjonqalandarov40@gmail.com')
);
```

### 3) Realtime

In Supabase Dashboard:

- Go to **Database → Replication** or **Realtime**
- Enable realtime for `public.site_content`

## Netlify deploy

### Option A: Netlify CLI

If you already have Netlify CLI installed and authenticated:

```bash
npx netlify-cli deploy --prod --dir .
```

### Option B: Manual drag-and-drop

1. Open https://app.netlify.com/drop
2. Drag the entire project folder or a ZIP of this folder
3. Wait for deploy
4. Copy the generated `*.netlify.app` URL
5. Put that URL into Supabase:
   - Authentication → URL Configuration → Site URL
   - Authentication → URL Configuration → Redirect URLs
6. Replace the `og:url` placeholder in `index.html`

## Notes

- Only the publishable Supabase key is used in the client site.
- The Supabase secret/service-role key must never be added to this repo or shipped to the browser.
- Content edits are stored in Supabase and mirrored into localStorage as offline cache.
