/**
 * Redacción amigable del tiempo medio de respuesta de un profesional (ver
 * calcularTiempoRespuestaProfesional en lib/supabase-admin.ts), en vez de
 * mostrar un número de minutos en frío.
 */
export function formatearTiempoRespuesta(minutos: number): string {
  const horas = minutos / 60;

  if (horas < 1) return "Normalmente responde en menos de 1 hora";
  if (horas < 3) return "Normalmente responde en menos de 3 horas";
  if (horas < 6) return "Normalmente responde en menos de 6 horas";
  if (horas < 12) return "Normalmente responde en menos de 12 horas";
  if (horas < 24) return "Normalmente responde en menos de 24 horas";

  const dias = horas / 24;
  if (dias < 2) return "Normalmente responde en 1-2 días";
  if (dias < 4) return "Normalmente responde en 2-4 días";
  return "Normalmente responde en varios días";
}
