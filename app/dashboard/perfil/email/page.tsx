import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CambiarEmailForm } from "./cambiar-email-form";

export default async function CambiarEmailPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Cambiar el correo electrónico</h2>
        <p className="mt-1 text-sm text-neutral-600">Correo actual: {user.email}</p>
      </div>

      <CambiarEmailForm />
    </div>
  );
}
