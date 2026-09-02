"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reenviarAccesoCliente } from "@/app/actions/acceso-cliente";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccesoClientePage() {
  const [state, action, pending] = useActionState(reenviarAccesoCliente, undefined);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm p-6">
        {state?.success ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">Revisa tu email</h1>
            <p className="text-sm text-neutral-600">
              Te hemos enviado un enlace para acceder y ver el estado de tus solicitudes.
            </p>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">Accede a tu cuenta</h1>
            <p className="text-sm text-neutral-600">
              Si ya solicitaste un servicio antes, escribe tu email y te enviamos un enlace
              para entrar — no hace falta contraseña.
            </p>

            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Enviando..." : "Enviar enlace"}
            </Button>

            <p className="text-sm text-neutral-600">
              ¿Eres profesional?{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
