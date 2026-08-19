-- Tabla de disponibilidad semanal de un profesional (Fase 1)

create table public.disponibilidad (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  dia_semana integer not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  constraint disponibilidad_horario_valido check (hora_fin > hora_inicio)
);

alter table public.disponibilidad enable row level security;

-- Cualquier usuario autenticado puede leer la disponibilidad (el cliente
-- la necesita para reservar)
create policy "disponibilidad_select_authenticated"
  on public.disponibilidad
  for select
  to authenticated
  using (true);

-- Un profesional solo puede crear tramos de su propio perfil
create policy "disponibilidad_insert_own"
  on public.disponibilidad
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profesionales p
      where p.id = disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  );

-- Un profesional solo puede editar sus propios tramos
create policy "disponibilidad_update_own"
  on public.disponibilidad
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.profesionales p
      where p.id = disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  );

-- Un profesional solo puede borrar sus propios tramos
create policy "disponibilidad_delete_own"
  on public.disponibilidad
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  );
