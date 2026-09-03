-- Tour guiado del calendario del profesional (ver
-- app/dashboard/calendario-tour.tsx): se lanza solo la primera vez que el
-- profesional entra a /dashboard, mismo patrón que
-- "calendario_google_ofrecido". Verlo de nuevo más tarde (botón "¿Cómo
-- funciona?") no toca esta columna.

alter table public.profesionales
  add column calendario_tour_visto boolean not null default false;
