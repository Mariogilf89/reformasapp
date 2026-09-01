"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/oauth-buttons";

export function RegisterForm({
  redirectTo,
  roleInicial = "cliente",
}: {
  redirectTo?: string;
  roleInicial?: "cliente" | "profesional";
}) {
  const [state, action, pending] = useActionState(signUp, undefined);
  // Controlado (no solo defaultChecked) porque los botones de Google/
  // Facebook necesitan saber qué tipo de cuenta está elegido ahora mismo,
  // no solo el valor inicial.
  const [role, setRole] = useState<"cliente" | "profesional">(roleInicial);

  return (
    <Card className="w-full max-w-sm p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo ?? ""} />

        <h1 className="text-2xl font-semibold text-neutral-900">
          Crear cuenta
        </h1>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-neutral-900">
            Tipo de cuenta
          </legend>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="role"
              value="cliente"
              checked={role === "cliente"}
              onChange={() => setRole("cliente")}
              className="accent-primary-600"
            />
            Cliente
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="role"
              value="profesional"
              checked={role === "profesional"}
              onChange={() => setRole("profesional")}
              className="accent-primary-600"
            />
            Profesional
          </label>
        </fieldset>

        <OAuthButtons redirectTo={redirectTo} role={role} />

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
          <Input id="password" name="password" type="password" required minLength={8} />
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
