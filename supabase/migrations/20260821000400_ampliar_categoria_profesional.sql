-- Amplía el enum de categorías. Solo contiene ALTER TYPE ... ADD VALUE: estos
-- valores no pueden usarse (en un WHERE, INSERT, CHECK, etc.) dentro de la
-- misma transacción en que se añaden, así que cualquier migración que use
-- alguna de estas categorías nuevas debe ir en un archivo posterior.

alter type public.categoria_profesional add value 'albanileria' before 'otros';
alter type public.categoria_profesional add value 'cerrajeria' before 'otros';
alter type public.categoria_profesional add value 'climatizacion' before 'otros';
alter type public.categoria_profesional add value 'jardineria' before 'otros';
alter type public.categoria_profesional add value 'limpieza' before 'otros';
alter type public.categoria_profesional add value 'mudanzas' before 'otros';
alter type public.categoria_profesional add value 'decoracion' before 'otros';
