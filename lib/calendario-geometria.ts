import type { CSSProperties } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import { TIPOS_CITA } from "@/lib/citas";

export const ALTURA_HORA_PX = 60;
export const INTERVALO_SNAP_MIN = 15;
export const UMBRAL_ARRASTRE_PX = 6;

export function minutosDesdeHora(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function horaDesdeMinutos(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function rangoHoraTexto(horaInicio: string, horaFin: string | null) {
  const inicio = horaInicio.slice(0, 5);
  return horaFin ? `${inicio}–${horaFin.slice(0, 5)}` : inicio;
}

// Alturas mínimas (px) de un bloque de la vista semanal para mostrar la
// ubicación completa (localidad + calle en dos líneas) o la versión
// compacta (icono + un solo valor, priorizando la localidad).
export const ALTURA_UBICACION_COMPLETA_PX = 60;
export const ALTURA_UBICACION_COMPACTA_PX = 36;

export function finEfectivoMinutos(horaInicio: string, horaFin: string | null) {
  return horaFin ? minutosDesdeHora(horaFin) : minutosDesdeHora(horaInicio) + 60;
}

/**
 * A partir de la posición del puntero y el rect del contenedor compartido
 * de la vista semanal (numDias días de ancho, el rango configurado por el
 * profesional), calcula a qué día/minuto corresponde, con snap a
 * INTERVALO_SNAP_MIN. diaIndex es un índice dentro del array de días
 * visibles (0..numDias-1), no un día de la semana absoluto.
 */
export function posicionDesdePuntero(params: {
  clientX: number;
  clientY: number;
  rect: DOMRect;
  minutosInicio: number;
  minutosFin: number;
  numDias: number;
}) {
  const { clientX, clientY, rect, minutosInicio, minutosFin, numDias } = params;

  const xRel = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const diaIndex = Math.min(numDias - 1, Math.max(0, Math.floor(xRel * numDias)));

  const yRel = Math.min(rect.height, Math.max(0, clientY - rect.top));
  const minutosBrutos = minutosInicio + (yRel / ALTURA_HORA_PX) * 60;
  const snap = Math.round(minutosBrutos / INTERVALO_SNAP_MIN) * INTERVALO_SNAP_MIN;
  const inicioMin = Math.min(minutosFin, Math.max(minutosInicio, snap));

  return { diaIndex, inicioMin };
}

/**
 * A partir de la posición vertical del puntero y la parte superior del
 * grid, calcula el minuto correspondiente con el mismo snap que
 * posicionDesdePuntero. Lo usa el redimensionado (estirar el borde superior
 * o inferior de un bloque), que solo necesita el eje Y.
 */
export function minutoDesdePunteroY(clientY: number, rectTop: number, minutosInicio: number, minutosFin: number) {
  const yRel = Math.max(0, clientY - rectTop);
  const minutosBrutos = minutosInicio + (yRel / ALTURA_HORA_PX) * 60;
  const snap = Math.round(minutosBrutos / INTERVALO_SNAP_MIN) * INTERVALO_SNAP_MIN;
  return Math.min(minutosFin, Math.max(minutosInicio, snap));
}

export function tituloCita(cita: Pick<CitaCalendario, "origen_externo" | "titulo_externo" | "tipo">) {
  if (cita.origen_externo) {
    return cita.titulo_externo ?? "Bloqueo";
  }
  return TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? "Cita";
}

const RAYADO: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(180,83,9,0.25) 0px, rgba(180,83,9,0.25) 5px, transparent 5px, transparent 10px)",
};

/**
 * Estilo visual del bloque según las reglas:
 * confirmada = verde sólido; pendiente+propuesto por el profesional = ámbar
 * rayado (esperando al cliente); pendiente+propuesto por el cliente = ámbar
 * sólido (esperando respuesta del profesional); externa = gris sólido por
 * defecto, o el color personalizado del bloqueo si tiene uno asignado
 * (siempre, sea cual sea el estado).
 */
export function estiloCita(
  cita: Pick<CitaCalendario, "origen_externo" | "estado" | "propuesto_por" | "color">
): { className: string; style?: CSSProperties } {
  if (cita.origen_externo) {
    if (cita.color) {
      return {
        className: "border-neutral-400",
        style: { backgroundColor: cita.color, color: "#1F2937" },
      };
    }
    return {
      className:
        "border-neutral-400 bg-neutral-100 text-neutral-700",
    };
  }
  if (cita.estado === "confirmada") {
    return {
      className:
        "border-primary-500 bg-primary-100 text-primary-800",
    };
  }
  if (cita.propuesto_por === "profesional") {
    return {
      className:
        "border-amber-400 bg-amber-50 text-amber-800",
      style: RAYADO,
    };
  }
  return {
    className:
      "border-amber-400 bg-amber-50 text-amber-800",
  };
}

export type ArrastreEstado = {
  citaId: string;
  pointerId: number;
  origenPanel: boolean;
  titulo: string;
  duracionMin: number;
  startX: number;
  startY: number;
  moved: boolean;
  diaIndex: number;
  inicioMin: number;
};

/** Redimensionado vertical de un bloque (estirar hora_inicio u hora_fin). */
export type RedimensionEstado = {
  citaId: string;
  pointerId: number;
  borde: "inicio" | "fin";
  inicioMin: number;
  finMin: number;
  moved: boolean;
};
