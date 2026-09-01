// Solo se sigue un "redirect"/"next" si es una ruta interna (empieza por "/"
// y no por "//" ni "/\", que un navegador podría interpretar como otro
// host), para evitar redirigir a un sitio externo controlado por el
// parámetro. La usan tanto las acciones de login/registro por contraseña
// como el route handler de vuelta del login OAuth.
export function esRutaInternaSegura(ruta: string): boolean {
  return ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\");
}
