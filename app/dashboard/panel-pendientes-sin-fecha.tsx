"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PanelPendientesSinFecha({
  citas,
  citaArrastrandoId,
  onAbrirFormulario,
  onPointerDownCita,
  onPointerMoveArrastre,
  onPointerUpArrastre,
  onPointerCancelArrastre,
}: {
  citas: CitaCalendario[];
  citaArrastrandoId: string | null;
  onAbrirFormulario: () => void;
  onPointerDownCita: (e: ReactPointerEvent<HTMLLIElement>, cita: CitaCalendario) => void;
  onPointerMoveArrastre: (e: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerUpArrastre: (e: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerCancelArrastre: (e: ReactPointerEvent<HTMLLIElement>) => void;
}) {
  return (
    <Card className="flex w-full flex-wrap items-center gap-3 p-3">
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="text-sm font-semibold text-neutral-900">
          Citas externas
        </h2>
        <Button type="button" size="xs" onClick={onAbrirFormulario}>
          Añadir
        </Button>
      </div>

      {citas.length === 0 ? (
        <p className="text-xs text-neutral-500">
          No tienes citas externas pendientes de agendar.
        </p>
      ) : (
        <ul className="flex flex-1 flex-wrap items-center gap-2">
          {citas.map((cita) => (
            <li
              key={cita.id}
              onPointerDown={(e) => onPointerDownCita(e, cita)}
              onPointerMove={onPointerMoveArrastre}
              onPointerUp={onPointerUpArrastre}
              onPointerCancel={onPointerCancelArrastre}
              title="Arrastra al calendario para asignarle fecha y hora"
              style={{
                touchAction: "none",
                opacity: citaArrastrandoId === cita.id ? 0.4 : 1,
              }}
              className="cursor-grab select-none whitespace-nowrap rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 active:cursor-grabbing [-webkit-touch-callout:none]"
            >
              {cita.titulo_externo}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
