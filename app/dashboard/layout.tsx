import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { obtenerNotificaciones } from "@/app/actions/notificaciones";
import { NotificationBell } from "./notification-bell";
import { ProfileMenu } from "./profile-menu";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const notificaciones = await obtenerNotificaciones();

  const role = user.user_metadata?.role ?? "cliente";

  // Nombre/foto para el icono circular del menú de perfil: para
  // profesionales, el nombre del negocio y la primera foto de su galería
  // (no hay un campo de foto de perfil dedicado); para el resto, el nombre
  // de la cuenta, sin foto.
  let nombreMenu = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Cuenta";
  let fotoMenu: string | null = null;
  if (role === "profesional") {
    const { data: perfil } = await supabase
      .from("profesionales")
      .select("nombre, fotos")
      .eq("user_id", user.id)
      .maybeSingle<{ nombre: string; fotos: string[] | null }>();
    if (perfil) {
      nombreMenu = perfil.nombre;
      fotoMenu = perfil.fotos?.[0] ?? null;
    }
  }

  const navLinks = [
    { href: "/dashboard", label: "Panel" },
    ...(role === "profesional"
      ? [{ href: "/dashboard/perfil", label: "Perfil" }]
      : []),
    ...(role === "cliente"
      ? [{ href: "/dashboard/solicitudes", label: "Mis solicitudes" }]
      : []),
    { href: "/dashboard/citas", label: "Mis citas" },
    {
      href: "/dashboard/verificar-telefono",
      label: role === "profesional" ? "Verificar teléfono" : "Añade tu teléfono",
    },
    ...(role === "profesional"
      ? [
          { href: "/dashboard/solicitudes-disponibles", label: "Solicitudes disponibles" },
          { href: "/dashboard/alertas-busqueda", label: "Mis alertas" },
        ]
      : []),
    ...(role === "admin"
      ? [{ href: "/admin/verificaciones", label: "Verificaciones" }]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          {/* Va siempre a "/" (home), no a "/dashboard": el logo es la marca,
              no un atajo al panel — "Panel" ya está en el menú de perfil de
              al lado para eso. */}
          <Link href="/" className="shrink-0">
            <Image src="/logo-horizontal.png" alt="Faenia" width={100} height={40} priority />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell notificacionesIniciales={notificaciones} />
            <ProfileMenu nombre={nombreMenu} fotoUrl={fotoMenu} navLinks={navLinks} onSignOut={signOut} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
