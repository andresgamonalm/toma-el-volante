/* Verificación E2E de Toma el Volante: recorrido completo + regeneración de las
   capturas de entregables. Responde el simulacro con las respuestas CORRECTAS del
   banco (verifica de punta a punta el mapeo pregunta→alternativa: debe dar 38/38)
   y asevera las reglas duras de marca (tarjetas blancas sobre navy, RB-006).
   Uso: NODE_PATH=<ruta con playwright instalado> node veri_toma_el_volante.js [raíz del repo]
   Chromium esperado en /opt/pw-browsers (sandbox de Claude Code). */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const APP = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, "..");
const ENT = path.join(APP, "entregables");
const MIME = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("no"); }
  res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
  res.end(fs.readFileSync(f));
});

let pasa = 0, falla = 0;
function chk(nombre, ok, extra) {
  if (ok) { pasa++; console.log("PASS", nombre); }
  else { falla++; console.log("FAIL", nombre, extra || ""); }
}

(async () => {
  await new Promise(r => server.listen(8940, r));
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const errores = [];
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
  page.on("pageerror", e => errores.push("PAGEERROR: " + e.message));
  const shot = async (n) => page.screenshot({ path: path.join(ENT, "pantalla_" + n + "_toma_el_volante.jpg"), type: "jpeg", quality: 85 });

  await page.goto("http://127.0.0.1:8940/");
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
  chk("versión interna 1.1", marca.version === "1.1", marca.version);
  chk("banco de 262 preguntas", marca.n === 262, String(marca.n));
  await shot("home");

  // 3. estudiar
  await page.goto("http://127.0.0.1:8940/#/estudiar"); await page.waitForSelector(".cap-card");
  chk("8 capítulos listados", (await page.$$(".cap-card")).length === 8);
  await shot("capitulos");

  // 4. micro-quiz con respuesta correcta
  await page.click(".cap-card"); await page.waitForSelector("#btn-quiz");
  await page.click("#btn-quiz"); await page.waitForSelector("#q-alts .alt");
  const okQuiz = await page.evaluate(() => {
    const txt = document.querySelector(".pregunta-txt").textContent;
    const q = window.RUTAB.data.preguntas.find(p => p.pregunta === txt);
    if (!q) return "pregunta no encontrada en el banco";
    const buena = q.opciones[q.correcta];
    const alt = [...document.querySelectorAll("#q-alts .alt")].find(a => a.textContent.includes(buena));
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
    if (!q) return "no encontrada: " + txt.slice(0, 40);
    const buena = q.opciones[q.correcta];
    const alt = [...document.querySelectorAll("#q-alts .alt")].find(a => a.textContent.includes(buena));
    if (!alt) return "alt no visible";
    alt.click(); return true;
  });
  let fallosSim = [];
  for (let i = 0; i < 12; i++) { const r = await responde(); if (r !== true) fallosSim.push(r); await page.waitForTimeout(25); }
  await shot("simulacro"); // en curso: 12 respondidas, mapa avanzado
  for (let i = 12; i < 35; i++) { const r = await responde(); if (r !== true) fallosSim.push(r); await page.waitForTimeout(25); }
  chk("simulacro: 35 respuestas correctas aplicadas", fallosSim.length === 0, fallosSim.join("|"));
  await page.evaluate(() => document.getElementById("sim-entregar").click());
  await page.waitForSelector(".velo [data-m=si]");
  await page.click(".velo [data-m=si]");
  await page.waitForSelector(".res-hero");
  const res = await page.evaluate(() => ({ ap: document.querySelector(".res-hero").classList.contains("ap"), pts: document.querySelector(".res-hero .puntaje").textContent.trim() }));
  chk("simulacro entregado APROBADO 38/38 (mapeo consistente)", res.ap && res.pts.startsWith("38"), JSON.stringify(res));
  await shot("resultado");

  // 6. señales, progreso, configuración
  await page.goto("http://127.0.0.1:8940/#/senales"); await page.waitForTimeout(300); await shot("senales");
  await page.goto("http://127.0.0.1:8940/#/progreso"); await page.waitForTimeout(300); await shot("progreso");
  await page.goto("http://127.0.0.1:8940/#/configuracion"); await page.waitForTimeout(300);
  const acerca = await page.evaluate(() => document.body.textContent.includes("Acerca de Toma el Volante"));
  chk("configuración: 'Acerca de Toma el Volante'", acerca);
  const sinRutaB = await page.evaluate(() => !document.body.textContent.includes("Ruta B"));
  chk("configuración: sin rastro visible de 'Ruta B'", sinRutaB);
  await shot("configuracion");

  // 7. móvil
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await mctx.newPage();
  mp.on("console", m => { if (m.type() === "error") errores.push("MOVIL: " + m.text()); });
  mp.on("pageerror", e => errores.push("MOVIL PAGEERROR: " + e.message));
  await mp.goto("http://127.0.0.1:8940/");
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

  chk("0 errores de consola/página en todo el recorrido", errores.length === 0, errores.slice(0, 4).join(" || "));
  await browser.close(); server.close();
  console.log(`\nRESULTADO: ${pasa}/${pasa + falla} PASS${falla ? " — " + falla + " FALLAS" : ""}`);
  process.exit(falla ? 1 : 0);
})().catch(e => { console.error("ERROR ARNÉS:", e); process.exit(2); });
