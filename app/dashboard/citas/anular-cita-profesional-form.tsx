"use client";

import { useActionState, useEffect, useRef } from "react";
import { anularCitaProfesional } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AnularCitaProfesionalForm({
  citaId,
  onExito,
}: {
  citaId: string;
  onExito?: () => void;
}) {
  const [state, action, pending] = useActionState(anularCitaProfesional, undefined);
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
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <input type="hidden" name="id" value={citaId} />
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Anular</p>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`comentario_anular_${citaId}`}>Motivo</Label>
        <Textarea id={`comentario_anular_${citaId}`} name="comentario" required rows={2} />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" variant="danger" size="xs" disabled={pending} className="self-start">
        {pending ? "Anulando..." : "Anular"}
      </Button>
    </form>
  );
}
