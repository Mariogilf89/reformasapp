"use client";

import { useActionState } from "react";
import { anularCitaCliente } from "@/app/actions/citas";

export function AnularCitaClienteForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(anularCitaCliente, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={citaId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={`comentario_cliente_${citaId}`} className="text-xs font-medium">
          Comentario (opcional)
        </label>
        <textarea
          id={`comentario_cliente_${citaId}`}
          name="comentario"
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
        {pending ? "Anulando..." : "Anular"}
      </button>
    </form>
  );
}
