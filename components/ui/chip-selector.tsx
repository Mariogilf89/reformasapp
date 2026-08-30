"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";

type ChipOption = { value: string; label: string };

export function ChipSelector({
  name,
  options,
  defaultValues = [],
  formId,
  addLabel = "+ Añadir",
}: {
  name: string;
  options: readonly ChipOption[];
  defaultValues?: readonly string[];
  formId?: string;
  addLabel?: string;
}) {
  const [seleccionados, setSeleccionados] = useState<string[]>([...defaultValues]);
  const [abierto, setAbierto] = useState(false);

  const disponibles = options.filter((opcion) => !seleccionados.includes(opcion.value));

  function quitar(value: string) {
    setSeleccionados((actuales) => actuales.filter((v) => v !== value));
  }

  function agregar(value: string) {
    if (!value) return;
    setSeleccionados((actuales) => [...actuales, value]);
    setAbierto(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {seleccionados.map((value) => {
        const opcion = options.find((o) => o.value === value);
        return (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-3 pr-2 text-sm text-primary-700"
          >
            {opcion?.label ?? value}
            <button
              type="button"
              onClick={() => quitar(value)}
              aria-label={`Quitar ${opcion?.label ?? value}`}
              className="rounded-full text-primary-500 hover:text-primary-700"
            >
              ×
            </button>
            <input type="hidden" name={name} value={value} form={formId} />
          </span>
        );
      })}

      {disponibles.length > 0 &&
        (abierto ? (
          <Select
            autoFocus
            value=""
            onChange={(e) => agregar(e.target.value)}
            onBlur={() => setAbierto(false)}
            className="w-auto"
          >
            <option value="" disabled>
              Elige una opción
            </option>
            {disponibles.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>
        ) : (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
          >
            {addLabel}
          </button>
        ))}
    </div>
  );
}
