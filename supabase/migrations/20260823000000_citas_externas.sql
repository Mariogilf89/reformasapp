-- Permite citas "externas" (bloqueos manuales del profesional, fuera de la
-- negociación cliente-profesional): sin cliente_id/solicitud_id/tipo, con
-- origen_externo/titulo_externo (esas dos columnas ya existen en producción,
-- añadidas manualmente; aquí solo se ajusta nullability, un check y RLS).

alter table public.citas alter column cliente_id drop not null;
alter table public.citas alter column solicitud_id drop not null;
alter table public.citas alter column tipo drop not null;

alter table public.citas
  add constraint citas_normal_o_externa check (
    (
      origen_externo = false
      and cliente_id is not null
      and solicitud_id is not null
      and tipo is not null
      and titulo_externo is null
    )
    or
    (
      origen_externo = true
      and cliente_id is null
      and solicitud_id is null
      and tipo is null
      and titulo_externo is not null
    )
  );

-- El profesional puede insertar sus propios bloqueos externos (la política
-- "citas_insert_cliente_dueno" existente sigue cubriendo el flujo normal;
-- RLS hace OR entre políticas del mismo comando).
create policy "citas_insert_profesional_externa"
  on public.citas
  for insert
  to authenticated
  with check (
    origen_externo = true
    and cliente_id is null
    and solicitud_id is null
    and exists (
      select 1
      from public.profesionales p
      where p.id = citas.profesional_id
        and p.user_id = auth.uid()
    )
  );
