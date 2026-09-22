-- Los trabajos del portafolio no tienen datos sensibles (solo título,
-- categoría y fotos), así que se abren a anon para que se vean en el perfil
-- público del profesional sin sesión iniciada, igual que valoraciones (ver
-- 20260821000500_directorio_publico_profesionales.sql). Sin esta política,
-- trabajos_select_authenticated (20260901000000_create_trabajos.sql) deja el
-- portafolio invisible para cualquier visitante que no haya iniciado sesión.

create policy "trabajos_select_anon" on public.trabajos
  for select to anon using (true);
