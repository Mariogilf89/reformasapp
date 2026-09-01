import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

type Valoracion = { puntuacion: number; comentario: string | null; creado_en: string };

export default async function ValoracionesPage() {
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

  const { data: valoraciones } = perfil
    ? await supabase
        .from("valoraciones")
        .select("puntuacion, comentario, creado_en")
        .eq("profesional_id", perfil.id)
        .order("creado_en", { ascending: false })
        .returns<Valoracion[]>()
    : { data: [] as Valoracion[] };

  const media =
    valoraciones && valoraciones.length > 0
      ? valoraciones.reduce((suma, v) => suma + v.puntuacion, 0) / valoraciones.length
      : null;

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-neutral-900">
        Valoraciones {media !== null && `· ${media.toFixed(1)} / 5`}
      </h2>

      {(valoraciones ?? []).length === 0 ? (
        <p className="text-sm text-neutral-600">
          Todavía no has recibido ninguna valoración.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(valoraciones ?? []).map((valoracion, index) => (
            <li key={index}>
              <Card className="p-3 text-sm">
                <p className="font-medium text-neutral-900">
                  {valoracion.puntuacion} {valoracion.puntuacion === 1 ? "estrella" : "estrellas"}
                </p>
                {valoracion.comentario && (
                  <p className="mt-1 text-neutral-600">
                    {valoracion.comentario}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
