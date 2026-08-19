-- Excepciones puntuales a la disponibilidad semanal de un profesional
-- (vacaciones, bloqueos concretos), que se combinan con "disponibilidad"
-- al calcular huecos libres (Fase 1)

create table public.excepciones_disponibilidad (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  fecha date not null,
  todo_el_dia boolean not null default true,
  hora_inicio time,
  hora_fin time,
  constraint excepciones_disponibilidad_horario_valido check (
    (todo_el_dia and hora_inicio is null and hora_fin is null)
    or (not todo_el_dia and hora_inicio is not null and hora_fin is not null and hora_fin > hora_inicio)
  )
);

alter table public.excepciones_disponibilidad enable row level security;

-- Cualquier usuario autenticado puede leer las excepciones (el cliente las
-- necesita para calcular huecos libres al reservar)
create policy "excepciones_disponibilidad_select_authenticated"
  on public.excepciones_disponibilidad
  for select
  to authenticated
  using (true);

-- Un profesional solo puede crear excepciones de su propio perfil
create policy "excepciones_disponibilidad_insert_own"
  on public.excepciones_disponibilidad
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profesionales p
      where p.id = excepciones_disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  );

-- Un profesional solo puede borrar sus propias excepciones
create policy "excepciones_disponibilidad_delete_own"
  on public.excepciones_disponibilidad
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = excepciones_disponibilidad.profesional_id
        and p.user_id = auth.uid()
    )
  );
