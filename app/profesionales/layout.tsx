import { PublicHeader } from "@/components/public-header";

export default function ProfesionalesLayout({ children }: LayoutProps<"/profesionales">) {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
