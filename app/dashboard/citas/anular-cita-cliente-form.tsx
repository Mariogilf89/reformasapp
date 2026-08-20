"use client";

import { useActionState } from "react";
import { anularCitaCliente } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AnularCitaClienteForm({ citaId }: { citaId: string }) {
  const [state, action, pending] = useActionState(anularCitaCliente, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={citaId} />

      <div className="flex flex-col gap-1">
        <Label htmlFor={`comentario_cliente_${citaId}`}>Comentario (opcional)</Label>
        <Textarea id={`comentario_cliente_${citaId}`} name="comentario" rows={2} />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" variant="secondary" size="xs" disabled={pending} className="self-start">
        {pending ? "Anulando..." : "Anular"}
      </Button>
    </form>
  );
}
