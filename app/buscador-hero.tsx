"use client";

import { CATEGORIAS } from "@/lib/profesionales";
import { PROVINCIAS } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SelectorModoBusqueda } from "@/app/profesionales/selector-modo-busqueda";

/**
 * Buscador completo del hero de la home: categoría + provincia + "¿cuándo lo
 * necesitas?". Al enviarlo navega a /profesionales con esos filtros como
 * query params, los mismos que ya interpreta esa página (ver
 * app/profesionales/page.tsx). El modo/fecha/hora los aporta
 * SelectorModoBusqueda, compartido con FiltroBusqueda para no duplicar esa
 * lógica.
 */
export function BuscadorHero() {
  return (
    <Card className="mt-4 w-full max-w-lg p-6 text-left shadow-sm">
      <form action="/profesionales" method="get" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="categoria-hero" className="sr-only">
              ¿Qué necesitas?
            </label>
            <Select id="categoria-hero" name="categoria" defaultValue="">
              <option value="">¿Qué necesitas?</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria.value} value={categoria.value}>
                  {categoria.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="provincia-hero" className="sr-only">
              Provincia
            </label>
            <Select id="provincia-hero" name="provincia" defaultValue="">
              <option value="">Provincia</option>
              {PROVINCIAS.map((provincia) => (
                <option key={provincia.value} value={provincia.value}>
                  {provincia.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <SelectorModoBusqueda modoInicial="indiferente" fechaInicial="" horaInicial="" />

        <Button type="submit" className="whitespace-nowrap">
          Buscar profesionales
        </Button>
      </form>
    </Card>
  );
}
