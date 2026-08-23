"use client";

import { useState, type FormEvent } from "react";
import { apuntarseListaEspera } from "@/app/actions/lista-espera";
import { PROVINCIAS } from "@/lib/provincias";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Mini formulario (email + provincia opcional) para apuntarse a la lista de
 * espera de una zona/categoría sin profesionales todavía. Se reutiliza tal
 * cual en la home y en /profesionales cuando una búsqueda no da resultados.
 */
export function ListaEsperaForm({
  categoria,
  provinciaInicial = "",
  className,
}: {
  categoria?: string;
  provinciaInicial?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [provincia, setProvincia] = useState(provinciaInicial);
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEstado("enviando");

    const resultado = await apuntarseListaEspera(email, provincia || undefined, categoria);

    if (resultado.error) {
      setError(resultado.error);
      setEstado("idle");
      return;
    }
    setEstado("enviado");
  }

  if (estado === "enviado") {
    return (
      <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
        ¡Gracias! Te avisaremos en cuanto lleguemos a tu zona.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3 sm:flex-row sm:items-start", className)}>
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="email-lista-espera" className="sr-only">
          Email
        </label>
        <Input
          id="email-lista-espera"
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 sm:max-w-[13rem]">
        <label htmlFor="provincia-lista-espera" className="sr-only">
          Provincia
        </label>
        <Select
          id="provincia-lista-espera"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
        >
          <option value="">Tu provincia (opcional)</option>
          {PROVINCIAS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" disabled={estado === "enviando"} className="whitespace-nowrap">
        {estado === "enviando" ? "Enviando..." : "Avisadme"}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400 sm:basis-full">{error}</p>}
    </form>
  );
}
