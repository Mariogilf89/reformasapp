"use client";

import { useState, useTransition } from "react";
import { obtenerCitasCalendario, type CitaCalendario } from "@/app/actions/citas";
import { fechaISO, inicioSemana, sumarDias } from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { VistaSemana } from "./vista-semana";
import { VistaMes } from "./vista-mes";
import { DetalleCitaModal } from "./detalle-cita-modal";
import { CitaExternaForm } from "./cita-externa-form";

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

type Vista = "semana" | "mes";

function rangoSemana(anchor: Date) {
  const lunes = inicioSemana(anchor);
  return { desde: fechaISO(lunes), hasta: fechaISO(sumarDias(lunes, 6)) };
}

function rangoMes(anchor: Date) {
  const primerDia = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const ultimoDia = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { desde: fechaISO(primerDia), hasta: fechaISO(ultimoDia) };
}

function etiquetaRango(anchor: Date, vista: Vista) {
  if (vista === "mes") {
    return `${NOMBRES_MES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }
  const lunes = inicioSemana(anchor);
  const domingo = sumarDias(lunes, 6);
  const mismoMes = lunes.getMonth() === domingo.getMonth();
  return mismoMes
    ? `${lunes.getDate()}–${domingo.getDate()} ${NOMBRES_MES[lunes.getMonth()]} ${lunes.getFullYear()}`
    : `${lunes.getDate()} ${NOMBRES_MES[lunes.getMonth()]} – ${domingo.getDate()} ${NOMBRES_MES[domingo.getMonth()]} ${domingo.getFullYear()}`;
}

export function CalendarioCitas({
  citasIniciales,
  anchorInicial,
}: {
  citasIniciales: CitaCalendario[];
  anchorInicial: Date;
}) {
  const [vista, setVista] = useState<Vista>("semana");
  const [anchor, setAnchor] = useState(anchorInicial);
  const [citas, setCitas] = useState(citasIniciales);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null);
  const [mostrarFormExterna, setMostrarFormExterna] = useState(false);
  const [cargando, startTransition] = useTransition();

  function refrescar(nuevoAnchor: Date, nuevaVista: Vista) {
    const { desde, hasta } = nuevaVista === "semana" ? rangoSemana(nuevoAnchor) : rangoMes(nuevoAnchor);
    startTransition(async () => {
      const nuevas = await obtenerCitasCalendario(desde, hasta);
      setCitas(nuevas);
    });
  }

  function navegar(nuevoAnchor: Date, nuevaVista: Vista = vista) {
    setAnchor(nuevoAnchor);
    setVista(nuevaVista);
    refrescar(nuevoAnchor, nuevaVista);
  }

  function irAnterior() {
    navegar(vista === "semana" ? sumarDias(anchor, -7) : new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  }

  function irSiguiente() {
    navegar(vista === "semana" ? sumarDias(anchor, 7) : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  }

  function cerrarDetalle() {
    setCitaSeleccionadaId(null);
  }

  function trasExitoDetalle() {
    setCitaSeleccionadaId(null);
    refrescar(anchor, vista);
  }

  function trasCrearExterna() {
    setMostrarFormExterna(false);
    refrescar(anchor, vista);
  }

  const citaSeleccionada = citas.find((c) => c.id === citaSeleccionadaId) ?? null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={irAnterior}
            aria-label="Anterior"
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ←
          </button>
          <p className="min-w-[10rem] text-center text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
            {etiquetaRango(anchor, vista)}
          </p>
          <button
            type="button"
            onClick={irSiguiente}
            aria-label="Siguiente"
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            →
          </button>
          {cargando && (
            <span className="text-xs text-neutral-500 dark:text-neutral-500">Cargando...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => navegar(anchor, "semana")}
              className={`px-3 py-1.5 text-xs font-medium ${
                vista === "semana"
                  ? "bg-primary-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => navegar(anchor, "mes")}
              className={`px-3 py-1.5 text-xs font-medium ${
                vista === "mes"
                  ? "bg-primary-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Mes
            </button>
          </div>

          <Button type="button" size="xs" onClick={() => setMostrarFormExterna(true)}>
            Cita externa
          </Button>
        </div>
      </div>

      {vista === "semana" ? (
        <VistaSemana anchor={anchor} citas={citas} onSeleccionarCita={setCitaSeleccionadaId} />
      ) : (
        <VistaMes anchor={anchor} citas={citas} onSeleccionarDia={(dia) => navegar(dia, "semana")} />
      )}

      {citaSeleccionada && (
        <DetalleCitaModal cita={citaSeleccionada} onClose={cerrarDetalle} onExito={trasExitoDetalle} />
      )}

      {mostrarFormExterna && (
        <CitaExternaForm
          fechaInicial={fechaISO(anchor)}
          onClose={() => setMostrarFormExterna(false)}
          onExito={trasCrearExterna}
        />
      )}
    </div>
  );
}
