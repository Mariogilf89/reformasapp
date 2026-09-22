-- Canal mínimo de "reportar un problema": todavía no hay ninguna forma de
-- que un cliente avise si algo fue mal con una cita o un profesional. No es
-- una garantía económica (eso sería Fase 2/3 de verdad), solo un canal de
-- contacto para casos problemáticos que Mario revisa a mano por email —
-- sin panel de administración todavía.

create type public.reporte_estado as enum (
  'pendiente',
  'revisado'
);

create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  -- Ambas referencias son opcionales: un reporte puede no estar ligado a
  -- ninguna solicitud/cita concreta (p.ej. "este profesional no contesta").
  -- on delete set null en vez de cascade: si se borra la solicitud o el
  -- profesional, el reporte se conserva para que Mario no pierda el
  -- historial de incidencias.
  solicitud_id uuid references public.solicitudes (id) on delete set null,
  profesional_id uuid references public.profesionales (id) on delete set null,
  contacto text not null,
  mensaje text not null,
  estado public.reporte_estado not null default 'pendiente'
);

alter table public.reportes enable row level security;

-- Es un canal de contacto para problemas: cualquiera puede crear un
-- reporte, tenga sesión iniciada o no (el propio formulario pide el
-- contacto porque no se puede asumir que haya un usuario autenticado).
create policy "reportes_insert_publico"
  on public.reportes
  for insert
  to anon, authenticated
  with check (true);

-- A propósito no hay policy de select para anon/authenticated: de momento
-- Mario revisa los reportes a mano desde el panel de Supabase (con la
-- service role, que ignora RLS), no hay panel de administración en la app
-- todavía.
