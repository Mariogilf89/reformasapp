"use client";

import { useActionState } from "react";
import { guardarPerfilProfesional } from "@/app/actions/profesionales";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PERFIL_FORM_ID } from "./constants";

export function ZonaGuardarSection({ zonaInicial }: { zonaInicial?: string }) {
  const [state, action, pending] = useActionState(guardarPerfilProfesional, undefined);

  return (
    <Card className="p-6">
      <form id={PERFIL_FORM_ID} action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="zona">Zona de cobertura</Label>
          <Input
            id="zona"
            name="zona"
            type="text"
            required
            defaultValue={zonaInicial}
            placeholder="Ej. Vigo y alrededores"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-primary-600 dark:text-primary-400">Perfil guardado.</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </form>
    </Card>
  );
}
