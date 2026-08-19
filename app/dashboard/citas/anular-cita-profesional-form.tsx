"use client";

import { useActionState } from "react";
import { anularCitaProfesional } from "@/app/actions/citas";

export function AnularCitaProfesionalForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(anularCitaProfesional, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/15"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium">Anular</p>

      <div className="flex flex-col gap-1">
        <label htmlFor={`comentario_anular_${citaId}`} className="text-xs font-medium">
          Motivo
        </label>
        <textarea
          id={`comentario_anular_${citaId}`}
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
        className="self-start rounded-full px-4 py-1.5 text-xs font-medium text-red-600 underline disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "Anulando..." : "Anular"}
      </button>
    </form>
  );
}
