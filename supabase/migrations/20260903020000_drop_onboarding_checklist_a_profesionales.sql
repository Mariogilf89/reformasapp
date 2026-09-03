-- Se quita el checklist de bienvenida del dashboard del profesional (solo
-- queda el tour guiado del calendario, ver calendario_tour_visto). La
-- columna deja de usarse por completo.
--
-- "if exists" a propósito: esta migración se añade justo después de
-- add_onboarding_checklist_a_profesionales (20260903000000) en el mismo
-- desarrollo, así que puede que esa migración anterior nunca se llegara a
-- aplicar contra Supabase — este drop no debe fallar en ese caso.

alter table public.profesionales
  drop column if exists onboarding_checklist_cerrado;
