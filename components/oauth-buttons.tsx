"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { IconGoogle } from "@/components/ui/icon-google";
import { IconFacebook } from "@/components/ui/icon-facebook";

type Proveedor = "google" | "facebook";

export function OAuthButtons({
  redirectTo,
  role,
}: {
  // Ruta interna a la que volver tras completar el login (ver
  // app/auth/callback/route.ts). Sin ella, el callback usa /dashboard.
  redirectTo?: string;
  // Solo tiene efecto la primera vez que ESTE usuario inicia sesión (nunca
  // pisa un role ya asignado): lo usa el registro, que ya tiene un
  // selector "Tipo de cuenta"; el login no pasa ninguno (por defecto
  // "cliente" si el usuario resulta ser nuevo, ver el route handler).
  role?: "cliente" | "profesional";
}) {
  const [cargando, setCargando] = useState<Proveedor | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function iniciar(provider: Proveedor) {
    setError(null);
    setCargando(provider);

    const params = new URLSearchParams();
    if (redirectTo) params.set("next", redirectTo);
    if (role) params.set("role", role);
    const query = params.toString();
    const callbackUrl = `${window.location.origin}/auth/callback${query ? `?${query}` : ""}`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });

    if (error) {
      setError(error.message);
      setCargando(null);
    }
    // Si no hay error, el navegador ya está navegando fuera de la página
    // hacia el proveedor: no hace falta hacer nada más aquí.
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={cargando !== null}
        onClick={() => iniciar("google")}
        className="w-full gap-2"
      >
        <IconGoogle className="h-4 w-4 shrink-0" />
        {cargando === "google" ? "Redirigiendo..." : "Continuar con Google"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={cargando !== null}
        onClick={() => iniciar("facebook")}
        className="w-full gap-2"
      >
        <IconFacebook className="h-4 w-4 shrink-0" />
        {cargando === "facebook" ? "Redirigiendo..." : "Continuar con Facebook"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
