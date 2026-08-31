"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cambiarContrasena } from "@/app/actions/cuenta";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CambiarContrasenaForm() {
  const [state, action, pending] = useActionState(cambiarContrasena, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="contrasena_actual">Contraseña actual</Label>
        <Input id="contrasena_actual" name="contrasena_actual" type="password" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="contrasena_nueva">Nueva contraseña</Label>
        <Input id="contrasena_nueva" name="contrasena_nueva" type="password" required minLength={8} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="confirmar_contrasena">Confirma la nueva contraseña</Label>
        <Input id="confirmar_contrasena" name="confirmar_contrasena" type="password" required minLength={8} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary-600">Contraseña actualizada.</p>}

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
