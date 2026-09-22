"use client";

import { useActionState } from "react";
import { crearValoracion } from "@/app/actions/valoraciones";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StarRatingInput } from "@/components/ui/star-rating-input";
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

        <div className="grid grid-cols-2 gap-4">
          <StarRatingInput name="puntualidad" label="Puntualidad" />
          <StarRatingInput name="calidad" label="Calidad" />
          <StarRatingInput name="precio" label="Precio" />
          <StarRatingInput name="comunicacion" label="Comunicación" />
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
