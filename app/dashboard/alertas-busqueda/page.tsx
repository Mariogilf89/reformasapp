import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { PROVINCIAS } from "@/lib/provincias";
import { borrarAlertaBusqueda } from "@/app/actions/alertas-busqueda";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Alerta = {
  id: string;
  categoria: Categoria | null;
  provincia: string | null;
  modo_tiempo: "lo_antes_posible" | "indiferente" | "dia_hora" | null;
  creado_en: string;
};

const ETIQUETAS_MODO: Record<string, string> = {
  lo_antes_posible: "Lo antes posible",
  dia_hora: "Fecha y hora concreta",
  indiferente: "Disponibilidad total",
};

export default async function AlertasBusquedaPage() {
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
        <p className="text-neutral-600">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  const { data: profesional } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  const { data: alertas } = profesional
    ? await supabase
        .from("alertas_busqueda_trabajos")
        .select("id, categoria, provincia, modo_tiempo, creado_en")
        .eq("profesional_id", profesional.id)
        .order("creado_en", { ascending: false })
        .returns<Alerta[]>()
    : { data: [] as Alerta[] };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Mis alertas de búsqueda
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Te avisamos por email en cuanto entre una solicitud que encaje con alguna de estas
          búsquedas guardadas.
        </p>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-3">
        {(alertas ?? []).length === 0 && (
          <p className="text-sm text-neutral-600">
            No tienes ninguna alerta guardada todavía. Guarda una desde el buscador de
            solicitudes disponibles.
          </p>
        )}

        {(alertas ?? []).map((alerta) => (
          <Card key={alerta.id} className="flex items-center justify-between gap-3 p-4 text-sm">
            <span className="text-neutral-700">
              {alerta.categoria
                ? CATEGORIAS.find((c) => c.value === alerta.categoria)?.label ?? alerta.categoria
                : "Cualquier categoría"}
              {" · "}
              {alerta.provincia
                ? PROVINCIAS.find((p) => p.value === alerta.provincia)?.label ?? alerta.provincia
                : "Cualquier provincia"}
              {" · "}
              {alerta.modo_tiempo ? ETIQUETAS_MODO[alerta.modo_tiempo] : "Cualquier momento"}
            </span>
            <form action={borrarAlertaBusqueda}>
              <input type="hidden" name="id" value={alerta.id} />
              <Button type="submit" variant="danger" size="xs">
                Borrar
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
