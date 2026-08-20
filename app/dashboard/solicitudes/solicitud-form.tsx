"use client";

import { useActionState } from "react";
import { CATEGORIAS } from "@/lib/profesionales";
import { crearSolicitud } from "@/app/actions/solicitudes";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SolicitudForm() {
  const [state, action, pending] = useActionState(crearSolicitud, undefined);

  return (
    <Card className="w-full max-w-lg p-8">
      <form action={action} className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Publicar una solicitud
        </h1>

        <div className="flex flex-col gap-1">
          <Label htmlFor="categoria">Categoría</Label>
          <Select id="categoria" name="categoria" required defaultValue="">
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="zona">Zona</Label>
          <Input id="zona" name="zona" type="text" required placeholder="Ej. Vigo y alrededores" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            required
            rows={4}
            placeholder="Cuéntanos qué necesitas"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary-600 dark:text-primary-400">
            Solicitud publicada.
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Publicando..." : "Publicar solicitud"}
        </Button>
      </form>
    </Card>
  );
}
