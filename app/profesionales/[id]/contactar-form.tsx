"use client";

import { useActionState, useState } from "react";
import { crearSolicitudYContactar } from "@/app/actions/solicitudes";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ContactarForm({
  profesionalId,
  categoriasProfesional,
  fechaElegida,
  horaInicioElegida,
}: {
  profesionalId: string;
  categoriasProfesional: Categoria[];
  fechaElegida?: string;
  horaInicioElegida?: string;
}) {
  const proponeCita = Boolean(fechaElegida && horaInicioElegida);
  const [mostrar, setMostrar] = useState(proponeCita);
  const [state, action, pending] = useActionState(crearSolicitudYContactar, undefined);

  if (!mostrar) {
    return (
      <Button type="button" onClick={() => setMostrar(true)}>
        Contactar
      </Button>
    );
  }

  return (
    <Card className="w-full p-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="profesional_id" value={profesionalId} />

        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Cuéntale al profesional lo que necesitas
        </h2>

        {proponeCita && (
          <>
            <input type="hidden" name="fecha" value={fechaElegida} />
            <input type="hidden" name="hora_inicio" value={horaInicioElegida} />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Además de tu solicitud, le vas a proponer una cita:{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatearFecha(fechaElegida!)} a las {horaInicioElegida}
              </span>
              .
            </p>
          </>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="categoria">Categoría</Label>
          <Select id="categoria" name="categoria" required defaultValue={categoriasProfesional[0] ?? ""}>
            {categoriasProfesional.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIAS.find((c) => c.value === cat)?.label ?? cat}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="zona">Zona</Label>
          <Input id="zona" name="zona" type="text" required placeholder="Ej. Vigo y alrededores" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="descripcion">¿Qué necesitas?</Label>
          <Textarea id="descripcion" name="descripcion" required rows={3} placeholder="Cuéntale al profesional qué necesitas" />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar solicitud"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setMostrar(false)} disabled={pending}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
