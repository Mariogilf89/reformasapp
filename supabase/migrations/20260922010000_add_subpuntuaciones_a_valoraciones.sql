-- Sub-puntuaciones de valoraciones (estilo Airbnb): además de la nota
-- general (puntuacion, que se sigue guardando pero ahora se calcula como la
-- media de las 4 al crear la valoración, ver crearValoracion en
-- app/actions/valoraciones.ts), se piden 4 criterios por separado.
--
-- Se hace ahora porque todavía no hay valoraciones reales en producción
-- (comprobado con una consulta de solo lectura antes de escribir esta
-- migración), así que no hace falta backfill ni las columnas pueden quedar
-- nullable por compatibilidad con filas antiguas.

alter table public.valoraciones
  add column puntualidad integer not null check (puntualidad between 1 and 5),
  add column calidad integer not null check (calidad between 1 and 5),
  add column precio integer not null check (precio between 1 and 5),
  add column comunicacion integer not null check (comunicacion between 1 and 5);
