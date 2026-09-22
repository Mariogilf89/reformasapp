import { cn } from "@/lib/cn";
import { IconEstrella } from "@/components/ui/icon-estrella";
import type { NivelProfesional } from "@/lib/niveles-profesional";
import { NIVELES_PROFESIONAL_INFO } from "@/lib/niveles-profesional";

const ESTILOS: Record<NivelProfesional, { className: string; icono: boolean }> = {
  activo: { className: "border border-neutral-300 text-neutral-600", icono: false },
  destacado: { className: "border border-amber-300 bg-amber-50 text-amber-800", icono: true },
};

/**
 * Insignia de nivel de profesional (calcularNivelProfesional, ver
 * lib/niveles-profesional.ts). A propósito con un estilo en píldora con
 * borde en vez del relleno sólido verde de VerificadoBadge
 * (components/ui/verificado-badge.tsx): son dos señales distintas
 * (identidad comprobada vs. actividad/reputación) y no deben confundirse.
 */
export function NivelBadge({ nivel }: { nivel: NivelProfesional }) {
  const estilo = ESTILOS[nivel];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        estilo.className
      )}
    >
      {estilo.icono && <IconEstrella className="h-3 w-3 shrink-0" />}
      {NIVELES_PROFESIONAL_INFO[nivel].label}
    </span>
  );
}
