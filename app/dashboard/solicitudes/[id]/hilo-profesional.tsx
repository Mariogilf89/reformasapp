"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { TIPOS_CITA } from "@/lib/citas";
import { enviarMensajeConCita } from "@/app/actions/mensajes";
import { obtenerHuecosDisponibles, type HuecosDia } from "@/app/actions/citas";
import { CalendarioHuecos } from "./calendario-huecos";

export type MensajeHilo = {
  id: string;
  autor: string;
  texto: string;
  creadoEn: string;
};

export function HiloProfesional({
  solicitudId,
  profesionalId,
  profesionalNombre,
  mensajes,
  enfocar,
}: {
  solicitudId: string;
  profesionalId: string;
  profesionalNombre: string;
  mensajes: MensajeHilo[];
  enfocar?: boolean;
}) {
  const [state, action, pending] = useActionState(enviarMensajeConCita, undefined);
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [dias, setDias] = useState<HuecosDia[]>([]);
  const [cargando, startTransition] = useTransition();
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_CITA[0].value);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function cargarHuecos(anioObjetivo: number, mesObjetivo: number) {
    startTransition(async () => {
      const huecos = await obtenerHuecosDisponibles(profesionalId, anioObjetivo, mesObjetivo);
      setDias(huecos);
    });
  }

  useEffect(() => {
    cargarHuecos(anio, mes);
    if (enfocar) {
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      queueMicrotask(() => {
        setFechaSeleccionada("");
        setHoraSeleccionada("");
        setTipo(TIPOS_CITA[0].value);
      });
    }
  }, [pending, state]);

  function irAMes(anioObjetivo: number, mesObjetivo: number) {
    setAnio(anioObjetivo);
    setMes(mesObjetivo);
    setFechaSeleccionada("");
    setHoraSeleccionada("");
    cargarHuecos(anioObjetivo, mesObjetivo);
  }

  function irMesAnterior() {
    const nuevoMes = mes === 1 ? 12 : mes - 1;
    const nuevoAnio = mes === 1 ? anio - 1 : anio;
    irAMes(nuevoAnio, nuevoMes);
  }

  function irMesSiguiente() {
    const nuevoMes = mes === 12 ? 1 : mes + 1;
    const nuevoAnio = mes === 12 ? anio + 1 : anio;
    irAMes(nuevoAnio, nuevoMes);
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <input type="hidden" name="solicitud_id" value={solicitudId} />
      <input type="hidden" name="destinatario_id" value={profesionalId} />
      <input type="hidden" name="fecha" value={fechaSeleccionada} />
      <input type="hidden" name="hora_inicio" value={horaSeleccionada} />
      {horaSeleccionada && <input type="hidden" name="tipo" value={tipo} />}

      <p className="font-medium">{profesionalNombre}</p>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Opcional: propón un día y hora para una cita.
        </p>
        <CalendarioHuecos
          dias={dias}
          cargando={cargando}
          anio={anio}
          mes={mes}
          fechaSeleccionada={fechaSeleccionada}
          horaSeleccionada={horaSeleccionada}
          onSeleccionarFecha={(fecha) => {
            setFechaSeleccionada(fecha);
            setHoraSeleccionada("");
          }}
          onSeleccionarHora={setHoraSeleccionada}
          onMesAnterior={irMesAnterior}
          onMesSiguiente={irMesSiguiente}
        />
        {horaSeleccionada && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`tipo-${profesionalId}`}
              className="text-sm font-medium"
            >
              Tipo de cita
            </label>
            <select
              id={`tipo-${profesionalId}`}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
            >
              {TIPOS_CITA.map((tipoOpcion) => (
                <option key={tipoOpcion.value} value={tipoOpcion.value}>
                  {tipoOpcion.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mensajes.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
          {mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className="rounded-lg bg-black/[.03] p-3 text-sm dark:bg-white/[.05]"
            >
              <p className="font-medium">{mensaje.autor}</p>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">{mensaje.texto}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{mensaje.creadoEn}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-black/10 pt-4 dark:border-white/15">
        <label htmlFor={`texto-${profesionalId}`} className="text-sm font-medium">
          Enviar un mensaje
        </label>
        <textarea
          ref={textareaRef}
          id={`texto-${profesionalId}`}
          name="texto"
          required
          rows={3}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending
          ? "Enviando..."
          : horaSeleccionada
            ? "Enviar mensaje y proponer cita"
            : "Enviar mensaje"}
      </button>
    </form>
  );
}
