"use client";

import { useActionState, useState } from "react";
import { crearExcepcionDisponibilidad } from "@/app/actions/disponibilidad";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DIAS_MAXIMO = 60;

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ExcepcionDisponibilidadForm() {
  const [state, action, pending] = useActionState(crearExcepcionDisponibilidad, undefined);
  const [todoElDia, setTodoElDia] = useState(true);

  const hoy = new Date();
  const fechaMinima = fechaISO(hoy);
  const fechaMaxima = fechaISO(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + DIAS_MAXIMO)
  );

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            required
            min={fechaMinima}
            max={fechaMaxima}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-neutral-900">
            Tipo de bloqueo
          </legend>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="todo_el_dia"
              value="true"
              checked={todoElDia}
              onChange={() => setTodoElDia(true)}
              className="accent-primary-600"
            />
            No disponible todo el día
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="todo_el_dia"
              value="false"
              checked={!todoElDia}
              onChange={() => setTodoElDia(false)}
              className="accent-primary-600"
            />
            No disponible en una franja concreta
          </label>
        </fieldset>

        {!todoElDia && (
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
        )}

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending ? "Guardando..." : "Guardar excepción"}
        </Button>
      </form>
    </Card>
  );
}
