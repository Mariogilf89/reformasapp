"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarPreferenciasNotificacion } from "@/app/actions/cuenta";
import { TIPOS_NOTIFICACION, type TipoNotificacion } from "@/lib/notificaciones";
import { Button } from "@/components/ui/button";

const ETIQUETAS_TIPO_NOTIFICACION: Record<TipoNotificacion, string> = {
  cita_propuesta: "Cuando un cliente propone o cambia el horario de una cita",
  cita_confirmada: "Cuando se confirma una cita",
  cita_cancelada: "Cuando se cancela una cita",
  mensaje_cliente: "Cuando recibes un mensaje de un cliente",
};

export function PreferenciasNotificacionForm({
  preferenciasIniciales,
}: {
  preferenciasIniciales: Record<TipoNotificacion, boolean>;
}) {
  const [state, action, pending] = useActionState(guardarPreferenciasNotificacion, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-3">
        {TIPOS_NOTIFICACION.map((tipo) => (
          <label key={tipo} className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name={`notif_${tipo}`}
              defaultChecked={preferenciasIniciales[tipo]}
              className="mt-0.5 accent-primary-600"
            />
            {ETIQUETAS_TIPO_NOTIFICACION[tipo]}
          </label>
        ))}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary-600">Preferencias guardadas.</p>}

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button type="submit" variant="danger" disabled={pending} className="w-full">
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Link href="/dashboard/perfil" className="text-sm text-primary-700 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
