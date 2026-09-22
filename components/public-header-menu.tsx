"use client";

import Link from "next/link";
import { useState } from "react";
import { IconMenu } from "@/components/ui/icon-menu";
import { IconX } from "@/components/ui/icon-x";

/**
 * Acciones de la cabecera pública para visitantes sin sesión ("Iniciar
 * sesión" / CTA de registro de profesional), en formato menú hamburguesa.
 * Solo se muestra en móvil (<sm): en desktop, PublicHeader pinta esas mismas
 * acciones en línea y oculta este componente.
 */
export function PublicHeaderMenu() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
      >
        {abierto ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 flex w-56 flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg"
          >
            <Link
              href="/login"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register?role=profesional"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-blue-700"
            >
              Regístrate aquí
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
