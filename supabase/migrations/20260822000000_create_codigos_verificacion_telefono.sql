-- Códigos de verificación de teléfono (SMS de un solo uso, caducan a los
-- 10 minutos). El teléfono y el flag telefono_verificado en sí se guardan
-- en user_metadata, no en esta tabla.

create table public.codigos_verificacion_telefono (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  codigo text not null,
  expira_en timestamptz not null,
  creado_en timestamptz not null default now()
);

alter table public.codigos_verificacion_telefono enable row level security;

create policy "codigos_verificacion_telefono_select_propio"
  on public.codigos_verificacion_telefono for select to authenticated
  using (user_id = auth.uid());

create policy "codigos_verificacion_telefono_insert_propio"
  on public.codigos_verificacion_telefono for insert to authenticated
  with check (user_id = auth.uid());

create policy "codigos_verificacion_telefono_delete_propio"
  on public.codigos_verificacion_telefono for delete to authenticated
  using (user_id = auth.uid());
