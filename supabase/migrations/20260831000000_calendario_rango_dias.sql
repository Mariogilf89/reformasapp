-- Rango de días visibles en el calendario del profesional, configurable
-- igual que el rango de horas (calendario_hora_inicio/calendario_hora_fin).
--
-- Numeración ISO (1=lunes ... 7=domingo). Coincide con disponibilidad.dia_semana
-- en lunes-sábado (1-6), pero difiere en domingo: disponibilidad usa el
-- criterio de Date.getDay() (domingo=0), mientras que aquí domingo=7 para
-- que un rango lunes->domingo se pueda comparar con inicio<=fin sin casos
-- especiales.

alter table public.profesionales
  add column calendario_dia_inicio smallint not null default 1,
  add column calendario_dia_fin smallint not null default 7;

alter table public.profesionales
  add constraint profesionales_rango_dias_valido check (
    calendario_dia_inicio >= 1
    and calendario_dia_inicio <= 7
    and calendario_dia_fin >= 1
    and calendario_dia_fin <= 7
    and calendario_dia_fin >= calendario_dia_inicio
  );
