import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { PerfilForm } from "./perfil-form";

export default async function PerfilProfesionalPage() {
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
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  const { data: perfil } = await supabase
    .from("profesionales")
    .select("id, categorias, zona, descripcion")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: valoraciones } = perfil
    ? await supabase
        .from("valoraciones")
        .select("puntuacion, comentario, creado_en")
        .eq("profesional_id", perfil.id)
        .order("creado_en", { ascending: false })
        .returns<{ puntuacion: number; comentario: string | null; creado_en: string }[]>()
    : { data: [] as { puntuacion: number; comentario: string | null; creado_en: string }[] };

  const media =
    valoraciones && valoraciones.length > 0
      ? valoraciones.reduce((suma, v) => suma + v.puntuacion, 0) / valoraciones.length
      : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      <PerfilForm perfil={perfil} />

      {perfil && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold">
            Valoraciones {media !== null && `· ${media.toFixed(1)} / 5`}
          </h2>

          {(valoraciones ?? []).length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Todavía no has recibido ninguna valoración.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(valoraciones ?? []).map((valoracion, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
                >
                  <p className="font-medium">
                    {valoracion.puntuacion} {valoracion.puntuacion === 1 ? "estrella" : "estrellas"}
                  </p>
                  {valoracion.comentario && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {valoracion.comentario}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
