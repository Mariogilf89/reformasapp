-- Tabla de valoraciones de un profesional tras completar una solicitud (Fase 1)

create table public.valoraciones (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  puntuacion integer not null check (puntuacion between 1 and 5),
  comentario text,
  creado_en timestamptz not null default now(),
  constraint valoraciones_solicitud_id_key unique (solicitud_id)
);

alter table public.valoraciones enable row level security;

-- Cualquier usuario autenticado puede leer las valoraciones
create policy "valoraciones_select_authenticated"
  on public.valoraciones
  for select
  to authenticated
  using (true);

-- Solo el cliente dueño de la solicitud puede valorarla (una sola vez,
-- forzado por la restricción unique sobre solicitud_id)
create policy "valoraciones_insert_cliente_dueno"
  on public.valoraciones
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.solicitudes s
      where s.id = valoraciones.solicitud_id
        and s.cliente_id = auth.uid()
    )
  );
