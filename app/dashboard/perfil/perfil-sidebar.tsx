"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { SECCIONES_PERFIL } from "./secciones";

export function PerfilSidebar() {
  const pathname = usePathname();

  return (
    <Card className="flex flex-col divide-y divide-neutral-200 p-0">
      {SECCIONES_PERFIL.map((seccion) => {
        const activa = pathname === seccion.href;
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            className="flex flex-col gap-1 px-6 py-5 hover:bg-neutral-50"
          >
            <span
              className={
                activa
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-700"
              }
            >
              {seccion.label}
            </span>
            {activa && seccion.descripcion && (
              <span className="text-sm text-neutral-500">{seccion.descripcion}</span>
            )}
          </Link>
        );
      })}
    </Card>
  );
}
