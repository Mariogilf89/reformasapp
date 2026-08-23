-- Color personalizable (código hex) para bloqueos externos del calendario.
-- NULL = sin color asignado, se sigue pintando con el gris fijo actual.

alter table public.citas add column color text;
