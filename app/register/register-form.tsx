"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/oauth-buttons";

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <Card className="w-full max-w-sm p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo ?? ""} />
        {/* Este formulario solo registra profesionales: los clientes no
            eligen tipo de cuenta aquí. */}
        <input type="hidden" name="role" value="profesional" />

        <h1 className="text-2xl font-semibold text-neutral-900">
          Crear cuenta
        </h1>

        <OAuthButtons redirectTo={redirectTo} role="profesional" />

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="h-px flex-1 bg-neutral-200" />
          o regístrate con email
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" type="text" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput id="password" name="password" required minLength={8} />
        </div>

        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 accent-primary-600"
          />
          <span>
            Al registrarte, aceptas los{" "}
            <Link
              href="/terminos"
              target="_blank"
              className="font-medium text-primary-600 hover:underline"
            >
              Términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-medium text-primary-600 hover:underline"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creando cuenta..." : "Registrarse"}
        </Button>

        <p className="text-sm text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
            className="font-medium text-primary-600 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </Card>
  );
}
