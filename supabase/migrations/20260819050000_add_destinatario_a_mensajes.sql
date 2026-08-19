-- Destinatario opcional de un mensaje: el profesional al que el cliente
-- escribe primero, para poder identificarlo aunque todavía no haya
-- respondido (Fase 1)

alter table public.mensajes
  add column destinatario_id uuid references public.profesionales (id) on delete set null;
