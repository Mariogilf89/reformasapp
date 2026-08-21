-- URLs públicas de las fotos subidas por el profesional (bucket fotos-profesionales).

alter table public.profesionales
  add column fotos text[] not null default '{}';
