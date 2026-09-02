-- Conexión OAuth de un profesional con su Google Calendar personal (solo
-- exportación: las citas confirmadas de Faenia se copian a un calendario
-- secundario dedicado "Faenia" que la propia app crea en su cuenta de
-- Google). Sin políticas RLS para authenticated/anon a propósito: el
-- profesional nunca debe poder leer su propio refresh_token desde el
-- cliente normal. Con RLS activado y sin ninguna policy, solo el service
-- role (que ignora RLS, mismo patrón que lib/supabase-admin.ts) puede
-- tocar esta tabla.

create table public.google_calendar_conexiones (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null unique references public.profesionales (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expira_en timestamptz,
  -- id del calendario secundario "Faenia" creado en la cuenta de Google del
  -- profesional (calendars.insert), donde se crean todos sus eventos.
  google_calendar_id text not null,
  -- Email de la cuenta de Google conectada, solo para mostrarlo en la UI
  -- ("Conectado como ..."); null si Google no lo devolvió.
  google_email text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.google_calendar_conexiones enable row level security;
-- Deliberadamente sin "create policy": ningún rol authenticated/anon puede
-- select/insert/update/delete; solo el service role.

-- Referencia al evento creado en el calendario "Faenia" del profesional
-- para cada fila de "citas" que llegó a estar confirmada y sincronizada.
-- NULL = todavía no sincronizada, o el profesional no tiene Google
-- Calendar conectado.
alter table public.citas add column google_event_id text;
