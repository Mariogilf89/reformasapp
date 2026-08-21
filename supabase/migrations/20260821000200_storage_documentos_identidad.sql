-- Bucket de Storage para los documentos de identidad de los profesionales.
-- Privado: sin lectura pública. Solo el propio profesional puede subir a su
-- carpeta (primer segmento de la ruta = auth.uid()); solo el dueño o un
-- usuario con rol "admin" (leído del JWT) pueden leer o borrar el documento.
-- El acceso de lectura siempre debe hacerse mediante URLs firmadas.

insert into storage.buckets (id, name, public)
values ('documentos-identidad', 'documentos-identidad', false)
on conflict (id) do nothing;

create policy "documentos_identidad_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos-identidad'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

create policy "documentos_identidad_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos-identidad'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documentos_identidad_delete_own_or_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos-identidad'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );
