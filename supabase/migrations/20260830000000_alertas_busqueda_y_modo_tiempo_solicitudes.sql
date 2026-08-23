-- Mejoras en "solicitudes disponibles" del profesional:
-- - solicitudes.modo_tiempo / solicitudes.provincia: cuándo lo necesita el
--   cliente y en qué provincia buscaba, capturados desde la búsqueda de
--   /profesionales cuando la solicitud viene de ahí (NULL si no).
-- - alertas_busqueda_trabajos: búsquedas guardadas de un profesional para
--   avisarle por email cuando entra una solicitud que encaja.

alter table public.solicitudes
  add column modo_tiempo text
    check (modo_tiempo in ('lo_antes_posible', 'indiferente', 'dia_hora')),
  add column provincia text;

create table public.alertas_busqueda_trabajos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  categoria public.categoria_profesional,
  provincia text,
  modo_tiempo text check (modo_tiempo in ('lo_antes_posible', 'indiferente', 'dia_hora')),
  creado_en timestamptz not null default now()
);

alter table public.alertas_busqueda_trabajos enable row level security;

-- Un profesional solo ve, crea y borra sus propias alertas. No hay policy
-- de update: se borran y se vuelven a crear, como excepciones_disponibilidad.
create policy "alertas_busqueda_trabajos_select_own"
  on public.alertas_busqueda_trabajos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = alertas_busqueda_trabajos.profesional_id
        and p.user_id = auth.uid()
    )
  );

create policy "alertas_busqueda_trabajos_insert_own"
  on public.alertas_busqueda_trabajos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profesionales p
      where p.id = alertas_busqueda_trabajos.profesional_id
        and p.user_id = auth.uid()
    )
  );

create policy "alertas_busqueda_trabajos_delete_own"
  on public.alertas_busqueda_trabajos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = alertas_busqueda_trabajos.profesional_id
        and p.user_id = auth.uid()
    )
  );
