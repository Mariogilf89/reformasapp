"use client";

import { useState } from "react";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { PROVINCIAS, type Provincia } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectorFechaHora } from "./selector-fecha-hora";

const MODOS = [
  { value: "indiferente", label: "Indiferente" },
  { value: "lo_antes_posible", label: "Lo antes posible" },
  { value: "dia_hora", label: "Elegir día y hora" },
] as const;

export function FiltroBusqueda({
  categoriaInicial,
  provinciaInicial,
  zonaInicial,
  modoInicial,
  fechaInicial,
  horaInicial,
}: {
  categoriaInicial: Categoria | "";
  provinciaInicial: Provincia | "";
  zonaInicial: string;
  modoInicial: string;
  fechaInicial: string;
  horaInicial: string;
}) {
  const [modo, setModo] = useState(modoInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial);

  return (
    <Card className="w-full max-w-5xl p-6">
      <form method="get" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="categoria"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Categoría
            </label>
            <Select id="categoria" name="categoria" defaultValue={categoriaInicial}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="provincia"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Provincia
            </label>
            <Select id="provincia" name="provincia" defaultValue={provinciaInicial}>
              <option value="">Todas las provincias</option>
              {PROVINCIAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="zona"
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Localidad
            </label>
            <Input id="zona" name="zona" type="text" placeholder="Ej. Vigo" defaultValue={zonaInicial} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="modo" className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            ¿Cuándo lo necesitas?
          </label>
          <Select
            id="modo"
            name="modo"
            value={modo}
            onChange={(e) => setModo(e.target.value)}
            className="sm:max-w-xs"
          >
            {MODOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        {modo === "dia_hora" && (
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <SelectorFechaHora
              fecha={fecha}
              hora={hora}
              onSeleccionarFecha={setFecha}
              onSeleccionarHora={setHora}
            />
            <input type="hidden" name="fecha" value={fecha} />
            <input type="hidden" name="hora_inicio" value={hora} />
          </div>
        )}

        <Button type="submit" className="self-start">
          Buscar
        </Button>
      </form>
    </Card>
  );
}
