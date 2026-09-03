import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { borrarTrabajo, type FotoTrabajo } from "@/app/actions/trabajos";
import { CATEGORIAS } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrabajoForm } from "./trabajo-form";

type Trabajo = {
  id: string;
  titulo: string;
  categoria: string;
  fotos: FotoTrabajo[];
  creado_en: string;
};

export default async function TrabajosPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: trabajos } = perfil
    ? await supabase
        .from("trabajos")
        .select("id, titulo, categoria, fotos, creado_en")
        .eq("profesional_id", perfil.id)
        .order("creado_en", { ascending: false })
        .returns<Trabajo[]>()
    : { data: [] as Trabajo[] };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Mis trabajos</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Añade trabajos que has realizado para mostrar tu experiencia.
        </p>
      </div>

      {perfil ? (
        <TrabajoForm userId={user.id} />
      ) : (
        <p className="text-sm text-neutral-600">
          Completa tu perfil profesional antes de añadir trabajos.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {(trabajos ?? []).length === 0 && (
          <p className="text-sm text-neutral-600">
            Sube fotos de trabajos anteriores para que los clientes vean ejemplos de tu trabajo
            antes de contactarte.
          </p>
        )}

        {(trabajos ?? []).map((trabajo) => (
          <Card key={trabajo.id} className="flex w-full max-w-lg flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-neutral-900">{trabajo.titulo}</p>
                <p className="text-sm text-neutral-500">
                  {CATEGORIAS.find((categoria) => categoria.value === trabajo.categoria)?.label ??
                    trabajo.categoria}
                </p>
              </div>
              <form action={borrarTrabajo}>
                <input type="hidden" name="id" value={trabajo.id} />
                <Button type="submit" variant="danger" size="xs">
                  Borrar
                </Button>
              </form>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {trabajo.fotos.map((foto, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="aspect-square overflow-hidden rounded-lg border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.url} alt={foto.descripcion || trabajo.titulo} className="h-full w-full object-cover" />
                  </div>
                  {foto.descripcion && (
                    <p className="text-xs text-neutral-500">{foto.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
