/* Verificación E2E de Toma el Volante: recorrido completo + regeneración de las
   capturas de entregables. Responde el simulacro con las respuestas CORRECTAS del
   banco (verifica de punta a punta el mapeo pregunta→alternativa: debe dar 38/38)
   y asevera las reglas duras de marca (tarjetas blancas sobre navy, RB-006).
   Uso: NODE_PATH=<ruta con playwright instalado> node veri_toma_el_volante.js [raíz del repo]
   Chromium esperado en /opt/pw-browsers (sandbox de Claude Code).
   Puerta de acceso: exporta TEV_USUARIO y TEV_CLAVE para probar las credenciales
   REALES; sin esas variables se prueba el mismo mecanismo con credenciales de
   prueba generadas al vuelo (nunca se escriben secretos en este archivo). */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const APP = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, "..");
const ENT = path.join(APP, "entregables");
const MIME = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png" };

/* La puerta de acceso REAL (functions/) se ejecuta en este server de pruebas:
   se copian los módulos a .mjs temporales (Node los importa como ESM sin
   package.json) y cada request pasa primero por el middleware, igual que en
   Cloudflare Pages. */
const os = require("os");
const AUTHTMP = fs.mkdtempSync(path.join(os.tmpdir(), "tev-auth-"));
for (const [origen, destino] of [
  ["functions/api/_config.js", "_config.mjs"],
  ["functions/api/_auth.js", "_auth.mjs"],
  ["functions/_middleware.js", "_middleware.mjs"],
  ["functions/api/acceso.js", "acceso.mjs"],
  ["functions/api/salir.js", "salir.mjs"]
]) {
  let src = fs.readFileSync(path.join(APP, origen), "utf8");
  src = src.replace(/from "\.\/api\/(_[a-z]+)\.js"/g, 'from "./$1.mjs"').replace(/from "\.\/(_[a-z]+)\.js"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(AUTHTMP, destino), src);
}
let MW = null, ACC = null, SAL = null;
async function cargarAuth() {
  if (!process.env.TEV_CLAVE) {
    const salT = "0123456789abcdef0123456789abcdef";
    const enc = new TextEncoder();
    const mat = await crypto.subtle.importKey("raw", enc.encode("clave-de-prueba-tev"), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salT), iterations: 100000 }, mat, 256);
    const hashT = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
    fs.writeFileSync(path.join(AUTHTMP, "_config.mjs"),
      'export const ACCESO = { usuario: "prueba@tev.local", sal: "' + salT + '", hash: "' + hashT + '", iteraciones: 100000, diasSesion: 30 };\n');
    console.log("AVISO: sin TEV_CLAVE en el entorno — la puerta se prueba con credenciales de PRUEBA (mismo mecanismo).");
  }
  MW = await import(path.join(AUTHTMP, "_middleware.mjs"));
  ACC = await import(path.join(AUTHTMP, "acceso.mjs"));
  SAL = await import(path.join(AUTHTMP, "salir.mjs"));
}

/* El next() del middleware devuelve una Response REAL del estático (igual que
   en Cloudflare Pages): así las cabeceras que el middleware agrega (caché) se
   prueban tal cual llegan al navegador.
   Emula además las "pretty URLs" de Pages: /foo.html redirige 301 a /foo y
   /foo sirve foo.html. Sin esa emulación el loop de redirecciones de la
   puerta (bug real de producción) no se detecta en local. */
function respuestaEstatica(p) {
  if (p === "/") p = "/index.html";
  if (p.endsWith(".html") && p !== "/index.html") {
    return new Response(null, { status: 301, headers: { Location: p.slice(0, -5) } });
  }
  let f = path.join(APP, p);
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return new Response("no", { status: 404 });
  return new Response(fs.readFileSync(f), { headers: { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" } });
}

async function volcarRespuesta(r, res) {
  res.statusCode = r.status;
  r.headers.forEach((v, k) => {
    /* En pruebas locales por http:// se quita el flag Secure de la cookie */
    if (k.toLowerCase() === "set-cookie") v = v.replace(/;\s*Secure/i, "");
    res.setHeader(k, v);
  });
  const cuerpo = Buffer.from(await r.arrayBuffer());
  res.end(cuerpo);
}

const server = http.createServer((req, res) => {
  const trozos = [];
  req.on("data", c => trozos.push(c));
  req.on("end", async () => {
    try {
      const p = decodeURIComponent(req.url.split("?")[0]);
      const request = new Request("http://127.0.0.1:8940" + req.url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(trozos)
      });
      if (p === "/api/acceso" && req.method === "POST") return await volcarRespuesta(await ACC.onRequestPost({ request, env: {} }), res);
      if (p === "/api/salir") return await volcarRespuesta(await SAL.onRequestGet({ request, env: {} }), res);
      const r = await MW.onRequest({ request, env: {}, next: async () => respuestaEstatica(p) });
      return await volcarRespuesta(r, res);
    } catch (e) {
      console.log("ERROR-SERVER:", e.message);
      res.statusCode = 500; res.end("error");
    }
  });
});

let pasa = 0, falla = 0;
function chk(nombre, ok, extra) {
  if (ok) { pasa++; console.log("PASS", nombre); }
  else { falla++; console.log("FAIL", nombre, extra || ""); }
}

(async () => {
  await cargarAuth();
  await new Promise(r => server.listen(8940, r));
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const errores = [];
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
  page.on("pageerror", e => errores.push("PAGEERROR: " + e.message));
  const shot = async (n) => page.screenshot({ path: path.join(ENT, "pantalla_" + n + "_toma_el_volante.jpg"), type: "jpeg", quality: 85 });

  // 0. puerta de acceso (se ejecuta el middleware REAL de functions/)
  const USUARIO = process.env.TEV_USUARIO || "prueba@tev.local";
  const CLAVE = process.env.TEV_CLAVE || "clave-de-prueba-tev";
  const sinCookie = await fetch("http://127.0.0.1:8940/app_toma_el_volante.js");
  chk("puerta: recurso sin sesión → 401", sinCookie.status === 401, String(sinCookie.status));
  const redir = await fetch("http://127.0.0.1:8940/", { headers: { Accept: "text/html" }, redirect: "manual" });
  chk("puerta: navegación sin sesión → 302 a /acceso (pretty URL, sin loop)", redir.status === 302 && (redir.headers.get("location") || "").endsWith("/acceso"), redir.status + " → " + redir.headers.get("location"));
  await page.goto("http://127.0.0.1:8940/");
  chk("puerta: el navegador aterriza en la página de acceso", /\/acceso(\.html)?$/.test(page.url()), page.url());
  await page.evaluate(() => document.fonts.ready);
  await shot("acceso");
  await page.fill("#inp-usuario", USUARIO);
  await page.fill("#inp-clave", "contraseña-equivocada");
  await page.click("#btn-entrar");
  await page.waitForSelector(".error.ver", { timeout: 5000 });
  chk("puerta: credenciales malas muestran error claro", true);
  await page.fill("#inp-clave", CLAVE);
  await page.click("#btn-entrar");
  await page.waitForURL(u => u.pathname === "/", { timeout: 8000 });
  chk("puerta: credenciales buenas entran al aplicativo", true);
  await page.evaluate(() => document.fonts.ready);

  // 1. título + favicon + login
  chk("título de la pestaña", (await page.title()) === "Toma el Volante · Entrenador del examen teórico Clase B", await page.title());
  const fav = await page.evaluate(() => fetch("brand/icono_toma_el_volante.svg").then(r => r.status));
  const ico = await page.evaluate(() => fetch("brand/icono_toma_el_volante.ico").then(r => r.status));
  chk("favicon SVG e ICO servidos", fav === 200 && ico === 200, fav + "/" + ico);
  const logo = await page.evaluate(() => { const i = document.querySelector(".login-form img.logo"); return i && { ok: i.naturalWidth > 0, src: i.src, alt: i.alt }; });
  chk("logo del login carga y es el nuevo", logo && logo.ok && logo.src.includes("logo_toma_el_volante.svg"), JSON.stringify(logo));
  chk("alt del logo con nombre nuevo", logo && logo.alt.includes("Toma el Volante"));
  const lvDato = await page.evaluate(() => {
    const d = document.querySelector(".lv-dato"); if (!d) return null;
    const cs = getComputedStyle(d);
    return { bg: cs.backgroundColor, num: getComputedStyle(d.querySelector("b")).color };
  });
  chk("stats del login: tarjeta BLANCA sobre navy (regla Gamonal: nunca azul sobre azul)",
    lvDato && lvDato.bg === "rgb(255, 255, 255)" && lvDato.num === "rgb(4, 7, 100)", JSON.stringify(lvDato));
  await shot("login");

  // 2. crear perfil → home
  await page.fill("#inp-nombre", "Andrés");
  await page.click("#form-perfil button[type=submit]");
  await page.waitForSelector(".topbar");
  const marca = await page.evaluate(() => ({
    palabra: document.querySelector(".tb-logo span").textContent,
    ruedas: document.querySelectorAll(".tb-logo svg circle").length,
    version: window.RUTAB.version,
    n: window.RUTAB.data.preguntas.length
  }));
  chk("wordmark del topbar = Toma el Volante", marca.palabra === "Toma el Volante", marca.palabra);
  chk("símbolo inline es el volante (círculos)", marca.ruedas >= 2, String(marca.ruedas));
  chk("versión interna 1.3.4", marca.version === "1.3.4", marca.version);
  chk("banco de 262 preguntas", marca.n === 262, String(marca.n));
  await shot("home");

  // 3. estudiar
  await page.goto("http://127.0.0.1:8940/#/estudiar"); await page.waitForSelector(".cap-card");
  chk("8 capítulos listados", (await page.$$(".cap-card")).length === 8);
  await shot("capitulos");

  // 4a. fichas de estudio: tarjeta CLARA + avance de lectura persistente
  await page.click(".cap-card"); await page.waitForSelector("#btn-quiz");
  const ficha = await page.evaluate(() => {
    const f = document.querySelector(".ficha"); if (!f) return null;
    return { bg: getComputedStyle(f).backgroundColor, contador: !!document.getElementById("cap-fichas-num") };
  });
  chk("fichas: tarjeta blanca de lectura (fin del navy agotador)", ficha && ficha.bg === "rgb(255, 255, 255)", JSON.stringify(ficha));
  chk("fichas: contador de avance visible", ficha && ficha.contador);
  await page.click("#ficha-sig"); await page.waitForTimeout(80);
  await page.click("#ficha-sig"); await page.waitForTimeout(80);
  const avanceFichas = await page.evaluate(() => ({
    leidas: Object.keys(window.RUTAB.perfil().fichasLeidas).length,
    num: document.getElementById("cap-fichas-num").textContent,
    puntitosLeidos: document.querySelectorAll("#ficha-pts .leida").length
  }));
  chk("fichas: la lectura queda registrada (3 leídas, puntitos marcados)", avanceFichas.leidas >= 3 && avanceFichas.puntitosLeidos >= 2, JSON.stringify(avanceFichas));
  await shot("fichas");

  // 4b. micro-quiz con respuesta correcta
  await page.click("#btn-quiz"); await page.waitForSelector("#q-alts .alt");
  const okQuiz = await page.evaluate(() => {
    const txt = document.querySelector(".pregunta-txt").textContent;
    const q = window.RUTAB.data.preguntas.find(p => p.pregunta === txt);
    if (!q) return "pregunta no encontrada en el banco";
    const buena = q.opciones[q.correcta];
    /* comparación EXACTA del texto (includes() clickeaba otra alternativa si la
       correcta era substring de ella — daba 37/38 intermitente) */
    const alt = [...document.querySelectorAll("#q-alts .alt")].find(a => {
      const spans = a.querySelectorAll("span");
      return spans.length > 1 && spans[spans.length - 1].textContent.trim() === buena.trim();
    });
    if (!alt) return "alternativa correcta no visible";
    alt.click(); return true;
  });
  chk("quiz: responde la alternativa correcta del banco", okQuiz === true, String(okQuiz));
  await page.waitForTimeout(120);
  const feedback = await page.evaluate(() => (document.getElementById("q-extra") || {}).textContent || "");
  chk("quiz: feedback inmediato visible", feedback.length > 10, feedback.slice(0, 60));
  await shot("quiz");
  await page.evaluate(() => document.getElementById("q-salir").click());
  await page.waitForTimeout(150);
  await page.evaluate(() => { const m = document.querySelector(".velo [data-m=si]"); if (m) m.click(); });

  // 5. simulacro completo con respuestas correctas → 38/38
  await page.goto("http://127.0.0.1:8940/#/simulacro"); await page.waitForSelector("#sim-partir");
  await shot("intro_simulacro");
  await page.click("#sim-partir"); await page.waitForSelector("#q-alts .alt");
  const responde = () => page.evaluate(() => {
    const txt = document.querySelector(".pregunta-txt").textContent;
    const q = window.RUTAB.data.preguntas.find(p => p.pregunta === txt);
    if (!q) return { err: "no encontrada: " + txt.slice(0, 40) };
    const buena = q.opciones[q.correcta];
    /* comparación EXACTA (includes() era flaky por substrings entre alternativas) */
    const alt = [...document.querySelectorAll("#q-alts .alt")].find(a => {
      const spans = a.querySelectorAll("span");
      return spans.length > 1 && spans[spans.length - 1].textContent.trim() === buena.trim();
    });
    if (!alt) return { err: "alt no visible" };
    alt.click(); return { ok: true, txt };
  });
  /* Avance DETERMINISTA: tras el clic se espera a que la pregunta CAMBIE (una
     espera fija de ms es flaky con la máquina cargada: un clic caía en el DOM
     viejo y el simulacro terminaba 37/38). En la última no hay cambio. */
  const avanza = (prev) => page.waitForFunction(p => {
    const el = document.querySelector(".pregunta-txt");
    return !el || el.textContent !== p;
  }, prev, { timeout: 6000 }).catch(() => {});
  let fallosSim = [];
  for (let i = 0; i < 12; i++) { const r = await responde(); if (!r.ok) fallosSim.push(r.err); else if (i < 34) await avanza(r.txt); }
  await shot("simulacro"); // en curso: 12 respondidas, mapa avanzado
  for (let i = 12; i < 35; i++) { const r = await responde(); if (!r.ok) fallosSim.push(r.err); else if (i < 34) await avanza(r.txt); }
  chk("simulacro: 35 respuestas correctas aplicadas", fallosSim.length === 0, fallosSim.join("|"));
  await page.evaluate(() => document.getElementById("sim-entregar").click());
  await page.waitForSelector(".velo [data-m=si]");
  await page.click(".velo [data-m=si]");
  await page.waitForSelector(".res-hero");
  const res = await page.evaluate(() => ({ ap: document.querySelector(".res-hero").classList.contains("ap"), pts: document.querySelector(".res-hero .puntaje").textContent.trim() }));
  chk("simulacro entregado APROBADO 38/38 (mapeo consistente)", res.ap && res.pts.startsWith("38"), JSON.stringify(res));
  await shot("resultado");

  // 6. señales (arte OFICIAL del libro) + trivia estilo tarjetas (maqueta del usuario)
  await page.goto("http://127.0.0.1:8940/#/senales"); await page.waitForTimeout(300);
  const catalogo = await page.evaluate(() => {
    const sen = window.RUTAB.data.senales, porFam = {};
    sen.forEach(s => { porFam[s.familia] = (porFam[s.familia] || 0) + 1; });
    return { total: sen.length, porFam, filtros: document.querySelectorAll(".filtros .filtro").length,
             cards: document.querySelectorAll(".sen-card").length };
  });
  chk("señales: catálogo COMPLETO del anexo (195 del libro oficial)", catalogo.total === 195, JSON.stringify(catalogo));
  chk("señales: 4 familias (62 regl./73 prev./46 inf./14 transitorias) y 5 filtros",
    catalogo.porFam.reglamentaria === 62 && catalogo.porFam.preventiva === 73 &&
    catalogo.porFam.informativa === 46 && catalogo.porFam.transitoria === 14 && catalogo.filtros === 5,
    JSON.stringify(catalogo));
  chk("señales: la galería pinta las 195 tarjetas", catalogo.cards === 195, String(catalogo.cards));
  // el arte es BITMAP oficial servido desde /senales/ y carga de verdad
  const artOk = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll(".sen-card .senal-img")];
    const muestra = [imgs[0], imgs[60], imgs[130], imgs[imgs.length - 1]].filter(Boolean);
    /* las de abajo del pliegue son lazy: forzarlas a eager dispara su carga */
    muestra.forEach(im => { im.loading = "eager"; });
    await Promise.all(muestra.map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; })));
    return muestra.map(im => im.naturalWidth > 50 && im.src.includes("/senales/")).every(Boolean);
  });
  chk("señales: el arte oficial (PNG del PDF) carga en la galería", artOk === true, String(artOk));
  /* anti-caché (bug real: tras un deploy el navegador servía JS viejo y el
     usuario veía señales de la versión anterior): HTML/JS siempre revalidan,
     el arte estable cachea una semana */
  const cache = await page.evaluate(async () => ({
    js: (await fetch("/app_toma_el_volante.js?v=sonda")).headers.get("cache-control"),
    png: (await fetch("/senales/pare.png")).headers.get("cache-control")
  }));
  chk("caché: JS con no-cache y señales con max-age (la versión nueva SIEMPRE llega)",
    cache.js === "no-cache" && /max-age=604800/.test(cache.png || ""), JSON.stringify(cache));
  await shot("senales");
  const btnTrivia = await page.evaluate(() => (document.getElementById("sen-quiz") || {}).textContent || "");
  chk("señales: el botón principal lanza la trivia", btnTrivia.includes("trivia") || btnTrivia.includes("Trivia"), btnTrivia);
  await page.goto("http://127.0.0.1:8940/#/trivia"); await page.waitForSelector("#tr-partir");
  // tamaño de ronda a ELECCIÓN del usuario (control del catálogo completo)
  const selTam = await page.evaluate(() => ({
    n: document.querySelectorAll("#tr-tams .filtro").length,
    etiquetas: [...document.querySelectorAll("#tr-tams .filtro")].map(b => b.textContent.trim()).join("|"),
    control: (document.getElementById("tr-control") || {}).textContent || ""
  }));
  chk("trivia: selector de tamaño de ronda (10/25/50/Todas · 151) y tarjeta de control",
    selTam.n === 4 && /Todas · 151/.test(selTam.etiquetas) && /de 151/.test(selTam.control), JSON.stringify(selTam));
  await page.evaluate(() => { [...document.querySelectorAll("#tr-tams .filtro")].find(b => b.textContent.includes("Todas")).click(); });
  await page.waitForSelector("#tr-partir"); await page.click("#tr-partir"); await page.waitForSelector(".tk-carta");
  const nTodas = await page.evaluate(() => window.RUTAB.triviaEstado().qs.length);
  chk("trivia: ronda 'Todas' trae las 151 jugables", nTodas === 151, String(nTodas));
  await page.click("#tr-salir"); await page.waitForSelector(".velo [data-m=si]"); await page.click(".velo [data-m=si]");
  await page.waitForTimeout(250);
  await page.goto("http://127.0.0.1:8940/#/trivia"); await page.waitForSelector("#tr-tams");
  await page.evaluate(() => { [...document.querySelectorAll("#tr-tams .filtro")].find(b => b.textContent.trim() === "10").click(); });
  await page.waitForSelector("#tr-partir");
  await page.click("#tr-partir"); await page.waitForSelector(".tk-carta");
  const cartas = await page.evaluate(() => ({
    n: document.querySelectorAll(".tk-carta").length,
    colores: [...document.querySelectorAll(".tk-carta")].map(c => getComputedStyle(c).backgroundColor),
    numeros: [...document.querySelectorAll(".tk-carta .tk-num")].map(n => n.textContent).join("")
  }));
  chk("trivia: 4 alternativas UNIFORMES blancas con número (RB-014: nada de un color por alternativa)",
    cartas.n === 4 && new Set(cartas.colores).size === 1 && cartas.colores[0] === "rgb(255, 255, 255)" && cartas.numeros === "1234",
    JSON.stringify(cartas));
  const rondaSana = await page.evaluate(async () => {
    const tr = window.RUTAB.triviaEstado();
    const excl = ["pare","velocidad-minima","desvio","zona-espera-especial-ciclos","peligro","peligro-2"];
    const sinExcluidas = tr.qs.every(q => !excl.includes(q.s.id));
    const opcionesUnicas = tr.qs.every(q => new Set(q.opciones).size === 4 && q.opciones[q.correcta] === q.s.nombre);
    const img = document.querySelector(".tk-senal .senal-img");
    if (img && !img.complete) await new Promise(r => { img.onload = img.onerror = r; });
    return { sinExcluidas, opcionesUnicas, imgOficial: !!img && img.src.includes("/senales/") && img.naturalWidth > 50 };
  });
  chk("trivia: arte oficial visible, sin señales que se autonombran y 4 opciones únicas",
    rondaSana.sinExcluidas && rondaSana.opcionesUnicas && rondaSana.imgOficial, JSON.stringify(rondaSana));
  const puntosAntes = await page.evaluate(() => window.RUTAB.perfil().puntos || 0);
  // primera respuesta correcta para la captura con feedback
  await page.evaluate(() => {
    const tr = window.RUTAB.triviaEstado();
    document.querySelectorAll("#tk-cartas .tk-carta")[tr.qs[tr.i].correcta].click();
  });
  await page.waitForSelector(".tk-carta.ok");
  await shot("trivia");
  // resto de la ronda, siempre con la correcta → 10/10
  for (let i = 1; i < 10; i++) {
    await page.waitForSelector(".tk-carta:not([disabled])", { timeout: 5000 });
    await page.evaluate(() => {
      const tr = window.RUTAB.triviaEstado();
      document.querySelectorAll("#tk-cartas .tk-carta")[tr.qs[tr.i].correcta].click();
    });
    await page.waitForTimeout(950);
  }
  await page.waitForSelector("#tr-otra", { timeout: 8000 });
  const finTrivia = await page.evaluate(() => ({
    texto: document.body.textContent.includes("¡Nuevo récord: 100%!"),
    mejorPct: (window.RUTAB.perfil().trivia || {}).mejorPct,
    puntos: window.RUTAB.perfil().puntos || 0,
    catalogo: /Control del catálogo/.test(document.body.textContent)
  }));
  chk("trivia: ronda perfecta con récord 100% y resumen del catálogo",
    finTrivia.texto && finTrivia.mejorPct === 100 && finTrivia.puntos > puntosAntes && finTrivia.catalogo, JSON.stringify(finTrivia));
  const controlSen = await page.evaluate(() => {
    const reg = window.RUTAB.perfil().senales || {};
    const ids = Object.keys(reg);
    return { n: ids.length, perfectas: ids.every(id => reg[id].a === 1 && reg[id].f === 0) };
  });
  chk("trivia: CONTROL por señal registrado en el perfil (10 respondidas, acertadas)",
    controlSen.n === 10 && controlSen.perfectas, JSON.stringify(controlSen));
  await page.goto("http://127.0.0.1:8940/#/senales"); await page.waitForSelector(".sen-card");
  const dots = await page.evaluate(() => ({
    ok: document.querySelectorAll(".sen-dot.ok").length,
    mal: document.querySelectorAll(".sen-dot.mal").length,
    linea: /Tu control en la trivia/.test(document.body.textContent)
  }));
  chk("galería: puntos de estado por señal + línea de control (10 dominadas)",
    dots.ok === 10 && dots.mal === 0 && dots.linea, JSON.stringify(dots));

  // 7. plan de estudio: examen en 2 días → 2 simulacros (el caso pedido por el usuario)
  await page.goto("http://127.0.0.1:8940/#/plan"); await page.waitForSelector("#plan-crear");
  const fechaExamen = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    document.getElementById("plan-fecha").value = v;
    document.querySelectorAll("#plan-dias .plan-diachip").forEach(b => { b.classList.add("activa"); });
    return v;
  });
  await page.click("#plan-crear");
  await page.waitForSelector("#plan-ics");
  const plan = await page.evaluate(() => ({
    titulo: document.querySelector("h1").textContent,
    sims: [...document.querySelectorAll(".plan-dia")].filter(f => f.textContent.includes("Simulacro completo")).length,
    dias: document.querySelectorAll(".plan-dia").length
  }));
  chk("plan: examen en 2 días → hoy y mañana son simulacros completos", plan.titulo.includes("Faltan 2 días") && plan.dias === 2 && plan.sims === 2, JSON.stringify(plan));
  await shot("plan");
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.click("#plan-ics")]);
  const icsPath = await descarga.path();
  const ics = fs.readFileSync(icsPath, "utf8");
  chk("plan: el .ics trae los eventos con alarma y el día del examen",
    ics.includes("BEGIN:VCALENDAR") && (ics.match(/BEGIN:VALARM/g) || []).length === 3 && ics.includes("Examen teórico Clase B") && ics.includes("Simulacro completo"), (ics.match(/BEGIN:VEVENT/g) || []).length + " eventos");
  await page.goto("http://127.0.0.1:8940/#/home"); await page.waitForTimeout(250);
  const homePlan = await page.evaluate(() => document.body.textContent);
  chk("home: la sesión del día obedece al plan", homePlan.includes("faltan 2 días para el examen") && homePlan.includes("Según tu plan"), "");

  // 8. progreso y configuración
  await page.goto("http://127.0.0.1:8940/#/progreso"); await page.waitForTimeout(300); await shot("progreso");
  await page.goto("http://127.0.0.1:8940/#/configuracion"); await page.waitForTimeout(300);
  const acerca = await page.evaluate(() => document.body.textContent.includes("Acerca de Toma el Volante"));
  chk("configuración: 'Acerca de Toma el Volante'", acerca);
  const sinRutaB = await page.evaluate(() => !document.body.textContent.includes("Ruta B"));
  chk("configuración: sin rastro visible de 'Ruta B'", sinRutaB);
  const cerrarAcceso = await page.evaluate(() => document.body.textContent.includes("Cerrar acceso al sitio"));
  chk("configuración: botón para cerrar el acceso del sitio", cerrarAcceso);
  await shot("configuracion");

  // 7. móvil
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await mctx.newPage();
  mp.on("console", m => { if (m.type() === "error") errores.push("MOVIL: " + m.text()); });
  mp.on("pageerror", e => errores.push("MOVIL PAGEERROR: " + e.message));
  await mp.goto("http://127.0.0.1:8940/");
  await mp.fill("#inp-usuario", USUARIO);
  await mp.fill("#inp-clave", CLAVE);
  await mp.click("#btn-entrar");
  await mp.waitForURL(u => u.pathname === "/", { timeout: 8000 });
  await mp.fill("#inp-nombre", "Andrés");
  await mp.click("#form-perfil button[type=submit]");
  await mp.waitForSelector(".topbar");
  const anchoOK = await mp.evaluate(() => document.documentElement.scrollWidth <= 392);
  chk("móvil: sin scroll horizontal con el nombre nuevo", anchoOK);
  await mp.screenshot({ path: path.join(ENT, "pantalla_movil_home_toma_el_volante.jpg"), type: "jpeg", quality: 85 });
  await mctx.close();

  // 8. portada de presentación
  const fonts = (fs.readFileSync(path.join(APP, "index.html"), "utf8").match(/@font-face\{[^}]*\}/g) || []).join("\n");
  const icono = fs.readFileSync(path.join(APP, "brand/icono_toma_el_volante.svg"), "utf8").replace("<svg ", '<svg style="width:240px;height:240px" ');
  const pp = await ctx.newPage();
  await pp.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${fonts}
    body{margin:0;background:#f5f5f5;font-family:Roboto,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#040764}
    h1{font-weight:600;font-size:78px;margin:34px 0 0}
    p.sub{font-weight:500;font-size:30px;color:#545454;margin:14px 0 0}
    p.pie{position:fixed;bottom:44px;font-size:20px;color:#545454;margin:0}</style></head>
    <body>${icono}<h1>Toma el Volante</h1><p class="sub">Entrenador del examen teórico · Licencia Clase B · Chile</p>
    <p class="pie">Desarrollado por Gamonal</p></body></html>`);
  await pp.evaluate(() => document.fonts.ready);
  await pp.screenshot({ path: path.join(ENT, "portada_presentacion_toma_el_volante.jpg"), type: "jpeg", quality: 88 });
  await pp.close();

  // 9. salir de la sesión
  await page.goto("http://127.0.0.1:8940/api/salir");
  chk("salir: limpia la sesión y vuelve a la puerta", /\/acceso(\.html)?$/.test(page.url()), page.url());
  const trasSalir = await page.evaluate(() => fetch("/app_toma_el_volante.js").then(r => r.status));
  chk("salir: los recursos quedan cerrados de nuevo", trasSalir === 401, String(trasSalir));

  /* Los 401 de las pruebas NEGATIVAS de la puerta (fetch deliberado sin sesión)
     aparecen como errores de consola del navegador: son esperados. Cualquier
     otro fallo de recurso sí rompe la verificación (y además rompería los
     checks funcionales anteriores). */
  const erroresReales = errores.filter(e => !/status of 401/.test(e));
  chk("0 errores de consola/página en todo el recorrido", erroresReales.length === 0, erroresReales.slice(0, 4).join(" || "));
  await browser.close(); server.close();
  console.log(`\nRESULTADO: ${pasa}/${pasa + falla} PASS${falla ? " — " + falla + " FALLAS" : ""}`);
  process.exit(falla ? 1 : 0);
})().catch(e => { console.error("ERROR ARNÉS:", e); process.exit(2); });
