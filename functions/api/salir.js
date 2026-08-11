/* GET /api/salir → borra la cookie de sesión y vuelve a la puerta de acceso. */
import { cookieSalir } from "./_auth.js";

export async function onRequestGet(ctx) {
  return new Response(null, {
    status: 302,
    headers: { "Location": new URL("/acceso.html", ctx.request.url).toString(), "Set-Cookie": cookieSalir() }
  });
}
