-- Tabla de citas reservadas por un cliente con un profesional (Fase 1)

create type public.citas_tipo as enum (
  'visita',
  'trabajo'
);

create type public.citas_estado as enum (
  'confirmada',
  'cancelada'
);

create table public.citas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  cliente_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  tipo public.citas_tipo not null,
  estado public.citas_estado not null default 'confirmada',
  creado_en timestamptz not null default now(),
  constraint citas_horario_valido check (hora_fin > hora_inicio)
);

alter table public.citas enable row level security;

-- El cliente dueño de la cita o el profesional de la cita pueden verla
create policy "citas_select_participantes"
  on public.citas
  for select
  to authenticated
  using (
    cliente_id = auth.uid()
    or exists (
      select 1
      from public.profesionales p
      where p.id = citas.profesional_id
        and p.user_id = auth.uid()
    )
  );

-- Solo el cliente dueño de la solicitud puede insertar citas asociadas a ella
create policy "citas_insert_cliente_dueno"
  on public.citas
  for insert
  to authenticated
  with check (
    cliente_id = auth.uid()
    and exists (
      select 1
      from public.solicitudes s
      where s.id = citas.solicitud_id
        and s.cliente_id = auth.uid()
    )
  );

-- El cliente dueño o el profesional de la cita pueden cambiar su estado
-- (la aplicación solo permite pasar a "cancelada"; nadie puede borrarla,
-- no hay política de delete)
create policy "citas_update_participantes"
  on public.citas
  for update
  to authenticated
  using (
    cliente_id = auth.uid()
    or exists (
      select 1
      from public.profesionales p
      where p.id = citas.profesional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    cliente_id = auth.uid()
    or exists (
      select 1
      from public.profesionales p
      where p.id = citas.profesional_id
        and p.user_id = auth.uid()
    )
  );
