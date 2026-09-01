import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { VerificarTelefonoForm } from "./verificar-telefono-form";
import { TelefonoClienteForm } from "./telefono-cliente-form";
import { VerificacionForm } from "./verificacion-form";

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
  const esProfesional = user.user_metadata?.role === "profesional";

  const { data: perfil } = esProfesional
    ? await supabase
        .from("profesionales")
        .select("documento_identidad_url, verificado")
        .eq("user_id", user.id)
        .maybeSingle<{ documento_identidad_url: string | null; verificado: boolean }>()
    : { data: null };

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      {esProfesional ? (
        <VerificarTelefonoForm telefonoInicial={telefono} verificadoInicial={verificado} />
      ) : (
        <TelefonoClienteForm telefonoInicial={telefono} />
      )}

      {esProfesional && perfil && (
        <VerificacionForm
          userId={user.id}
          tieneDocumentoInicial={Boolean(perfil.documento_identidad_url)}
          verificadoInicial={Boolean(perfil.verificado)}
        />
      )}
    </div>
  );
}
