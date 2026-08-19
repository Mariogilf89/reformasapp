export const TIPOS_CITA = [
  { value: "visita", label: "Visita previa" },
  { value: "trabajo", label: "Trabajo" },
] as const;

export type TipoCita = (typeof TIPOS_CITA)[number]["value"];

export function isTipoCita(value: string): value is TipoCita {
  return TIPOS_CITA.some((tipo) => tipo.value === value);
}

export type EstadoCita = "pendiente" | "confirmada" | "cancelada";

export type PropuestoPor = "cliente" | "profesional";
