"use client";

import { useState } from "react";
import { crearCitaExterna } from "@/app/actions/citas";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CitaExternaForm({
  onClose,
  onExito,
}: {
  onClose: () => void;
  onExito: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const fecha = formData.get("fecha")?.toString();
    const horaInicio = formData.get("hora_inicio")?.toString();
    const horaFin = formData.get("hora_fin")?.toString();
    const todosVacios = !fecha && !horaInicio && !horaFin;
    const todosCompletos = Boolean(fecha && horaInicio && horaFin);

    if (!todosVacios && !todosCompletos) {
      setError("Indica fecha y horas completas, o déjalas todas vacías para guardarla como pendiente de agendar.");
      return;
    }

    setEnviando(true);
    const resultado = await crearCitaExterna(undefined, formData);
    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  return (
    <Modal onClose={onClose}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Cita externa
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Bloquea un hueco en tu calendario que no pasa por la negociación con clientes (por
          ejemplo, un trabajo ya acordado fuera de la app).
        </p>

        <div className="flex flex-col gap-1">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" type="text" required placeholder="Ej. Trabajo en Vigo" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="hora_inicio">Hora inicio</Label>
            <Input id="hora_inicio" name="hora_inicio" type="time" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="hora_fin">Hora fin</Label>
            <Input id="hora_fin" name="hora_fin" type="time" />
          </div>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          Déjalo sin fecha ni horas para guardarla como pendiente de agendar: aparecerá en el
          panel lateral y podrás arrastrarla al calendario más adelante.
        </p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Creando..." : "Crear cita externa"}
        </Button>
      </form>
    </Modal>
  );
}
