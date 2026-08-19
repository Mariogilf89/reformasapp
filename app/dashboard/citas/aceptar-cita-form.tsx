"use client";

import { useActionState } from "react";
import { aceptarCitaProfesional } from "@/app/actions/citas";

export function AceptarCitaForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(aceptarCitaProfesional, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/15"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium">Aceptar</p>

      <div className="flex flex-col gap-1">
        <label htmlFor={`hora_fin_${citaId}`} className="text-xs font-medium">
          Hora de fin
        </label>
        <input
          id={`hora_fin_${citaId}`}
          name="hora_fin"
          type="time"
          required
          className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
        />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
      >
        {pending ? "Aceptando..." : "Aceptar"}
      </button>
    </form>
  );
}
