"use client";

import { useState } from "react";
import { useCompletarMinutos } from "@/lib/completar-minutos";

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function fechaISOLocal(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fechaLocal(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function inicioDeHoy() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
}

/**
 * Calendario genérico para elegir fecha/rango horario en la búsqueda de
 * profesionales: mismo estilo visual que CalendarioHuecos (mes navegable),
 * pero sin conocer la disponibilidad de nadie en concreto todavía (aquí solo
 * se busca, no se ha fijado profesional). Solo bloquea fechas ya pasadas; el
 * rango horario (Desde/Hasta) cubre las 24 horas, ya que algunos
 * profesionales trabajan también en horario nocturno.
 */
export function SelectorFechaHora({
  fecha,
  horaInicio,
  horaFin,
  onSeleccionarFecha,
  onSeleccionarHoraInicio,
  onSeleccionarHoraFin,
}: {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  onSeleccionarFecha: (fecha: string) => void;
  onSeleccionarHoraInicio: (hora: string) => void;
  onSeleccionarHoraFin: (hora: string) => void;
}) {
  const hoy = inicioDeHoy();
  const inicial = fecha ? fechaLocal(fecha) : hoy;
  const [anio, setAnio] = useState(inicial.getFullYear());
  const [mes, setMes] = useState(inicial.getMonth() + 1);

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const columnaInicio = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  const celdas: (Date | null)[] = new Array(columnaInicio).fill(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push(new Date(anio, mes - 1, dia));
  }
  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }

  const noSePuedeRetroceder = anio * 12 + mes <= hoy.getFullYear() * 12 + (hoy.getMonth() + 1);

  const completarMinutosInicio = useCompletarMinutos(onSeleccionarHoraInicio);
  const completarMinutosFin = useCompletarMinutos(onSeleccionarHoraFin);

  function irMesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function irMesSiguiente() {
    if (mes === 12) {
      setMes(1);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={irMesAnterior}
            disabled={noSePuedeRetroceder}
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <p className="text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
            {NOMBRES_MES[mes - 1]} {anio}
          </p>
          <button
            type="button"
            onClick={irMesSiguiente}
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
            {DIAS_CABECERA.map((letra, index) => (
              <div key={index}>{letra}</div>
            ))}
          </div>
          {semanas.map((semana, indexSemana) => (
            <div key={indexSemana} className="grid grid-cols-7 gap-1">
              {semana.map((dia, columna) => {
                if (!dia) {
                  return <div key={columna} />;
                }
                const esPasado = dia < hoy;
                const fechaDia = fechaISOLocal(dia);
                const seleccionado = fechaDia === fecha;
                return (
                  <button
                    key={fechaDia}
                    type="button"
                    disabled={esPasado}
                    onClick={() => onSeleccionarFecha(fechaDia)}
                    className={
                      "flex aspect-square items-center justify-center rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-40 " +
                      (seleccionado
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-neutral-300 font-medium text-neutral-900 dark:border-neutral-700 dark:text-neutral-100")
                    }
                  >
                    {dia.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="selector-hora-desde"
            className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
          >
            Desde
          </label>
          <input
            id="selector-hora-desde"
            type="time"
            step={900}
            min="00:00"
            max="23:59"
            value={horaInicio}
            onChange={(evento) => onSeleccionarHoraInicio(evento.target.value)}
            {...completarMinutosInicio}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="selector-hora-hasta"
            className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
          >
            Hasta
          </label>
          <input
            id="selector-hora-hasta"
            type="time"
            step={900}
            min="00:00"
            max="23:59"
            value={horaFin}
            onChange={(evento) => onSeleccionarHoraFin(evento.target.value)}
            {...completarMinutosFin}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
    </div>
  );
}
