import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PERFIL_FORM_ID } from "./constants";

export function DatosPersonalesSection({
  nombreInicial,
  apellidosInicial,
  fechaNacimientoInicial,
}: {
  nombreInicial?: string;
  apellidosInicial?: string;
  fechaNacimientoInicial?: string | null;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            form={PERFIL_FORM_ID}
            type="text"
            required
            defaultValue={nombreInicial}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input
            id="apellidos"
            name="apellidos"
            form={PERFIL_FORM_ID}
            type="text"
            defaultValue={apellidosInicial}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
          <DatePicker
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            form={PERFIL_FORM_ID}
            defaultValue={fechaNacimientoInicial}
            ariaLabel="Fecha de nacimiento"
          />
        </div>
      </div>
    </Card>
  );
}
