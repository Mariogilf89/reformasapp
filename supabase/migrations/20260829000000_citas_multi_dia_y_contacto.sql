-- Cuarta tanda del calendario del profesional:
-- - fecha_fin: citas externas de varios días (NULL = un solo día = fecha).
-- - contacto_nombre / contacto_telefono: datos de contacto opcionales de un
--   bloqueo externo (por ejemplo, el cliente del trabajo fuera de la app).

alter table public.citas add column fecha_fin date;
alter table public.citas add column contacto_nombre text;
alter table public.citas add column contacto_telefono text;
