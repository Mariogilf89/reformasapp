import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";

type SolicitudDisponible = {
  id: string;
  categoria: Categoria;
  zona: string;
  descripcion: string;
  creado_en: string;
};

export default async function SolicitudesDisponiblesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "profesional") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  // RLS ya limita el resultado a solicitudes abiertas que coinciden con
  // alguna de las categorías del perfil del profesional autenticado.
  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select("id, categoria, zona, descripcion, creado_en")
    .eq("estado", "abierta")
    .order("creado_en", { ascending: false })
    .returns<SolicitudDisponible[]>();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Solicitudes disponibles
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Solicitudes abiertas que coinciden con tus categorías.
        </p>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-4">
        {(solicitudes ?? []).length === 0 && (
          <p className="text-neutral-600 dark:text-neutral-400">
            No hay solicitudes disponibles por ahora.
          </p>
        )}

        {(solicitudes ?? []).map((solicitud) => (
          <Link key={solicitud.id} href={`/dashboard/solicitudes/${solicitud.id}`}>
            <Card className="p-6 transition-colors hover:border-primary-300">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.label ??
                  solicitud.categoria}
                {" · "}
                {solicitud.zona}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {solicitud.descripcion}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
