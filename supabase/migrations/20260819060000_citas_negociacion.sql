-- Rediseña las citas como una negociación entre cliente y profesional:
-- una cita queda "pendiente" hasta que ambas partes están de acuerdo
-- en fecha/hora (Fase 1)

alter type public.citas_estado add value 'pendiente';

create type public.citas_propuesto_por as enum (
  'cliente',
  'profesional'
);

alter table public.citas
  add column propuesto_por public.citas_propuesto_por not null default 'cliente';

alter table public.citas
  add column comentario text;

alter table public.citas
  alter column hora_fin drop not null;

alter table public.citas
  alter column estado set default 'pendiente';
