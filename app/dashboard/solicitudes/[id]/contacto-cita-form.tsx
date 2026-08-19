"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { enviarMensajeConCita } from "@/app/actions/mensajes";
import { obtenerHuecosDisponibles, type HuecosDia } from "@/app/actions/citas";
import { CalendarioHuecos } from "./calendario-huecos";

export function ContactoCitaForm({
  solicitudId,
  profesionalId,
  profesionalNombre,
}: {
  solicitudId: string;
  profesionalId: string;
  profesionalNombre?: string;
}) {
  const [state, action, pending] = useActionState(enviarMensajeConCita, undefined);
  const [dias, setDias] = useState<HuecosDia[]>([]);
  const [cargando, startTransition] = useTransition();
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    startTransition(async () => {
      const huecos = await obtenerHuecosDisponibles(profesionalId);
      setDias(huecos);
    });
    textareaRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      queueMicrotask(() => {
        setFechaSeleccionada("");
        setHoraSeleccionada("");
      });
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <input type="hidden" name="solicitud_id" value={solicitudId} />
      <input type="hidden" name="destinatario_id" value={profesionalId} />
      <input type="hidden" name="fecha" value={fechaSeleccionada} />
      <input type="hidden" name="hora_inicio" value={horaSeleccionada} />

      {profesionalNombre && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Escribiendo a <span className="font-medium text-foreground">{profesionalNombre}</span>
        </p>
      )}

      <label htmlFor="texto" className="text-sm font-medium">
        Enviar un mensaje
      </label>
      <textarea
        ref={textareaRef}
        id="texto"
        name="texto"
        required
        rows={3}
        className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
      />

      <div className="border-t border-black/10 pt-3 dark:border-white/15">
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Opcional: propón directamente un día y hora para una cita.
        </p>
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
