-- Schéma Supabase pour la collecte des commandes et le stockage de fichiers

-- 1) Table orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  service text not null,
  budget numeric not null check (budget >= 0),
  details text,
  file_path text,
  file_public_url text
);

-- 2) RLS
alter table public.orders enable row level security;

-- Règle: tout le monde peut insérer (site public). Ajustez si vous avez un proxy.
drop policy if exists insert_orders_public on public.orders;
create policy insert_orders_public on public.orders
  for insert to anon, authenticated
  with check (true);

-- Règle: lecture restreinte (désactivée par défaut). N'activez que si besoin dashboard admin.
drop policy if exists select_orders_admin on public.orders;
-- create policy select_orders_admin on public.orders
--   for select to authenticated
--   using (auth.role() = 'authenticated');

-- 3) Bucket Storage (à créer dans l'UI ou via RPC)
-- Créez un bucket public nommé 'orders' dans Supabase Storage et activez les politiques publiques de lecture.
-- Exemple de politique de lecture publique (UI Storage Policies):
--   (bucket_id = 'orders') AND (request.method = 'GET')
-- Exemple de politique d'upload (via clé anon) si souhaité:
--   (bucket_id = 'orders') AND (request.method = 'POST')


