"use client";

import { useState } from "react";
import { crearCitaExterna, editarCitaExterna, type CitaCalendario } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CitaExternaCampos({
  citaExistente,
  onExito,
  onCancelar,
}: {
  citaExistente?: CitaCalendario;
  onExito: () => void;
  onCancelar?: () => void;
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
      setError(
        "Indica fecha y horas completas, o déjalas todas vacías para guardarla como pendiente de agendar."
      );
      return;
    }

    if (citaExistente) {
      formData.set("id", citaExistente.id);
    }

    setEnviando(true);
    const resultado = citaExistente
      ? await editarCitaExterna(undefined, formData)
      : await crearCitaExterna(undefined, formData);
    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {!citaExistente && (
        <>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Cita externa
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Bloquea un hueco en tu calendario que no pasa por la negociación con clientes (por
            ejemplo, un trabajo ya acordado fuera de la app).
          </p>
        </>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={citaExistente?.titulo_externo ?? ""}
          placeholder="Ej. Trabajo en Vigo"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="fecha">Fecha</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={citaExistente?.fecha ?? ""} />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_inicio">Hora inicio</Label>
          <Input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            defaultValue={citaExistente?.hora_inicio?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_fin">Hora fin</Label>
          <Input
            id="hora_fin"
            name="hora_fin"
            type="time"
            defaultValue={citaExistente?.hora_fin?.slice(0, 5) ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="localidad">Localidad</Label>
        <Input
          id="localidad"
          name="localidad"
          type="text"
          defaultValue={citaExistente?.localidad ?? ""}
          placeholder="Ej. Vigo"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="calle">Calle</Label>
        <Input
          id="calle"
          name="calle"
          type="text"
          defaultValue={citaExistente?.calle ?? ""}
          placeholder="Ej. Rúa do Príncipe 12"
        />
      </div>

      {!citaExistente && (
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          Déjalo sin fecha ni horas para guardarla como pendiente de agendar: aparecerá en el
          panel lateral y podrás arrastrarla al calendario más adelante.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={enviando} className={onCancelar ? undefined : "w-full"}>
          {enviando ? "Guardando..." : citaExistente ? "Guardar cambios" : "Crear cita externa"}
        </Button>
        {onCancelar && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
