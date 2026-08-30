import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { obtenerNotificaciones } from "@/app/actions/notificaciones";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";

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
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="shrink-0">
            <Image src="/logo-horizontal.png" alt="Faenia" width={100} height={40} priority />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-neutral-600 hover:text-primary-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell notificacionesIniciales={notificaciones} />
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
