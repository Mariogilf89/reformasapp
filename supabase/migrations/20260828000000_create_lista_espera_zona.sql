-- Lista de espera para zonas/categorías sin profesionales todavía (home y
-- /profesionales cuando una búsqueda no da resultados). Esta tabla ya se
-- creó manualmente en producción con este mismo SQL; aquí queda documentada
-- como el resto de migraciones.

create table public.lista_espera_zona (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  provincia text,
  categoria text,
  creado_en timestamptz not null default now()
);

alter table public.lista_espera_zona enable row level security;

-- Formulario público sin sesión: cualquiera (anon o autenticado) puede
-- apuntarse. No hay política de select/update/delete: solo se lee con la
-- service role, nunca desde el cliente.
create policy "lista_espera_zona_insert_publico"
  on public.lista_espera_zona
  for insert
  to anon, authenticated
  with check (true);
