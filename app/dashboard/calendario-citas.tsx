"use client";

import { useEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import {
  obtenerCitasCalendario,
  obtenerCitasExternasPendientes,
  moverCitaExterna,
  proponerOtroHorario,
  proponerCambioCitaConfirmada,
  type CitaCalendario,
} from "@/app/actions/citas";
import {
  actualizarRangoHorarioCalendario,
  actualizarRangoDiasCalendario,
} from "@/app/actions/profesionales";
import { fechaISO, fechaLocal, inicioSemana, sumarDias } from "@/lib/fechas";
import {
  UMBRAL_ARRASTRE_PX,
  INTERVALO_SNAP_MIN,
  horaDesdeMinutos,
  minutosDesdeHora,
  finEfectivoMinutos,
  posicionDesdePuntero,
  minutoDesdePunteroY,
  tituloCita,
  type ArrastreEstado,
  type RedimensionEstado,
} from "@/lib/calendario-geometria";
import { Button } from "@/components/ui/button";
import { VistaSemana } from "./vista-semana";
import { VistaMes } from "./vista-mes";
import { PanelPendientesSinFecha } from "./panel-pendientes-sin-fecha";
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

const HORAS_DIA = Array.from({ length: 24 }, (_, i) => i);

// Numeración ISO (1=lunes ... 7=domingo). Distinta del dia_semana de
// disponibilidad (que usa el criterio de Date.getDay(), domingo=0): aquí
// domingo=7 para que el rango inicio->fin se compare sin casos especiales.
const DIAS_SEMANA_CALENDARIO = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
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
  citasPendientesIniciales,
  anchorInicial,
  citaIdInicial,
  horaInicioInicial,
  horaFinInicial,
  diaInicioInicial,
  diaFinInicial,
}: {
  citasIniciales: CitaCalendario[];
  citasPendientesIniciales: CitaCalendario[];
  anchorInicial: Date;
  citaIdInicial?: string | null;
  horaInicioInicial: number;
  horaFinInicial: number;
  diaInicioInicial: number;
  diaFinInicial: number;
}) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("semana");
  const [anchor, setAnchor] = useState(anchorInicial);
  const [citas, setCitas] = useState(citasIniciales);
  const [citasPendientes, setCitasPendientes] = useState(citasPendientesIniciales);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null);
  const [mostrarFormExterna, setMostrarFormExterna] = useState(false);
  const [cargando, startTransition] = useTransition();

  // Al llegar desde el enlace de una notificación (?citaId=...) mientras
  // CalendarioCitas ya está montado (p.ej. la campana está en el layout, que
  // persiste entre navegaciones dentro de /dashboard), Next.js no remonta
  // este componente: solo le pasa props nuevas. Los useState de arriba solo
  // leen su valor inicial en el primer montaje, así que anchorInicial y
  // citasIniciales nuevos se ignoraban en silencio. Se sincroniza a mano
  // durante el render (patrón "ajustar estado cuando cambia una prop" de
  // React, ya usado en SelectorColorCitaExterna) en vez de en un efecto,
  // comparando con el último citaIdInicial visto para no repetirlo en cada
  // render.
  const [ultimoCitaIdInicial, setUltimoCitaIdInicial] = useState<string | null | undefined>(undefined);
  if (citaIdInicial && citaIdInicial !== ultimoCitaIdInicial) {
    setUltimoCitaIdInicial(citaIdInicial);
    setAnchor(anchorInicial);
    setCitas(citasIniciales);
    setCitasPendientes(citasPendientesIniciales);
    setCitaSeleccionadaId(citaIdInicial);
  }

  // La limpieza de la URL sí es un efecto legítimo (navegación, no estado):
  // evita que refrescar la página reabra el modal solo.
  useEffect(() => {
    if (citaIdInicial) {
      router.replace("/dashboard");
    }
  }, [citaIdInicial, router]);

  const [horaInicio, setHoraInicio] = useState(horaInicioInicial);
  const [horaFin, setHoraFin] = useState(horaFinInicial);
  const [errorRango, setErrorRango] = useState<string | null>(null);

  const [diaInicio, setDiaInicio] = useState(diaInicioInicial);
  const [diaFin, setDiaFin] = useState(diaFinInicial);
  const [errorRangoDias, setErrorRangoDias] = useState<string | null>(null);

  // Offsets desde el lunes (0=lunes ... 6=domingo) de los días visibles,
  // derivados del rango ISO diaInicio/diaFin. dias[i] en VistaSemana y las
  // columnas visibles de VistaMes usan este mismo índice.
  const diasVisibles = Array.from({ length: diaFin - diaInicio + 1 }, (_, i) => diaInicio - 1 + i);

  const [arrastre, setArrastre] = useState<ArrastreEstado | null>(null);
  const [errorArrastre, setErrorArrastre] = useState<string | null>(null);
  const [redimension, setRedimension] = useState<RedimensionEstado | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  function refrescar(nuevoAnchor: Date, nuevaVista: Vista) {
    const { desde, hasta } = nuevaVista === "semana" ? rangoSemana(nuevoAnchor) : rangoMes(nuevoAnchor);
    startTransition(async () => {
      const [nuevasCitas, nuevasPendientes] = await Promise.all([
        obtenerCitasCalendario(desde, hasta),
        obtenerCitasExternasPendientes(),
      ]);
      setCitas(nuevasCitas);
      setCitasPendientes(nuevasPendientes);
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

  async function handleCambioRango(nuevoInicio: number, nuevoFin: number) {
    setErrorRango(null);
    const anteriorInicio = horaInicio;
    const anteriorFin = horaFin;
    setHoraInicio(nuevoInicio);
    setHoraFin(nuevoFin);

    const resultado = await actualizarRangoHorarioCalendario(nuevoInicio, nuevoFin);
    if (resultado?.error) {
      setErrorRango(resultado.error);
      setHoraInicio(anteriorInicio);
      setHoraFin(anteriorFin);
    }
  }

  async function handleCambioRangoDias(nuevoInicio: number, nuevoFin: number) {
    setErrorRangoDias(null);
    const anteriorInicio = diaInicio;
    const anteriorFin = diaFin;
    setDiaInicio(nuevoInicio);
    setDiaFin(nuevoFin);

    const resultado = await actualizarRangoDiasCalendario(nuevoInicio, nuevoFin);
    if (resultado?.error) {
      setErrorRangoDias(resultado.error);
      setDiaInicio(anteriorInicio);
      setDiaFin(anteriorFin);
    }
  }

  const citaSeleccionada =
    citas.find((c) => c.id === citaSeleccionadaId) ??
    citasPendientes.find((c) => c.id === citaSeleccionadaId) ??
    null;

  function iniciarArrastre(e: ReactPointerEvent<HTMLElement>, cita: CitaCalendario, origenPanel: boolean) {
    e.currentTarget.setPointerCapture(e.pointerId);

    const duracionMin =
      !origenPanel && cita.hora_inicio
        ? Math.max(15, finEfectivoMinutos(cita.hora_inicio, cita.hora_fin) - minutosDesdeHora(cita.hora_inicio))
        : 60;

    setArrastre({
      citaId: cita.id,
      pointerId: e.pointerId,
      origenPanel,
      titulo: tituloCita(cita),
      duracionMin,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      diaIndex: 0,
      inicioMin: horaInicio * 60,
    });
  }

  function moverArrastre(e: ReactPointerEvent<HTMLElement>) {
    setArrastre((prev) => {
      if (!prev || prev.pointerId !== e.pointerId) return prev;

      const dx = e.clientX - prev.startX;
      const dy = e.clientY - prev.startY;
      const moved = prev.moved || Math.hypot(dx, dy) > UMBRAL_ARRASTRE_PX;

      if (!moved || !gridRef.current) {
        return prev.moved === moved ? prev : { ...prev, moved };
      }

      const rect = gridRef.current.getBoundingClientRect();
      const { diaIndex, inicioMin } = posicionDesdePuntero({
        clientX: e.clientX,
        clientY: e.clientY,
        rect,
        minutosInicio: horaInicio * 60,
        minutosFin: horaFin * 60,
        numDias: diasVisibles.length,
      });
      const inicioMinClamped = Math.min(
        Math.max(inicioMin, horaInicio * 60),
        Math.max(horaInicio * 60, horaFin * 60 - prev.duracionMin)
      );

      return { ...prev, moved: true, diaIndex, inicioMin: inicioMinClamped };
    });
  }

  async function soltarArrastre(e: ReactPointerEvent<HTMLElement>) {
    const actual = arrastre;
    if (!actual || actual.pointerId !== e.pointerId) {
      return;
    }

    setArrastre(null);

    if (!actual.moved) {
      setCitaSeleccionadaId(actual.citaId);
      return;
    }

    const cita =
      citas.find((c) => c.id === actual.citaId) ??
      citasPendientes.find((c) => c.id === actual.citaId);
    if (!cita) {
      return;
    }

    const lunes = inicioSemana(anchor);
    const nuevaFecha = fechaISO(sumarDias(lunes, diasVisibles[actual.diaIndex]));
    const nuevaHoraInicio = horaDesdeMinutos(actual.inicioMin);
    const nuevaHoraFin = horaDesdeMinutos(actual.inicioMin + actual.duracionMin);

    const formData = new FormData();
    formData.set("id", cita.id);
    formData.set("fecha", nuevaFecha);
    formData.set("hora_inicio", nuevaHoraInicio);
    formData.set("hora_fin", nuevaHoraFin);

    // Un bloqueo externo de varios días conserva su duración: fecha_fin se
    // desplaza el mismo número de días que fecha, para no dejar un rango
    // invertido (fecha_fin anterior a la nueva fecha).
    if (cita.origen_externo && cita.fecha_fin && cita.fecha) {
      const spanDias = Math.round(
        (fechaLocal(cita.fecha_fin).getTime() - fechaLocal(cita.fecha).getTime()) / 86400000
      );
      formData.set("fecha_fin", fechaISO(sumarDias(fechaLocal(nuevaFecha), spanDias)));
    }

    setErrorArrastre(null);

    let resultado: { error?: string } | undefined;
    if (cita.origen_externo) {
      resultado = await moverCitaExterna(undefined, formData);
    } else if (cita.estado === "pendiente") {
      formData.set("comentario", "Horario actualizado desde el calendario.");
      resultado = await proponerOtroHorario(undefined, formData);
    } else if (cita.estado === "confirmada") {
      resultado = await proponerCambioCitaConfirmada(undefined, formData);
    }

    if (resultado?.error) {
      setErrorArrastre(resultado.error);
    }

    refrescar(anchor, vista);
  }

  function iniciarRedimension(
    e: ReactPointerEvent<HTMLElement>,
    cita: CitaCalendario,
    borde: "inicio" | "fin"
  ) {
    if (!cita.hora_inicio) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    setRedimension({
      citaId: cita.id,
      pointerId: e.pointerId,
      borde,
      inicioMin: minutosDesdeHora(cita.hora_inicio),
      finMin: finEfectivoMinutos(cita.hora_inicio, cita.hora_fin),
      moved: false,
    });
  }

  function moverRedimension(e: ReactPointerEvent<HTMLElement>) {
    setRedimension((prev) => {
      if (!prev || prev.pointerId !== e.pointerId || !gridRef.current) return prev;

      const rect = gridRef.current.getBoundingClientRect();
      const minuto = minutoDesdePunteroY(e.clientY, rect.top, horaInicio * 60, horaFin * 60);

      if (prev.borde === "inicio") {
        const inicioMin = Math.min(minuto, prev.finMin - INTERVALO_SNAP_MIN);
        return { ...prev, inicioMin, moved: true };
      }
      const finMin = Math.max(minuto, prev.inicioMin + INTERVALO_SNAP_MIN);
      return { ...prev, finMin, moved: true };
    });
  }

  async function soltarRedimension(e: ReactPointerEvent<HTMLElement>) {
    const actual = redimension;
    if (!actual || actual.pointerId !== e.pointerId) {
      return;
    }

    setRedimension(null);
    if (!actual.moved) {
      return;
    }

    const cita = citas.find((c) => c.id === actual.citaId);
    if (!cita || !cita.fecha) {
      return;
    }

    const formData = new FormData();
    formData.set("id", cita.id);
    formData.set("fecha", cita.fecha);
    formData.set("hora_inicio", horaDesdeMinutos(actual.inicioMin));
    formData.set("hora_fin", horaDesdeMinutos(actual.finMin));

    setErrorArrastre(null);

    let resultado: { error?: string } | undefined;
    if (cita.origen_externo) {
      resultado = await moverCitaExterna(undefined, formData);
    } else if (cita.estado === "pendiente") {
      formData.set("comentario", "Horario actualizado desde el calendario.");
      resultado = await proponerOtroHorario(undefined, formData);
    } else if (cita.estado === "confirmada") {
      resultado = await proponerCambioCitaConfirmada(undefined, formData);
    }

    if (resultado?.error) {
      setErrorArrastre(resultado.error);
    }

    refrescar(anchor, vista);
  }

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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
            <select
              aria-label="Hora de inicio del calendario"
              value={horaInicio}
              onChange={(e) => handleCambioRango(Number(e.target.value), horaFin)}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {HORAS_DIA.map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
            <span>–</span>
            <select
              aria-label="Hora de fin del calendario"
              value={horaFin}
              onChange={(e) => handleCambioRango(horaInicio, Number(e.target.value))}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {HORAS_DIA.filter((h) => h >= 1).map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
            <select
              aria-label="Primer día visible del calendario"
              value={diaInicio}
              onChange={(e) => handleCambioRangoDias(Number(e.target.value), diaFin)}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {DIAS_SEMANA_CALENDARIO.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <span>–</span>
            <select
              aria-label="Último día visible del calendario"
              value={diaFin}
              onChange={(e) => handleCambioRangoDias(diaInicio, Number(e.target.value))}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {DIAS_SEMANA_CALENDARIO.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

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

      {errorRango && <p className="text-sm text-red-600 dark:text-red-400">{errorRango}</p>}
      {errorRangoDias && <p className="text-sm text-red-600 dark:text-red-400">{errorRangoDias}</p>}
      {errorArrastre && <p className="text-sm text-red-600 dark:text-red-400">{errorArrastre}</p>}

      <PanelPendientesSinFecha
        citas={citasPendientes}
        citaArrastrandoId={arrastre?.origenPanel ? arrastre.citaId : null}
        onAbrirFormulario={() => setMostrarFormExterna(true)}
        onPointerDownCita={(e, cita) => iniciarArrastre(e, cita, true)}
        onPointerMoveArrastre={moverArrastre}
        onPointerUpArrastre={soltarArrastre}
      />

      <div className="relative w-full">
        {cargando && (
          <div
            role="status"
            aria-label="Actualizando calendario"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm dark:bg-neutral-950/60"
          >
            <svg
              className="h-8 w-8 animate-spin text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
        {vista === "semana" ? (
          <VistaSemana
            anchor={anchor}
            citas={citas}
            horaInicio={horaInicio}
            horaFin={horaFin}
            diasVisibles={diasVisibles}
            gridRef={gridRef}
            arrastre={arrastre}
            redimension={redimension}
            onPointerDownCita={(e, cita) => iniciarArrastre(e, cita, false)}
            onPointerMoveArrastre={moverArrastre}
            onPointerUpArrastre={soltarArrastre}
            onPointerDownRedimensionar={iniciarRedimension}
            onPointerMoveRedimensionar={moverRedimension}
            onPointerUpRedimensionar={soltarRedimension}
          />
        ) : (
          <VistaMes
            anchor={anchor}
            citas={citas}
            diasVisibles={diasVisibles}
            onSeleccionarDia={(dia) => navegar(dia, "semana")}
          />
        )}
      </div>

      {citaSeleccionada && (
        <DetalleCitaModal
          cita={citaSeleccionada}
          onClose={cerrarDetalle}
          onExito={trasExitoDetalle}
          onCambio={() => refrescar(anchor, vista)}
        />
      )}

      {mostrarFormExterna && (
        <CitaExternaForm onClose={() => setMostrarFormExterna(false)} onExito={trasCrearExterna} />
      )}
    </div>
  );
}
