"use client";

import { useActionState } from "react";
import { aceptarCitaProfesional } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AceptarCitaForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(aceptarCitaProfesional, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aceptar</p>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`hora_fin_${citaId}`}>Hora de fin</Label>
        <Input id={`hora_fin_${citaId}`} name="hora_fin" type="time" required />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending} size="xs" className="self-start">
        {pending ? "Aceptando..." : "Aceptar"}
      </Button>
    </form>
  );
}
