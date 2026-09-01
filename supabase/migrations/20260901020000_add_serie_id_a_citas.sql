-- Identificador compartido por todas las filas que genera crearCitaExterna
-- al crear una cita externa "que se repite" (un día de la semana en un
-- rango de fechas), para poder aplicar ediciones/cancelaciones a toda la
-- serie de una vez en vez de fila a fila.
--
-- Nullable y sin backfill: las citas individuales, y también las series
-- creadas antes de este cambio (no había forma de agruparlas), se quedan
-- con serie_id = null — se tratan como "solo esta cita" sin más.

alter table public.citas add column serie_id uuid;
