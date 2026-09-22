"use client";

import { useActionState, useState } from "react";
import { crearReporte } from "@/app/actions/reportes";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * Canal discreto de "¿Algo fue mal? Cuéntanoslo": un enlace de texto que se
 * despliega en un formulario corto. No exige sesión iniciada (por eso pide
 * el contacto como campo de texto en vez de usar el email de la cuenta).
 */
export function ReportarProblema({
  profesionalId,
  profesionalNombre,
  solicitudId,
}: {
  profesionalId?: string;
  profesionalNombre?: string;
  solicitudId?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, action, pending] = useActionState(crearReporte, undefined);

  if (state?.success) {
    return (
      <p className="text-sm text-neutral-600">
        Gracias, hemos recibido tu aviso y lo revisaremos en cuanto podamos.
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-neutral-500 underline decoration-dotted underline-offset-2 hover:text-neutral-700"
      >
        ¿Algo fue mal? Cuéntanoslo
      </button>
    );
  }

  return (
    <Card className="p-4">
      <form action={action} className="flex flex-col gap-3">
        {profesionalId && <input type="hidden" name="profesional_id" value={profesionalId} />}
        {profesionalNombre && (
          <input type="hidden" name="profesional_nombre" value={profesionalNombre} />
        )}
        {solicitudId && <input type="hidden" name="solicitud_id" value={solicitudId} />}

        <p className="text-sm font-medium text-neutral-900">¿Algo fue mal?</p>

        <div className="flex flex-col gap-1">
          <Label htmlFor="reporte_contacto">Tu email o teléfono</Label>
          <Input id="reporte_contacto" name="contacto" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="reporte_mensaje">Cuéntanos qué ha pasado</Label>
          <Textarea id="reporte_mensaje" name="mensaje" required rows={3} />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" size="xs" disabled={pending}>
            {pending ? "Enviando..." : "Enviar"}
          </Button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-xs text-neutral-500 hover:underline"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Card>
  );
}
