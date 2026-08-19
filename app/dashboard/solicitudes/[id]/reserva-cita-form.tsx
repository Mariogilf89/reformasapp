"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { TIPOS_CITA } from "@/lib/citas";
import { reservarCita, obtenerHuecosDisponibles, type HuecosDia } from "@/app/actions/citas";
import { CalendarioHuecos } from "./calendario-huecos";

type ProfesionalOpcion = { id: string; nombre: string };

export function ReservaCitaForm({
  solicitudId,
  profesionales,
}: {
  solicitudId: string;
  profesionales: ProfesionalOpcion[];
}) {
  const [state, action, pending] = useActionState(reservarCita, undefined);
  const [profesionalId, setProfesionalId] = useState(profesionales[0]?.id ?? "");
  const [dias, setDias] = useState<HuecosDia[]>([]);
  const [cargando, startTransition] = useTransition();
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  function cargarHuecos(id: string) {
    startTransition(async () => {
      if (!id) {
        setDias([]);
        return;
      }
      const huecos = await obtenerHuecosDisponibles(id);
      setDias(huecos);
    });
  }

  useEffect(() => {
    cargarHuecos(profesionalId);
    // Solo se ejecuta al montar: los cambios de profesional los gestiona
    // directamente el onChange del selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCambioProfesional(id: string) {
    setProfesionalId(id);
    setFechaSeleccionada("");
    setHoraSeleccionada("");
    cargarHuecos(id);
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <input type="hidden" name="solicitud_id" value={solicitudId} />
      <input type="hidden" name="fecha" value={fechaSeleccionada} />
      <input type="hidden" name="hora_inicio" value={horaSeleccionada} />

      <div className="flex flex-col gap-1">
        <label htmlFor="profesional_id" className="text-sm font-medium">
          Profesional
        </label>
        <select
          id="profesional_id"
          name="profesional_id"
          required
          value={profesionalId}
          onChange={(e) => handleCambioProfesional(e.target.value)}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          {profesionales.map((profesional) => (
            <option key={profesional.id} value={profesional.id}>
              {profesional.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue={TIPOS_CITA[0].value}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        >
          {TIPOS_CITA.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      <CalendarioHuecos
        dias={dias}
        cargando={cargando}
        fechaSeleccionada={fechaSeleccionada}
        horaSeleccionada={horaSeleccionada}
        onSeleccionarFecha={(fecha) => {
          setFechaSeleccionada(fecha);
          setHoraSeleccionada("");
        }}
        onSeleccionarHora={setHoraSeleccionada}
      />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Cita propuesta. Queda pendiente de confirmación del profesional.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !fechaSeleccionada || !horaSeleccionada}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Proponiendo..." : "Proponer cita"}
      </button>
    </form>
  );
}
