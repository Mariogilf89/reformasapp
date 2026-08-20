"use client";

import { useActionState } from "react";
import { proponerOtroHorario } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ProponerHorarioForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(proponerOtroHorario, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
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

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" variant="secondary" size="xs" disabled={pending} className="self-start">
        {pending ? "Proponiendo..." : "Proponer otro horario"}
      </Button>
    </form>
  );
}
