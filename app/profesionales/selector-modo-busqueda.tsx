"use client";

import { useState } from "react";
import { SelectorFechaHora } from "./selector-fecha-hora";

const MODOS = [
  { value: "lo_antes_posible", label: "Lo antes posible" },
  { value: "dia_hora", label: "Elegir día y hora" },
  { value: "indiferente", label: "Indiferente" },
] as const;

/**
 * "¿Cuándo lo necesitas?": tres botones toggle + (si se elige "Elegir día y
 * hora") el mismo selector de fecha/rango horario de SelectorFechaHora.
 * Expone modo, fecha, hora_inicio y hora_fin como inputs ocultos para que
 * cualquier <form method="get"> que lo contenga (la búsqueda del hero o el
 * filtro de /profesionales) los mande igual que hacía el <select> que
 * sustituye.
 */
export function SelectorModoBusqueda({
  modoInicial,
  fechaInicial,
  horaInicioInicial,
  horaFinInicial,
}: {
  modoInicial: string;
  fechaInicial: string;
  horaInicioInicial: string;
  horaFinInicial: string;
}) {
  const [modo, setModo] = useState(modoInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const [horaInicio, setHoraInicio] = useState(horaInicioInicial);
  const [horaFin, setHoraFin] = useState(horaFinInicial);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        ¿Cuándo lo necesitas?
      </p>
      <div className="flex flex-wrap gap-2">
        {MODOS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setModo(m.value)}
            className={
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
              (modo === m.value
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800")
            }
          >
            {m.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="modo" value={modo} />

      {modo === "dia_hora" && (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <SelectorFechaHora
            fecha={fecha}
            horaInicio={horaInicio}
            horaFin={horaFin}
            onSeleccionarFecha={setFecha}
            onSeleccionarHoraInicio={setHoraInicio}
            onSeleccionarHoraFin={setHoraFin}
          />
          <input type="hidden" name="fecha" value={fecha} />
          <input type="hidden" name="hora_inicio" value={horaInicio} />
          <input type="hidden" name="hora_fin" value={horaFin} />
        </div>
      )}
    </div>
  );
}
