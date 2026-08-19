"use client";

import { useActionState } from "react";
import { crearValoracion } from "@/app/actions/valoraciones";

type ProfesionalOpcion = {
  id: string;
  nombre: string;
};

export function ValoracionForm({
  solicitudId,
  profesionales,
}: {
  solicitudId: string;
  profesionales: ProfesionalOpcion[];
}) {
  const [state, action, pending] = useActionState(crearValoracion, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <input type="hidden" name="solicitud_id" value={solicitudId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="profesional_id" className="text-sm font-medium">
          Profesional
        </label>
        <select
          id="profesional_id"
          name="profesional_id"
          required
          defaultValue=""
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          <option value="" disabled>
            Selecciona un profesional
          </option>
          {profesionales.map((profesional) => (
            <option key={profesional.id} value={profesional.id}>
              {profesional.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="puntuacion" className="text-sm font-medium">
          Puntuación
        </label>
        <select
          id="puntuacion"
          name="puntuacion"
          required
          defaultValue=""
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          <option value="" disabled>
            Selecciona una puntuación
          </option>
          {[5, 4, 3, 2, 1].map((valor) => (
            <option key={valor} value={valor}>
              {valor} {valor === 1 ? "estrella" : "estrellas"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="comentario" className="text-sm font-medium">
          Comentario (opcional)
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={3}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Marcar como completada y valorar"}
      </button>
    </form>
  );
}
