import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { VerificarTelefonoForm } from "./verificar-telefono-form";

export default async function VerificarTelefonoPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const telefono = (user.user_metadata?.telefono as string | undefined) ?? null;
  const verificado = user.user_metadata?.telefono_verificado === true;

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      <VerificarTelefonoForm telefonoInicial={telefono} verificadoInicial={verificado} />
    </div>
  );
}
