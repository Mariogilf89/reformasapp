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
  NIVELES_ZOOM_SEMANA_PX,
  ZOOM_SEMANA_INICIAL,
  NIVELES_ZOOM_MES_PX,
  ZOOM_MES_INICIAL,
  horaDesdeMinutos,
  minutosDesdeHora,
  finEfectivoMinutos,
  posicionDesdePuntero,
  minutoDesdePunteroY,
  tituloCita,
  type ArrastreEstado,
  type RedimensionEstado,
} from "@/lib/calendario-geometria";
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

const NOMBRES_DIA_SEMANA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

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

type Vista = "dia" | "semana" | "mes";

function rangoSemana(anchor: Date) {
  const lunes = inicioSemana(anchor);
  return { desde: fechaISO(lunes), hasta: fechaISO(sumarDias(lunes, 6)) };
}

function rangoMes(anchor: Date) {
  const primerDia = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const ultimoDia = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { desde: fechaISO(primerDia), hasta: fechaISO(ultimoDia) };
}

function rangoDia(anchor: Date) {
  const iso = fechaISO(anchor);
  return { desde: iso, hasta: iso };
}

function etiquetaRango(anchor: Date, vista: Vista) {
  if (vista === "mes") {
    return `${NOMBRES_MES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }
  if (vista === "dia") {
    const diaSemana = NOMBRES_DIA_SEMANA[(anchor.getDay() + 6) % 7];
    return `${diaSemana} ${anchor.getDate()} ${NOMBRES_MES[anchor.getMonth()]} ${anchor.getFullYear()}`;
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
  const [vista, setVista] = useState<Vista>("dia");
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

  // La vista Día siempre muestra el día del ancla actual (hoy, al entrar),
  // sin importar el rango diaInicio/diaFin configurado por el profesional
  // (ese rango solo filtra columnas en Semana/Mes).
  const diasVisiblesActivos = vista === "dia" ? [(anchor.getDay() + 6) % 7] : diasVisibles;

  // Vistas que comparten el mismo eje de horas/zoom (Día es, en la práctica,
  // Semana con una sola columna).
  const esVistaHoraria = vista !== "mes";

  // Zoom independiente por eje: cuánto se ve de cada hora (día/semana) o de
  // cada celda de día (mes). Solo vive en el estado del cliente, no se
  // persiste — al recargar vuelve al nivel por defecto.
  const [zoomSemanaIndex, setZoomSemanaIndex] = useState(ZOOM_SEMANA_INICIAL);
  const [zoomMesIndex, setZoomMesIndex] = useState(ZOOM_MES_INICIAL);

  // Nivel de zoom más alejado (índice 0), adaptado a móvil: en pantallas
  // estrechas se recalcula para que la franja horaria configurada
  // (horaInicio..horaFin) quepa entera en el alto visible sin scroll, en vez
  // de quedarse fijo en 40px/hora (que en franjas largas se sigue
  // desbordando en pantallas pequeñas). Solo se sustituye ese primer nivel:
  // los demás índices no cambian, así que el zoom por defecto en escritorio
  // no se ve afectado.
  const [nivelesZoomSemana, setNivelesZoomSemana] = useState<readonly number[]>(NIVELES_ZOOM_SEMANA_PX);

  useEffect(() => {
    function recalcular() {
      const esMovil = window.innerWidth < 640;
      if (!esMovil) {
        setNivelesZoomSemana(NIVELES_ZOOM_SEMANA_PX);
        return;
      }
      const numHoras = Math.max(1, horaFin - horaInicio);
      // El contenedor scrollable de VistaSemana limita su alto a 65vh
      // (max-h-[65vh]) y reserva ~40px para la cabecera con los días.
      const altoDisponiblePx = window.innerHeight * 0.65 - 40;
      const pxPorHoraParaCaber = Math.max(18, Math.floor(altoDisponiblePx / numHoras));
      setNivelesZoomSemana(
        pxPorHoraParaCaber < NIVELES_ZOOM_SEMANA_PX[0]
          ? [pxPorHoraParaCaber, ...NIVELES_ZOOM_SEMANA_PX.slice(1)]
          : NIVELES_ZOOM_SEMANA_PX
      );
    }
    recalcular();
    window.addEventListener("resize", recalcular);
    return () => window.removeEventListener("resize", recalcular);
  }, [horaInicio, horaFin]);

  const alturaHoraPx = nivelesZoomSemana[zoomSemanaIndex];
  const tamanoCeldaMesPx = NIVELES_ZOOM_MES_PX[zoomMesIndex];

  function acercarZoom() {
    if (esVistaHoraria) {
      setZoomSemanaIndex((i) => Math.min(i + 1, nivelesZoomSemana.length - 1));
    } else {
      setZoomMesIndex((i) => Math.min(i + 1, NIVELES_ZOOM_MES_PX.length - 1));
    }
  }

  function alejarZoom() {
    if (esVistaHoraria) {
      setZoomSemanaIndex((i) => Math.max(i - 1, 0));
    } else {
      setZoomMesIndex((i) => Math.max(i - 1, 0));
    }
  }

  const zoomIndexActual = esVistaHoraria ? zoomSemanaIndex : zoomMesIndex;
  const zoomMaxIndex = (esVistaHoraria ? nivelesZoomSemana : NIVELES_ZOOM_MES_PX).length - 1;

  const [arrastre, setArrastre] = useState<ArrastreEstado | null>(null);
  const [errorArrastre, setErrorArrastre] = useState<string | null>(null);
  const [redimension, setRedimension] = useState<RedimensionEstado | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Contenedor con overflow-x-auto de VistaSemana (en móvil solo caben ~2
  // días y el resto requiere scroll horizontal). Durante un arrastre, el
  // dedo/puntero queda capturado por el bloque que se mueve, así que el
  // navegador no desplaza este contenedor por sí solo aunque el puntero esté
  // pegado a su borde: hace falta el auto-scroll de abajo.
  const scrollRef = useRef<HTMLDivElement>(null);
  const punteroRef = useRef<{ x: number; y: number } | null>(null);

  function refrescar(nuevoAnchor: Date, nuevaVista: Vista) {
    const { desde, hasta } =
      nuevaVista === "semana"
        ? rangoSemana(nuevoAnchor)
        : nuevaVista === "mes"
          ? rangoMes(nuevoAnchor)
          : rangoDia(nuevoAnchor);
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
    if (vista === "semana") {
      navegar(sumarDias(anchor, -7));
    } else if (vista === "dia") {
      navegar(sumarDias(anchor, -1));
    } else {
      navegar(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
    }
  }

  function irSiguiente() {
    if (vista === "semana") {
      navegar(sumarDias(anchor, 7));
    } else if (vista === "dia") {
      navegar(sumarDias(anchor, 1));
    } else {
      navegar(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
    }
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

  /** Recalcula día/minuto del arrastre en curso a partir de la posición del
   * puntero. La usan tanto moverArrastre (con las coordenadas del evento)
   * como el auto-scroll de abajo (con las últimas coordenadas conocidas,
   * mientras el contenido se desplaza bajo un dedo que no se ha movido). */
  function actualizarPosicionArrastre(clientX: number, clientY: number) {
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const { diaIndex, inicioMin } = posicionDesdePuntero({
      clientX,
      clientY,
      rect,
      minutosInicio: horaInicio * 60,
      minutosFin: horaFin * 60,
      numDias: diasVisiblesActivos.length,
      alturaHoraPx,
    });

    setArrastre((prev) => {
      if (!prev || !prev.moved) return prev;
      const inicioMinClamped = Math.min(
        Math.max(inicioMin, horaInicio * 60),
        Math.max(horaInicio * 60, horaFin * 60 - prev.duracionMin)
      );
      return { ...prev, diaIndex, inicioMin: inicioMinClamped };
    });
  }

  function moverArrastre(e: ReactPointerEvent<HTMLElement>) {
    punteroRef.current = { x: e.clientX, y: e.clientY };

    setArrastre((prev) => {
      if (!prev || prev.pointerId !== e.pointerId) return prev;
      const dx = e.clientX - prev.startX;
      const dy = e.clientY - prev.startY;
      const moved = prev.moved || Math.hypot(dx, dy) > UMBRAL_ARRASTRE_PX;
      return prev.moved === moved ? prev : { ...prev, moved };
    });

    actualizarPosicionArrastre(e.clientX, e.clientY);
  }

  // Auto-scroll del contenedor de VistaSemana (con overflow tanto horizontal
  // como vertical) mientras se arrastra una cita cerca de cualquiera de sus
  // cuatro bordes, para poder soltarla en un día u hora que no estaba
  // visible al empezar el gesto (p.ej. mover del lunes al viernes en móvil,
  // donde solo caben ~2 días en pantalla, o hacia una hora fuera de la franja
  // visible). Corre en un bucle de rAF -no solo en pointermove- porque en
  // touch, si el dedo se queda quieto pegado al borde, no llegan más eventos
  // de movimiento pero el contenido sigue debiendo desplazarse. La misma
  // lógica de velocidad/aceleración se reutiliza en ambos ejes.
  useEffect(() => {
    if (!arrastre?.moved) return;

    const ZONA_PX = 56;
    const VELOCIDAD_MAX_PX = 16;

    function deltaEje(distInicio: number, distFin: number) {
      if (distInicio < ZONA_PX) return -(1 - Math.max(0, distInicio) / ZONA_PX) * VELOCIDAD_MAX_PX;
      if (distFin < ZONA_PX) return (1 - Math.max(0, distFin) / ZONA_PX) * VELOCIDAD_MAX_PX;
      return 0;
    }

    let frameId: number;
    const tick = () => {
      const contenedor = scrollRef.current;
      const puntero = punteroRef.current;
      if (contenedor && puntero) {
        const rect = contenedor.getBoundingClientRect();
        const deltaX = deltaEje(puntero.x - rect.left, rect.right - puntero.x);
        const deltaY = deltaEje(puntero.y - rect.top, rect.bottom - puntero.y);

        if (deltaX !== 0 || deltaY !== 0) {
          contenedor.scrollLeft += deltaX;
          contenedor.scrollTop += deltaY;
          actualizarPosicionArrastre(puntero.x, puntero.y);
        }
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastre?.moved]);

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
    const nuevaFecha = fechaISO(sumarDias(lunes, diasVisiblesActivos[actual.diaIndex]));
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
      const minuto = minutoDesdePunteroY(e.clientY, rect.top, horaInicio * 60, horaFin * 60, alturaHoraPx);

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
      <PanelPendientesSinFecha
        citas={citasPendientes}
        citaArrastrandoId={arrastre?.origenPanel ? arrastre.citaId : null}
        onAbrirFormulario={() => setMostrarFormExterna(true)}
        onPointerDownCita={(e, cita) => iniciarArrastre(e, cita, true)}
        onPointerMoveArrastre={moverArrastre}
        onPointerUpArrastre={soltarArrastre}
        onPointerCancelArrastre={soltarArrastre}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={irAnterior}
            aria-label="Anterior"
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            ←
          </button>
          <p className="min-w-[10rem] text-center text-sm font-medium capitalize text-neutral-900">
            {etiquetaRango(anchor, vista)}
          </p>
          <button
            type="button"
            onClick={irSiguiente}
            aria-label="Siguiente"
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            →
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <select
              aria-label="Hora de inicio del calendario"
              value={horaInicio}
              onChange={(e) => handleCambioRango(Number(e.target.value), horaFin)}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs"
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
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs"
            >
              {HORAS_DIA.filter((h) => h >= 1).map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <select
              aria-label="Primer día visible del calendario"
              value={diaInicio}
              onChange={(e) => handleCambioRangoDias(Number(e.target.value), diaFin)}
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs"
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
              className="rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs"
            >
              {DIAS_SEMANA_CALENDARIO.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <button
              type="button"
              onClick={alejarZoom}
              disabled={zoomIndexActual === 0}
              aria-label="Alejar zoom del calendario"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <button
              type="button"
              onClick={acercarZoom}
              disabled={zoomIndexActual === zoomMaxIndex}
              aria-label="Acercar zoom del calendario"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>

          <div className="flex overflow-hidden rounded-full border border-neutral-300">
            <button
              type="button"
              onClick={() => navegar(anchor, "dia")}
              className={`px-3 py-1.5 text-xs font-medium ${
                vista === "dia"
                  ? "bg-primary-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => navegar(anchor, "semana")}
              className={`px-3 py-1.5 text-xs font-medium ${
                vista === "semana"
                  ? "bg-primary-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
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
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {errorRango && <p className="text-sm text-red-600">{errorRango}</p>}
      {errorRangoDias && <p className="text-sm text-red-600">{errorRangoDias}</p>}
      {errorArrastre && <p className="text-sm text-red-600">{errorArrastre}</p>}

      <div className="relative w-full">
        {cargando && (
          <div
            role="status"
            aria-label="Actualizando calendario"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm"
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
        {vista === "mes" ? (
          <VistaMes
            anchor={anchor}
            citas={citas}
            diasVisibles={diasVisibles}
            tamanoCeldaPx={tamanoCeldaMesPx}
            onSeleccionarDia={(dia) => navegar(dia, "semana")}
          />
        ) : (
          <VistaSemana
            anchor={anchor}
            citas={citas}
            horaInicio={horaInicio}
            horaFin={horaFin}
            alturaHoraPx={alturaHoraPx}
            diasVisibles={diasVisiblesActivos}
            gridRef={gridRef}
            scrollRef={scrollRef}
            arrastre={arrastre}
            redimension={redimension}
            onPointerDownCita={(e, cita) => iniciarArrastre(e, cita, false)}
            onPointerMoveArrastre={moverArrastre}
            onPointerUpArrastre={soltarArrastre}
            onPointerCancelArrastre={soltarArrastre}
            onPointerDownRedimensionar={iniciarRedimension}
            onPointerMoveRedimensionar={moverRedimension}
            onPointerUpRedimensionar={soltarRedimension}
            onPointerCancelRedimensionar={soltarRedimension}
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
