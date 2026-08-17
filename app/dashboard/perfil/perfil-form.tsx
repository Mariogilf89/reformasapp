"use client";

import { useActionState } from "react";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { guardarPerfilProfesional } from "@/app/actions/profesionales";

type PerfilInicial = {
  categorias: Categoria[];
  zona: string;
  descripcion: string;
} | null;

export function PerfilForm({ perfil }: { perfil: PerfilInicial }) {
  const [state, action, pending] = useActionState(guardarPerfilProfesional, undefined);

  return (
    <form
      action={action}
      className="w-full max-w-lg flex flex-col gap-4 rounded-xl border border-black/10 p-8 dark:border-white/15"
    >
      <h1 className="text-2xl font-semibold">Mi perfil profesional</h1>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">Categorías</legend>
        {CATEGORIAS.map((categoria) => (
          <label key={categoria.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="categorias"
              value={categoria.value}
              defaultChecked={perfil?.categorias.includes(categoria.value)}
            />
            {categoria.label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="zona" className="text-sm font-medium">
          Zona de cobertura
        </label>
        <input
          id="zona"
          name="zona"
          type="text"
          required
          defaultValue={perfil?.zona}
          placeholder="Ej. Vigo y alrededores"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={4}
          defaultValue={perfil?.descripcion}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Perfil guardado.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-background font-medium disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
