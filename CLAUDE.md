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
#/estudiar #/repaso #/simulacro #/senales #/trivia #/plan #/progreso #/configuracion`, perfiles, quiz, Leitner,
simulacro, señales, progreso, CSV, respaldo), `datos_toma_el_volante.js` (banco GENERADO,
no editar a mano) + carpeta `senales/` (195 PNG oficiales del anexo). Progreso en localStorage
por perfil.
- **Claves internas históricas — NO renombrar** (se pierde el avance guardado): localStorage
  `rutab:v1` y `rutab:v1:p:<perfil>`, globals `window.RUTAB_DATA` (banco) y `window.RUTAB`
  (interfaz de pruebas E2E). Los respaldos viejos con `app:"ruta-b"` se aceptan al restaurar.
- **Deploy**: publicar este repo como sitio propio en Cloudflare Pages (estático, sin build).
  Dominio configurado por el usuario: **toma-el-volante.gamonal.app** (Custom Domain del proyecto Pages).

## Contenido fidedigno (no rehacer)
- Banco construido desde el **Libro para la Conducción en Chile — clase B (CONASET, edición
  27-feb-2026)**, descarga oficial en mejoresconductores.conaset.cl. **262 preguntas** (cada
  una con cita VERBATIM + página, validadas programáticamente), **87 fichas**, **195 señales
  con el ARTE OFICIAL del anexo** (v1.3, ver más abajo). El banco real de Nexteo (+1.000) NO
  es público (venderlo es ilícito según MTT) — no intentar conseguirlo. Pipeline de
  regeneración: `ensamblar_banco.py` (scratchpad de la sesión original); ante nueva edición
  del libro, repetir extracción + validación de citas (cita no-substring ⇒ pregunta eliminada).
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
- Decisiones RB-001..013 en `DECISIONES-VISUALES.md` (leerlas antes de proponer cambios).

## Acuerdos de trabajo
1. Trabajar en `main` de ESTE repo (git push origin HEAD:main).
2. **Verificar SIEMPRE con Playwright antes de pushear**: `verificacion/veri_toma_el_volante.js`
   (server local + recorrido completo; responde el simulacro desde el banco y exige 38/38
   aprobado + 0 errores de consola + tarjetas blancas del login). Chromium del sandbox:
   `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; correr con
   `NODE_PATH=<ruta con playwright> node verificacion/veri_toma_el_volante.js <raíz del repo>`.
3. Capturas de entregables en `entregables/` (regenerarlas si cambia la UI) + mostrar al usuario.
4. Cambios de interfaz/layout: mockup primero, aprobación del usuario, luego implementar.

## Seguridad del sitio publicado (v1.2 — no rehacer)
- **Puerta en el borde**: `functions/_middleware.js` — sin cookie válida no se sirve NINGÚN
  archivo (redirige a **`/acceso`**; recursos → 401). ⚠️ GOTCHA REAL DE PRODUCCIÓN: Pages
  aplica "pretty URLs" (redirige `/acceso.html`→`/acceso`); la lista libre debe incluir AMBAS
  formas y las redirecciones de la puerta apuntar SIEMPRE a `/acceso`, o se produce un loop
  infinito (ERR_TOO_MANY_REDIRECTS). El arnés emula las pretty URLs para cazarlo en local. `POST /api/acceso` valida correo +
  contraseña contra hash **PBKDF2-SHA256 100k** en `functions/api/_config.js` (NUNCA la
  contraseña: el repo es público) y emite cookie HMAC HttpOnly 30 días. `GET /api/salir`
  cierra. Cambio de clave: `verificacion/generar_acceso.html` (doble clic, genera el bloque
  para pegar en GitHub). Refuerzo recomendado: env `JWT_SECRET` en Pages (sin ella la firma
  se deriva del hash: cierra a extraños, pero un lector del repo podría forjar cookies).
- La copia local con doble clic NO pasa por la puerta (functions solo corren en Cloudflare).
- El arnés ejecuta el middleware REAL (copias .mjs temporales); credenciales reales por env
  `TEV_USUARIO`/`TEV_CLAVE` (sin ellas usa credenciales de prueba generadas al vuelo).

## Funciones v1.2 (no rehacer)
- **Trivia de señales** (#/trivia, RB-007): señal grande + 4 tarjetas de color con formas
  (maqueta Kahoot del usuario). `P.trivia` {jugadas, mejor, mejorRacha}; puntos+racha sobrios.
  Botón principal de Señales la lanza; el quiz de texto del anexo sigue en Estudiar.
- **Fichas claras + avance** (RB-008): ficha blanca editorial; `P.fichasLeidas` persistente,
  contador/barra en capítulo, puntitos turquesa, conteo en parrilla.
- **Mi plan** (#/plan, RB-009): P.plan {examen, hora, dias[getDay], creado}; plan calculado EN
  VIVO (`tareaDelDia`: últimos 2 días de estudio = simulacros; antes capítulos con dominio<85).
  Home obedece al plan (`tareaDeHoy`). Recordatorios `.ics` con VALARM (`icsDelPlan`). Correo
  directo = fase 2 (Worker+Resend), no simulado.

## Correcciones v1.2.1 (11-ago, no rehacer)
- **RB-011**: tarjetas de la trivia en paleta GAMONAL (navy/azul blanco · turquesa/amarillo navy),
  nunca los colores Kahoot de la referencia (rojo/verde confunden con incorrecto/correcto).
- **RB-012**: `.ico` con regla base 20px + width/height intrínsecos; señalSVG viewBox −8..116
  (rombos sin cortar) y tamaño por CSS. Lección: REVISAR toda captura generada antes de entregar.
- **RB-013 (v1.2.2)**: señalética = NORMATIVA, jamás paleta de marca: rojo #C8102E, amarillo
  #FFCD00, azul #0057B7, negro puro (siguen en acceso.html + maquetas decorativas).

## Señales v1.3 — ARTE OFICIAL del libro (11-ago, no rehacer)
El usuario subió el PDF del libro a su Drive ("Libro_para_la_conduccion_en_Chile_Clase_B_27-02-2026",
170 págs). De su anexo (págs. 150-160) se extrajeron las **195 señales** con el arte ORIGINAL:
- **Extracción por RECORTE DE PÁGINA** (PyMuPDF `get_pixmap(clip=bbox)`), no por xref: el PDF
  reutiliza bitmaps con matrices espejo (angostamiento der/izq comparten imagen) y `extract_image`
  entregaría orientación errada; el recorte reproduce EXACTO lo impreso (vectores incluidos:
  SALIDA CARRO BOMBEROS; rasters chicos: BARRERAS). PNG paleta 128 colores, ~2.5 MB total, en
  **`senales/<id>.png`** (ruta relativa → funciona en producción y con doble clic).
- **Catálogo** en DATA.senales: `{id, nombre, familia, pagina, descripcion?}`. Nombres VERBATIM
  del libro, erratas incluidas ("MATENGA SU DERECHA", "SISTEMA COPLEMENTARIO" — NO corregir).
  4 familias: reglamentaria 62 · preventiva 73 · informativa 46 · **transitoria 14** (nueva,
  pág. 160 naranjas). Variantes reales comparten nombre y se distinguen por id (-2/-3): espejos
  izq/der, auto/camión, los 9 CRUCES, PROHIBIDO ESTACIONAR con placa de excepción. Celdas
  multi-lámina recompuestas: BALIZAS DE ACERCAMIENTO (300/200/100 m) y DESVÍO (2 flechas).
  La lámina duplicada de ZONA ESPERA ESPECIAL CICLOS en p.159 se deduplicó. Descripciones: se
  traspasaron las 58 ya aprobadas (match nombre+familia); el resto sin descripción (no inventar).
- **Renderer `senalImg(s,px)`** (img + lazy); los SVG esquemáticos (SEN_PICTO/senalSVG/pictoSVG)
  se ELIMINARON del app. Galería: 5 filtros con conteo (Todas/4 familias) + marco `.sen-art`.
- **Trivia**: el bitmap jamás se tapa → `TRIVIA_EXCLUIR` = 44 señales cuyo arte escribe su
  propio nombre (auditadas página a página); letras-símbolo (E, SOS, cifras) sí juegan (pool 151).
  Los distractores se arman por NOMBRE distinto y sin repetir (las variantes comparten nombre).
- Pipeline reproducible en el scratchpad de la sesión (`catalogo_final.json` + scripts PyMuPDF).

## v1.3.1 — caché y alternativas uniformes (12-ago, no rehacer)
- **BUG REAL DE PRODUCCIÓN:** tras el deploy de v1.3 el navegador del usuario siguió sirviendo
  el app JS viejo desde caché (vio las señales esquemáticas eliminadas → "sigues inventando
  señales"). Doble blindaje: el middleware fija `Cache-Control: no-cache` en HTML/JS y
  `max-age=604800` en `/senales/` (no re-envuelve `/api/` — llevan Set-Cookie), y los script
  tags llevan `?v=1.3.1` (subir el número con cada versión). El arnés asevera las cabeceras.
  Regla operativa: NUNCA anunciar "ya está en producción" — decir "en 1-2 min, con Ctrl+Shift+R".
- **RB-014 (orden del usuario: "no pintes cada cuadro de un color distinto, confunde; usa
  criterio, es un tema serio"):** alternativas de la trivia UNIFORMES con el lenguaje del quiz
  (tarjeta blanca, borde #cfd6e4, chip 1-4); color SOLO como feedback (verde correcta con
  check, rojo la elegida incorrecta; el resto no se atenúa). TK_CARTAS y las formas ▲◆●■
  se eliminaron.

## v1.3.3 — 132 señales VECTORIALES del Manual (12-ago, no rehacer)
El usuario subió los 8 capítulos del Manual al repo (ahora en `fuentes/`). Del **cap2**
(las señales a color son VECTORES; las leyendas de sus grillas también son vectores, no
texto) se integraron **128 señales** + 4 del cap5 = **132 de 195 en vectorial ~600px**:
- Método: clustering de trazos (componentes conexas, inflado 4pt) → thumb 128px →
  **matching por similitud de imagen contra el arte del libro** (los nombres SIEMPRE
  quedan verbatim del libro) → ~90 aceptadas tras revisión visual hoja a hoja → familias
  espejo asignadas A MANO leyendo las grillas anotadas (p11/p12/p35/p36: 9 cruces en
  orden 17,19,21,23,25,27,29,31,32; curvas muy cerradas; pendientes; ensanchamientos;
  medianas; vía segregada 11a/11b; superficie 13a=bici|auto→-3, 13b=auto|bici→base y -2)
  → minis azules de autopista (p88) por relleno azul → verificación 1:1 de las 135 y
  zoom de dudas → 7 DESCARTES donde el manual difiere del libro (manda el LIBRO):
  cruz-de-san-andres (poste), direccion-obligada (flecha→ vs ↑), fin-ciclovia (no está),
  solo-televia (cluster sucio), solo-transporte-publico (SÓLO vs SOLO), pendientes DE
  SUBIDA ×2 (espejadas). Leyendas pegadas: recorte cuadrado + recorte por contenido.
- **Siguen con arte del libro (63):** las 7 recién dichas + velocidad-minima (40≠60),
  zona-30/fin-zona-30, balizas, estacionamiento-reservado y prohibido-estacionar-2
  (placas distintas), preferencia-ciclistas ×4 (raster manual ≈ raster libro), café
  turísticas, servicios (SOS público/peaje/fotográfico/cámara), zona-espera/ciclo
  (cap6 Facilidades y minis IO de p90-92 del cap2 = MEJORA FUTURA por el mismo método),
  desvíos transitorios, y todas las demás sin lámina individual en el manual.
- SENAL_V=3. Los PDFs del manual viven en `fuentes/` (oficiales, MTT/CONASET).

## v1.3.2 — nitidez con el Manual de Señalización (12-ago, EN CURSO)
El usuario subió a Drive la carpeta "Manual-Señalización" (Manual de Señalización de Tránsito
MTT/CONASET por capítulos). **En el manual las señales a color son VECTORIALES** → nitidez
infinita. Pipeline probado con cap5 (transitorias): localizar rellenos naranjo/amarillo con
`get_drawings()` en el rango de cada sección "SEÑAL X (CÓDIGO)" (los rasters ~430px de esas
páginas son los DIBUJOS TÉCNICOS con cotas — no confundir), render del clip a ~600px,
verificación lado a lado contra el arte del libro (mismo símbolo y composición) y quantize.
4 integradas: trabajos-en-la-via, fin-trabajos-en-la-via, banderero, transito-de-maquinaria.
`SENAL_V` en app JS versiona las URLs de /senales/ (rompe el max-age 7d al renovar arte).
- **BLOQUEO cap2 (SenalesVerticales, 6.8 MB = 181 señales restantes):** el conector de Drive
  no entrega archivos sobre ~4-5 MB ("session expired"; cap5 de 3 MB sí bajó) y el proxy
  bloquea drive.google.com, conaset.cl y mtt.gob.cl. VÍA CONFIABLE: que el usuario suba
  `capitulo2_SenalesVerticales.pdf` al repo por GitHub web (carpeta `fuentes/`); GitHub sí
  está permitido. Pedido al usuario el 12-ago. Con ese archivo: mismo pipeline (secciones
  RPI/RPO/RR/RO/RA/PF/PO/PE/IS... con fills cálidos Y fríos — rojo/azul/verde según familia),
  match por nombre contra DATA.senales (alias MATENGA↔MANTENGA), comparación visual 1:1
  contra el libro ANTES de reemplazar (si la composición difiere, manda el LIBRO), quantize
  160, subir SENAL_V.
- El trío desvío/proximidad/fin-desvío del manual es raster ~170px (≈ libro): se mantiene
  el arte del libro. Las otras 7 transitorias no tienen lámina individual en cap5.

## Trivia v1.3.4 — tamaño a elección + CONTROL por señal (12-ago, pedido del usuario)
"Déjame elegir la cantidad de señales... y hay que llevar el control de las que respondí":
- **Selector de ronda** en la intro de la trivia (`#tr-tams`, estilo .filtro): 10/25/50/
  **Todas · 151** — persistente en `P.trivia.tam` (0 = todas; `tamRonda()`/`poolTrivia()`).
- **Registro por señal** `P.senales[id] = {v,a,f}` (se escribe y persiste en CADA respuesta,
  sobrevive salidas a mitad de ronda). Alimenta: tarjeta **"Tu control del catálogo"**
  (X de 151 + % de acierto + barra, en intro y al final de cada ronda), **puntos de estado
  en la galería** (`.sen-dot` turquesa = domina a≥f, rojo = falla; title con el detalle)
  y línea "Tu control en la trivia: X de 151" en el sub de la galería.
- **La ronda prioriza**: no-vistas → falladas (f≥a) → dominadas (armarRondaTrivia), con
  orden barajado — una ronda "Todas" recorre el catálogo completo sin repetir.
- **Récord ahora PORCENTUAL por ronda** (`P.trivia.mejorPct`; los tamaños varían) con
  migración del viejo `mejor` x/10 (×10) en vTrivia. Arnés: 45/45 PASS (4 asserts nuevos:
  selector+control, ronda Todas=151, registro perfil, dots galería).

## v1.3.5 — fichas en UNA pantalla + AUDITORÍA de contenido (12-ago, no rehacer)
- **RB-015 (referencia del usuario):** vCapitulo sin deslizable — micro-quiz arriba y
  TODAS las fichas en `.fichas-grid` (2 col/1 col). Lectura auto-registrada con
  IntersectionObserver (≥60% visible por 1,2 s → `P.fichasLeidas`, mismas claves cap:idx;
  clic también marca; fallback sin observer = clic). Punto turquesa por ficha leída
  (`.ficha-dot` reutiliza `.sen-dot`), contadores en vivo. `fichaIdx` eliminado.
- **AUDITORÍA DE FIDELIDAD** (pregunta del usuario "¿1000% seguro del libro?"):
  script contra el PDF oficial (scratchpad): las 262 preguntas tienen su cita EN el
  libro — 257 literales carácter a carácter y 5 de TABLAS (p.50-51 alcohol, p.74 SRI:
  el extractor reordena celdas; contenido verificado A OJO contra la página). Se
  encontraron y CORRIGIERON 6 páginas erradas: c5-22 87→91, c5-48/49/50 126→107,
  ficha "Señaliza el viraje" 87→92, ficha "El tren siempre pasa primero" 126→107.
  Las 87 fichas son RESÚMENES de estudio (no citas) con todos sus números respaldados
  en su página (auditado 87/87 tras el fix). Re-ejecutar la auditoría ante cualquier
  duda de contenido; ante nueva edición del libro, correr el pipeline completo.

## Estado
v1.3.5 (12-ago-2026): fichas en una pantalla (RB-015) + auditoría de contenido y 6
páginas corregidas. 44/44 PASS.
v1.3.4 (12-ago-2026): trivia con tamaño de ronda a elección + control por señal.
v1.3.3 (12-ago-2026): 132/195 señales en VECTORIAL del Manual oficial (nitidez total).
v1.3.2 (12-ago-2026): 4 transitorias en vectorial del Manual.
v1.3.1 (12-ago-2026): anti-caché + alternativas uniformes RB-014.
v1.3 (11-ago-2026): arte oficial CONASET en señales/trivia/galería, 4 familias, 195 señales.
v1.2: seguridad de sitio + trivia + fichas claras/avance + plan con .ics (35/35 PASS). v1.1:
rebrand + RB-006. Pendientes: elección del usuario entre las 3 propuestas de rediseño
estructural (P5, regla [16]); si elige, implementarla completa; correo directo de
recordatorios (fase 2 opcional); mejora móvil "Hoy te toca" (pre-existente).
