"use client";

import { useRef, useState, type FormEvent } from "react";
import { crearCitaExterna, editarCitaExterna, type CitaCalendario } from "@/app/actions/citas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function CitaExternaCampos({
  citaExistente,
  duplicarDesde,
  onExito,
  onCancelar,
}: {
  citaExistente?: CitaCalendario;
  // Cita de la que se copian título, duración, ubicación y contacto al abrir
  // el formulario de creación desde "Duplicar" (fecha y fecha_fin quedan
  // vacías a propósito para que el profesional elija el nuevo día).
  duplicarDesde?: CitaCalendario;
  onExito: () => void;
  onCancelar?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // FormData ya validada que se quedó pendiente de que el profesional
  // confirme el aviso de solapamiento (ver handleSubmit). Su sola presencia
  // controla si se muestra ese modal de confirmación.
  const [formPendienteSolape, setFormPendienteSolape] = useState<FormData | null>(null);

  const plantilla = citaExistente ?? duplicarDesde;

  async function enviar(formData: FormData) {
    return citaExistente
      ? await editarCitaExterna(undefined, formData)
      : await crearCitaExterna(undefined, formData);
  }

  // Se usa onSubmit + preventDefault (en vez de pasar esta función como
  // `action` del <form>) a propósito: con `action`, React resetea los campos
  // no controlados en cuanto la función termina, sea cual sea el resultado,
  // así que un error de validación/solape se veía acompañado de un
  // formulario vacío. Con onSubmit no hay reset automático, así que los
  // valores tecleados se conservan tal cual hasta que el profesional los
  // corrija o la cita se guarde con éxito.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const fecha = formData.get("fecha")?.toString();
    const horaInicio = formData.get("hora_inicio")?.toString();
    const horaFin = formData.get("hora_fin")?.toString();
    const fechaFin = formData.get("fecha_fin")?.toString();
    const todosVacios = !fecha && !horaInicio && !horaFin;
    const todosCompletos = Boolean(fecha && horaInicio && horaFin);

    if (!todosVacios && !todosCompletos) {
      setError(
        "Indica fecha y horas completas, o déjalas todas vacías para guardarla como pendiente de agendar."
      );
      return;
    }
    if (fechaFin && !fecha) {
      setError('Indica una fecha de inicio para poder indicar "Hasta".');
      return;
    }

    if (citaExistente) {
      formData.set("id", citaExistente.id);
    }

    setEnviando(true);
    const resultado = await enviar(formData);
    setEnviando(false);

    if (resultado?.solape) {
      setFormPendienteSolape(formData);
      return;
    }
    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  async function confirmarSolape() {
    if (!formPendienteSolape) return;
    formPendienteSolape.set("permitir_solape", "1");

    setEnviando(true);
    const resultado = await enviar(formPendienteSolape);
    setEnviando(false);
    setFormPendienteSolape(null);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!citaExistente && (
        <>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {duplicarDesde ? "Duplicar cita externa" : "Cita externa"}
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
          defaultValue={plantilla?.titulo_externo ?? ""}
          placeholder="Ej. Trabajo en Vigo"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={citaExistente?.fecha ?? ""} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="fecha_fin">Hasta (opcional)</Label>
          <Input
            id="fecha_fin"
            name="fecha_fin"
            type="date"
            defaultValue={citaExistente?.fecha_fin ?? ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_inicio">Hora inicio</Label>
          <Input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            defaultValue={plantilla?.hora_inicio?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_fin">Hora fin</Label>
          <Input
            id="hora_fin"
            name="hora_fin"
            type="time"
            defaultValue={plantilla?.hora_fin?.slice(0, 5) ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="localidad">Localidad</Label>
        <Input
          id="localidad"
          name="localidad"
          type="text"
          defaultValue={plantilla?.localidad ?? ""}
          placeholder="Ej. Vigo"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="calle">Calle</Label>
        <Input
          id="calle"
          name="calle"
          type="text"
          defaultValue={plantilla?.calle ?? ""}
          placeholder="Ej. Rúa do Príncipe 12"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="contacto_nombre">Nombre de contacto (opcional)</Label>
          <Input
            id="contacto_nombre"
            name="contacto_nombre"
            type="text"
            defaultValue={plantilla?.contacto_nombre ?? ""}
            placeholder="Ej. Ana Pérez"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="contacto_telefono">Teléfono de contacto (opcional)</Label>
          <Input
            id="contacto_telefono"
            name="contacto_telefono"
            type="tel"
            defaultValue={plantilla?.contacto_telefono ?? ""}
            placeholder="Ej. 600 123 456"
          />
        </div>
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

      {formPendienteSolape && (
        <Modal onClose={() => setFormPendienteSolape(null)}>
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Cita solapada
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Estás creando una cita que se solapa con otra ya existente en tu calendario. Si
              continúas, aparecerán dos citas simultáneas. ¿Quieres continuar o cancelar?
            </p>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={confirmarSolape} disabled={enviando}>
                {enviando ? "Guardando..." : "Continuar"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFormPendienteSolape(null)}
                disabled={enviando}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}
