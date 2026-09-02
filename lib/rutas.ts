import "server-only";
import { headers } from "next/headers";

// Origen (protocolo + host) de la petición actual, para construir enlaces
// absolutos (p.ej. el de acceso passwordless del cliente) desde una server
// action, que a diferencia de un route handler no recibe un Request con
// "url.origin" propio. localhost se sirve siempre por http; cualquier otro
// host (producción, previews) por https.
export async function obtenerOrigenPeticion(): Promise<string> {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://${host}`;
}

// Solo se sigue un "redirect"/"next" si es una ruta interna (empieza por "/"
// y no por "//" ni "/\", que un navegador podría interpretar como otro
// host), para evitar redirigir a un sitio externo controlado por el
// parámetro. La usan tanto las acciones de login/registro por contraseña
// como el route handler de vuelta del login OAuth.
export function esRutaInternaSegura(ruta: string): boolean {
  return ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\");
}

// Destino por defecto tras iniciar sesión cuando no hay un "redirect"/"next"
// explícito: el cliente entra buscando profesionales, así que se queda en
// el home; el profesional sigue yendo a su dashboard. La usan tanto el login
// por contraseña (app/actions/auth.ts) como el route handler de vuelta del
// login OAuth (app/auth/callback/route.ts).
export function destinoTrasLogin(role: string | undefined): string {
  return role === "cliente" ? "/" : "/dashboard";
}
