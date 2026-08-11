# Toma el Volante — memoria del proyecto

> Este archivo lo lee Claude Code al iniciar cada sesión en ESTE repositorio.
> Si cambias algo importante de arquitectura o acuerdos, actualízalo.

## Qué es
Entrenador personal del **examen teórico de conducir Clase B de Chile** para Andrés Gamonal
(hola@andresgamonal.com — **responder siempre en español**). Pedagogía para TDA. Producto
antes llamado "Ruta B"; renombrado a **"Toma el Volante"** el 11-ago-2026 (elección del
usuario). Hasta ago-2026 vivió en `simple-block-builder/toma-el-volante/`; ahora este repo
propio es la ÚNICA casa del proyecto.

## Arquitectura
SPA 100% estática SIN backend, sin build, sin dependencias en ejecución. Tres archivos en la
**raíz del repo**: `index.html` (tokens + **Roboto 400/500/600 embebida en base64**: funciona
con doble clic sin internet), `app_toma_el_volante.js` (motor: router hash `#/login #/home
#/estudiar #/repaso #/simulacro #/senales #/progreso #/configuracion`, perfiles, quiz, Leitner,
simulacro, señales SVG, progreso, CSV, respaldo) y `datos_toma_el_volante.js` (banco GENERADO,
no editar a mano). Progreso en localStorage por perfil.
- **Claves internas históricas — NO renombrar** (se pierde el avance guardado): localStorage
  `rutab:v1` y `rutab:v1:p:<perfil>`, globals `window.RUTAB_DATA` (banco) y `window.RUTAB`
  (interfaz de pruebas E2E). Los respaldos viejos con `app:"ruta-b"` se aceptan al restaurar.
- **Deploy**: publicar este repo como sitio propio en Cloudflare Pages (estático, sin build).
  Subdominio sugerido: **tomaelvolante.gamonal.app**.

## Contenido fidedigno (no rehacer)
- Banco construido desde el **Libro para la Conducción en Chile — clase B (CONASET, edición
  27-feb-2026)**, descarga oficial en mejoresconductores.conaset.cl. **262 preguntas** (cada
  una con cita VERBATIM + página, validadas programáticamente), **87 fichas**, **56 señales**
  en SVG propio fiel al anexo. El banco real de Nexteo (+1.000) NO es público (venderlo es
  ilícito según MTT) — no intentar conseguirlo. Pipeline de regeneración: `ensamblar_banco.py`
  (scratchpad de la sesión original); ante nueva edición del libro, repetir extracción +
  validación de citas (cita no-substring ⇒ pregunta eliminada).
- **Modalidad oficial replicada (verificada):** 35 preguntas, 3 con DOBLE puntaje (alcohol,
  velocidad, SRI), 38 pts máx, aprueba con 33, 45 minutos (minuta Senado Nexteo, gob.cl 2024).
- **Método TDA:** micro-quiz de 10 · fichas de UNA idea (≤20 s) · Leitner 1-2-4-7-15 días ·
  timer de foco 20 s OPCIONAL (pista + descarta 1 alternativa, NUNCA falla automática) ·
  puntos/racha sobrios · control POR PREGUNTA + CSV · ranking de simulacros · semáforo
  "listo para rendir" (dominio ≥85% + 3 simulacros aprobados).

## Identidad y reglas visuales (skill lineamientos-marca-gamonal + DECISIONES-VISUALES.md)
- Símbolo: **VOLANTE** blanco (aro + 3 rayos + cubo) sobre placa navy `#040764` con
  empuñaduras amarillas `#FCE865` en posición de manos **9:15**; fondos oscuros: placa blanca,
  volante navy, empuñaduras `#FADB0E`. Wordmark "Toma el Volante" Roboto 600 en **trazados
  vectoriales** (los SVG en `<img>` no ven la Roboto embebida; paths generados con fontTools
  desde la propia woff2). `brand/` con SVG, PNG 2118×640, 1000×1000, ICO 16/32/48/256.
- **Radio único 8px**. Sin Envato (orden del usuario: solo material CONASET).
- **RB-006 (corrección dura del usuario): NUNCA azul sobre azul** — sobre superficies navy,
  toda caja va en fondo sólido claramente distinto (blanco); nada de navy-d ni translúcidos
  como fondo de caja. El arnés E2E lo asevera.
- Decisiones RB-001..006 en `DECISIONES-VISUALES.md` (leerlas antes de proponer cambios).

## Acuerdos de trabajo
1. Trabajar en `main` de ESTE repo (git push origin HEAD:main).
2. **Verificar SIEMPRE con Playwright antes de pushear**: `verificacion/veri_toma_el_volante.js`
   (server local + recorrido completo; responde el simulacro desde el banco y exige 38/38
   aprobado + 0 errores de consola + tarjetas blancas del login). Chromium del sandbox:
   `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; correr con
   `NODE_PATH=<ruta con playwright> node verificacion/veri_toma_el_volante.js <raíz del repo>`.
3. Capturas de entregables en `entregables/` (regenerarlas si cambia la UI) + mostrar al usuario.
4. Cambios de interfaz/layout: mockup primero, aprobación del usuario, luego implementar.

## Estado
v1.1 (11-ago-2026): rebrand completo + corrección RB-006, verificado 18/18 PASS. Pendientes:
conectar Cloudflare Pages + subdominio; posible mejora móvil de la tarjeta "Hoy te toca"
(texto angosto junto al botón — pre-existente, requiere mockup).
