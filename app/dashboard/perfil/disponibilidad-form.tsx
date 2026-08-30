"use client";

import { useActionState } from "react";
import { DIAS_SEMANA } from "@/lib/disponibilidad";
import { crearTramoDisponibilidad } from "@/app/actions/disponibilidad";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function DisponibilidadForm() {
  const [state, action, pending] = useActionState(crearTramoDisponibilidad, undefined);

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dia_semana">Día</Label>
          <Select id="dia_semana" name="dia_semana" required defaultValue="">
            <option value="" disabled>
              Selecciona un día
            </option>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="hora_inicio">Hora inicio</Label>
            <Input id="hora_inicio" name="hora_inicio" type="time" required />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="hora_fin">Hora fin</Label>
            <Input id="hora_fin" name="hora_fin" type="time" required />
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending ? "Añadiendo..." : "Añadir tramo"}
        </Button>
      </form>
    </Card>
  );
}
