"use client";

import { useState } from "react";
import { guardarTelefonoCliente } from "@/app/actions/verificacion-telefono";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PREFIJO_ESPANA = "+34";

export function TelefonoClienteForm({ telefonoInicial }: { telefonoInicial: string | null }) {
  const [digitosIniciales] = useState(
    (telefonoInicial ?? "").startsWith(PREFIJO_ESPANA)
      ? (telefonoInicial ?? "").slice(PREFIJO_ESPANA.length)
      : ""
  );
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuardar(formData: FormData) {
    setError(null);
    setGuardado(false);

    const digitos = formData.get("telefono_local")?.toString().trim() ?? "";
    if (!/^[0-9]{9}$/.test(digitos)) {
      setError("Introduce los 9 dígitos de tu número de teléfono.");
      return;
    }

    setEnviando(true);
    const resultado = await guardarTelefonoCliente(undefined, formData);
    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }

    setGuardado(true);
  }

  return (
    <Card className="w-full max-w-lg p-8">
      <form action={handleGuardar} className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Añade tu teléfono de contacto
        </h1>

        <p className="text-sm text-neutral-600">
          Los profesionales con los que tengas una cita confirmada podrán ver este número para
          contactar contigo.
        </p>

        <div className="flex flex-col gap-1">
          <Label htmlFor="telefono_local">Teléfono</Label>
          <div className="flex items-stretch gap-2">
            <span className="flex items-center rounded-md border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">
              {PREFIJO_ESPANA}
            </span>
            <Input
              id="telefono_local"
              name="telefono_local"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{9}"
              maxLength={9}
              required
              defaultValue={digitosIniciales}
              placeholder="600000000"
              className="flex-1"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {guardado && !error && (
          <p className="text-sm text-primary-600">Teléfono guardado.</p>
        )}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Guardando..." : "Guardar teléfono"}
        </Button>
      </form>
    </Card>
  );
}
