import Image from "next/image";
import { RegisterForm } from "./register-form";

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : undefined;

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="hidden items-center justify-center bg-primary-50 px-8 py-16 lg:flex">
        <Image
          src="/images/logo-completo.png"
          alt="Faenia — Profesionales. Citas. Sin complicaciones."
          width={420}
          height={384}
          priority
          className="h-auto w-full max-w-md"
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 px-4 py-16">
        <Image
          src="/images/logo-completo.png"
          alt="Faenia — Profesionales. Citas. Sin complicaciones."
          width={175}
          height={160}
          priority
          className="lg:hidden"
        />
        <RegisterForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
