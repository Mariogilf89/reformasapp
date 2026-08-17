-- Tabla de perfiles de profesionales (Fase 1, sin fotos todavía)

create type public.categoria_profesional as enum (
  'pintura',
  'electricidad',
  'fontaneria',
  'carpinteria',
  'otros'
);

create table public.profesionales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  categorias public.categoria_profesional[] not null default '{}',
  zona text not null default '',
  descripcion text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint profesionales_user_id_key unique (user_id)
);

create function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger trg_profesionales_actualizado_en
  before update on public.profesionales
  for each row
  execute function public.set_actualizado_en();

alter table public.profesionales enable row level security;

-- Cualquier usuario autenticado puede ver todos los perfiles de profesionales
create policy "profesionales_select_authenticated"
  on public.profesionales
  for select
  to authenticated
  using (true);

-- Un profesional solo puede crear su propio perfil
create policy "profesionales_insert_own"
  on public.profesionales
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Un profesional solo puede editar su propio perfil
create policy "profesionales_update_own"
  on public.profesionales
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
