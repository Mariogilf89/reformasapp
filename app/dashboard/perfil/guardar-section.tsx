"use client";

import { useActionState } from "react";
import { guardarPerfilProfesional } from "@/app/actions/profesionales";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PERFIL_FORM_ID } from "./constants";
import { usePerfilReset } from "./perfil-reset-provider";

export function GuardarSection() {
  const [state, action, pending] = useActionState(guardarPerfilProfesional, undefined);
  const reset = usePerfilReset();

  return (
    <Card className="p-6">
      <form id={PERFIL_FORM_ID} action={action} className="flex flex-col gap-4">
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-primary-600">Perfil guardado.</p>
        )}

        <Button type="submit" disabled={pending} className="w-full py-3 text-base">
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={reset}
          disabled={pending}
          className="w-full"
        >
          Cancelar
        </Button>
      </form>
    </Card>
  );
}
