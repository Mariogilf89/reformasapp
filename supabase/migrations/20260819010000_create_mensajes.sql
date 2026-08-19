-- Tabla de mensajes del hilo de una solicitud (Fase 1)

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  remitente_id uuid not null references auth.users (id) on delete cascade,
  texto text not null,
  creado_en timestamptz not null default now()
);

alter table public.mensajes enable row level security;

-- El cliente dueño de la solicitud puede leer sus mensajes
create policy "mensajes_select_cliente_dueno"
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.solicitudes s
      where s.id = mensajes.solicitud_id
        and s.cliente_id = auth.uid()
    )
  );

-- Un profesional puede leer los mensajes de solicitudes que coincidan
-- con alguna de las categorías de su perfil
create policy "mensajes_select_profesional_match"
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.solicitudes s
      join public.profesionales p on p.user_id = auth.uid()
      where s.id = mensajes.solicitud_id
        and s.categoria = any (p.categorias)
    )
  );

-- El cliente dueño de la solicitud puede escribir mensajes en ella
create policy "mensajes_insert_cliente_dueno"
  on public.mensajes
  for insert
  to authenticated
  with check (
    remitente_id = auth.uid()
    and exists (
      select 1
      from public.solicitudes s
      where s.id = mensajes.solicitud_id
        and s.cliente_id = auth.uid()
    )
  );

-- Un profesional puede escribir mensajes en solicitudes que coincidan
-- con alguna de las categorías de su perfil
create policy "mensajes_insert_profesional_match"
  on public.mensajes
  for insert
  to authenticated
  with check (
    remitente_id = auth.uid()
    and exists (
      select 1
      from public.solicitudes s
      join public.profesionales p on p.user_id = auth.uid()
      where s.id = mensajes.solicitud_id
        and s.categoria = any (p.categorias)
    )
  );
