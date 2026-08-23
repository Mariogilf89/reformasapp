"use client";

import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { PROVINCIAS, type Provincia } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectorModoBusqueda } from "./selector-modo-busqueda";

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

        <SelectorModoBusqueda
          modoInicial={modoInicial}
          fechaInicial={fechaInicial}
          horaInicial={horaInicial}
        />

        <Button type="submit" className="self-start">
          Buscar
        </Button>
      </form>
    </Card>
  );
}
