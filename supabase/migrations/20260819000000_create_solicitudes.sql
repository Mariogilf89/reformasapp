-- Tabla de solicitudes publicadas por clientes (Fase 1)

create type public.solicitud_estado as enum (
  'abierta',
  'cerrada'
);

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references auth.users (id) on delete cascade,
  categoria public.categoria_profesional not null,
  zona text not null default '',
  descripcion text not null default '',
  estado public.solicitud_estado not null default 'abierta',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger trg_solicitudes_actualizado_en
  before update on public.solicitudes
  for each row
  execute function public.set_actualizado_en();

alter table public.solicitudes enable row level security;

-- Un cliente solo puede ver sus propias solicitudes
create policy "solicitudes_select_own"
  on public.solicitudes
  for select
  to authenticated
  using (auth.uid() = cliente_id);

-- Un cliente solo puede crear sus propias solicitudes
create policy "solicitudes_insert_own"
  on public.solicitudes
  for insert
  to authenticated
  with check (auth.uid() = cliente_id);

-- Un cliente solo puede editar sus propias solicitudes
create policy "solicitudes_update_own"
  on public.solicitudes
  for update
  to authenticated
  using (auth.uid() = cliente_id)
  with check (auth.uid() = cliente_id);

-- Un profesional puede ver las solicitudes abiertas que coincidan con
-- alguna de las categorías de su perfil
create policy "solicitudes_select_profesional_match"
  on public.solicitudes
  for select
  to authenticated
  using (
    estado = 'abierta'
    and exists (
      select 1
      from public.profesionales p
      where p.user_id = auth.uid()
        and solicitudes.categoria = any (p.categorias)
    )
  );
