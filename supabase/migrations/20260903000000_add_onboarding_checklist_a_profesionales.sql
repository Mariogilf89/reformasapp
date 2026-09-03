-- Checklist de bienvenida del dashboard del profesional (ver
-- app/actions/onboarding.ts): los pasos se derivan de datos ya existentes
-- (perfil, disponibilidad, citas, trabajos), así que lo único que hace
-- falta persistir es si el profesional lo cerró a mano, mismo patrón que
-- "calendario_google_ofrecido".

alter table public.profesionales
  add column onboarding_checklist_cerrado boolean not null default false;
