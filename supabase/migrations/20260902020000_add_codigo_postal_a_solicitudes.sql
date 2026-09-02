-- Guarda el código postal tal cual lo escribió el cliente en el formulario
-- corto de contacto, junto a zona (que pasa a llevar el municipio resuelto
-- a partir del CP) y provincia (ya existente). Nullable: las solicitudes
-- creadas antes de este cambio no tienen CP.

alter table public.solicitudes add column codigo_postal text;
