import { PROVINCIAS, type Provincia } from "@/lib/provincias";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChipSelector } from "@/components/ui/chip-selector";
import { PERFIL_FORM_ID } from "./constants";

export function ProvinciasSection({ provinciasIniciales }: { provinciasIniciales?: Provincia[] }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2">
        <Label>Provincias donde trabajas</Label>
        <ChipSelector
          name="provincias"
          options={PROVINCIAS}
          defaultValues={provinciasIniciales ?? []}
          formId={PERFIL_FORM_ID}
        />
      </div>
    </Card>
  );
}
