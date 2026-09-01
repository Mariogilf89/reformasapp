import Link from "next/link";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase";
import { StickyHeader } from "@/components/sticky-header";
import { UserMenu } from "@/components/user-menu";

// El enlace del nombre de la app siempre va a "/" y nunca depende de si hay
// sesión iniciada ni forma parte del formulario de cerrar sesión: solo el
// resto de la cabecera (a la derecha) cambia según el estado de sesión.
export async function PublicHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <StickyHeader>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="shrink-0">
          <Image src="/logo-horizontal.png" alt="Faenia" width={100} height={40} priority />
        </Link>
        {user ? (
          <UserMenu />
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-primary-700"
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className={buttonClassName()}>
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </StickyHeader>
  );
}
