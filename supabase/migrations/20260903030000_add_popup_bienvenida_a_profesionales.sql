-- Pop-up de bienvenida (3 diapositivas) que se enseña la primera vez que
-- un profesional entra a /dashboard, antes del tour del calendario (ver
-- app/dashboard/popup-bienvenida.tsx). Mismo patrón que
-- "calendario_tour_visto": un booleano, sin distinguir "completado" de
-- "cerrado con la X" — cualquiera de los dos lo marca visto.

alter table public.profesionales
  add column popup_bienvenida_visto boolean not null default false;
