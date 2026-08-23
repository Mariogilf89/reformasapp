"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm({
  redirectTo,
  roleInicial = "cliente",
}: {
  redirectTo?: string;
  roleInicial?: "cliente" | "profesional";
}) {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <Card className="w-full max-w-sm p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo ?? ""} />

        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Crear cuenta
        </h1>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Tipo de cuenta
          </legend>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="radio"
              name="role"
              value="cliente"
              defaultChecked={roleInicial === "cliente"}
              className="accent-primary-600"
            />
            Cliente
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="radio"
              name="role"
              value="profesional"
              defaultChecked={roleInicial === "profesional"}
              className="accent-primary-600"
            />
            Profesional
          </label>
        </fieldset>

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

        <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
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
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creando cuenta..." : "Registrarse"}
        </Button>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </Card>
  );
}
