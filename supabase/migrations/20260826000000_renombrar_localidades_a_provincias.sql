-- profesionales.localidades pasa a llamarse provincias: ahora es una
-- selección de provincias de España en vez de municipios sueltos.

alter table public.profesionales rename column localidades to provincias;

create or replace view public.profesionales_publico as
select
  id, nombre, categorias, zona, descripcion, fotos, verificado, provincias, creado_en
from public.profesionales;

grant select on public.profesionales_publico to anon, authenticated;
