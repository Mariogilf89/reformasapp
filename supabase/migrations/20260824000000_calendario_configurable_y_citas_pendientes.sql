-- Rango horario del calendario configurable por profesional, y citas
-- externas "pendientes de agendar" (sin fecha/hora todavía, se guardan
-- desde el panel lateral y se colocan más tarde arrastrándolas al hueco).

alter table public.profesionales
  add column calendario_hora_inicio smallint not null default 8,
  add column calendario_hora_fin smallint not null default 20;

alter table public.profesionales
  add constraint profesionales_rango_horario_valido check (
    calendario_hora_inicio >= 0
    and calendario_hora_inicio <= 23
    and calendario_hora_fin >= 1
    and calendario_hora_fin <= 24
    and calendario_hora_fin > calendario_hora_inicio
  );

alter table public.citas alter column fecha drop not null;
alter table public.citas alter column hora_inicio drop not null;

alter table public.citas drop constraint citas_normal_o_externa;

alter table public.citas
  add constraint citas_normal_o_externa check (
    (
      origen_externo = false
      and cliente_id is not null
      and solicitud_id is not null
      and tipo is not null
      and titulo_externo is null
      and fecha is not null
      and hora_inicio is not null
    )
    or
    (
      origen_externo = true
      and cliente_id is null
      and solicitud_id is null
      and tipo is null
      and titulo_externo is not null
      and (
        (fecha is not null and hora_inicio is not null)
        or
        (fecha is null and hora_inicio is null and hora_fin is null)
      )
    )
  );
