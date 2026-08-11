# Toma el Volante — Entrenador del examen teórico Clase B (Chile)

Aplicativo de estudio personal para aprobar el examen teórico de conducir Clase B.
Sin backend: HTML + CSS + JS vanilla, progreso en `localStorage`. Funciona con **doble
clic en `index.html`** (offline, Roboto embebida) o publicado como sitio propio en
Cloudflare Pages — subdominio sugerido: **tomaelvolante.gamonal.app**. (Producto antes
llamado "Ruta B"; renombrado en ago-2026 y mudado a este repositorio propio.)

## Archivos
- `index.html` — página única del aplicativo (tokens Gamonal + fuente embebida).
- `app_toma_el_volante.js` — motor: router hash, perfiles, quiz, repetición espaciada
  (Leitner), simulacro fiel Nexteo, control por pregunta, export CSV/respaldo JSON.
  Expone `window.RUTAB` para pruebas (nombre interno histórico, igual que la clave
  `rutab:v1` de localStorage: se conservan para no perder el avance guardado; los
  respaldos antiguos con `app:"ruta-b"` se siguen aceptando al restaurar).
- `datos_toma_el_volante.js` — banco de preguntas, fichas y señales. **Generado, no
  editar a mano**: cada pregunta lleva cita textual y página del libro oficial,
  verificadas programáticamente.
- `brand/` — identidad del producto (logo/ícono SVG, PNG, ICO multiresolución):
  volante navy `#040764` con empuñaduras amarillas `#FCE865` en la posición de manos
  9:15, wordmark Roboto 600 en trazados vectoriales.
- `entregables/` — capturas 1920×1080, portada y documentación.
- `acceso.html` + `functions/` — puerta del sitio publicado: middleware de Cloudflare
  Pages que exige correo y contraseña (hash PBKDF2 en `functions/api/_config.js`, jamás
  la contraseña; cookie firmada HttpOnly). La copia local con doble clic no pasa por la
  puerta. Cambio de clave: `verificacion/generar_acceso.html` (doble clic).
- `verificacion/` — arnés E2E Playwright (recorrido completo con la puerta REAL; el
  simulacro se responde desde el propio banco y debe dar 38/38 aprobado).
- `CLAUDE.md` y `DECISIONES-VISUALES.md` — memoria del proyecto y registro de
  decisiones/correcciones visuales (leer antes de proponer cambios).

## Fuentes y modalidad (verificadas ago-2026)
- Contenido: **Libro para la Conducción en Chile — clase B** (CONASET, edición 27-feb-2026),
  descarga oficial gratuita en https://mejoresconductores.conaset.cl (la reproducción del texto
  está autorizada por CONASET en la portada del propio libro).
- Modalidad del examen real (**Nexteo**): 35 preguntas, 3 con doble puntaje (alcohol,
  velocidad y sistemas de retención infantil), 38 puntos máximos, aprueba con 33, 45 minutos.
  El banco real de +1.000 preguntas NO es público: este material es independiente y se
  construye desde el libro oficial, con cita y página de respaldo en cada pregunta.

## Método pedagógico (para TDA / alto rendimiento)
Micro-sesiones de 10 · una pregunta por pantalla · feedback inmediato con el porqué y la cita
· temporizador de foco de 20 s opcional (pista + descarte de 1 alternativa, nunca castigo)
· repetición espaciada Leitner (1-2-4-7-15 días) · simulacros fieles · ranking personal ·
control individual de cada pregunta (vistas, aciertos, fallos, racha, dominio, próximo repaso)
· **trivia de señales** con tarjetas de color (reconocimiento de un vistazo, récord y racha)
· **plan de estudio** por fecha de examen (simulacros en la recta final) con recordatorios
al calendario (.ics con alarma) y fichas con avance de lectura persistente.

## Regenerar el banco
El pipeline vive en el scratchpad de sesión (`ensamblar_banco.py`): valida estructura,
verifica cada cita como substring real del texto oficial, deduplica, cruza respuestas con
un simulador de referencia y emite `datos_toma_el_volante.js`. Ante una nueva edición del
libro, repetir extracción + validación antes de tocar datos.
