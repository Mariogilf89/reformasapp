import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

          <UserMenu />
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
