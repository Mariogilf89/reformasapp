import Image from "next/image";
import { RegisterForm } from "./register-form";

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : undefined;

  const roleParam = searchParams.role;
  const roleInicial = roleParam === "profesional" ? "profesional" : "cliente";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <Image
        src="/images/logo-completo.png"
        alt="Faenia — Profesionales. Citas. Sin complicaciones."
        width={175}
        height={160}
        priority
      />
      <RegisterForm redirectTo={redirectTo} roleInicial={roleInicial} />
    </div>
  );
}
