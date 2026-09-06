"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/profesionales";
import { PROVINCIAS } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SelectorFechaHora } from "@/app/profesionales/selector-fecha-hora";

const CUANDO_OPCIONES = [
  { value: "lo_antes_posible", label: "Lo antes posible" },
  { value: "dia_hora", label: "Elegir día y hora" },
  { value: "indiferente", label: "Cuando sea" },
] as const;

function quitarAcentos(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function detectarCategoria(texto: string) {
  const palabras = quitarAcentos(texto.trim().toLowerCase()).split(/\s+/).filter(Boolean);
  for (const palabra of palabras) {
    if (palabra.length < 3) continue;
    const prefijo = palabra.slice(0, 4);
    const encontrada = CATEGORIAS.find((categoria) => {
      const label = quitarAcentos(categoria.label.toLowerCase());
      return label.startsWith(prefijo) || prefijo.startsWith(label.slice(0, 4));
    });
    if (encontrada) return encontrada.value;
  }
  return undefined;
}

/**
 * Buscador simplificado del hero, solo para móvil: un campo de texto libre +
 * botón "Buscar". Al buscar se intenta reconocer una categoría a partir del
 * texto (detectarCategoria) y, si se reconoce, se revelan los desplegables
 * de provincia y "¿cuándo lo necesitas?" para afinar antes de ir a
 * /profesionales. El hero de escritorio sigue usando BuscadorHero tal cual.
 */
export function BuscadorHeroMovil() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [provincia, setProvincia] = useState("");
  const [cuando, setCuando] = useState<string>("indiferente");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [buscado, setBuscado] = useState(false);

  function handleBuscarInicial(e: FormEvent) {
    e.preventDefault();
    const encontrada = detectarCategoria(texto);
    setBuscado(true);
    setCategoria(encontrada);
    if (!encontrada) {
      router.push("/profesionales");
    }
  }

  function handleBuscarFinal(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (provincia) params.set("provincia", provincia);
    params.set("modo", cuando);
    if (cuando === "dia_hora") {
      params.set("fecha", fecha);
      params.set("hora_inicio", horaInicio);
      params.set("hora_fin", horaFin);
    }
    router.push(`/profesionales?${params.toString()}`);
  }

  if (buscado && categoria) {
    const label = CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria;

    return (
      <Card className="mt-4 w-full max-w-lg p-6 text-left shadow-sm">
        <form onSubmit={handleBuscarFinal} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            Buscando: <span className="font-medium text-neutral-900">{label}</span>
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="provincia-hero-movil" className="text-sm font-medium text-neutral-900">
              Provincia
            </label>
            <Select
              id="provincia-hero-movil"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
            >
              <option value="">Cualquier provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="cuando-hero-movil" className="text-sm font-medium text-neutral-900">
              ¿Cuándo lo necesitas?
            </label>
            <Select
              id="cuando-hero-movil"
              value={cuando}
              onChange={(e) => setCuando(e.target.value)}
            >
              {CUANDO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          {cuando === "dia_hora" && (
            <div className="rounded-lg border border-neutral-200 p-4">
              <SelectorFechaHora
                fecha={fecha}
                horaInicio={horaInicio}
                horaFin={horaFin}
                onSeleccionarFecha={setFecha}
                onSeleccionarHoraInicio={setHoraInicio}
                onSeleccionarHoraFin={setHoraFin}
              />
            </div>
          )}

          <Button
            type="submit"
            className="whitespace-nowrap"
            disabled={cuando === "dia_hora" && (!fecha || !horaInicio || !horaFin)}
          >
            Buscar profesionales
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mt-4 w-full max-w-lg p-4 text-left shadow-sm">
      <form onSubmit={handleBuscarInicial} className="flex flex-col gap-3">
        <label htmlFor="busqueda-hero-movil" className="sr-only">
          ¿Qué necesitas?
        </label>
        <input
          id="busqueda-hero-movil"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej. Pintores, fontaneros, reformas..."
          className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <Button type="submit" className="w-full whitespace-nowrap">
          Buscar
        </Button>
      </form>
    </Card>
  );
}
