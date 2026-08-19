import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role ?? "cliente";
  const name = user.user_metadata?.full_name ?? user.email;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Hola, {name}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Cuenta de tipo: <span className="font-medium">{role}</span>
      </p>
      {role === "profesional" && (
        <>
          <Link href="/dashboard/perfil" className="font-medium underline">
            Editar mi perfil profesional
          </Link>
          <Link href="/dashboard/solicitudes-disponibles" className="font-medium underline">
            Solicitudes disponibles
          </Link>
        </>
      )}
      {role === "cliente" && (
        <Link href="/dashboard/solicitudes" className="font-medium underline">
          Mis solicitudes
        </Link>
      )}
      <Link href="/dashboard/citas" className="font-medium underline">
        Mis citas
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-black/15 px-5 py-2.5 font-medium dark:border-white/20"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
