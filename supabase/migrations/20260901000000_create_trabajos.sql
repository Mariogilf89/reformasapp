-- Tabla de "Mis trabajos": trabajos realizados que el profesional añade a
-- modo de portafolio. Cada trabajo tiene hasta 5 fotos (MAX_FOTOS_TRABAJO en
-- lib/profesionales.ts), guardadas como jsonb {url, descripcion} en vez de en
-- una tabla aparte porque siempre se leen/escriben juntas como una unidad.

create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  titulo text not null,
  categoria public.categoria_profesional not null,
  fotos jsonb not null default '[]',
  creado_en timestamptz not null default now()
);

alter table public.trabajos enable row level security;

-- Cualquier usuario autenticado puede ver los trabajos (portafolio visible
-- para clientes que estén evaluando a un profesional)
create policy "trabajos_select_authenticated"
  on public.trabajos
  for select
  to authenticated
  using (true);

-- Un profesional solo puede crear trabajos de su propio perfil
create policy "trabajos_insert_own"
  on public.trabajos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profesionales p
      where p.id = trabajos.profesional_id
        and p.user_id = auth.uid()
    )
  );

-- Un profesional solo puede borrar sus propios trabajos
create policy "trabajos_delete_own"
  on public.trabajos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profesionales p
      where p.id = trabajos.profesional_id
        and p.user_id = auth.uid()
    )
  );
