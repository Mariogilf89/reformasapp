"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cambiarEmail } from "@/app/actions/cuenta";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CambiarEmailForm() {
  const [state, action, pending] = useActionState(cambiarEmail, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="nuevo_email">Nuevo correo electrónico</Label>
        <Input id="nuevo_email" name="nuevo_email" type="email" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="confirmar_email">Confirma el nuevo correo</Label>
        <Input id="confirmar_email" name="confirmar_email" type="email" required />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-primary-600">
          Revisa tu correo para confirmar el cambio.
        </p>
      )}

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
