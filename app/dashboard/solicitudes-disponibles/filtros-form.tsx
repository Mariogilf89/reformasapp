"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { PROVINCIAS } from "@/lib/provincias";
import { guardarAlertaBusqueda } from "@/app/actions/alertas-busqueda";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const MODOS_FILTRO = [
  { value: "", label: "Cualquier momento" },
  { value: "lo_antes_posible", label: "Lo antes posible" },
  { value: "dia_hora", label: "Fecha y hora concreta" },
] as const;

const ORDEN = [
  { value: "recientes", label: "Más recientes" },
  { value: "encaje", label: "Mejor encaje con tu disponibilidad" },
] as const;

export function FiltrosSolicitudesDisponibles({
  categoriasProfesional,
  categoriaInicial,
  provinciaInicial,
  modoInicial,
  ordenInicial,
  ocultarContactadasInicial,
}: {
  categoriasProfesional: Categoria[];
  categoriaInicial: string;
  provinciaInicial: string;
  modoInicial: string;
  ordenInicial: string;
  ocultarContactadasInicial: boolean;
}) {
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  async function handleGuardarAlerta(formData: FormData) {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardado(false);
    const resultado = await guardarAlertaBusqueda(formData);
    setGuardando(false);

    if (resultado?.error) {
      setErrorGuardar(resultado.error);
      return;
    }
    setGuardado(true);
  }

  // El checkbox "ocultar_contactadas" desaparece de la query si se envía
  // desmarcado (así funcionan los checkboxes en un form GET), lo que se
  // confundiría con la primera visita a la página (sin enviar nada, donde
  // queremos que el valor por defecto sea "activado"). Este input oculto
  // distingue ambos casos: si está presente, la ausencia de
  // ocultar_contactadas sí significa "desmarcado a propósito".
  return (
    <Card className="w-full max-w-lg p-6">
      <form method="get" className="flex flex-col gap-4">
        <input type="hidden" name="f" value="1" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="categoria"className="text-sm font-medium text-neutral-900">
              Categoría
            </label>
            <Select id="categoria" name="categoria" defaultValue={categoriaInicial} className="w-full">
              <option value="">Todas mis categorías</option>
              {categoriasProfesional.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIAS.find((c) => c.value === cat)?.label ?? cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="provincia"className="text-sm font-medium text-neutral-900">
              Provincia
            </label>
            <Select id="provincia" name="provincia" defaultValue={provinciaInicial} className="w-full">
              <option value="">Todas las provincias</option>
              {PROVINCIAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="modo"className="text-sm font-medium text-neutral-900">
              ¿Cuándo lo necesita?
            </label>
            <Select id="modo" name="modo" defaultValue={modoInicial} className="w-full">
              {MODOS_FILTRO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="orden"className="text-sm font-medium text-neutral-900">
              Ordenar por
            </label>
            <Select id="orden" name="orden" defaultValue={ordenInicial} className="w-full">
              {ORDEN.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="ocultar_contactadas"
              value="1"
              defaultChecked={ocultarContactadasInicial}
              className="accent-primary-600"
            />
            Ocultar las que ya he contactado
          </label>
        </div>

        {errorGuardar && <p className="text-sm text-red-600">{errorGuardar}</p>}
        {guardado && (
          <p className="text-sm font-medium text-primary-700">
            Alerta guardada. Te avisaremos por email cuando encaje una solicitud nueva.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Filtrar</Button>
          <Button
            type="submit"
            formAction={handleGuardarAlerta}
            variant="secondary"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar esta búsqueda y avisarme"}
          </Button>
          <Link
            href="/dashboard/alertas-busqueda"
            className="text-sm font-medium text-primary-700 hover:underline"
          >
            Mis alertas
          </Link>
        </div>
      </form>
    </Card>
  );
}
