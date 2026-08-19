-- Función de solo lectura que expone la ocupación (fecha/horas/estado) de
-- las citas de un profesional, sin datos sensibles del cliente ni
-- comentarios. Se usa "security definer" para poder calcular huecos
-- libres de un profesional aunque las políticas RLS de "citas" solo
-- dejan ver a cada usuario sus propias citas como cliente o profesional
-- (necesario para que un cliente nuevo vea si otro cliente ya ocupó un
-- hueco con ese profesional) (Fase 1)

create or replace function public.citas_ocupacion_profesional(
  p_profesional_id uuid,
  p_desde date,
  p_hasta date
)
returns table (
  id uuid,
  fecha date,
  hora_inicio time,
  hora_fin time,
  estado public.citas_estado
)
language sql
security definer
set search_path = public
stable
as $$
  select id, fecha, hora_inicio, hora_fin, estado
  from public.citas
  where profesional_id = p_profesional_id
    and estado in ('pendiente', 'confirmada')
    and fecha between p_desde and p_hasta;
$$;

grant execute on function public.citas_ocupacion_profesional(uuid, date, date) to authenticated;
