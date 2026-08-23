"use client";

import { useState } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import {
  cancelarCitaExterna,
  editarCitaExterna,
  proponerOtroHorario,
  proponerCambioCitaConfirmada,
} from "@/app/actions/citas";
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

const COLORES_CITA_EXTERNA: { valor: string | null; etiqueta: string }[] = [
  { valor: "#CFE8D8", etiqueta: "Verde suave" },
  { valor: "#CFE0F0", etiqueta: "Azul suave" },
  { valor: "#DDD3EE", etiqueta: "Lavanda" },
  { valor: "#F3DCC8", etiqueta: "Melocotón" },
  { valor: "#F1D4DC", etiqueta: "Rosa" },
  { valor: "#F3E8C4", etiqueta: "Amarillo suave" },
  { valor: "#DCE0E3", etiqueta: "Gris" },
  { valor: null, etiqueta: "Sin color" },
];

function SelectorColorCitaExterna({ cita, onCambio }: { cita: CitaCalendario; onCambio: () => void }) {
  const [colorActual, setColorActual] = useState(cita.color);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recoloca colorActual cuando cambia la cita (otra distinta, o la misma
  // tras refrescar desde fuera) sin useEffect: ajustar el estado durante el
  // render, comparando con lo visto en el render anterior, es el patrón que
  // recomienda React en vez de sincronizarlo en un efecto aparte.
  const [ultimaCita, setUltimaCita] = useState({ id: cita.id, color: cita.color });
  if (ultimaCita.id !== cita.id || ultimaCita.color !== cita.color) {
    setUltimaCita({ id: cita.id, color: cita.color });
    setColorActual(cita.color);
  }

  async function handleSeleccionar(color: string | null) {
    if (guardando || color === colorActual) return;

    const anterior = colorActual;
    setError(null);
    setColorActual(color);
    setGuardando(true);

    const formData = new FormData();
    formData.set("id", cita.id);
    formData.set("titulo", cita.titulo_externo ?? "");
    if (cita.fecha) formData.set("fecha", cita.fecha);
    if (cita.hora_inicio) formData.set("hora_inicio", cita.hora_inicio.slice(0, 5));
    if (cita.hora_fin) formData.set("hora_fin", cita.hora_fin.slice(0, 5));
    if (cita.localidad) formData.set("localidad", cita.localidad);
    if (cita.calle) formData.set("calle", cita.calle);
    if (cita.fecha_fin) formData.set("fecha_fin", cita.fecha_fin);
    if (cita.contacto_nombre) formData.set("contacto_nombre", cita.contacto_nombre);
    if (cita.contacto_telefono) formData.set("contacto_telefono", cita.contacto_telefono);
    formData.set("color", color ?? "");

    const resultado = await editarCitaExterna(undefined, formData);
    setGuardando(false);

    if (resultado?.error) {
      setColorActual(anterior);
      setError(resultado.error);
      return;
    }
    onCambio();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {COLORES_CITA_EXTERNA.map(({ valor, etiqueta }) => {
          const seleccionado = valor === colorActual;
          return (
            <button
              key={valor ?? "sin-color"}
              type="button"
              aria-label={etiqueta}
              title={etiqueta}
              disabled={guardando}
              onClick={() => handleSeleccionar(valor)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 disabled:opacity-60 ${
                seleccionado
                  ? "border-neutral-900 dark:border-neutral-100"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              style={valor ? { backgroundColor: valor } : undefined}
            >
              {!valor && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
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
  onCambio,
}: {
  cita: CitaCalendario;
  onClose: () => void;
  onExito: () => void;
  onCambio?: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
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
                {formatearFecha(cita.fecha)}
                {cita.origen_externo && cita.fecha_fin && cita.fecha_fin > cita.fecha && (
                  <> – {formatearFecha(cita.fecha_fin)}</>
                )}{" "}
                · {cita.hora_inicio.slice(0, 5)}
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
          {cita.origen_externo && (cita.contacto_nombre || cita.contacto_telefono) && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {cita.contacto_nombre}
              {cita.contacto_nombre && cita.contacto_telefono && " · "}
              {cita.contacto_telefono && (
                <a href={`tel:${cita.contacto_telefono}`} className="text-primary-700 hover:underline dark:text-primary-400">
                  {cita.contacto_telefono}
                </a>
              )}
            </p>
          )}
        </div>

        {cita.origen_externo && (
          <SelectorColorCitaExterna cita={cita} onCambio={() => onCambio?.()} />
        )}

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
        ) : duplicando ? (
          <CitaExternaCampos
            duplicarDesde={cita}
            onExito={onExito}
            onCancelar={() => setDuplicando(false)}
          />
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
                <>
                  <Button type="button" variant="secondary" size="xs" onClick={() => setDuplicando(true)}>
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="xs"
                    disabled={cancelando}
                    onClick={handleCancelarExterna}
                  >
                    {cancelando ? "Eliminando..." : "Eliminar"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
