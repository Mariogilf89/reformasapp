import { IconCheck } from "@/components/ui/icon-check";

/**
 * Insignia de identidad verificada: refleja el campo "verificado" de
 * profesionales (lo marca un admin en /admin/verificaciones tras revisar el
 * documento de identidad subido en Perfil > Verificar usuario). Se usa tanto
 * en las páginas públicas (tarjeta de /profesionales, perfil público) como
 * en el propio dashboard del profesional y en el hilo de mensajes.
 */
export function VerificadoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
      <IconCheck className="h-3.5 w-3.5 shrink-0" />
      Identidad verificada
    </span>
  );
}
