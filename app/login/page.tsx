import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const justRegistered = searchParams.registered === "1";
  const redirectParam = searchParams.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : undefined;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <Image
        src="/images/logo-completo.png"
        alt="Faenia — Profesionales. Citas. Sin complicaciones."
        width={175}
        height={160}
        priority
      />
      <LoginForm justRegistered={justRegistered} redirectTo={redirectTo} />
    </div>
  );
}
