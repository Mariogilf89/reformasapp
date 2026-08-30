"use client";

import { useActionState } from "react";
import { borrarSolicitud } from "@/app/actions/solicitudes";
import { Button } from "@/components/ui/button";

export function BorrarSolicitudForm({
  solicitudId,
  tieneDatosAsociados,
}: {
  solicitudId: string;
  tieneDatosAsociados: boolean;
}) {
  const [state, action, pending] = useActionState(borrarSolicitud, undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const mensaje = tieneDatosAsociados
      ? "Esta solicitud tiene mensajes o citas asociadas. Si la borras, se perderán también. ¿Seguro que quieres borrarla?"
      : "¿Seguro que quieres borrar esta solicitud?";
    if (!window.confirm(mensaje)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={solicitudId} />
      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <Button type="submit" variant="danger" size="xs" disabled={pending}>
        {pending ? "Borrando..." : "Borrar"}
      </Button>
    </form>
  );
}
