"use client";

import { useState } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import { cancelarCitaExterna, proponerOtroHorario, proponerCambioCitaConfirmada } from "@/app/actions/citas";
import { TIPOS_CITA } from "@/lib/citas";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AceptarCitaForm } from "./citas/aceptar-cita-form";
import { ProponerHorarioForm } from "./citas/proponer-horario-form";
import { AnularCitaProfesionalForm } from "./citas/anular-cita-profesional-form";
import { CitaExternaCampos } from "./cita-externa-campos";

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function EditarFechaHoraCitaReal({
  cita,
  onExito,
  onCancelar,
}: {
  cita: CitaCalendario;
  onExito: () => void;
  onCancelar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const fecha = formData.get("fecha")?.toString();
    const horaInicio = formData.get("hora_inicio")?.toString();
    const horaFin = formData.get("hora_fin")?.toString();
    if (!fecha || !horaInicio || !horaFin) {
      setError("Indica fecha, hora de inicio y hora de fin.");
      return;
    }

    formData.set("id", cita.id);
    setEnviando(true);

    const resultado =
      cita.estado === "pendiente"
        ? await (() => {
            formData.set("comentario", "Horario actualizado por el profesional.");
            return proponerOtroHorario(undefined, formData);
          })()
        : await proponerCambioCitaConfirmada(undefined, formData);

    setEnviando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="fecha_editar_real">Fecha</Label>
        <Input id="fecha_editar_real" name="fecha" type="date" defaultValue={cita.fecha ?? ""} />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_inicio_editar_real">Hora inicio</Label>
          <Input
            id="hora_inicio_editar_real"
            name="hora_inicio"
            type="time"
            defaultValue={cita.hora_inicio?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="hora_fin_editar_real">Hora fin</Label>
          <Input
            id="hora_fin_editar_real"
            name="hora_fin"
            type="time"
            defaultValue={cita.hora_fin?.slice(0, 5) ?? ""}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="xs" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" size="xs" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function DetalleCitaModal({
  cita,
  onClose,
  onExito,
}: {
  cita: CitaCalendario;
  onClose: () => void;
  onExito: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancelarExterna() {
    setError(null);
    setCancelando(true);
    const formData = new FormData();
    formData.set("id", cita.id);
    const resultado = await cancelarCitaExterna(undefined, formData);
    setCancelando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    onExito();
  }

  function trasGuardarEdicion() {
    setEditando(false);
    onExito();
  }

  const tipoLabel = cita.origen_externo
    ? "Bloqueo externo"
    : TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? "Cita";

  const ubicacion = [cita.localidad, cita.calle].filter(Boolean).join(", ");

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {cita.origen_externo ? cita.titulo_externo : tipoLabel}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {cita.fecha && cita.hora_inicio ? (
              <>
                {formatearFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                {cita.hora_fin && `–${cita.hora_fin.slice(0, 5)}`}
              </>
            ) : (
              "Pendiente de agendar"
            )}
          </p>
          {!cita.origen_externo && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{tipoLabel}</p>
          )}
          {ubicacion && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{ubicacion}</p>
          )}
        </div>

        {cita.comentario && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            &quot;{cita.comentario}&quot;
          </p>
        )}

        {!cita.origen_externo && cita.estado === "confirmada" && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {cita.telefonoCliente
              ? `Teléfono de contacto: ${cita.telefonoCliente}`
              : "El cliente no ha añadido un teléfono de contacto todavía."}
          </p>
        )}

        {editando ? (
          cita.origen_externo ? (
            <CitaExternaCampos
              citaExistente={cita}
              onExito={trasGuardarEdicion}
              onCancelar={() => setEditando(false)}
            />
          ) : (
            <EditarFechaHoraCitaReal
              cita={cita}
              onExito={trasGuardarEdicion}
              onCancelar={() => setEditando(false)}
            />
          )
        ) : (
          <div className="flex flex-col gap-3">
            {cita.estado === "pendiente" && !cita.origen_externo && (
              <>
                <AceptarCitaForm citaId={cita.id} onExito={onExito} />
                <ProponerHorarioForm citaId={cita.id} onExito={onExito} />
                <AnularCitaProfesionalForm citaId={cita.id} onExito={onExito} />
              </>
            )}

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" size="xs" onClick={() => setEditando(true)}>
                Editar
              </Button>
              {cita.origen_externo && (
                <Button
                  type="button"
                  variant="danger"
                  size="xs"
                  disabled={cancelando}
                  onClick={handleCancelarExterna}
                >
                  {cancelando ? "Anulando..." : "Anular bloqueo"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
