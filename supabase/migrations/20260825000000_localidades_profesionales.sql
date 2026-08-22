-- Localidades donde trabaja el profesional (búsqueda estructurada del
-- cliente por zona, además del campo "zona" libre existente).

alter table public.profesionales
  add column localidades text[] not null default '{}';

create or replace view public.profesionales_publico as
select
  id, nombre, categorias, zona, descripcion, fotos, verificado, localidades, creado_en
from public.profesionales;

grant select on public.profesionales_publico to anon, authenticated;
