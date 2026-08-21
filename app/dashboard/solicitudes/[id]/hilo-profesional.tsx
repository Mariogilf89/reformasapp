"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { TIPOS_CITA } from "@/lib/citas";
import { enviarMensajeConCita } from "@/app/actions/mensajes";
import { obtenerHuecosDisponibles, type HuecosDia } from "@/app/actions/citas";
import { CalendarioHuecos } from "./calendario-huecos";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
  profesionalFotos,
  mensajes,
  enfocar,
}: {
  solicitudId: string;
  profesionalId: string;
  profesionalNombre: string;
  profesionalFotos?: string[];
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
    <Card className="p-6">
      <form ref={formRef} action={action} className="flex flex-col gap-4">
        <input type="hidden" name="solicitud_id" value={solicitudId} />
        <input type="hidden" name="destinatario_id" value={profesionalId} />
        <input type="hidden" name="fecha" value={fechaSeleccionada} />
        <input type="hidden" name="hora_inicio" value={horaSeleccionada} />
        {horaSeleccionada && <input type="hidden" name="tipo" value={tipo} />}

        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{profesionalNombre}</p>
          {profesionalFotos && profesionalFotos.length > 0 && (
            <div className="mt-2 flex gap-2">
              {profesionalFotos.slice(0, 6).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`Trabajo de ${profesionalNombre}`}
                  className="h-14 w-14 rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
              <Label htmlFor={`tipo-${profesionalId}`}>Tipo de cita</Label>
              <Select
                id={`tipo-${profesionalId}`}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPOS_CITA.map((tipoOpcion) => (
                  <option key={tipoOpcion.value} value={tipoOpcion.value}>
                    {tipoOpcion.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {mensajes.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className="rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800/60"
              >
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {mensaje.autor}
                </p>
                <p className="mt-1 text-neutral-700 dark:text-neutral-300">{mensaje.texto}</p>
                <p className="mt-1 text-xs text-neutral-500">{mensaje.creadoEn}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Label htmlFor={`texto-${profesionalId}`}>Enviar un mensaje</Label>
          <Textarea ref={textareaRef} id={`texto-${profesionalId}`} name="texto" required rows={3} />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending
            ? "Enviando..."
            : horaSeleccionada
              ? "Enviar mensaje y proponer cita"
              : "Enviar mensaje"}
        </Button>
      </form>
    </Card>
  );
}
