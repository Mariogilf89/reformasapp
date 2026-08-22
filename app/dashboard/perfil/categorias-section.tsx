import { CATEGORIAS, type Categoria } from "@/lib/profesionales";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChipSelector } from "@/components/ui/chip-selector";
import { PERFIL_FORM_ID } from "./constants";

export function CategoriasSection({ categoriasIniciales }: { categoriasIniciales?: Categoria[] }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2">
        <Label>Categorías</Label>
        <ChipSelector
          name="categorias"
          options={CATEGORIAS}
          defaultValues={categoriasIniciales ?? []}
          formId={PERFIL_FORM_ID}
        />
      </div>
    </Card>
  );
}
