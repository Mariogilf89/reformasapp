"use client";

import { useActionState, useEffect, useRef } from "react";
import { aceptarCitaProfesional } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AceptarCitaForm({
  citaId,
  onExito,
}: {
  citaId: string;
  onExito?: () => void;
}) {
  const [state, action, pending] = useActionState(aceptarCitaProfesional, undefined);
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
      <p className="text-sm font-medium text-neutral-900">Aceptar</p>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`hora_fin_${citaId}`}>Hora de fin</Label>
        <Input id={`hora_fin_${citaId}`} name="hora_fin" type="time" required />
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} size="xs" className="self-start">
        {pending ? "Aceptando..." : "Aceptar"}
      </Button>
    </form>
  );
}
