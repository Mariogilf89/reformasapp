-- Directorio público de profesionales (accesible sin sesión iniciada).
--
-- En vez de abrir "profesionales_select_authenticated" al rol anon (lo que
-- expondría columnas sensibles como documento_identidad_url a cualquiera en
-- internet), se crea una vista con solo las columnas públicas. Al no llevar
-- "security_invoker", la vista se evalúa con los privilegios de su dueño
-- (el rol que aplica las migraciones, dueño también de la tabla), que
-- ignora RLS por ser el propietario — así no hace falta tocar las políticas
-- de la tabla base.
create view public.profesionales_publico as
select
  id,
  nombre,
  categorias,
  zona,
  descripcion,
  fotos,
  verificado,
  creado_en
from public.profesionales;

grant select on public.profesionales_publico to anon, authenticated;

-- Las valoraciones no tienen columnas sensibles (no guardan la identidad del
-- cliente), así que se abren directamente a anon para mostrarlas en el
-- perfil público del profesional.
create policy "valoraciones_select_anon" on public.valoraciones
  for select to anon using (true);
