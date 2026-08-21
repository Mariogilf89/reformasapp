"use client";

import { useActionState } from "react";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { guardarPerfilProfesional } from "@/app/actions/profesionales";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { VerificadoBadge } from "@/components/ui/verificado-badge";

type PerfilInicial = {
  categorias: Categoria[];
  zona: string;
  descripcion: string;
  verificado: boolean;
} | null;

export function PerfilForm({ perfil }: { perfil: PerfilInicial }) {
  const [state, action, pending] = useActionState(guardarPerfilProfesional, undefined);

  return (
    <Card className="w-full max-w-lg p-8">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Mi perfil profesional
          </h1>
          {perfil?.verificado && <VerificadoBadge />}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Categorías
          </legend>
          {CATEGORIAS.map((categoria) => (
            <label
              key={categoria.value}
              className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <input
                type="checkbox"
                name="categorias"
                value={categoria.value}
                defaultChecked={perfil?.categorias.includes(categoria.value)}
                className="accent-primary-600"
              />
              {categoria.label}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1">
          <Label htmlFor="zona">Zona de cobertura</Label>
          <Input
            id="zona"
            name="zona"
            type="text"
            required
            defaultValue={perfil?.zona}
            placeholder="Ej. Vigo y alrededores"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            required
            rows={4}
            defaultValue={perfil?.descripcion}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary-600 dark:text-primary-400">Perfil guardado.</p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </form>
    </Card>
  );
}
