"use client";

import { useActionState, useState } from "react";
import { crearExcepcionDisponibilidad } from "@/app/actions/disponibilidad";

const DIAS_MAXIMO = 60;

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ExcepcionDisponibilidadForm() {
  const [state, action, pending] = useActionState(crearExcepcionDisponibilidad, undefined);
  const [todoElDia, setTodoElDia] = useState(true);

  const hoy = new Date();
  const fechaMinima = fechaISO(hoy);
  const fechaMaxima = fechaISO(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + DIAS_MAXIMO)
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="fecha" className="text-sm font-medium">
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          min={fechaMinima}
          max={fechaMaxima}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Tipo de bloqueo</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="todo_el_dia"
            value="true"
            checked={todoElDia}
            onChange={() => setTodoElDia(true)}
          />
          No disponible todo el día
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="todo_el_dia"
            value="false"
            checked={!todoElDia}
            onChange={() => setTodoElDia(false)}
          />
          No disponible en una franja concreta
        </label>
      </fieldset>

      {!todoElDia && (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="hora_inicio" className="text-sm font-medium">
              Hora inicio
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              required
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="hora_fin" className="text-sm font-medium">
              Hora fin
            </label>
            <input
              id="hora_fin"
              name="hora_fin"
              type="time"
              required
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
            />
          </div>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar excepción"}
      </button>
    </form>
  );
}
