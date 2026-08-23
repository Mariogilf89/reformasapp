import { RegisterForm } from "./register-form";

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : undefined;

  const roleParam = searchParams.role;
  const roleInicial = roleParam === "profesional" ? "profesional" : "cliente";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <RegisterForm redirectTo={redirectTo} roleInicial={roleInicial} />
    </div>
  );
}
