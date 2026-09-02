export const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number]["value"];

// Horas y minutos para los desplegables de "Hora inicio"/"Hora fin" de
// disponibilidad-form.tsx: en vez de un <input type="time"> nativo, cuyo
// selector emergente de Chrome muestra un hueco en blanco entre las
// opciones "00" y "01" de las horas (comprobado en el navegador, no es
// nada que generemos nosotros), se listan las opciones a mano con
// <select>, que no tiene ese problema de renderizado.
export const HORAS_DIA = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
export const MINUTOS_TRAMO = ["00", "15", "30", "45"];
