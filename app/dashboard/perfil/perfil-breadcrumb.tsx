"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES_PERFIL } from "./secciones";

export function PerfilBreadcrumb() {
  const pathname = usePathname();
  const activa = SECCIONES_PERFIL.find((seccion) => seccion.href === pathname);

  return (
    <nav className="text-sm text-neutral-600">
      <Link href="/dashboard/perfil" className="text-primary-700 underline hover:no-underline">
        Mi perfil
      </Link>
      {activa && <span> / {activa.breadcrumb}</span>}
    </nav>
  );
}
