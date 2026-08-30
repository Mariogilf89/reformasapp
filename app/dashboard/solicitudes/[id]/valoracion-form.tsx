"use client";

import { useActionState } from "react";
import { crearValoracion } from "@/app/actions/valoraciones";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ProfesionalOpcion = {
  id: string;
  nombre: string;
};

export function ValoracionForm({
  solicitudId,
  profesionales,
}: {
  solicitudId: string;
  profesionales: ProfesionalOpcion[];
}) {
  const [state, action, pending] = useActionState(crearValoracion, undefined);

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="solicitud_id" value={solicitudId} />

        <div className="flex flex-col gap-1">
          <Label htmlFor="profesional_id">Profesional</Label>
          <Select id="profesional_id" name="profesional_id" required defaultValue="">
            <option value="" disabled>
              Selecciona un profesional
            </option>
            {profesionales.map((profesional) => (
              <option key={profesional.id} value={profesional.id}>
                {profesional.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="puntuacion">Puntuación</Label>
          <Select id="puntuacion" name="puntuacion" required defaultValue="">
            <option value="" disabled>
              Selecciona una puntuación
            </option>
            {[5, 4, 3, 2, 1].map((valor) => (
              <option key={valor} value={valor}>
                {valor} {valor === 1 ? "estrella" : "estrellas"}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea id="comentario" name="comentario" rows={3} />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending ? "Enviando..." : "Marcar como completada y valorar"}
        </Button>
      </form>
    </Card>
  );
}
