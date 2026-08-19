"use client";

import { useActionState } from "react";
import { CATEGORIAS } from "@/lib/profesionales";
import { crearSolicitud } from "@/app/actions/solicitudes";

export function SolicitudForm() {
  const [state, action, pending] = useActionState(crearSolicitud, undefined);

  return (
    <form
      action={action}
      className="w-full max-w-lg flex flex-col gap-4 rounded-xl border border-black/10 p-8 dark:border-white/15"
    >
      <h1 className="text-2xl font-semibold">Publicar una solicitud</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          defaultValue=""
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="zona" className="text-sm font-medium">
          Zona
        </label>
        <input
          id="zona"
          name="zona"
          type="text"
          required
          placeholder="Ej. Vigo y alrededores"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={4}
          placeholder="Cuéntanos qué necesitas"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Solicitud publicada.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Publicando..." : "Publicar solicitud"}
      </button>
    </form>
  );
}
