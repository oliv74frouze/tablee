-- =====================================================================
--  Tablée — structure de la base et règles de sécurité (Supabase)
--  À coller en entier dans Supabase › SQL Editor › New query, puis « Run ».
--  Le script peut être relancé sans risque : il ne supprime aucune donnée.
-- =====================================================================

-- ---------- Profils (prénom affiché) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 40),
  created_at timestamptz not null default now()
);
-- Petite photo de profil (chemin dans le stockage « avatars »), ajoutée le 23 nov.
alter table public.profiles add column if not exists avatar text not null default '' check (char_length(avatar) <= 200);

-- Création automatique du profil à l'inscription (prénom saisi dans le formulaire).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'name', ''), 40))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tribus et membres ----------
create table if not exists public.tribes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.members (
  tribe_id  uuid not null references public.tribes(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (tribe_id, user_id)
);
create index if not exists members_user_idx on public.members(user_id);

-- Vrai si l'utilisateur connecté fait partie de la tribu (utilisé par toutes les règles).
create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where tribe_id = t and user_id = auth.uid());
$$;

-- Vrai si l'utilisateur connecté partage au moins une tribu avec u (pour voir son prénom).
create or replace function public.shares_tribe(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members a join public.members b on a.tribe_id = b.tribe_id
    where a.user_id = auth.uid() and b.user_id = u);
$$;

-- Créer une tribu (le créateur en devient administrateur).
create or replace function public.create_tribe(tribe_name text) returns public.tribes
language plpgsql security definer set search_path = public as $$
declare t public.tribes;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.tribes (name, created_by) values (left(trim(tribe_name), 60), auth.uid()) returning * into t;
  insert into public.members (tribe_id, user_id, role) values (t.id, auth.uid(), 'admin');
  return t;
end $$;

-- Rejoindre une tribu avec son code d'invitation.
create or replace function public.join_tribe(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into t from public.tribes where invite_code = code;
  if t is null then raise exception 'invalid_code'; end if;
  insert into public.members (tribe_id, user_id) values (t, auth.uid()) on conflict do nothing;
  return t;
end $$;

-- Nouveau lien d'invitation (l'ancien cesse de marcher). Réservé aux administrateurs.
create or replace function public.reset_invite(t uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not exists (select 1 from public.members where tribe_id = t and user_id = auth.uid() and role = 'admin')
    then raise exception 'not_admin'; end if;
  update public.tribes set invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16) where id = t returning invite_code into c;
  return c;
end $$;

-- ---------- Posts (plats, cocktails, trouvailles, refaits, versions à sa sauce) ----------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  tribe_id    uuid not null references public.tribes(id) on delete cascade,
  author      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind        text not null default 'plat' check (kind in ('plat', 'boisson', 'trouvaille')),
  name        text not null check (char_length(name) between 1 and 80),
  descr       text not null default '' check (char_length(descr) <= 200),
  source      text not null default '' check (char_length(source) <= 120),
  photos      text[] not null default '{}' check (cardinality(photos) <= 3),
  portions    int,
  minutes     int,
  ingredients text[] not null default '{}' check (cardinality(ingredients) <= 40),
  steps       text[] not null default '{}' check (cardinality(steps) <= 40),
  diff        int not null default 0 check (diff between 0 and 5),
  tools       text[] not null default '{}',
  maker       text not null default '',
  style       text not null default '',
  abv         numeric,
  where_buy   text not null default '',
  twist       text not null default '' check (char_length(twist) <= 140),
  remake_of   uuid references public.posts(id) on delete set null,
  root_id     uuid not null,
  from_twist  uuid references public.posts(id) on delete set null,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);
create index if not exists posts_tribe_idx on public.posts(tribe_id, created_at desc);
create index if not exists posts_root_idx  on public.posts(root_id);

-- ---------- Commentaires ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  tribe_id   uuid not null references public.tribes(id) on delete cascade,
  author     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id, created_at);

-- ---------- « J'ai envie de la faire » ----------
create table if not exists public.wants (
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  tribe_id   uuid not null references public.tribes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists wants_tribe_idx on public.wants(tribe_id);

-- ---------- Données privées : liste de courses et « Ma cuisine » ----------
create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  cart    jsonb not null default '[]',
  kitchen text[] not null default '{}'
);

-- ---------- Compteur d'utilisation de l'IA (écrit seulement par la fonction serveur) ----------
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  month   text not null,
  n       int not null default 0,
  primary key (user_id, month)
);

-- Compte une utilisation de l'IA pour la personne connectée et renvoie le total du mois (appelé par la fonction « ai »).
create or replace function public.ai_use() returns int
language plpgsql security definer set search_path = public as $$
declare k int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.ai_usage (user_id, month, n) values (auth.uid(), to_char(now(), 'YYYY-MM'), 1)
  on conflict (user_id, month) do update set n = public.ai_usage.n + 1 returning n into k;
  return k;
end $$;

-- =====================================================================
--  Règles d'accès (Row Level Security)
-- =====================================================================
alter table public.profiles  enable row level security;
alter table public.tribes    enable row level security;
alter table public.members   enable row level security;
alter table public.posts     enable row level security;
alter table public.comments  enable row level security;
alter table public.wants     enable row level security;
alter table public.user_data enable row level security;
alter table public.ai_usage  enable row level security;   -- aucune règle : invisible depuis l'appli

-- Profils : je vois le mien et ceux des membres de mes tribus ; je ne modifie que le mien.
drop policy if exists "profils lisibles" on public.profiles;
create policy "profils lisibles" on public.profiles for select using (id = auth.uid() or public.shares_tribe(id));
drop policy if exists "mon profil" on public.profiles;
create policy "mon profil" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Tribus : visibles par leurs membres ; renommées par un administrateur. Création via create_tribe().
drop policy if exists "tribus des membres" on public.tribes;
create policy "tribus des membres" on public.tribes for select using (public.is_member(id));
drop policy if exists "renommer sa tribu" on public.tribes;
create policy "renommer sa tribu" on public.tribes for update
  using (exists (select 1 from public.members m where m.tribe_id = id and m.user_id = auth.uid() and m.role = 'admin'));

-- Membres : visibles dans la tribu ; on peut quitter une tribu. Entrée via join_tribe().
drop policy if exists "membres visibles" on public.members;
create policy "membres visibles" on public.members for select using (public.is_member(tribe_id));
drop policy if exists "quitter" on public.members;
create policy "quitter" on public.members for delete using (user_id = auth.uid());

-- Posts : lus par la tribu ; publiés par un membre en son nom ; modifiés et supprimés par leur auteur seulement.
drop policy if exists "posts lus" on public.posts;
create policy "posts lus" on public.posts for select using (public.is_member(tribe_id));
drop policy if exists "posts publiés" on public.posts;
create policy "posts publiés" on public.posts for insert with check (author = auth.uid() and public.is_member(tribe_id));
drop policy if exists "posts modifiés" on public.posts;
create policy "posts modifiés" on public.posts for update using (author = auth.uid()) with check (author = auth.uid() and public.is_member(tribe_id));
drop policy if exists "posts supprimés" on public.posts;
create policy "posts supprimés" on public.posts for delete using (author = auth.uid());

-- Commentaires : même logique.
drop policy if exists "commentaires lus" on public.comments;
create policy "commentaires lus" on public.comments for select using (public.is_member(tribe_id));
drop policy if exists "commentaires écrits" on public.comments;
create policy "commentaires écrits" on public.comments for insert with check (author = auth.uid() and public.is_member(tribe_id));
drop policy if exists "commentaires supprimés" on public.comments;
create policy "commentaires supprimés" on public.comments for delete using (author = auth.uid());

-- Envies : visibles par la tribu ; chacun gère les siennes.
drop policy if exists "envies lues" on public.wants;
create policy "envies lues" on public.wants for select using (public.is_member(tribe_id));
drop policy if exists "envies ajoutées" on public.wants;
create policy "envies ajoutées" on public.wants for insert with check (user_id = auth.uid() and public.is_member(tribe_id));
drop policy if exists "envies retirées" on public.wants;
create policy "envies retirées" on public.wants for delete using (user_id = auth.uid());

-- Données privées : moi seul.
drop policy if exists "mes données" on public.user_data;
create policy "mes données" on public.user_data for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
--  Droits d'accès de l'application (nécessaires sur les projets Supabase récents,
--  qui n'ouvrent plus automatiquement les nouvelles tables). Les règles ci-dessus
--  continuent de filtrer ce que chacun peut voir ou modifier.
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.tribes, public.members, public.posts, public.comments, public.wants to authenticated;
grant update (name, avatar) on public.profiles to authenticated;
grant update (name) on public.tribes to authenticated;
grant delete on public.members to authenticated;
grant insert, update, delete on public.posts, public.comments to authenticated;
grant insert, delete on public.wants to authenticated;
grant select, insert, update on public.user_data to authenticated;
revoke all on public.ai_usage from anon, authenticated;
grant execute on function public.create_tribe(text), public.join_tribe(text), public.reset_invite(uuid), public.ai_use(), public.is_member(uuid), public.shares_tribe(uuid) to authenticated;

-- =====================================================================
--  Photos : stockage privé, rangé par tribu (« <tribu>/<post>/<fichier>.jpg »)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos lues par la tribu" on storage.objects;
create policy "photos lues par la tribu" on storage.objects for select
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "photos ajoutées par un membre" on storage.objects;
create policy "photos ajoutées par un membre" on storage.objects for insert
  with check (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "photos supprimées par leur auteur" on storage.objects;
create policy "photos supprimées par leur auteur" on storage.objects for delete
  using (bucket_id = 'photos' and owner = auth.uid());

-- =====================================================================
--  Photos de profil : stockage privé « avatars/<personne>/<fichier>.jpg »,
--  visibles seulement par les membres de ses tribus.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatars lus par la tribu" on storage.objects;
create policy "avatars lus par la tribu" on storage.objects for select
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.shares_tribe(((storage.foldername(name))[1])::uuid)));
drop policy if exists "mon avatar ajouté" on storage.objects;
create policy "mon avatar ajouté" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "mon avatar supprimé" on storage.objects;
create policy "mon avatar supprimé" on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());

-- =====================================================================
--  Notifications sur le téléphone (ajouté le 23 nov.)
--  Un abonnement par appareil ; la fonction « push » envoie un message aux autres
--  membres de la tribu quand quelqu'un publie.
-- =====================================================================
alter table public.posts add column if not exists notified_at timestamptz;
create table if not exists public.push_subs (
  endpoint   text primary key check (char_length(endpoint) < 1000),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  p256dh     text not null check (char_length(p256dh) < 200),
  auth       text not null check (char_length(auth) < 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subs(user_id);
alter table public.push_subs enable row level security;
drop policy if exists "mes appareils" on public.push_subs;
create policy "mes appareils" on public.push_subs for select using (user_id = auth.uid());
revoke all on public.push_subs from anon, authenticated;
grant select on public.push_subs to authenticated;

-- Enregistrer / retirer l'appareil de la personne connectée (un téléphone peut changer de compte).
create or replace function public.save_push_sub(ep text, k text, a text) returns void
language sql security definer set search_path = public as $$
  insert into public.push_subs (endpoint, user_id, p256dh, auth) values (ep, auth.uid(), k, a)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
$$;
create or replace function public.drop_push_sub(ep text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_subs where endpoint = ep and user_id = auth.uid();
$$;
revoke execute on function public.save_push_sub(text, text, text), public.drop_push_sub(text) from public, anon;
grant execute on function public.save_push_sub(text, text, text), public.drop_push_sub(text) to authenticated;

-- Clés de l'appli pour les notifications (créées par la fonction « push ») : illisibles depuis l'appli.
create table if not exists public.app_keys (name text primary key, value text not null);
alter table public.app_keys enable row level security;
revoke all on public.app_keys from anon, authenticated;
-- La fonction « push » agit avec le rôle de service de Supabase : elle doit pouvoir lire et écrire ces tables.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;

-- =====================================================================
--  Temps réel : le fil se met à jour tout seul
-- =====================================================================
do $$ begin
  begin alter publication supabase_realtime add table public.posts;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.wants;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
end $$;
