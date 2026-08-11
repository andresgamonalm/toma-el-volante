/* Criptografía compartida del acceso (WebCrypto, disponible en el runtime de
   Cloudflare y en Node 18+ para las pruebas E2E). */
import { ACCESO } from "./_config.js";

const enc = new TextEncoder();

function aHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function b64url(str) {
  const bytes = typeof str === "string" ? enc.encode(str) : new Uint8Array(str);
  let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  return atob(s);
}
function comparaConstante(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function pbkdf2Hex(clave, sal, iteraciones) {
  const material = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(sal), iterations: iteraciones },
    material, 256
  );
  return aHex(bits);
}

export async function credencialesValidas(usuario, clave) {
  const u = String(usuario || "").trim().toLowerCase();
  if (!comparaConstante(u, ACCESO.usuario.toLowerCase())) return false;
  const h = await pbkdf2Hex(String(clave || ""), ACCESO.sal, ACCESO.iteraciones);
  return comparaConstante(h, ACCESO.hash);
}

function secretoFirma(env) {
  /* Con JWT_SECRET la firma usa un secreto fuera del repositorio (recomendado).
     Sin ella se deriva del hash: sigue cerrando el sitio a extraños, pero un
     lector del repo podría forjar cookies — por eso el refuerzo. */
  return (env && env.JWT_SECRET) ? String(env.JWT_SECRET) : "derivado|" + ACCESO.hash + "|" + ACCESO.sal;
}
async function claveHmac(env) {
  return crypto.subtle.importKey("raw", enc.encode(secretoFirma(env)), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function emitirToken(env) {
  const carga = b64url(JSON.stringify({ u: ACCESO.usuario, exp: Date.now() + ACCESO.diasSesion * 86400000 }));
  const firma = await crypto.subtle.sign("HMAC", await claveHmac(env), enc.encode(carga));
  return carga + "." + b64url(firma);
}

export async function tokenValido(token, env) {
  try {
    const [carga, firma] = String(token || "").split(".");
    if (!carga || !firma) return false;
    const bin = deB64url(firma);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ok = await crypto.subtle.verify("HMAC", await claveHmac(env), bytes, enc.encode(carga));
    if (!ok) return false;
    const datos = JSON.parse(deB64url(carga));
    return typeof datos.exp === "number" && datos.exp > Date.now();
  } catch (e) { return false; }
}

export function leerCookie(cadena, nombre) {
  const m = String(cadena || "").match(new RegExp("(?:^|;\\s*)" + nombre + "=([^;]+)"));
  return m ? m[1] : null;
}

export function cookieSesion(token) {
  return "tev_acceso=" + token + "; Path=/; Max-Age=" + (ACCESO.diasSesion * 86400) + "; HttpOnly; Secure; SameSite=Lax";
}
export function cookieSalir() {
  return "tev_acceso=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}
