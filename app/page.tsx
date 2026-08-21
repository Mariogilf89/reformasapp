import Link from "next/link";
import type { SVGProps } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

function IconEstrella(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3.5 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.5Z" />
    </svg>
  );
}

function IconOjo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
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

const CONFIANZA = [
  {
    titulo: "Valoraciones verificadas",
    descripcion: "Solo puntúan los clientes que han tenido una solicitud real con el profesional.",
    Icon: IconEstrella,
  },
  {
    titulo: "Sin intermediarios ocultos",
    descripcion: "Hablas directamente con el profesional, sin comisiones escondidas en el proceso.",
    Icon: IconOjo,
  },
  {
    titulo: "Perfiles y disponibilidad reales",
    descripcion: "Cada profesional gestiona su propio calendario, así que las citas se ajustan a su agenda real.",
    Icon: IconCalendario,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <span className="text-lg font-semibold text-primary-700 dark:text-primary-400">
            ReformasApp
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className={buttonClassName()}>
              Registrarse
            </Link>
          </div>
        </div>
      </header>

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

            <Card className="mt-4 w-full max-w-lg p-6 shadow-sm">
              <form
                action="/register"
                method="get"
                className="flex flex-col items-stretch gap-3 sm:flex-row"
              >
                <label htmlFor="categoria-hero" className="sr-only">
                  ¿Qué necesitas?
                </label>
                <select
                  id="categoria-hero"
                  name="categoria"
                  defaultValue=""
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="" disabled>
                    ¿Qué necesitas?
                  </option>
                  {CATEGORIAS_HOME.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" className="whitespace-nowrap">
                  Buscar profesionales
                </Button>
              </form>
            </Card>
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
                <Link key={value} href={`/register?categoria=${value}`}>
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
        <section className="bg-white px-4 py-16 dark:bg-neutral-950">
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

        {/* Confianza */}
        <section className="bg-primary-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Pensado para dar confianza, a ambos lados
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {CONFIANZA.map(({ titulo, descripcion, Icon }) => (
                <div key={titulo} className="flex flex-col items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-700 dark:bg-neutral-800 dark:text-primary-300">
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
