import Link from "next/link";
import type { SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";
import { IconUbicacion } from "@/components/ui/icon-ubicacion";
import { ListaEsperaCTA } from "@/components/lista-espera-cta";
import { BuscadorHero } from "./buscador-hero";

function IconPintura(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="11" height="5" rx="1.2" />
      <rect x="7" y="9" width="3" height="3" />
      <path d="M8.5 12v5.5a2 2 0 0 0 2 2h.5a2 2 0 0 0 2-2V15" />
    </svg>
  );
}

function IconElectricidad(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" />
    </svg>
  );
}

function IconFontaneria(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.8 6.3a3.8 3.8 0 0 0-5.3 5l-6 6 2.2 2.2 6-6a3.8 3.8 0 0 0 5-5.3l-2.6 2.6-2-2 2.7-2.5Z" />
    </svg>
  );
}

function IconCarpinteria(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15.2 4.8 19.2 8.8l-2.2 2.2-4-4 2.2-2.2Z" />
      <path d="M13.4 6.6 4.5 15.5v3h3l8.9-8.9" />
    </svg>
  );
}

function IconLimpieza(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5v3.2M12 17.3v3.2M4.7 12h3.2M16.1 12h3.2M7 7l2.3 2.3M14.7 14.7 17 17M17 7l-2.3 2.3M9.3 14.7 7 17" />
    </svg>
  );
}

function IconOtros(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function IconCalendario(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M12 13v3l2 1.2" />
    </svg>
  );
}

function IconEscudoVerificado(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5 19 6.5v5c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5v-5L12 3.5Z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  );
}

const CATEGORIAS_HOME = [
  { value: "pintura", label: "Pintura", Icon: IconPintura },
  { value: "electricidad", label: "Electricidad", Icon: IconElectricidad },
  { value: "fontaneria", label: "Fontanería", Icon: IconFontaneria },
  { value: "carpinteria", label: "Carpintería", Icon: IconCarpinteria },
  { value: "limpieza", label: "Limpieza", Icon: IconLimpieza },
  { value: "otros", label: "Otros", Icon: IconOtros },
];

const PASOS = [
  {
    numero: "1",
    titulo: "Publica lo que necesitas",
    descripcion:
      "Cuéntanos qué reforma o servicio necesitas y en qué zona de Galicia, en menos de dos minutos.",
  },
  {
    numero: "2",
    titulo: "Recibe propuestas de profesionales",
    descripcion:
      "Los profesionales de tu categoría y zona te contactan directamente para hablar de tu proyecto.",
  },
  {
    numero: "3",
    titulo: "Reserva cita y valora el trabajo",
    descripcion:
      "Acuerda un horario dentro de la app y, al terminar, deja tu valoración para ayudar a otros usuarios.",
  },
];

const DIFERENCIACION = [
  {
    titulo: "Agenda real, no solo un lead",
    descripcion: "Reserva una cita en el calendario del profesional, no un simple contacto que puede quedar sin respuesta.",
    Icon: IconCalendario,
  },
  {
    titulo: "Identidad verificada",
    descripcion: "Comprobamos la identidad de cada profesional antes de que pueda recibir solicitudes.",
    Icon: IconEscudoVerificado,
  },
  {
    titulo: "Cerca de ti",
    descripcion: "Filtra por provincia y localidad para encontrar profesionales que realmente cubren tu zona.",
    Icon: IconUbicacion,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="px-4 py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
            <span className="text-sm font-medium uppercase tracking-wide text-primary-700 dark:text-primary-400">
              Reformas y servicios del hogar en Galicia
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-50">
              Encuentra al profesional de confianza para tu próxima reforma
            </h1>
            <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
              Pintores, electricistas, fontaneros y más, cerca de ti. Publica lo que
              necesitas y compara propuestas reales antes de decidir.
            </p>

            <BuscadorHero />
          </div>
        </section>

        {/* Diferenciación */}
        <section className="bg-white px-4 py-16 dark:bg-neutral-950">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {DIFERENCIACION.map(({ titulo, descripcion, Icon }) => (
                <div key={titulo} className="flex flex-col items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
                    {titulo}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="px-4 py-16">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Explora por categoría
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIAS_HOME.map(({ value, label, Icon }) => (
                <Link key={value} href={`/profesionales?categoria=${value}`}>
                  <Card className="flex flex-col items-center gap-3 px-3 py-6 text-center transition-colors hover:border-primary-300">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {label}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="bg-primary-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Cómo funciona
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {PASOS.map((paso) => (
                <div key={paso.numero} className="flex flex-col items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {paso.numero}
                  </span>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
                    {paso.titulo}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {paso.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para profesionales */}
        <section className="px-4 py-16">
          <div className="mx-auto w-full max-w-5xl">
            <Card className="flex flex-col items-center gap-4 border-primary-200 bg-primary-50 px-6 py-10 text-center dark:border-primary-900 dark:bg-primary-950/30 sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  ¿Eres profesional de reformas?
                </h2>
                <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
                  Gestiona tu agenda, recibe solicitudes reales de tu zona y haz crecer tu
                  negocio sin intermediarios.
                </p>
              </div>
              <Link href="/register?role=profesional" className="shrink-0">
                <Button className="whitespace-nowrap">Regístrate como profesional</Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* Lista de espera por zona */}
        <section className="px-4 pb-16">
          <div className="mx-auto w-full max-w-5xl">
            <ListaEsperaCTA />
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white px-4 py-10 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 text-sm text-neutral-600 sm:flex-row dark:text-neutral-400">
          <p>© 2026 ReformasApp. Marketplace de reformas y servicios del hogar en Galicia.</p>
          <p>
            ¿Eres profesional de la reforma?{" "}
            <Link
              href="/register"
              className="font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              Regístrate y recibe solicitudes
            </Link>
          </p>
        </div>
        <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-neutral-100 pt-6 text-xs text-neutral-500 sm:justify-start dark:border-neutral-900 dark:text-neutral-500">
          <Link href="/aviso-legal" className="hover:text-primary-700 hover:underline dark:hover:text-primary-400">
            Aviso legal
          </Link>
          <Link href="/privacidad" className="hover:text-primary-700 hover:underline dark:hover:text-primary-400">
            Política de privacidad
          </Link>
          <Link href="/terminos" className="hover:text-primary-700 hover:underline dark:hover:text-primary-400">
            Términos y condiciones
          </Link>
        </div>
      </footer>
    </div>
  );
}
