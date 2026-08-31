import { CambiarContrasenaForm } from "./cambiar-contrasena-form";

export default function CambiarContrasenaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-neutral-900">Cambiar la contraseña</h2>
      <CambiarContrasenaForm />
    </div>
  );
}
