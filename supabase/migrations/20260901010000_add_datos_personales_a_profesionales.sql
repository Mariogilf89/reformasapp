-- Campos de datos personales del profesional, editables desde la página
-- "Datos personales" del panel (apellidos, sexo, fecha de nacimiento).
-- No se añade una columna de foto de perfil: esa ya es la primera foto del
-- array `fotos` (ver marcarFotoPrincipalProfesional en app/actions/profesionales.ts).

create type public.sexo_profesional as enum (
  'hombre',
  'mujer',
  'prefiero_no_decir'
);

alter table public.profesionales
  add column apellidos text not null default '',
  add column sexo public.sexo_profesional,
  add column fecha_nacimiento date;
