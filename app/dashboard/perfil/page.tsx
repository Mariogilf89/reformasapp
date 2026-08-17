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
    .select("categorias, zona, descripcion")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <PerfilForm perfil={perfil} />
    </div>
  );
}
