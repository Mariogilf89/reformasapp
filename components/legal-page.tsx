import type { ReactNode } from "react";

// Contenido legal genérico de partida: revisar y adaptar con un gestor o abogado antes del lanzamiento real.
export function LegalPage({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <strong>Borrador de partida:</strong> este contenido es genérico y orientativo. Debe ser
          revisado y adaptado por un gestor o abogado antes del lanzamiento real de la plataforma.
        </div>

        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{titulo}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Última actualización: [fecha pendiente de fijar]
        </p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">{titulo}</h2>
      {children}
    </section>
  );
}
