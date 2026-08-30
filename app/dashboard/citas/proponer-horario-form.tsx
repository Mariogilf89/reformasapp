"use client";

import { useActionState, useEffect, useRef } from "react";
import { proponerOtroHorario } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ProponerHorarioForm({
  citaId,
  onExito,
}: {
  citaId: string;
  onExito?: () => void;
}) {
  const [state, action, pending] = useActionState(proponerOtroHorario, undefined);
  const enviado = useRef(false);

  useEffect(() => {
    if (pending) {
      enviado.current = true;
      return;
    }
    if (enviado.current && !state?.error) {
      enviado.current = false;
      onExito?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium text-neutral-900">
        Proponer otro horario
      </p>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`fecha_${citaId}`}>Fecha</Label>
        <Input id={`fecha_${citaId}`} name="fecha" type="date" required />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={`hora_inicio_${citaId}`}>Hora inicio</Label>
          <Input id={`hora_inicio_${citaId}`} name="hora_inicio" type="time" required />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={`hora_fin_${citaId}`}>Hora fin</Label>
          <Input id={`hora_fin_${citaId}`} name="hora_fin" type="time" required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`comentario_${citaId}`}>Motivo</Label>
        <Textarea id={`comentario_${citaId}`} name="comentario" required rows={2} />
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <Button type="submit" variant="secondary" size="xs" disabled={pending} className="self-start">
        {pending ? "Proponiendo..." : "Proponer otro horario"}
      </Button>
    </form>
  );
}
