"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, buttonClassName } from "@/components/ui/button";

type Estado = "comprobando" | "listo" | "caducado" | "guardado";

// Solo se considera un intento de recuperación válido si venimos del enlace
// del email (trae "code" en la query o "type=recovery" en el hash). Sin esa
// marca, una sesión ya iniciada por otro motivo no debe habilitar el cambio
// de contraseña aquí.
function vieneDeEnlaceRecuperacion() {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).has("code") ||
    new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
  );
}

export default function ResetPasswordPage() {
  const [estado, setEstado] = useState<Estado>(() =>
    vieneDeEnlaceRecuperacion() ? "comprobando" : "caducado"
  );
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!vieneDeEnlaceRecuperacion()) return;

    const supabase = createClient();

    // Solo el evento PASSWORD_RECOVERY confirma que el código/token de la
    // URL se ha canjeado por una sesión de recuperación válida. No se usa
    // getSession() como respaldo porque devolvería una sesión normal ya
    // existente aunque el enlace de recuperación fuera inválido.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setEstado("listo");
      }
    });

    const timeout = setTimeout(() => {
      setEstado((actual) => (actual === "comprobando" ? "caducado" : actual));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError("No se ha podido actualizar la contraseña. Inténtalo de nuevo.");
      return;
    }

    setEstado("guardado");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm p-6">
        {estado === "comprobando" && (
          <p className="text-sm text-neutral-600">
            Comprobando el enlace...
          </p>
        )}

        {estado === "caducado" && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Enlace caducado
            </h1>
            <p className="text-sm text-neutral-600">
              Este enlace de restablecimiento no es válido o ha caducado. Solicita uno
              nuevo.
            </p>
            <Link href="/forgot-password" className={buttonClassName()}>
              Solicitar nuevo enlace
            </Link>
          </div>
        )}

        {estado === "guardado" && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Contraseña actualizada
            </h1>
            <p className="text-sm text-neutral-600">
              Ya puedes seguir usando tu cuenta con la nueva contraseña.
            </p>
            <Link href="/dashboard" className={buttonClassName()}>
              Ir a mi cuenta
            </Link>
          </div>
        )}

        {estado === "listo" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Elige una nueva contraseña
            </h1>

            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Nueva contraseña</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="confirmacion">Repite la contraseña</Label>
              <PasswordInput
                id="confirmacion"
                required
                minLength={8}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
