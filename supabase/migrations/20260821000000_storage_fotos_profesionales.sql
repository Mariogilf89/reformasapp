-- Bucket de Storage para las fotos de perfil de los profesionales.
-- Lectura pública; solo el propio profesional puede subir/actualizar/borrar
-- dentro de su propia carpeta (primer segmento de la ruta = auth.uid()).

insert into storage.buckets (id, name, public)
values ('fotos-profesionales', 'fotos-profesionales', true)
on conflict (id) do nothing;

create policy "fotos_profesionales_select_public" on storage.objects
  for select to public
  using (bucket_id = 'fotos-profesionales');

create policy "fotos_profesionales_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-profesionales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fotos_profesionales_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos-profesionales'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'fotos-profesionales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fotos_profesionales_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos-profesionales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
