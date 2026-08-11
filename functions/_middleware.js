/* Puerta del sitio publicado: sin sesión válida no se sirve NINGÚN archivo.
   Corre solo en Cloudflare Pages; la copia local con doble clic no pasa por
   aquí y sigue libre (no expone datos de nadie: el progreso es de cada equipo). */
import { tokenValido, leerCookie } from "./api/_auth.js";

/* OJO: Cloudflare Pages sirve acceso.html en la "pretty URL" /acceso y además
   REDIRIGE /acceso.html → /acceso. Por eso la lista libre incluye AMBAS formas
   y la puerta siempre redirige a /acceso (redirigir a /acceso.html provoca un
   loop infinito de redirecciones — bug real detectado en producción). */
const LIBRES = new Set([
  "/acceso",
  "/acceso.html",
  "/api/acceso",
  "/api/salir",
  "/brand/icono_toma_el_volante.svg",
  "/favicon.ico"
]);

export async function onRequest(ctx) {
  const { request, next, env } = ctx;
  try {
    const url = new URL(request.url);
    if (LIBRES.has(url.pathname)) return next();
    const token = leerCookie(request.headers.get("Cookie"), "tev_acceso");
    if (token && await tokenValido(token, env)) return next();
    const acepta = request.headers.get("Accept") || "";
    if (request.method === "GET" && acepta.includes("text/html")) {
      return Response.redirect(new URL("/acceso", url).toString(), 302);
    }
    return new Response("Acceso requerido", { status: 401 });
  } catch (e) {
    /* Ante un error inesperado la puerta queda CERRADA (redirige al acceso),
       nunca abierta. */
    return Response.redirect(new URL("/acceso", request.url).toString(), 302);
  }
}
