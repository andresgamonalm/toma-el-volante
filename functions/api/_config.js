/* Acceso al sitio publicado (Cloudflare Pages).
   Aquí NUNCA va la contraseña: solo su hash PBKDF2-SHA256 con sal.
   Para cambiar la contraseña: abrir verificacion/generar_acceso.html con doble
   clic, escribir la nueva, y pegar aquí el bloque que genera (editando este
   archivo en GitHub). El deploy tarda 1-2 minutos.
   Refuerzo opcional: definir la variable de entorno JWT_SECRET en el proyecto
   de Pages (Settings → Environment variables) con un texto largo aleatorio;
   con ella las cookies de sesión quedan firmadas con un secreto que no está
   en el repositorio. */
export const ACCESO = {
  usuario: "hola@andresgamonal.com",
  sal: "3a22e9caf8b3eb518c5722b1781674c2",
  hash: "ed8b08a3ed9678670470436218ab0baa106927344fbf38e272d1d875d93273a6",
  iteraciones: 100000,
  diasSesion: 30
};
