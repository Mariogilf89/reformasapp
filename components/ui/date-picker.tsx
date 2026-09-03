"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

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

function fechaLocal(iso: string): Date | null {
  const partes = iso.split("-").map(Number);
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) return null;
  const [anio, mes, dia] = partes;
  return new Date(anio, mes - 1, dia);
}

function formatearVisible(iso: string): string {
  const fecha = fechaLocal(iso);
  if (!fecha) return "";
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${fecha.getFullYear()}`;
}

/**
 * Selector de fecha con calendario desplegable (mes/año navegables), en vez
 * del <input type="date"> nativo cuyo aspecto varía según navegador/SO. El
 * valor real se guarda en un input oculto no controlado (name/form) para que
 * el resto del formulario del perfil (FormData por atributo `form`) lo
 * recoja igual que cualquier otro campo; se dispara un evento "change" al
 * cambiarlo a mano para que el detector de cambios sin guardar lo note.
 */
export function DatePicker({
  id,
  name,
  form,
  defaultValue,
  className,
  ariaLabel,
}: {
  id?: string;
  name: string;
  form?: string;
  defaultValue?: string | null;
  className?: string;
  ariaLabel?: string;
}) {
  const hoy = new Date();
  const inicial = (defaultValue && fechaLocal(defaultValue)) || null;

  const [valorISO, setValorISO] = useState(defaultValue ?? "");
  const [abierto, setAbierto] = useState(false);
  const [anio, setAnio] = useState((inicial ?? hoy).getFullYear());
  const [mes, setMes] = useState((inicial ?? hoy).getMonth() + 1);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputOcultoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function handleClickFuera(event: MouseEvent) {
      if (!contenedorRef.current?.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", handleClickFuera);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [abierto]);

  function seleccionarFecha(fecha: Date) {
    const iso = fechaISOLocal(fecha);
    setValorISO(iso);
    setAbierto(false);

    const input = inputOcultoRef.current;
    if (input) {
      input.value = iso;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  const anioActual = hoy.getFullYear();
  const anios = Array.from({ length: anioActual - 1920 + 1 }, (_, i) => anioActual - i);

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
    <div ref={contenedorRef} className="relative">
      <input ref={inputOcultoRef} type="hidden" name={name} form={form} defaultValue={valorISO} />

      <button
        id={id}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-md border border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
          className
        )}
      >
        <span className={valorISO ? "" : "text-neutral-400"}>
          {valorISO ? formatearVisible(valorISO) : "dd/mm/aaaa"}
        </span>
        <span aria-hidden className="text-neutral-400">
          📅
        </span>
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={irMesAnterior}
              className="cursor-pointer rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              aria-label="Mes anterior"
            >
              ←
            </button>

            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="cursor-pointer flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm capitalize text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label="Mes"
            >
              {NOMBRES_MES.map((nombre, index) => (
                <option key={nombre} value={index + 1} className="capitalize">
                  {nombre}
                </option>
              ))}
            </select>

            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="cursor-pointer w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label="Año"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={irMesSiguiente}
              className="cursor-pointer rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
            {DIAS_CABECERA.map((letra, index) => (
              <div key={index}>{letra}</div>
            ))}
          </div>
          {semanas.map((semana, indexSemana) => (
            <div key={indexSemana} className="grid grid-cols-7 gap-1 mt-1">
              {semana.map((dia, columna) => {
                if (!dia) return <div key={columna} />;
                const esFutura = dia > hoy;
                const iso = fechaISOLocal(dia);
                const seleccionado = iso === valorISO;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={esFutura}
                    onClick={() => seleccionarFecha(dia)}
                    className={cn(
                      "flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-40",
                      seleccionado
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-transparent font-medium text-neutral-900 hover:bg-neutral-100"
                    )}
                  >
                    {dia.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
