"use client";

import { useState } from "react";
import {
  solicitarCodigoTelefono,
  verificarCodigoTelefono,
} from "@/app/actions/verificacion-telefono";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PREFIJO_ESPANA = "+34";

export function VerificarTelefonoForm({
  telefonoInicial,
  verificadoInicial,
}: {
  telefonoInicial: string | null;
  verificadoInicial: boolean;
}) {
  const [paso, setPaso] = useState<"telefono" | "codigo">("telefono");
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [digitosIniciales] = useState(
    (telefonoInicial ?? "").startsWith(PREFIJO_ESPANA)
      ? (telefonoInicial ?? "").slice(PREFIJO_ESPANA.length)
      : ""
  );
  const [verificado, setVerificado] = useState(verificadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSolicitar(formData: FormData) {
    setError(null);

    const digitos = formData.get("telefono_local")?.toString().trim() ?? "";
    if (!/^[0-9]{9}$/.test(digitos)) {
      setError("Introduce los 9 dígitos de tu número de teléfono.");
      return;
    }

    setEnviando(true);
    const resultado = await solicitarCodigoTelefono(undefined, formData);
    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }

    setTelefono(`${PREFIJO_ESPANA}${digitos}`);
    setVerificado(false);
    setPaso("codigo");
  }

  async function handleVerificar(formData: FormData) {
    setError(null);
    setEnviando(true);
    const resultado = await verificarCodigoTelefono(undefined, formData);
    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }

    setVerificado(true);
  }

  return (
    <Card className="w-full max-w-lg p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Verificación de teléfono
          </h1>
          {verificado ? (
            <Badge status="confirmada">Verificado</Badge>
          ) : (
            <Badge status="cerrada">Sin verificar</Badge>
          )}
        </div>

        {verificado ? (
          <p className="text-sm text-neutral-600">
            Tu teléfono {telefono} está verificado. Los clientes y profesionales con los que
            tengas una cita confirmada podrán ver este número.
          </p>
        ) : paso === "telefono" ? (
          <form action={handleSolicitar} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Te enviaremos un código de verificación por SMS a este número.
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

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando ? "Enviando..." : "Enviar código"}
            </Button>
          </form>
        ) : (
          <form action={handleVerificar} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Hemos enviado un código a {telefono}. Introdúcelo a continuación. Caduca a los 10
              minutos.
            </p>

            <div className="flex flex-col gap-1">
              <Label htmlFor="codigo">Código de verificación</Label>
              <Input
                id="codigo"
                name="codigo"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="123456"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={enviando}>
                {enviando ? "Comprobando..." : "Verificar código"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPaso("telefono");
                }}
                className="text-sm text-neutral-600 hover:underline"
              >
                Cambiar número
              </button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
