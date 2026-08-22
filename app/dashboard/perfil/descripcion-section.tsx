import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PERFIL_FORM_ID } from "./constants";

export function DescripcionSection({ descripcionInicial }: { descripcionInicial?: string }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-1">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          form={PERFIL_FORM_ID}
          required
          rows={5}
          defaultValue={descripcionInicial}
        />
      </div>
    </Card>
  );
}
