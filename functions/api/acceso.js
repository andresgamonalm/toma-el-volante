/* POST /api/acceso { usuario, clave } → cookie de sesión firmada. */
import { credencialesValidas, emitirToken, cookieSesion } from "./_auth.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  let datos = {};
  try { datos = await request.json(); } catch (e) { /* cuerpo inválido */ }
  const ok = await credencialesValidas(datos.usuario, datos.clave);
  if (!ok) {
    /* pequeña espera fija: encarece probar claves al voleo */
    await new Promise(r => setTimeout(r, 900));
    return new Response(JSON.stringify({ ok: false, error: "Correo o contraseña incorrectos" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  const token = await emitirToken(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookieSesion(token) }
  });
}
