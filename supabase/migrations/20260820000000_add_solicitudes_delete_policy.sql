-- Permite al cliente dueño borrar sus propias solicitudes.
--
-- Las claves foráneas solicitud_id de mensajes, citas y valoraciones ya
-- se crearon con "on delete cascade" (ver 20260819010000_create_mensajes.sql,
-- 20260819040000_create_citas.sql y 20260819020000_create_valoraciones.sql),
-- así que borrar una solicitud arrastra automáticamente sus mensajes,
-- citas y valoraciones asociadas sin necesidad de tocar esas tablas aquí.

create policy "solicitudes_delete_own"
  on public.solicitudes
  for delete
  to authenticated
  using (auth.uid() = cliente_id);
