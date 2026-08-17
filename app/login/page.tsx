import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const justRegistered = searchParams.registered === "1";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm justRegistered={justRegistered} />
    </div>
  );
}
