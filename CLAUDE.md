Proceso de pensamiento

Proceso de pensamiento

Copia y pega esto en el Bloc de notas (dentro de notepad CLAUDE.md) y guarda con Ctrl+S:



markdown

\# Faenia



Marketplace que conecta particulares con profesionales de la reforma

(pintores, electricistas, fontaneros...) en Galicia. Fase 1: marketplace

mínimo (sin calendario ni finanzas todavía).



\## Stack

\- Next.js (App Router) + TypeScript

\- Tailwind CSS

\- Supabase (Postgres + Auth), cliente en `lib/supabase.ts`

\- Desplegado en Vercel



\## Alcance de la Fase 1 (lo único que se construye ahora)

1\. Registro y login (profesional / cliente) con Supabase Auth

2\. Perfil de profesional: categorías, zona de cobertura, fotos, descripción

3\. Publicación de solicitud por el cliente + matching por categoría/ubicación

4\. Mensajería interna entre cliente y profesional

5\. Sistema de valoraciones



No añadir calendario ni módulo de finanzas todavía — eso es Fase 2 y 3.



\## Modelo de datos (borrador inicial)

\- \*\*profesionales\*\*: id, user\_id, nombre, categorías\[], zona, descripción, fotos\[]

\- \*\*clientes\*\*: id, user\_id, nombre

\- \*\*solicitudes\*\*: id, cliente\_id, categoría, descripción, zona, estado

\- \*\*mensajes\*\*: id, solicitud\_id, remitente\_id, texto, creado\_en

\- \*\*valoraciones\*\*: id, profesional\_id, solicitud\_id, puntuación, comentario



\## Convenciones

\- Componentes en `app/`, lógica compartida en `lib/`

\- Nombres de archivo en minúsculas con guiones

\- Comentarios y textos de interfaz en español

