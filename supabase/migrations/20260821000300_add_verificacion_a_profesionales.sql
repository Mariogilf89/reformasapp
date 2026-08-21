-- documento_identidad_url guarda la ruta del objeto dentro del bucket privado
-- "documentos-identidad" (no una URL pública: el bucket no tiene lectura
-- pública, así que el documento siempre se sirve con una URL firmada).

alter table public.profesionales
  add column documento_identidad_url text,
  add column verificado boolean not null default false,
  add column verificado_en timestamptz;

-- Permite además a un usuario con rol "admin" (leído del JWT) actualizar
-- cualquier fila, necesario para aprobar/rechazar verificaciones. Se suma a
-- la política "profesionales_update_own" ya existente (son permisivas: basta
-- con que una de las dos aplique).
create policy "profesionales_update_admin" on public.profesionales
  for update to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- RLS es a nivel de fila, no de columna: sin esto, "profesionales_update_own"
-- dejaría a cualquier profesional marcarse verificado=true en su propia fila
-- con un update directo. Este trigger anula ese cambio para quien no sea
-- admin, pero deja pasar el caso legítimo de degradar su propio estado a
-- pendiente (verificado=false) al volver a subir un documento.
create function public.proteger_verificacion_profesional()
returns trigger
language plpgsql
as $$
begin
  if (auth.jwt() -> 'user_metadata' ->> 'role') is distinct from 'admin' then
    if new.verificado and not old.verificado then
      new.verificado := old.verificado;
      new.verificado_en := old.verificado_en;
    elsif not new.verificado then
      new.verificado_en := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_proteger_verificacion_profesional
  before update on public.profesionales
  for each row
  execute function public.proteger_verificacion_profesional();
