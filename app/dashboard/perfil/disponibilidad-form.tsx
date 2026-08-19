"use client";

import { useActionState } from "react";
import { DIAS_SEMANA } from "@/lib/disponibilidad";
import { crearTramoDisponibilidad } from "@/app/actions/disponibilidad";

export function DisponibilidadForm() {
  const [state, action, pending] = useActionState(crearTramoDisponibilidad, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="dia_semana" className="text-sm font-medium">
          Día
        </label>
        <select
          id="dia_semana"
          name="dia_semana"
          required
          defaultValue=""
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          <option value="" disabled>
            Selecciona un día
          </option>
          {DIAS_SEMANA.map((dia) => (
            <option key={dia.value} value={dia.value}>
              {dia.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="hora_inicio" className="text-sm font-medium">
            Hora inicio
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            required
            className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="hora_fin" className="text-sm font-medium">
            Hora fin
          </label>
          <input
            id="hora_fin"
            name="hora_fin"
            type="time"
            required
            className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Añadiendo..." : "Añadir tramo"}
      </button>
    </form>
  );
}
