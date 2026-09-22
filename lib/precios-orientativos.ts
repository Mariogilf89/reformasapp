import type { Categoria } from "@/lib/profesionales";

/**
 * Precios orientativos de mercado por categoría, para reducir el abandono de
 * quien no tiene ni idea de cuánto cuesta un servicio antes de contactar
 * (mismo objetivo que el rango de precio de Thumbtack).
 *
 * IMPORTANTE:
 * - Son datos de referencia del MERCADO español, no tarifas de ningún
 *   profesional concreto de Faenia ni precios fijados por la plataforma.
 *   Cualquier sitio donde se muestre esto debe ir acompañado del aviso
 *   correspondiente (ver AVISO_PRECIO_ORIENTATIVO más abajo).
 * - Investigado en SEPTIEMBRE DE 2026 (búsquedas de precios de mercado
 *   español en webs especializadas en reformas y presupuestos). Conviene
 *   revisar/actualizar estos rangos pasado un año o si el mercado se mueve
 *   de forma notable; son cifras que envejecen.
 * - Categorías sin dato investigado (jardinería, mudanzas, decoración,
 *   otros) se dejan fuera a propósito en vez de inventar un rango: si una
 *   categoría no tiene entrada aquí, la interfaz simplemente no debe
 *   mostrar precio orientativo para ella.
 * - Para añadir o actualizar una categoría, edita únicamente el objeto
 *   PRECIOS_ORIENTATIVOS de abajo.
 */
export const AVISO_PRECIO_ORIENTATIVO =
  "Precio orientativo del mercado, no es la tarifa de un profesional concreto.";

type PrecioOrientativo = {
  /** Texto corto y legible, listo para mostrar en la interfaz. */
  texto: string;
};

export const PRECIOS_ORIENTATIVOS: Partial<Record<Categoria, PrecioOrientativo>> = {
  pintura: {
    texto: "6-15 €/m² de superficie pintada · trabajo puntual (una habitación) desde 150-350 €",
  },
  electricidad: {
    texto: "40-55 €/hora (oficial de 1ª) · revisión de instalación 200-250 €",
  },
  fontaneria: {
    texto: "25-40 €/hora · reparación de una fuga sencilla 80-200 €",
  },
  carpinteria: {
    texto: "30-55 €/hora · instalación de una puerta interior 150-350 €",
  },
  albanileria: {
    texto: "18-35 €/hora (20-28 €/hora en Madrid y Barcelona) · revestimientos desde 25 €/m²",
  },
  cerrajeria: {
    texto: "apertura de puerta 60-150 € · cambio de cerradura 70-300 €",
  },
  climatizacion: {
    texto: "instalación de un split de pared (1 unidad) 650-1.500 € con equipo incluido",
  },
  limpieza: {
    texto: "11-22 €/hora según ciudad · limpieza de fin de obra 16-25 €/hora o 100-200 € por servicio",
  },
};

export function obtenerPrecioOrientativo(categoria: Categoria): PrecioOrientativo | null {
  return PRECIOS_ORIENTATIVOS[categoria] ?? null;
}
