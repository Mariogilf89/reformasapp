"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({
  justRegistered,
  redirectTo,
}: {
  justRegistered: boolean;
  redirectTo?: string;
}) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <Card className="w-full max-w-sm p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo ?? ""} />

        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Iniciar sesión
        </h1>

        {justRegistered && (
          <p className="text-sm text-primary-600 dark:text-primary-400">
            Cuenta creada. Revisa tu email si se requiere confirmación, luego
            inicia sesión.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required />
          <Link
            href="/forgot-password"
            className="mt-1 self-end text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿No tienes cuenta?{" "}
          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </Card>
  );
}
