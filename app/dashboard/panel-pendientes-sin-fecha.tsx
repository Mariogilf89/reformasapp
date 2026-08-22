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
}: {
  citas: CitaCalendario[];
  citaArrastrandoId: string | null;
  onAbrirFormulario: () => void;
  onPointerDownCita: (e: ReactPointerEvent<HTMLLIElement>, cita: CitaCalendario) => void;
  onPointerMoveArrastre: (e: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerUpArrastre: (e: ReactPointerEvent<HTMLLIElement>) => void;
}) {
  return (
    <Card className="flex w-60 shrink-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Pendientes (sin fecha)
        </h2>
        <Button type="button" size="xs" variant="secondary" onClick={onAbrirFormulario}>
          Añadir
        </Button>
      </div>

      {citas.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          No tienes citas externas pendientes de agendar.
        </p>
      ) : (
        <>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Arrastra una al calendario para asignarle fecha y hora.
          </p>
          <ul className="flex flex-col gap-2">
            {citas.map((cita) => (
              <li
                key={cita.id}
                onPointerDown={(e) => onPointerDownCita(e, cita)}
                onPointerMove={onPointerMoveArrastre}
                onPointerUp={onPointerUpArrastre}
                style={{
                  touchAction: "none",
                  opacity: citaArrastrandoId === cita.id ? 0.4 : 1,
                }}
                className="cursor-grab select-none rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {cita.titulo_externo}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
