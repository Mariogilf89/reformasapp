-- Tabla de referencia (código postal -> municipio/provincia) para el
-- autocompletado de ciudad en el formulario corto de contacto de clientes.
-- Se rellena aparte con datos reales del INE (~11.000 filas), no en esta
-- migración: mantenerla fuera del .sql evita un archivo enorme y poco
-- revisable. Lectura pública porque se consulta antes de que exista
-- ninguna sesión (un visitante escribiendo su CP todavía no tiene cuenta).

create table public.codigos_postales (
  cp text primary key,
  municipio text not null,
  provincia text not null
);

alter table public.codigos_postales enable row level security;

create policy "codigos_postales_select_publico"
  on public.codigos_postales
  for select
  to anon, authenticated
  using (true);
