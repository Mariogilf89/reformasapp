"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setPending(false);

    if (error) {
      setError("No se ha podido procesar la solicitud. Inténtalo de nuevo.");
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm p-6">
        {enviado ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Revisa tu email
            </h1>
            <p className="text-sm text-neutral-600">
              Si existe una cuenta con ese email, te hemos enviado un enlace para
              restablecer la contraseña.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-neutral-600">
              Escribe tu email y te enviaremos un enlace para restablecerla.
            </p>

            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Enviando..." : "Enviar enlace"}
            </Button>

            <p className="text-sm text-neutral-600">
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
