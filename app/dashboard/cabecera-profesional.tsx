import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificadoBadge } from "@/components/ui/verificado-badge";
import { buttonClassName } from "@/components/ui/button";

export function CabeceraProfesional({
  nombre,
  categorias,
  zona,
  verificado,
  telefono,
  telefonoVerificado,
}: {
  nombre: string;
  categorias: Categoria[];
  zona: string;
  verificado: boolean;
  telefono: string | null;
  telefonoVerificado: boolean;
}) {
  const categoriasLabel = categorias
    .map((valor) => CATEGORIAS.find((c) => c.value === valor)?.label ?? valor)
    .join(", ");

  return (
    <Card className="flex w-full flex-wrap items-center justify-between gap-4 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-neutral-900">{nombre}</h1>
          {verificado && <VerificadoBadge />}
        </div>
        <p className="text-sm text-neutral-600">
          {categoriasLabel || "Sin categorías"} · {zona || "Sin zona"} ·{" "}
          {telefono ?? "Sin teléfono"}
        </p>
        <Badge status={telefonoVerificado ? "confirmada" : "cerrada"} className="w-fit">
          {telefonoVerificado ? "Teléfono verificado" : "Teléfono sin verificar"}
        </Badge>
      </div>

      <Link href="/dashboard/perfil" className={buttonClassName("secondary", "sm")}>
        Editar perfil
      </Link>
    </Card>
  );
}
