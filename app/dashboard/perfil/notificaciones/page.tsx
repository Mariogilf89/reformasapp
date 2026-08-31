import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_NOTIFICACION, type TipoNotificacion } from "@/lib/notificaciones";
import { PreferenciasNotificacionForm } from "./preferencias-notificacion-form";

export default async function NotificacionesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metadata = user.user_metadata as Record<string, unknown> | null;

  // Sin preferencia guardada todavía = notificación activada por defecto.
  const preferenciasIniciales = Object.fromEntries(
    TIPOS_NOTIFICACION.map((tipo) => [tipo, metadata?.[`notif_${tipo}`] !== false])
  ) as Record<TipoNotificacion, boolean>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-900">Preferencias de notificaciones</h2>
      <PreferenciasNotificacionForm preferenciasIniciales={preferenciasIniciales} />
    </div>
  );
}
