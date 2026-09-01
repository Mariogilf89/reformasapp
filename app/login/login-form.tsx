"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/oauth-buttons";

export function LoginForm({
  justRegistered,
  redirectTo,
  oauthError,
}: {
  justRegistered: boolean;
  redirectTo?: string;
  oauthError?: string;
}) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <Card className="w-full max-w-sm p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo ?? ""} />

        <h1 className="text-2xl font-semibold text-neutral-900">
          Iniciar sesión
        </h1>

        {justRegistered && (
          <p className="text-sm text-primary-600">
            Cuenta creada. Revisa tu email si se requiere confirmación, luego
            inicia sesión.
          </p>
        )}

        {oauthError && <p className="text-sm text-red-600">{oauthError}</p>}

        <OAuthButtons redirectTo={redirectTo} />

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="h-px flex-1 bg-neutral-200" />
          o entra con email
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required />
          <Link
            href="/forgot-password"
            className="mt-1 self-end text-xs font-medium text-primary-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-sm text-neutral-600">
          ¿No tienes cuenta?{" "}
          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="font-medium text-primary-600 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </Card>
  );
}
