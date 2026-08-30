import Link from "next/link";

const BUSQUEDAS_POPULARES = [
  { label: "Electricista urgente", href: "/profesionales?categoria=electricidad&modo=lo_antes_posible" },
  { label: "Pintar salón", href: "/profesionales?categoria=pintura" },
  { label: "Grifo que gotea", href: "/profesionales?categoria=fontaneria" },
  { label: "Persiana rota", href: "/profesionales?categoria=carpinteria" },
  { label: "Limpieza tras obra", href: "/profesionales?categoria=limpieza" },
] as const;

/**
 * Atajos a búsquedas frecuentes: enlaces directos a /profesionales con los
 * filtros ya puestos en la URL, sin pasar por el formulario del hero.
 */
export function BusquedasPopulares() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {BUSQUEDAS_POPULARES.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-neutral-100"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
