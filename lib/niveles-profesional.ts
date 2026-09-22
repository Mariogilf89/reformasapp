/**
 * Niveles de profesional (estilo Fiverr/Upwork): un atajo de confianza
 * visual para el cliente sin tener que leer reseña por reseña. Se calculan
 * siempre a partir de datos objetivos — nunca se asignan a mano — mediante
 * calcularNivelProfesional() de abajo.
 *
 * Con el volumen de citas y valoraciones reales que hay en septiembre de
 * 2026 (muy poco todavía), lo normal es que casi ningún profesional alcance
 * ningún nivel por ahora. Eso es el comportamiento esperado, no un bug: el
 * sistema está para cuando haya historial real que lo respalde.
 *
 * "Citas completadas" no es un estado que se guarde en la tabla citas (solo
 * existen los estados pendiente/confirmada/cancelada, ver
 * 20260819040000_create_citas.sql y 20260819060000_citas_negociacion.sql):
 * se aproxima como las citas en estado "confirmada" cuya fecha ya ha
 * pasado — ver contarCitasCompletadasPorProfesionales en
 * lib/supabase-admin.ts, que es quien calcula ese número.
 */
export type NivelProfesional = "activo" | "destacado";

const CITAS_MIN_ACTIVO = 5;
const CITAS_MIN_DESTACADO = 15;
const VALORACION_MIN_DESTACADO = 4.5;

export const NIVELES_PROFESIONAL_INFO: Record<NivelProfesional, { label: string }> = {
  activo: { label: "Profesional activo" },
  destacado: { label: "Profesional destacado" },
};

/**
 * Devuelve el nivel de un profesional, o null si está en el nivel por
 * defecto (sin insignia) — nunca se muestra nada negativo, igual que con la
 * insignia de identidad verificada.
 */
export function calcularNivelProfesional(
  citasCompletadas: number,
  valoracionMedia: number | null
): NivelProfesional | null {
  if (
    citasCompletadas >= CITAS_MIN_DESTACADO &&
    valoracionMedia !== null &&
    valoracionMedia >= VALORACION_MIN_DESTACADO
  ) {
    return "destacado";
  }
  if (citasCompletadas >= CITAS_MIN_ACTIVO) {
    return "activo";
  }
  return null;
}
