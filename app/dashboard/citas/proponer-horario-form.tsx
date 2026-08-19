"use client";

import { useActionState } from "react";
import { proponerOtroHorario } from "@/app/actions/citas";

export function ProponerHorarioForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(proponerOtroHorario, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/15"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium">Proponer otro horario</p>

      <div className="flex flex-col gap-1">
        <label htmlFor={`fecha_${citaId}`} className="text-xs font-medium">
          Fecha
        </label>
        <input
          id={`fecha_${citaId}`}
          name="fecha"
          type="date"
          required
          className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`hora_inicio_${citaId}`} className="text-xs font-medium">
            Hora inicio
          </label>
          <input
            id={`hora_inicio_${citaId}`}
            name="hora_inicio"
            type="time"
            required
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`hora_fin_${citaId}`} className="text-xs font-medium">
            Hora fin
          </label>
          <input
            id={`hora_fin_${citaId}`}
            name="hora_fin"
            type="time"
            required
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`comentario_${citaId}`} className="text-xs font-medium">
          Motivo
        </label>
        <textarea
          id={`comentario_${citaId}`}
          name="comentario"
          required
          rows={2}
          className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
        />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? "Proponiendo..." : "Proponer otro horario"}
      </button>
    </form>
  );
}
