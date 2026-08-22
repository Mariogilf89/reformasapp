"use client";

import { useState } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import { cancelarCitaExterna } from "@/app/actions/citas";
import { TIPOS_CITA } from "@/lib/citas";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AceptarCitaForm } from "./citas/aceptar-cita-form";
import { ProponerHorarioForm } from "./citas/proponer-horario-form";
import { AnularCitaProfesionalForm } from "./citas/anular-cita-profesional-form";

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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

  const tipoLabel = cita.origen_externo
    ? "Bloqueo externo"
    : TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? "Cita";

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
        </div>

        {cita.comentario && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            &quot;{cita.comentario}&quot;
          </p>
        )}

        {cita.estado === "pendiente" && !cita.origen_externo && (
          <div className="flex flex-col gap-3">
            <AceptarCitaForm citaId={cita.id} onExito={onExito} />
            <ProponerHorarioForm citaId={cita.id} onExito={onExito} />
            <AnularCitaProfesionalForm citaId={cita.id} onExito={onExito} />
          </div>
        )}

        {cita.estado === "confirmada" && !cita.origen_externo && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {cita.telefonoCliente
              ? `Teléfono de contacto: ${cita.telefonoCliente}`
              : "El cliente no ha añadido un teléfono de contacto todavía."}
          </p>
        )}

        {cita.origen_externo && (
          <div className="flex flex-col gap-2">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button
              type="button"
              variant="danger"
              size="xs"
              disabled={cancelando}
              onClick={handleCancelarExterna}
              className="self-start"
            >
              {cancelando ? "Anulando..." : "Anular bloqueo"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
