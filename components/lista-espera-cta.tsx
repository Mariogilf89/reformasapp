"use client";

import { useState } from "react";
import { ListaEsperaForm } from "@/components/lista-espera-form";

const TEXTO = "¿No hay profesionales todavía en tu zona? Avísanos cuando quieras que lleguemos";

/**
 * Texto + flecha que, al pulsarlo, abre el mini formulario de
 * ListaEsperaForm. Pensado para el final de la home, donde no hace falta
 * mostrar el formulario hasta que alguien lo pide.
 */
export function ListaEsperaCTA() {
  const [abierto, setAbierto] = useState(false);

  if (abierto) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{TEXTO}</p>
        <ListaEsperaForm className="flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-start" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="mx-auto flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
    >
      {TEXTO} →
    </button>
  );
}
