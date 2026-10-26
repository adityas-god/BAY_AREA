create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.sops (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  title text not null,
  kind text not null default 'link' check (kind in ('link','note')),
  url text,
  content text,
  created_at timestamptz not null default now()
);

create index idx_categories_team on public.categories(team_id);
create index idx_sops_team on public.sops(team_id);
create index idx_sops_category on public.sops(category_id);

grant select, insert, update, delete on public.teams to anon, authenticated;
grant select, insert, update, delete on public.categories to anon, authenticated;
grant select, insert, update, delete on public.sops to anon, authenticated;
grant all on public.teams to service_role;
grant all on public.categories to service_role;
grant all on public.sops to service_role;

alter table public.teams enable row level security;
alter table public.categories enable row level security;
alter table public.sops enable row level security;

create policy "Public teams access" on public.teams for all to anon, authenticated using (true) with check (true);
create policy "Public categories access" on public.categories for all to anon, authenticated using (true) with check (true);
create policy "Public sops access" on public.sops for all to anon, authenticated using (true) with check (true);