/* ============================================================================
   Toma el Volante · Entrenador del examen teórico Clase B (Chile)
   App local sin backend: todo el progreso vive en localStorage de este equipo.
   Contenido basado en el "Libro para la Conducción en Chile" (CONASET, feb 2026).
   Modalidad del simulacro = examen real Nexteo: 35 preguntas (3 de doble
   puntaje), 38 puntos máximos, se aprueba con 33, tiempo 45 minutos.
   ========================================================================== */
(function(){
"use strict";

var DATA = window.RUTAB_DATA;
var raiz = document.getElementById("app");

/* ---------- utilidades ---------- */
function esc(s){ s = (s==null? "" : String(s)); return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function mk(html){ var d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }
function uid(){ return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
function shuffle(arr){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function hoyStr(d){ d=d||new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function fmtFecha(ts){ var d=new Date(ts); return d.toLocaleDateString("es-CL",{day:"2-digit",month:"short"})+" "+d.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}); }
function fmtDur(seg){ var m=Math.floor(seg/60), s=seg%60; return m+":"+String(s).padStart(2,"0"); }
function plural(n,uno,mas){ return n===1? uno : mas; }
var DIA = 86400000;

var toastT = null;
function toast(msg){
  var v = document.querySelector(".toast"); if(v) v.remove();
  var t = mk('<div class="toast" role="status">'+esc(msg)+'</div>');
  document.body.appendChild(t);
  clearTimeout(toastT); toastT = setTimeout(function(){ t.remove(); }, 2600);
}

/* ---------- iconografía (línea única, trazo 2) ---------- */
var ICONOS = {
  inicio:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  libro:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  repaso:'<path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 3v6h6"/>',
  crono:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v4l2.5 1.5"/><path d="M9.5 2.5h5"/><path d="M12 2.5V6"/>',
  senal:'<path d="M12 2 22 12 12 22 2 12z"/><path d="M9.5 14.5c1-3 4-5 5.5-5"/>',
  trivia:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  grafico:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
  config:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.15-1.44l2.12-1.64-2-3.46-2.49 1a7 7 0 0 0-2.49-1.44L13.5 2.5h-3l-.49 2.52a7 7 0 0 0-2.49 1.44l-2.49-1-2 3.46 2.12 1.64A7 7 0 0 0 5 12c0 .49.05.97.15 1.44l-2.12 1.64 2 3.46 2.49-1a7 7 0 0 0 2.49 1.44l.49 2.52h3l.49-2.52a7 7 0 0 0 2.49-1.44l2.49 1 2-3.46-2.12-1.64c.1-.47.15-.95.15-1.44z"/>',
  llama:'<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.9-5-3.4-6.8C14.7 6.4 14 4.5 14 2c-3.4 1.6-5 4.3-5 6.8 0 1.2.3 2 .3 2S7.6 10 7.6 7.9C5.9 9.5 4.5 11.9 4.5 14.8 4.5 19 7.6 22 12 22z"/>',
  check:'<path d="M4 12.5 9.5 18 20 6.5"/>',
  cruz:'<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  trofeo:'<path d="M7 3h10v6a5 5 0 0 1-10 0z"/><path d="M7 5H3.5v1A4.5 4.5 0 0 0 8 10.5"/><path d="M17 5h3.5v1A4.5 4.5 0 0 1 16 10.5"/><path d="M12 14v4"/><path d="M8 21h8"/><path d="M9 18h6v3H9z"/>',
  descarga:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19h16"/>',
  usuario:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  usuarios:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M15.5 14.8a6 6 0 0 1 6 5.2"/>',
  mas:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  flecha:'<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  flechaIzq:'<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  ojo:'<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  foco:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  pista:'<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.8.6-1.5 1.2-1.5 2.1h-4c0-.9-.7-1.5-1.5-2.1A6 6 0 0 1 12 3z"/>',
  bandera:'<path d="M5 21V4"/><path d="M5 4c5-2.5 9 2.5 14 0v9c-5 2.5-9-2.5-14 0"/>',
  salir:'<path d="M14 4h-8v16h8"/><path d="M10 12h11"/><path d="m17 8 4 4-4 4"/>',
  marcar:'<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  estrella:'<path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/>'
};
/* width/height intrínsecos: si un contexto no define tamaño (o el CSS no cargó),
   el ícono jamás vuelve a renderizar gigante (corrección del usuario: filas del
   intro de simulacro/trivia con íconos de 400px). El CSS contextual los pisa. */
function ico(n, cls){ return '<svg class="ico'+(cls? " "+cls:"")+'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONOS[n]||"")+'</svg>'; }

/* ---------- sonido (WebAudio, sutil, configurable) ---------- */
var audioCtx = null;
function tono(fq, dur, t0, tipo, vol){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = tipo||"sine"; o.frequency.value = fq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol||0.12, audioCtx.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t0 + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + t0); o.stop(audioCtx.currentTime + t0 + dur + 0.05);
  }catch(e){}
}
function sonido(tipo){
  if(!perfilCfg().sonido) return;
  if(tipo==="ok"){ tono(660,0.09,0); tono(880,0.12,0.09); }
  else if(tipo==="mal"){ tono(220,0.16,0,"sine",0.10); }
  else if(tipo==="aprobado"){ tono(523,0.12,0); tono(659,0.12,0.12); tono(784,0.2,0.24); }
  else if(tipo==="fin"){ tono(494,0.1,0); tono(587,0.16,0.1); }
}

/* ---------- estado (localStorage) ---------- */
var LS_ROOT = "rutab:v1"; /* clave histórica del producto (ex "Ruta B"): no cambiarla o se pierde el avance ya guardado */
function cargarRoot(){
  try{ var r = JSON.parse(localStorage.getItem(LS_ROOT)); if(r && r.perfiles) return r; }catch(e){}
  return { v:1, perfiles:[], activo:null };
}
var ROOT = cargarRoot();
function guardarRoot(){ try{ localStorage.setItem(LS_ROOT, JSON.stringify(ROOT)); }catch(e){ toast("No se pudo guardar (almacenamiento lleno)"); } }

var P = null; // datos del perfil activo
function perfilActivo(){ if(!ROOT.activo) return null; for(var i=0;i<ROOT.perfiles.length;i++) if(ROOT.perfiles[i].id===ROOT.activo) return ROOT.perfiles[i]; return null; }
function perfilNuevoDatos(){
  return { cfg:{ timer20:true, sonido:true, fzGrande:false, meta:20 },
           prog:{}, sims:[], sesiones:[], puntos:0, racha:{ ult:"", dias:0 }, ultCap:null,
           fichasLeidas:{}, trivia:{ jugadas:0, mejor:0, mejorRacha:0 }, plan:null };
}
function cargarPerfil(id){
  try{ var d = JSON.parse(localStorage.getItem(LS_ROOT+":p:"+id)); if(d && d.cfg) { if(d.cfg.meta==null) d.cfg.meta=20; if(!d.fichasLeidas) d.fichasLeidas={}; return d; } }catch(e){}
  return perfilNuevoDatos();
}
function fichasDe(capId){ return DATA.fichas.filter(function(f){ return String(f.capitulo)===String(capId); }); }
function fichasLeidasDe(capId){
  var n = 0, total = fichasDe(capId).length;
  for(var i=0; i<total; i++){ if(P.fichasLeidas[capId+":"+i]) n++; }
  return n;
}
function persistir(){ if(!ROOT.activo) return; try{ localStorage.setItem(LS_ROOT+":p:"+ROOT.activo, JSON.stringify(P)); }catch(e){ toast("No se pudo guardar el avance"); } }
function perfilCfg(){ return (P && P.cfg) || { timer20:true, sonido:true, fzGrande:false, meta:20 }; }

/* ---------- motor de dominio (Leitner) ---------- */
var INTERVALOS = [0, 1, 2, 4, 7, 15]; // días por caja 0..5
function progDe(qid){ return P.prog[qid] || null; }
function registrarRespuesta(qid, ok){
  var p = P.prog[qid] || { v:0, a:0, f:0, r:0, caja:0, prox:0, ult:0 };
  p.v++; p.ult = Date.now();
  if(ok){ p.a++; p.r++; p.caja = clamp(p.caja+1, 1, 5); }
  else  { p.f++; p.r = 0; p.caja = 1; }
  p.prox = Date.now() + INTERVALOS[p.caja]*DIA;
  P.prog[qid] = p;
}
function marcarRachaDia(){
  var hoy = hoyStr();
  if(P.racha.ult === hoy) return;
  var ayer = hoyStr(new Date(Date.now()-DIA));
  P.racha.dias = (P.racha.ult === ayer) ? P.racha.dias+1 : 1;
  P.racha.ult = hoy;
}
function preguntasDe(capId){ return DATA.preguntas.filter(function(q){ return String(q.capitulo)===String(capId); }); }
function dominioCap(capId){
  var qs = preguntasDe(capId); if(!qs.length) return 0;
  var dom = qs.filter(function(q){ var p=progDe(q.id); return p && p.caja>=3; }).length;
  return Math.round(100*dom/qs.length);
}
function dominioGlobal(){
  var qs = DATA.preguntas; if(!qs.length) return 0;
  var dom = qs.filter(function(q){ var p=progDe(q.id); return p && p.caja>=3; }).length;
  return Math.round(100*dom/qs.length);
}
function vencidasHoy(){
  var ahora = Date.now();
  return DATA.preguntas.filter(function(q){ var p=progDe(q.id); return p && p.prox<=ahora && p.caja<5; })
    .sort(function(a,b){ return (progDe(a.id).prox)-(progDe(b.id).prox); });
}
function debiles(){
  return DATA.preguntas.filter(function(q){ var p=progDe(q.id); return p && p.f>0 && p.caja<=2; });
}
function estadoListo(){
  var dom = dominioGlobal();
  var ult3 = P.sims.slice(-3);
  var aprobados3 = ult3.length===3 && ult3.every(function(s){ return s.puntaje>=DATA.examen.aprueba; });
  if(dom>=85 && aprobados3) return { nivel:"listo", color:"var(--ok)", txt:"Listo para rendir", det:"Dominio "+dom+"% y tus últimos 3 simulacros aprobados. Agenda tu hora con confianza." };
  if(dom>=50 || P.sims.some(function(s){ return s.puntaje>=DATA.examen.aprueba; }))
    return { nivel:"camino", color:"var(--warn)", txt:"En camino", det:"Dominio "+dom+"%. Meta: 85% de dominio y 3 simulacros seguidos aprobados." };
  return { nivel:"inicio", color:"#cfd6e4", txt:"Recién comenzando", det:"Estudia los capítulos y suma tus primeros simulacros. Meta: 85% de dominio y 3 simulacros aprobados." };
}

/* ---------- router ---------- */
var vistaActual = "";
function irA(hash){ location.hash = hash; }
function ruta(){
  var h = location.hash.replace(/^#\/?/, "");
  var partes = h.split("/");
  return { v: partes[0]||"", arg: partes[1]||"" };
}
window.addEventListener("hashchange", render);

function render(){
  var r = ruta();
  if(!ROOT.activo && r.v!=="login"){ irA("#/login"); return; }
  if(ROOT.activo && (r.v===""||r.v==="login")){ irA("#/home"); return; }
  vistaActual = r.v || "login";
  window.scrollTo(0,0);
  detenerTimers();
  document.body.classList.toggle("fz-grande", !!(P && P.cfg.fzGrande));
  if(r.v==="login") return vLogin();
  var shellV = { home:vHome, estudiar:(r.arg? function(){vCapitulo(r.arg);} : vEstudiar),
                 repaso:vRepaso, simulacro:vSimulacro, senales:vSenales, trivia:vTrivia,
                 plan:vPlan, progreso:vProgreso, configuracion:vConfig };
  (shellV[r.v]||vHome)();
}

/* ---------- shell (topbar + tabbar) ---------- */
function simboloSVG(px){
  return '<svg viewBox="0 0 512 512" style="width:'+px+'px;height:'+px+'px" aria-hidden="true">'+
    '<rect x="36" y="36" width="440" height="440" rx="44" fill="#040764"/>'+
    '<circle cx="256" cy="256" r="146" fill="none" stroke="#FFFFFF" stroke-width="36"/>'+
    '<g stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"><line x1="256" y1="256" x2="134" y2="256"/><line x1="256" y1="256" x2="378" y2="256"/><line x1="256" y1="256" x2="256" y2="378"/></g>'+
    '<circle cx="256" cy="256" r="58" fill="#FFFFFF"/>'+
    '<g stroke="#FCE865" stroke-width="36" stroke-linecap="round" fill="none"><path d="M 122.6 315.4 A 146 146 0 0 1 122.6 196.6"/><path d="M 389.4 196.6 A 146 146 0 0 1 389.4 315.4"/></g></svg>';
}
function shell(contHTML){
  var per = perfilActivo();
  var nav = [ ["home","Inicio","inicio"], ["estudiar","Estudiar","libro"], ["repaso","Repaso","repaso"],
              ["simulacro","Simulacro","crono"], ["senales","Señales","senal"], ["progreso","Progreso","grafico"] ];
  var links = nav.map(function(n){
    return '<a href="#/'+n[0]+'" class="'+(vistaActual===n[0]?"activa":"")+'">'+ico(n[2])+n[1]+'</a>';
  }).join("");
  var tabs = [["home","Inicio","inicio"],["estudiar","Estudiar","libro"],["repaso","Repaso","repaso"],["simulacro","Simulacro","crono"],["progreso","Progreso","grafico"]].map(function(n){
    return '<a href="#/'+n[0]+'" class="'+(vistaActual===n[0]?"activa":"")+'">'+ico(n[2])+n[1]+'</a>';
  }).join("");
  raiz.innerHTML =
    '<header class="topbar"><div class="topbar-in">'+
      '<a class="tb-logo" href="#/home" aria-label="Toma el Volante, ir al inicio">'+simboloSVG(34)+'<span>Toma el Volante</span></a>'+
      '<nav class="tb-nav" aria-label="Navegación principal">'+links+'</nav>'+
      '<div class="tb-der">'+
        '<span class="tb-stat" title="Puntos de entrenamiento">'+ico("estrella")+'<span>'+(P.puntos||0)+'</span></span>'+
        '<span class="tb-stat racha" title="Días seguidos estudiando">'+ico("llama")+'<span>'+(P.racha.dias||0)+'<span class="txt"> '+plural(P.racha.dias||0,"día","días")+'</span></span></span>'+
        '<button class="tb-avatar" data-acc="config" title="'+esc(per? per.nombre:"")+' · Configuración">'+esc((per&&per.nombre||"?").charAt(0).toUpperCase())+'</button>'+
      '</div>'+
    '</div></header>'+
    '<main class="pagina">'+contHTML+'</main>'+
    '<nav class="tabbar" aria-label="Navegación móvil">'+tabs+'</nav>';
  var av = raiz.querySelector("[data-acc=config]");
  if(av) av.addEventListener("click", function(){ irA("#/configuracion"); });
}

/* ---------- vista: login (acceso y perfiles) ---------- */
function senalMiniSVG(tipo){
  if(tipo==="pare") return '<svg viewBox="0 0 100 100"><path d="M30 4h40l26 26v40L70 96H30L4 70V30z" fill="#C8102E" stroke="#fff" stroke-width="4"/><text x="50" y="60" font-size="24" font-weight="700" fill="#fff" text-anchor="middle" font-family="Roboto,Arial">PARE</text></svg>';
  if(tipo==="ceda") return '<svg viewBox="0 0 100 100"><path d="M6 14h88L50 92z" fill="#fff" stroke="#C8102E" stroke-width="10"/></svg>';
  if(tipo==="vel") return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#C8102E" stroke-width="10"/><text x="50" y="64" font-size="36" font-weight="700" fill="#000000" text-anchor="middle" font-family="Roboto,Arial">50</text></svg>';
  if(tipo==="curva") return '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="10" transform="rotate(45 50 50)" fill="#FFCD00" stroke="#000000" stroke-width="4"/><path d="M38 72c0-14 24-16 24-30" stroke="#000000" stroke-width="8" fill="none" stroke-linecap="round"/><path d="m56 34 6 8 4-10z" fill="#000000"/></svg>';
  return "";
}
function vLogin(){
  var perfiles = ROOT.perfiles.map(function(p){
    return '<button class="perfil-item" data-per="'+p.id+'"><span class="tb-avatar">'+esc(p.nombre.charAt(0).toUpperCase())+'</span><span class="crece"><b>'+esc(p.nombre)+'</b><span>Continuar mi preparación</span></span>'+ico("flecha")+'</button>';
  }).join("");
  raiz.innerHTML =
  '<div class="login">'+
    '<section class="login-form">'+
      '<img class="logo" src="brand/logo_toma_el_volante.svg" alt="Toma el Volante — Entrenador del examen Clase B">'+
      '<div><h1 style="font-size:24px">Tu entrenador personal</h1>'+
      '<p class="sub">Estudia el examen teórico Clase B a tu ritmo: sesiones cortas, repaso inteligente y simulacros idénticos al examen real.</p></div>'+
      (perfiles? '<div style="display:flex;flex-direction:column;gap:10px">'+perfiles+'</div><p class="sub" style="font-size:13.5px">o crea un perfil nuevo:</p>' : "")+
      '<form id="form-perfil" style="display:flex;flex-direction:column;gap:14px">'+
        '<div class="campo"><label for="inp-nombre">'+(perfiles? "Nombre del nuevo perfil":"¿Cómo te llamas?")+'</label>'+
        '<input id="inp-nombre" type="text" maxlength="24" autocomplete="off" placeholder="Ej: Andrés" required></div>'+
        '<button class="btn btn-pri" type="submit">'+ico("usuario")+'Comenzar a entrenar</button>'+
      '</form>'+
      '<p class="sub" style="font-size:12.5px">Sin cuentas ni contraseñas: tu avance se guarda solo en este equipo.</p>'+
    '</section>'+
    '<section class="login-visual">'+
      '<span class="eyebrow" style="color:var(--amarillo)">Examen teórico · Licencia Clase B · Chile</span>'+
      '<h2>Apruébalo a la primera, entrenando como en el examen real.</h2>'+
      '<p class="sub">Contenido construido íntegramente desde el Libro para la Conducción en Chile (CONASET, edición febrero 2026), con la modalidad oficial del examen.</p>'+
      '<div class="lv-senales" aria-hidden="true">'+senalMiniSVG("pare")+senalMiniSVG("ceda")+senalMiniSVG("vel")+senalMiniSVG("curva")+'</div>'+
      '<div class="lv-datos">'+
        '<div class="lv-dato"><b>35</b><span>preguntas por examen</span></div>'+
        '<div class="lv-dato"><b>3</b><span>valen doble puntaje</span></div>'+
        '<div class="lv-dato"><b>33/38</b><span>puntos para aprobar</span></div>'+
        '<div class="lv-dato"><b>45 min</b><span>tiempo límite</span></div>'+
      '</div>'+
      '<span class="lv-endoso">Desarrollado por Gamonal</span>'+
    '</section>'+
  '</div>';
  raiz.querySelectorAll("[data-per]").forEach(function(b){
    b.addEventListener("click", function(){ activarPerfil(b.getAttribute("data-per")); });
  });
  document.getElementById("form-perfil").addEventListener("submit", function(ev){
    ev.preventDefault();
    var nombre = document.getElementById("inp-nombre").value.trim();
    if(!nombre) return;
    var id = uid();
    ROOT.perfiles.push({ id:id, nombre:nombre, creado:Date.now() });
    guardarRoot();
    activarPerfil(id);
  });
}
function activarPerfil(id){
  ROOT.activo = id; guardarRoot();
  P = cargarPerfil(id);
  persistir();
  irA("#/home");
  render();
}

/* ---------- plan de estudio con recordatorios (P4) ----------
   El plan se calcula EN VIVO desde la fecha del examen + días elegidos + el
   estado real de dominio: capítulos pendientes primero, y los últimos 2 días
   de estudio son simulacros completos. Los recordatorios salen como .ics con
   alarma (Google/Outlook/Apple Calendar); un correo a hora exacta requeriría
   un servidor despierto y este aplicativo es 100% estático a propósito. */
var DIAS_SEM = [["Lu",1],["Ma",2],["Mi",3],["Ju",4],["Vi",5],["Sá",6],["Do",0]];
function fechaDeStr(s){ var p = String(s).split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
function diasHastaExamen(){ if(!P.plan) return null; return Math.round((fechaDeStr(P.plan.examen) - fechaDeStr(hoyStr()))/86400000); }
function diasDeEstudio(){
  if(!P.plan) return [];
  var lista = [], ex = fechaDeStr(P.plan.examen);
  for(var d = fechaDeStr(hoyStr()); d < ex; d.setDate(d.getDate()+1)){
    if(P.plan.dias.indexOf(d.getDay()) !== -1) lista.push(new Date(d));
  }
  return lista;
}
function capsPendientes(){ return DATA.capitulos.filter(function(c){ return dominioCap(c.id) < 85; }); }
function tareaDelDia(idx, total){
  if(total - 1 - idx <= 1){
    return { titulo:"Simulacro completo del examen", detalle:"35 preguntas · 45 minutos, igual al real. Después revisa tus incorrectas una a una.", ruta:"#/simulacro" };
  }
  var pend = capsPendientes();
  if(!pend.length) return { titulo:"Repaso inteligente + trivia de señales", detalle:"Mantén fino lo aprendido: el repaso del día y una ronda de trivia.", ruta:"#/repaso" };
  var cap = pend[idx % pend.length];
  return { titulo:(cap.id==="senales"? "Anexo · " : "Capítulo "+cap.id+" · ")+cap.label,
           detalle:"Fichas + micro-quiz de 10. Suma el repaso inteligente si hay pendientes.",
           ruta:"#/estudiar/"+cap.id };
}
function tareaDeHoy(){
  var dias = diasDeEstudio(); if(!dias.length) return null;
  for(var i=0;i<dias.length;i++){ if(hoyStr(dias[i])===hoyStr()) return { tarea:tareaDelDia(i, dias.length), idx:i, total:dias.length }; }
  return null;
}
function icsTexto(s){ return String(s).replace(/\\/g,"\\\\").replace(/[,;]/g, function(m){ return "\\"+m; }); }
function icsFecha(d){
  var p2 = function(n){ return String(n).padStart(2,"0"); };
  return d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+"T"+p2(d.getHours())+p2(d.getMinutes())+"00";
}
function icsDelPlan(){
  var dias = diasDeEstudio();
  var hhmm = (P.plan.hora||"19:00").split(":");
  var L = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Gamonal//Toma el Volante//ES","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  dias.forEach(function(d, i){
    var t = tareaDelDia(i, dias.length);
    var ini = new Date(d); ini.setHours(+hhmm[0]||19, +hhmm[1]||0, 0, 0);
    var fin = new Date(ini.getTime() + 30*60000);
    L.push("BEGIN:VEVENT",
      "UID:tev-"+hoyStr(d)+"@tomaelvolante",
      "DTSTAMP:"+icsFecha(new Date()),
      "DTSTART:"+icsFecha(ini),
      "DTEND:"+icsFecha(fin),
      "SUMMARY:"+icsTexto("Toma el Volante · "+t.titulo),
      "DESCRIPTION:"+icsTexto(t.detalle),
      "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsTexto("Hora de entrenar: "+t.titulo),"TRIGGER:-PT0M","END:VALARM",
      "END:VEVENT");
  });
  L.push("BEGIN:VEVENT",
    "UID:tev-examen-"+P.plan.examen+"@tomaelvolante",
    "DTSTAMP:"+icsFecha(new Date()),
    "DTSTART;VALUE=DATE:"+P.plan.examen.replace(/-/g,""),
    "SUMMARY:"+icsTexto("Examen teórico Clase B — a aprobarlo a la primera"),
    "DESCRIPTION:"+icsTexto("Llega descansado. La víspera: repaso corto de tus débiles y a dormir temprano."),
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Examen teórico mañana","TRIGGER:-P1D","END:VALARM",
    "END:VEVENT","END:VCALENDAR");
  return L.join("\r\n");
}
function vPlan(){
  if(!P.plan){ formPlan(); return; }
  var dias = diasDeEstudio(), faltan = diasHastaExamen();
  var filas = dias.slice(0, 14).map(function(d, i){
    var t = tareaDelDia(i, dias.length);
    var esHoy = hoyStr(d)===hoyStr();
    return '<div class="plan-dia'+(esHoy?" hoy-si":"")+'">'+
      '<div class="plan-fecha"><b>'+d.toLocaleDateString("es-CL",{weekday:"short"})+'</b><span>'+d.toLocaleDateString("es-CL",{day:"numeric",month:"short"})+'</span>'+(esHoy?'<span class="chip chip-curso" style="margin-top:4px">Hoy</span>':'')+'</div>'+
      '<div class="crece"><b>'+esc(t.titulo)+'</b><span class="sub" style="display:block;font-size:13.5px">'+esc(t.detalle)+'</span></div>'+
      '<a class="btn btn-sec" href="'+t.ruta+'">Ir</a>'+
    '</div>';
  }).join("");
  shell(
    '<div style="max-width:800px;margin:0 auto">'+
    '<div class="sec-head"><div><span class="eyebrow">Mi plan de estudio</span>'+
    '<h1 style="font-size:26px;margin-top:4px">'+(faltan>0? "Faltan "+faltan+" "+plural(faltan,"día","días")+" para tu examen" : (faltan===0? "¡Tu examen es HOY!" : "Tu examen ya pasó"))+'</h1>'+
    '<p class="sub">Examen: '+fechaDeStr(P.plan.examen).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})+' · sesiones a las '+esc(P.plan.hora)+'</p></div>'+
    '<button class="btn btn-pri" id="plan-ics">'+ico("descarga")+'Recordatorios al calendario</button></div>'+
    (dias.length? '<div class="plan-lista">'+filas+(dias.length>14? '<p class="sub" style="font-size:13px">… y '+(dias.length-14)+' días más hasta el examen.</p>':'')+'</div>'
                : '<p class="sub">Con los días elegidos no quedan sesiones antes del examen. Ajusta tu plan.</p>')+
    '<div class="fila" style="margin-top:16px;gap:18px;flex-wrap:wrap">'+
      '<button class="btn btn-ter" id="plan-cambiar" style="padding-left:0">Ajustar plan</button>'+
      '<button class="btn btn-ter" id="plan-borrar" style="color:var(--magenta)">Eliminar plan</button>'+
    '</div>'+
    (faltan>0? '<p class="sub" style="font-size:12.5px;margin-top:10px">El archivo .ics agrega cada sesión CON alarma a Google Calendar, Outlook o Apple Calendar: tu calendario te la recuerda en el teléfono o por correo, según cómo lo tengas configurado. Si cambias el plan, descárgalo de nuevo.</p>':'')+
    '</div>'
  );
  document.getElementById("plan-ics").addEventListener("click", function(){
    descargar("toma_el_volante_plan_"+P.plan.examen+".ics", icsDelPlan(), "text/calendar;charset=utf-8");
    toast("Plan descargado: ábrelo y tu calendario agenda los recordatorios");
  });
  document.getElementById("plan-cambiar").addEventListener("click", formPlan);
  document.getElementById("plan-borrar").addEventListener("click", function(){
    modal("¿Eliminar tu plan?", "Se borra el plan y sus tareas del Inicio (tu avance de estudio no se toca).", "Eliminar", function(){ P.plan = null; persistir(); vPlan(); });
  });
}
function formPlan(){
  var man = new Date(); man.setDate(man.getDate()+1);
  var p = P.plan || { examen:"", hora:"19:00", dias:[1,2,3,4,5] };
  shell(
    '<div style="max-width:640px;margin:0 auto">'+
    '<span class="eyebrow">Mi plan de estudio</span>'+
    '<h1 style="font-size:26px;margin:6px 0 6px">¿Cuándo rindes el examen?</h1>'+
    '<p class="sub" style="margin-bottom:16px">Con la fecha armo tu plan día a día: capítulos pendientes primero y simulacros completos en la recta final. Lo verás aquí y en el Inicio, y te lo llevas al calendario con recordatorios.</p>'+
    '<section class="card" style="display:grid;gap:16px">'+
      '<div class="campo"><label for="plan-fecha">Fecha del examen</label><input type="date" id="plan-fecha" min="'+hoyStr(man)+'" value="'+esc(p.examen)+'"></div>'+
      '<div class="campo"><label for="plan-hora">Hora a la que sueles estudiar</label><input type="time" id="plan-hora" value="'+esc(p.hora)+'"></div>'+
      '<div class="campo"><label>Días de estudio</label><div class="plan-dias-form" id="plan-dias">'+
        DIAS_SEM.map(function(ds){ return '<button type="button" class="plan-diachip'+(p.dias.indexOf(ds[1])!==-1?" activa":"")+'" data-d="'+ds[1]+'" aria-pressed="'+(p.dias.indexOf(ds[1])!==-1)+'">'+ds[0]+'</button>'; }).join("")+
      '</div></div>'+
      '<button class="btn btn-pri" id="plan-crear">'+(P.plan? "Guardar cambios":"Crear mi plan")+'</button>'+
    '</section>'+
    (P.plan? '<button class="btn btn-ter" id="plan-volver" style="margin-top:10px;padding-left:0">Volver al plan</button>' : "")+
    '</div>'
  );
  document.querySelectorAll("#plan-dias .plan-diachip").forEach(function(b){
    b.addEventListener("click", function(){
      b.classList.toggle("activa");
      b.setAttribute("aria-pressed", b.classList.contains("activa")? "true":"false");
    });
  });
  document.getElementById("plan-crear").addEventListener("click", function(){
    var fecha = document.getElementById("plan-fecha").value;
    var dias = [].map.call(document.querySelectorAll("#plan-dias .activa"), function(b){ return +b.getAttribute("data-d"); });
    if(!fecha || fechaDeStr(fecha) <= fechaDeStr(hoyStr())){ toast("Elige una fecha de examen futura"); return; }
    if(!dias.length){ toast("Marca al menos un día de estudio"); return; }
    P.plan = { examen:fecha, hora:document.getElementById("plan-hora").value||"19:00", dias:dias, creado:Date.now() };
    persistir(); toast("Plan creado: síguelo desde el Inicio");
    vPlan();
  });
  var volver = document.getElementById("plan-volver");
  if(volver) volver.addEventListener("click", vPlan);
}

/* ---------- vista: home ---------- */
function vHome(){
  var per = perfilActivo();
  var venc = vencidasHoy();
  var dom = dominioGlobal();
  var listo = estadoListo();
  var mejor = P.sims.reduce(function(m,s){ return Math.max(m, s.puntaje); }, 0);
  var capSig = capParaContinuar();
  var hoyTxt, hoyCta, hoyHash;
  if(venc.length){
    hoyTxt = "Tienes <b style=\"color:var(--amarillo)\">"+venc.length+" "+plural(venc.length,"pregunta","preguntas")+"</b> listas para repasar. Repasar lo que fallaste es lo que más sube tu puntaje.";
    hoyCta = "Repasar ahora ("+Math.min(venc.length, perfilCfg().meta)+")"; hoyHash = "#/repaso";
  } else if(capSig){
    hoyTxt = "Sin repasos pendientes. Sigue avanzando con el capítulo <b style=\"color:var(--amarillo)\">"+esc(capSig.label)+"</b> en sesiones de 10 preguntas.";
    hoyCta = "Estudiar ese capítulo"; hoyHash = "#/estudiar/"+capSig.id;
  } else {
    hoyTxt = "Dominaste el banco completo. Mantente fino con un simulacro fiel al examen real.";
    hoyCta = "Hacer un simulacro"; hoyHash = "#/simulacro";
  }
  var eyebrowHoy = "Tu sesión de hoy";
  if(P.plan){
    var faltan = diasHastaExamen();
    var planHoy = tareaDeHoy();
    eyebrowHoy = faltan>0? "Tu plan · faltan "+faltan+" "+plural(faltan,"día","días")+" para el examen"
               : (faltan===0? "Tu plan · ¡el examen es HOY!" : "Tu plan · examen rendido");
    if(planHoy){
      hoyTxt = "Según tu plan, hoy: <b style=\"color:var(--amarillo)\">"+esc(planHoy.tarea.titulo)+"</b>. "+esc(planHoy.tarea.detalle);
      hoyCta = "Partir ahora"; hoyHash = planHoy.tarea.ruta;
    } else if(faltan>0 && venc.length===0){
      hoyTxt = "Hoy no es día de estudio en tu plan. Si igual quieres avanzar, una ronda de trivia no rompe el descanso.";
      hoyCta = "Trivia de señales"; hoyHash = "#/trivia";
    }
  }
  shell(
    '<div class="home-head"><h1>Hola, '+esc(per.nombre)+'</h1>'+
    '<span class="sub">'+new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})+'</span></div>'+
    '<div class="stats4">'+
      '<div class="stat"><div class="num">'+dom+'<small>%</small></div><div class="lbl">'+ico("libro")+'Dominio del banco</div></div>'+
      '<div class="stat s-ama"><div class="num">'+(P.racha.dias||0)+'<small> '+plural(P.racha.dias||0,"día","días")+'</small></div><div class="lbl">'+ico("llama")+'Racha de estudio</div></div>'+
      '<div class="stat s-turq"><div class="num">'+(mejor||"—")+(mejor?'<small>/'+DATA.examen.puntajeMax+'</small>':'')+'</div><div class="lbl">'+ico("trofeo")+'Mejor simulacro</div></div>'+
      '<div class="stat"><div class="num">'+(P.puntos||0)+'</div><div class="lbl">'+ico("estrella")+'Puntos de entrenamiento</div></div>'+
    '</div>'+
    '<section class="hoy"><div class="crece"><span class="eyebrow" style="color:var(--turq-c)">'+eyebrowHoy+'</span>'+
      '<h2>Hoy te toca</h2><p>'+hoyTxt+'</p></div>'+
      '<div class="hoy-der"><a class="btn btn-amarillo" href="'+hoyHash+'">'+hoyCta+'</a>'+
      '<a class="hoy-plan" href="#/plan">'+(P.plan? "Ajustar mi plan":"Crear mi plan de estudio")+'</a></div></section>'+
    '<div class="listo"><span class="semaforo" style="background:'+listo.color+'"></span>'+
      '<div class="crece"><b>'+listo.txt+'</b><span class="sub" style="display:block;font-size:13.5px">'+listo.det+'</span></div></div>'+
    '<h2 style="font-size:18px;margin:0 0 12px">¿Qué quieres hacer?</h2>'+
    '<div class="lanzadores">'+
      '<a class="lanz" href="#/estudiar"><span class="ico-caja ic-azul">'+ico("libro")+'</span><b>Estudiar por capítulos</b><span>Fichas breves y micro-quiz de 10 preguntas por capítulo del libro oficial.</span></a>'+
      '<a class="lanz" href="#/repaso"><span class="ico-caja ic-turq">'+ico("repaso")+'</span><b>Repaso inteligente</b><span>'+(venc.length? venc.length+" "+plural(venc.length,"pregunta pendiente","preguntas pendientes")+" hoy." : "Las preguntas que falles volverán aquí en el momento justo.")+'</span></a>'+
      '<a class="lanz" href="#/simulacro"><span class="ico-caja ic-navy">'+ico("crono")+'</span><b>Simulacro del examen</b><span>35 preguntas · 45 minutos · igual al examen real de CONASET.</span></a>'+
      '<a class="lanz" href="#/senales"><span class="ico-caja ic-ama">'+ico("senal")+'</span><b>Señales de tránsito</b><span>Galería del anexo oficial para reconocerlas de un vistazo.</span></a>'+
      '<a class="lanz" href="#/trivia"><span class="ico-caja ic-mag">'+ico("trivia")+'</span><b>Trivia de señales</b><span>La señal grande y 4 tarjetas de color: adivina su nombre y suma racha.</span></a>'+
    '</div>'
  );
}
function capParaContinuar(){
  if(P.ultCap){ var c = DATA.capitulos.find(function(c){ return String(c.id)===String(P.ultCap); }); if(c && dominioCap(c.id)<100) return c; }
  var caps = DATA.capitulos.slice().sort(function(a,b){ return dominioCap(a.id)-dominioCap(b.id); });
  return caps[0]||null;
}

/* ---------- vista: estudiar (capítulos) ---------- */
function vEstudiar(){
  var cards = DATA.capitulos.map(function(c){
    var qs = preguntasDe(c.id), dom = dominioCap(c.id);
    var vistas = qs.filter(function(q){ return progDe(q.id); }).length;
    var totalF = fichasDe(c.id).length, leidas = totalF? fichasLeidasDe(c.id) : 0;
    var chip = dom>=85? '<span class="chip chip-dom">Dominado</span>' : ((vistas || leidas)? '<span class="chip chip-curso">En curso</span>' : '<span class="chip chip-nuevo">Nuevo</span>');
    return '<a class="cap-card" href="#/estudiar/'+c.id+'">'+
      '<div class="fila"><span class="cap-num crece">'+(c.id==="senales"? "Anexo" : "Capítulo "+c.id)+'</span>'+chip+'</div>'+
      '<h3>'+esc(c.label)+'</h3>'+
      '<div class="barra"><i style="width:'+dom+'%"></i></div>'+
      '<div class="cap-meta"><span>'+dom+'% de dominio'+(totalF? ' · '+leidas+'/'+totalF+' fichas':'')+'</span><span>'+qs.length+' preguntas · pág. '+c.pagina+'</span></div>'+
    '</a>';
  }).join("");
  shell(
    '<div class="sec-head"><div><span class="eyebrow">Libro para la Conducción en Chile · CONASET · edición febrero 2026</span>'+
    '<h1 style="font-size:24px;margin-top:4px">Estudiar por capítulos</h1></div>'+
    '<span class="sub">Dominas una pregunta cuando la aciertas 3 veces con repaso espaciado.</span></div>'+
    '<div class="caps">'+cards+'</div>'
  );
}

/* ---------- vista: capítulo (fichas + micro-quiz) ---------- */
function vCapitulo(capId){
  var cap = DATA.capitulos.find(function(c){ return String(c.id)===String(capId); });
  if(!cap){ irA("#/estudiar"); return; }
  P.ultCap = cap.id; persistir();
  var fichas = DATA.fichas.filter(function(f){ return String(f.capitulo)===String(cap.id); });
  var qs = preguntasDe(cap.id), dom = dominioCap(cap.id);
  shell(
    '<a class="btn-ter" href="#/estudiar" style="display:inline-flex;align-items:center;gap:6px;padding-left:0">'+ico("flechaIzq")+'Todos los capítulos</a>'+
    '<div class="sec-head" style="margin-top:6px"><div><span class="eyebrow">'+(cap.id==="senales"? "Anexo oficial" : "Capítulo "+cap.id)+' · pág. '+cap.pagina+' del libro</span>'+
    '<h1 style="font-size:24px;margin-top:4px">'+esc(cap.label)+'</h1></div>'+
    '<div style="min-width:190px"><div class="cap-meta" style="margin-bottom:5px"><span>Dominio</span><b style="color:var(--navy)">'+dom+'%</b></div><div class="barra b-navy"><i style="width:'+dom+'%"></i></div>'+
    (fichas.length? '<div class="cap-meta" style="margin:9px 0 5px"><span>Fichas leídas</span><b style="color:var(--turq-o)" id="cap-fichas-num">0/'+fichas.length+'</b></div><div class="barra"><i id="cap-fichas-bar" style="width:0%;background:var(--turq)"></i></div>' : "")+
    '</div></div>'+
    '<section class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
      '<div class="crece"><h2 style="font-size:18px">Micro-quiz de este capítulo</h2>'+
      '<p class="sub">10 preguntas en unos 5 minutos. Primero las que te tocan repasar, después las nuevas.</p></div>'+
      '<button class="btn btn-pri" id="btn-quiz">'+ico("flecha")+'Partir micro-quiz</button>'+
    '</section>'+
    /* TODAS las fichas a la vista en UNA pantalla (referencia del usuario:
       el deslizable de a una lo hacía difícil). La lectura se registra sola
       cuando la tarjeta queda a la vista un momento; cada ficha muestra su
       estado con el punto turquesa y los contadores avanzan en vivo. */
    (fichas.length?
      '<section aria-label="Fichas de repaso" style="margin-top:18px">'+
      '<h2 style="font-size:18px;margin-bottom:10px">Fichas de repaso <span class="sub" style="font-weight:400">· quedan marcadas como leídas al pasar por ellas</span></h2>'+
      '<div class="fichas-grid">'+fichas.map(function(f, i){
        var leida = !!P.fichasLeidas[cap.id+":"+i];
        return '<article class="ficha'+(leida? " leida":"")+'" data-fi="'+i+'">'+
          '<span class="sen-dot ok ficha-dot" aria-hidden="true"></span>'+
          '<span class="eyebrow">Ficha '+(i+1)+' de '+fichas.length+' · '+esc(f.seccion||cap.label)+'</span>'+
          '<h3>'+esc(f.titulo)+'</h3><p>'+esc(f.texto)+'</p>'+
          (f.dato? '<span class="dato">'+esc(f.dato)+'</span>':"")+
          '<span class="pag">Libro CONASET, página '+f.pagina+'</span></article>';
      }).join("")+'</div></section>' : "")
  );
  if(fichas.length){
    var refrescarContador = function(){
      var leidas = fichasLeidasDe(cap.id);
      var num = document.getElementById("cap-fichas-num"), bar = document.getElementById("cap-fichas-bar");
      if(num){ num.textContent = leidas+"/"+fichas.length; }
      if(bar){ bar.style.width = Math.round(100*leidas/fichas.length)+"%"; }
    };
    refrescarContador();
    var marcarLeida = function(i){
      var clave = cap.id+":"+i;
      if(P.fichasLeidas[clave]) return;
      P.fichasLeidas[clave] = Date.now(); persistir();
      var el = document.querySelector('.ficha[data-fi="'+i+'"]');
      if(el) el.classList.add("leida");
      refrescarContador();
    };
    /* leída = estuvo a la vista ~1.2 s (si el navegador no trae el observer,
       basta tocar la tarjeta) */
    var pendientes = {};
    if(window.IntersectionObserver){
      var obs = new IntersectionObserver(function(entradas){
        entradas.forEach(function(en){
          var i = +en.target.getAttribute("data-fi");
          if(en.isIntersecting && en.intersectionRatio >= 0.6){
            if(pendientes[i] == null){
              pendientes[i] = setTimeout(function(){ marcarLeida(i); obs.unobserve(en.target); }, 1200);
              timers.push(pendientes[i]);
            }
          } else if(pendientes[i] != null){
            clearTimeout(pendientes[i]); pendientes[i] = null;
          }
        });
      }, { threshold: [0.6] });
      document.querySelectorAll(".fichas-grid .ficha").forEach(function(el){ obs.observe(el); });
    }
    document.querySelectorAll(".fichas-grid .ficha").forEach(function(el){
      el.addEventListener("click", function(){ marcarLeida(+el.getAttribute("data-fi")); });
    });
  }
  document.getElementById("btn-quiz").addEventListener("click", function(){
    var seleccion = seleccionMicroQuiz(qs, 10);
    if(!seleccion.length){ toast("Este capítulo aún no tiene preguntas"); return; }
    iniciarQuiz({ tipo:"estudio", titulo:"Micro-quiz · "+cap.label, capId:cap.id, preguntas:seleccion, feedback:true, volverA:"#/estudiar/"+cap.id });
  });
}
function seleccionMicroQuiz(qs, n){
  var ahora = Date.now();
  var vencidas = shuffle(qs.filter(function(q){ var p=progDe(q.id); return p && p.prox<=ahora; }));
  var nuevas   = shuffle(qs.filter(function(q){ return !progDe(q.id); }));
  var resto    = shuffle(qs.filter(function(q){ var p=progDe(q.id); return p && p.prox>ahora; }))
                   .sort(function(a,b){ return progDe(a.id).caja - progDe(b.id).caja; });
  return vencidas.concat(nuevas).concat(resto).slice(0, n);
}

/* ---------- vista: repaso inteligente ---------- */
function vRepaso(){
  var venc = vencidasHoy();
  var deb = debiles();
  if(!venc.length){
    shell(
      '<h1 style="font-size:24px">Repaso inteligente</h1>'+
      '<p class="sub" style="margin:6px 0 18px">Cada pregunta que respondes entra a un calendario de repaso: si la fallas vuelve pronto; si la aciertas, se espacia (1, 2, 4, 7 y 15 días). Así se fija en la memoria de largo plazo.</p>'+
      '<div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
        '<div class="crece"><h2 style="font-size:18px">No tienes repasos pendientes hoy</h2>'+
        '<p class="sub">'+(Object.keys(P.prog).length? "Vuelve mañana, o sigue sumando preguntas nuevas al calendario." : "Parte estudiando un capítulo: tus primeras respuestas crearán tu calendario de repaso.")+'</p></div>'+
        '<a class="btn btn-pri" href="#/estudiar">'+ico("libro")+'Ir a estudiar</a>'+
        (deb.length? '<button class="btn btn-sec" id="btn-deb">'+ico("repaso")+'Reforzar mis débiles ('+Math.min(deb.length,10)+')</button>' : "")+
      '</div>'
    );
    var bd = document.getElementById("btn-deb");
    if(bd) bd.addEventListener("click", function(){
      iniciarQuiz({ tipo:"repaso", titulo:"Refuerzo de preguntas débiles", preguntas:shuffle(deb).slice(0,10), feedback:true, volverA:"#/repaso" });
    });
    return;
  }
  var meta = perfilCfg().meta || 20;
  var tanda = venc.slice(0, meta);
  shell(
    '<h1 style="font-size:24px">Repaso inteligente</h1>'+
    '<p class="sub" style="margin:6px 0 18px">Estas preguntas llegaron a su fecha de repaso. Responderlas hoy es lo que más consolida tu memoria.</p>'+
    '<div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
      '<div class="crece"><h2 style="font-size:18px">'+venc.length+' '+plural(venc.length,"pregunta pendiente","preguntas pendientes")+'</h2>'+
      '<p class="sub">Tanda de hoy: '+tanda.length+' '+plural(tanda.length,"pregunta","preguntas")+' (tu meta diaria es '+meta+'; puedes cambiarla en Configuración).</p></div>'+
      '<button class="btn btn-pri" id="btn-rep">'+ico("repaso")+'Partir repaso</button>'+
    '</div>'
  );
  document.getElementById("btn-rep").addEventListener("click", function(){
    iniciarQuiz({ tipo:"repaso", titulo:"Repaso de hoy", preguntas:tanda, feedback:true, volverA:"#/repaso" });
  });
}

/* ---------- motor de quiz (estudio y repaso, con feedback) ---------- */
var timers = [];
function detenerTimers(){ timers.forEach(clearInterval); timers = []; }
var QZ = null;

function iniciarQuiz(opts){
  QZ = { tipo:opts.tipo, titulo:opts.titulo, capId:opts.capId||null, volverA:opts.volverA||"#/home",
         qs:opts.preguntas.map(prepararPregunta), i:0, aciertos:0, racha:0, puntos:0, resp:[], t20:null };
  pintarQuiz();
}
function prepararPregunta(q){
  var orden = shuffle([0,1,2,3]);
  return { q:q, orden:orden, correctaPos:orden.indexOf(q.correcta), respondida:false, ok:null, descartada:-1, pistaVista:false };
}
function pintarQuiz(){
  detenerTimers();
  var it = QZ.qs[QZ.i], q = it.q;
  var cfg = perfilCfg();
  var conT20 = cfg.timer20 && !it.respondida;
  var alts = it.orden.map(function(oi, pos){
    return '<button class="alt" data-pos="'+pos+'"><span class="letra">'+String.fromCharCode(65+pos)+'</span><span>'+esc(q.opciones[oi])+'</span></button>';
  }).join("");
  shell(
    '<div class="quiz-top">'+
      '<button class="btn-ter" id="q-salir" style="padding-left:0">'+ico("salir")+'Salir</button>'+
      '<div class="quiz-prog crece"><div class="fila" style="justify-content:space-between;font-size:13.5px;color:var(--gris-m);margin-bottom:4px"><span>'+esc(QZ.titulo)+'</span><span>'+(QZ.i+1)+' de '+QZ.qs.length+'</span></div>'+
      '<div class="barra"><i style="width:'+Math.round(100*QZ.i/QZ.qs.length)+'%"></i></div></div>'+
      (QZ.racha>=2? '<span class="racha-viva">'+ico("llama")+QZ.racha+' seguidas</span>' : "")+
      (conT20? '<div class="t20" id="t20" title="Temporizador de foco: al llegar a 0 aparece una pista"><svg><circle cx="22" cy="22" r="18" fill="none" stroke="#E4E8F0" stroke-width="5"/><circle id="t20c" cx="22" cy="22" r="18" fill="none" stroke="#1C73CB" stroke-width="5" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="0"/></svg><b id="t20n">20</b></div>' : "")+
    '</div>'+
    '<article class="pregunta-card">'+
      '<div class="badges">'+
        '<span class="chip chip-turq">'+esc(q.temaLabel||q.seccion||"")+'</span>'+
        (q.doble? '<span class="chip chip-doble">Doble puntaje en el examen</span>' : "")+
      '</div>'+
      '<h2 class="pregunta-txt" id="q-txt">'+esc(q.pregunta)+'</h2>'+
      '<div class="alts" id="q-alts">'+alts+'</div>'+
      '<div id="q-extra" aria-live="polite"></div>'+
      '<div class="quiz-pie"><span class="sub" style="font-size:13px">Responde con las teclas 1–4 · Enter para continuar</span>'+
      '<span id="q-pie-der"></span></div>'+
    '</article>'
  );
  document.getElementById("q-salir").addEventListener("click", function(){ cerrarQuiz(false); });
  document.querySelectorAll("#q-alts .alt").forEach(function(b){
    b.addEventListener("click", function(){ responder(+b.getAttribute("data-pos")); });
  });
  if(conT20) iniciarT20();
  enfocarTeclas();
}
function iniciarT20(){
  var s = 20;
  var iv = setInterval(function(){
    s--;
    var n = document.getElementById("t20n"), c = document.getElementById("t20c");
    if(!n){ clearInterval(iv); return; }
    n.textContent = s;
    c.setAttribute("stroke-dashoffset", String(113 - Math.round(113*s/20)));
    if(s<=5) c.setAttribute("stroke","#CF1717");
    if(s<=0){ clearInterval(iv); mostrarPista(); }
  }, 1000);
  timers.push(iv);
}
function mostrarPista(){
  var it = QZ.qs[QZ.i]; if(it.respondida || it.pistaVista) return;
  it.pistaVista = true;
  var t = document.getElementById("t20"); if(t) t.remove();
  var malas = []; it.orden.forEach(function(oi,pos){ if(pos!==it.correctaPos) malas.push(pos); });
  it.descartada = malas[Math.floor(Math.random()*malas.length)];
  var btn = document.querySelector('#q-alts .alt[data-pos="'+it.descartada+'"]');
  if(btn){ btn.classList.add("descartada"); btn.disabled = true; }
  var extra = document.getElementById("q-extra");
  extra.innerHTML = '<div class="pista-caja">'+ico("pista")+'<div><b>Pista:</b> '+esc(it.q.pista||"Descarta lo que contradiga al libro y elige lo más seguro para las personas.")+' <span class="sub">(descartamos una alternativa por ti)</span></div></div>';
}
function responder(pos){
  var it = QZ.qs[QZ.i]; if(it.respondida) return;
  it.respondida = true;
  detenerTimers();
  var ok = pos===it.correctaPos;
  it.ok = ok;
  registrarRespuesta(it.q.id, ok);
  QZ.resp.push({ id:it.q.id, ok:ok });
  if(ok){ QZ.aciertos++; QZ.racha++; QZ.puntos += 100 + Math.min(QZ.racha-1,5)*10; sonido("ok"); }
  else { QZ.racha = 0; sonido("mal"); }
  persistir();
  var botones = document.querySelectorAll("#q-alts .alt");
  botones.forEach(function(b){
    var p = +b.getAttribute("data-pos");
    b.disabled = true;
    if(p===it.correctaPos) b.classList.add("correcta");
    else if(p===pos && !ok) b.classList.add("incorrecta");
  });
  var q = it.q;
  var fb =
    '<div class="feedback '+(ok?"ok":"mal")+'" role="status">'+
      '<b class="titulo">'+ico(ok?"check":"cruz")+(ok? "Correcta"+(q.doble? " · en el examen vale doble":"") : "Incorrecta — mírala con calma")+'</b>'+
      '<p class="exp">'+esc(q.explicacion||"")+'</p>'+
      '<details class="cita"><summary>'+ico("libro")+'Ver el respaldo en el libro oficial</summary>'+
        '<blockquote>“'+esc(q.cita)+'”</blockquote>'+
        '<span class="ref">Libro para la Conducción en Chile (CONASET, feb. 2026) · '+esc(q.seccion||"")+' · página '+q.pagina+'</span>'+
      '</details>'+
    '</div>';
  document.getElementById("q-extra").innerHTML = fb;
  var ultima = QZ.i === QZ.qs.length-1;
  document.getElementById("q-pie-der").innerHTML =
    '<button class="btn btn-pri" id="q-sig">'+(ultima? "Ver mi resultado" : "Continuar")+ico("flecha")+'</button>';
  var btnSig = document.getElementById("q-sig");
  btnSig.addEventListener("click", avanzarQuiz);
  btnSig.focus();
}
function avanzarQuiz(){
  if(QZ.i < QZ.qs.length-1){ QZ.i++; pintarQuiz(); }
  else finalizarQuiz();
}
function enfocarTeclas(){
  document.onkeydown = function(ev){
    if(!QZ) return;
    var it = QZ.qs[QZ.i];
    if(!it.respondida && ev.key>="1" && ev.key<="4"){
      var pos = +ev.key-1;
      if(pos!==it.descartada) responder(pos);
    } else if(it.respondida && ev.key==="Enter"){
      var b = document.getElementById("q-sig"); if(b){ ev.preventDefault(); avanzarQuiz(); }
    }
  };
}
function finalizarQuiz(){
  detenerTimers(); document.onkeydown = null;
  marcarRachaDia();
  P.puntos = (P.puntos||0) + QZ.puntos;
  P.sesiones.push({ ts:Date.now(), tipo:QZ.tipo, cap:QZ.capId, aciertos:QZ.aciertos, total:QZ.qs.length, puntos:QZ.puntos });
  persistir();
  sonido("fin");
  var pct = Math.round(100*QZ.aciertos/QZ.qs.length);
  var msj = pct===100? "Impecable. Este material ya es tuyo." :
            pct>=80? "Muy buena sesión: vas fijando lo importante." :
            pct>=50? "Buen entrenamiento: lo que fallaste volverá en tu repaso, ahí se aprende." :
                     "Tranquilo: fallar aquí es gratis. Estas preguntas volverán en tu repaso hasta que sean tuyas.";
  var volver = QZ.volverA, capId = QZ.capId, tipo = QZ.tipo;
  shell(
    '<div class="res-hero ap" style="max-width:720px;margin:0 auto">'+
      '<span class="eyebrow" style="color:var(--turq-c)">'+esc(QZ.titulo)+'</span>'+
      '<div class="puntaje" style="margin-top:10px">'+QZ.aciertos+'<small>/'+QZ.qs.length+'</small></div>'+
      '<p>'+msj+'</p>'+
      '<p style="margin-top:6px;color:var(--amarillo);font-weight:600">+'+QZ.puntos+' puntos de entrenamiento</p>'+
      '<div class="fila" style="justify-content:center;gap:12px;margin-top:20px;flex-wrap:wrap">'+
        '<button class="btn btn-amarillo" id="r-otra">'+ico("repaso")+(tipo==="repaso"? "Seguir repasando":"Otra tanda de 10")+'</button>'+
        '<a class="btn btn-sec" style="background:transparent;color:#fff;border-color:#fff" href="'+volver+'">Volver</a>'+
        '<a class="btn btn-sec" style="background:transparent;color:#fff;border-color:#fff" href="#/home">Inicio</a>'+
      '</div>'+
    '</div>'
  );
  QZ = null;
  document.getElementById("r-otra").addEventListener("click", function(){
    if(tipo==="repaso"){ irA("#/repaso"); render(); var b=document.getElementById("btn-rep")||document.getElementById("btn-deb"); if(b) b.click(); }
    else if(capId){ var qs = preguntasDe(capId); iniciarQuiz({ tipo:"estudio", titulo:"Micro-quiz", capId:capId, preguntas:seleccionMicroQuiz(qs,10), feedback:true, volverA:"#/estudiar/"+capId }); }
    else irA("#/estudiar");
  });
}
function cerrarQuiz(fin){
  detenerTimers(); document.onkeydown = null;
  var volver = QZ? QZ.volverA : "#/home";
  QZ = null;
  irA(volver); render();
}

/* ---------- simulacro (fiel al examen real Nexteo) ---------- */
var SIM = null;
function seleccionSimulacro(){
  /* Fiel al examen real: EXACTAMENTE 3 preguntas designadas valen doble (una de
     alcohol, una de velocidad y una de SRI). Otras preguntas de temas críticos
     pueden salir, pero valen 1 punto: el doble es de la instancia, no del banco. */
  var EX = DATA.examen;
  var dobles = [];
  ["alcohol","velocidad","sri"].forEach(function(tc){
    var pool = DATA.preguntas.filter(function(q){ return q.doble && q.temaCritico===tc; });
    if(pool.length) dobles.push(shuffle(pool)[0]);
  });
  while(dobles.length < EX.dobles){
    var extra = shuffle(DATA.preguntas.filter(function(q){ return q.doble && dobles.indexOf(q)<0; }))[0];
    if(!extra) break; dobles.push(extra);
  }
  var usados = {}; dobles.forEach(function(q){ usados[q.id]=1; });
  var resto = DATA.preguntas.filter(function(q){ return !usados[q.id]; });
  var porCap = {};
  resto.forEach(function(q){ (porCap[q.capitulo] = porCap[q.capitulo]||[]).push(q); });
  var faltan = EX.preguntas - dobles.length;
  var sel = [], caps = Object.keys(porCap);
  caps.forEach(function(c){ porCap[c] = shuffle(porCap[c]); });
  var cuotas = caps.map(function(c){ return { c:c, n: porCap[c].length*faltan/resto.length }; });
  var asignadas = 0;
  cuotas.forEach(function(x){ x.base = Math.floor(x.n); asignadas += x.base; });
  cuotas.sort(function(a,b){ return (b.n-Math.floor(b.n)) - (a.n-Math.floor(a.n)) });
  for(var i=0; asignadas<faltan && i<cuotas.length; i++, asignadas++) cuotas[i].base++;
  cuotas.forEach(function(x){ sel = sel.concat(porCap[x.c].slice(0, x.base)); });
  var i2 = 0;
  while(sel.length<faltan && i2<resto.length){ if(sel.indexOf(resto[i2])<0) sel.push(resto[i2]); i2++; }
  var doblesIds = {};
  dobles.forEach(function(q){ doblesIds[q.id] = q.temaCritico; });
  return { qs: shuffle(sel.concat(dobles)), doblesIds: doblesIds };
}
function vSimulacro(){
  if(SIM){ pintarSim(); return; }
  var EX = DATA.examen;
  var suf = P.sims.length? '<p class="sub" style="margin-top:10px">Llevas '+P.sims.length+' '+plural(P.sims.length,"simulacro","simulacros")+'. Tu mejor marca: <b style="color:var(--navy)">'+P.sims.reduce(function(m,s){return Math.max(m,s.puntaje);},0)+'/'+EX.puntajeMax+'</b>.</p>' : "";
  shell(
    '<div style="max-width:760px;margin:0 auto">'+
    '<span class="eyebrow">Simulacro oficial · misma modalidad del examen real</span>'+
    '<h1 style="font-size:26px;margin:6px 0 14px">Simulacro del examen teórico Clase B</h1>'+
    '<div class="card" style="display:grid;gap:14px">'+
      '<div class="fila">'+ico("check","")+'<span><b>'+EX.preguntas+' preguntas</b> de selección múltiple, elegidas al azar del banco.</span></div>'+
      '<div class="fila">'+ico("check","")+'<span><b>3 preguntas valen doble</b> (alcohol, velocidad y retención infantil), igual que en el examen real. Van marcadas.</span></div>'+
      '<div class="fila">'+ico("check","")+'<span>Puntaje máximo <b>'+EX.puntajeMax+' puntos</b> · apruebas con <b>'+EX.aprueba+' o más</b>.</span></div>'+
      '<div class="fila">'+ico("crono","")+'<span><b>'+EX.minutos+' minutos</b> de tiempo límite, con entrega automática al llegar a 0.</span></div>'+
      '<div class="fila">'+ico("marcar","")+'<span>Puedes navegar libremente, <b>marcar preguntas para revisar</b> y usar el mapa 1–'+EX.preguntas+'.</span></div>'+
      '<div class="fila">'+ico("ojo","")+'<span>Sin feedback durante la prueba (como el examen real): la corrección llega al final, pregunta por pregunta.</span></div>'+
    '</div>'+suf+
    '<div class="fila" style="margin-top:18px;gap:12px;flex-wrap:wrap">'+
      '<button class="btn btn-pri" id="sim-partir" style="font-size:17px;padding:12px 28px">'+ico("bandera")+'Comenzar simulacro</button>'+
      '<a class="btn btn-ter" href="#/home">Todavía no</a>'+
    '</div></div>'
  );
  document.getElementById("sim-partir").addEventListener("click", function(){
    var sel = seleccionSimulacro();
    SIM = { qs: sel.qs.map(prepararPregunta), i:0, resp:{}, marcas:{}, ini:Date.now(),
            fin: Date.now() + DATA.examen.minutos*60000 };
    SIM.qs.forEach(function(it){ it.esDoble = !!sel.doblesIds[it.q.id]; });
    pintarSim();
  });
}
function pintarSim(){
  detenerTimers();
  var it = SIM.qs[SIM.i], q = it.q;
  var elegida = SIM.resp[SIM.i];
  var alts = it.orden.map(function(oi,pos){
    return '<button class="alt'+(elegida===pos? " elegida":"")+'" data-pos="'+pos+'"><span class="letra">'+String.fromCharCode(65+pos)+'</span><span>'+esc(q.opciones[oi])+'</span></button>';
  }).join("");
  var mapa = SIM.qs.map(function(_,i){
    var cls = (SIM.marcas[i]? "marcada ":"") + (i===SIM.i? "actual" : (SIM.resp[i]!=null && !SIM.marcas[i]? "resp":""));
    return '<button class="'+cls+'" data-ir="'+i+'" aria-label="Ir a pregunta '+(i+1)+'">'+(i+1)+'</button>';
  }).join("");
  var nResp = Object.keys(SIM.resp).length;
  shell(
    '<div class="quiz-top">'+
      '<button class="btn-ter" id="sim-salir" style="padding-left:0">'+ico("salir")+'Abandonar</button>'+
      '<div class="quiz-prog crece"><div class="fila" style="justify-content:space-between;font-size:13.5px;color:var(--gris-m);margin-bottom:4px"><span>Simulacro · pregunta '+(SIM.i+1)+' de '+SIM.qs.length+'</span><span>'+nResp+' respondidas</span></div>'+
      '<div class="barra"><i style="width:'+Math.round(100*nResp/SIM.qs.length)+'%"></i></div></div>'+
      '<span class="quiz-timer" id="sim-timer">'+ico("crono")+'<span id="sim-mmss">--:--</span></span>'+
    '</div>'+
    '<div class="sim-cols">'+
      '<article class="pregunta-card">'+
        '<div class="badges">'+
          (it.esDoble? '<span class="chip chip-doble">Doble puntaje ×2</span>' : "")+
          '<span class="chip chip-turq">'+esc(q.temaLabel||q.seccion||"")+'</span>'+
        '</div>'+
        '<h2 class="pregunta-txt">'+esc(q.pregunta)+'</h2>'+
        '<div class="alts" id="q-alts">'+alts+'</div>'+
        '<div class="quiz-pie">'+
          '<button class="btn btn-sec" id="sim-ant" '+(SIM.i===0?"disabled":"")+'>'+ico("flechaIzq")+'Anterior</button>'+
          '<button class="btn btn-ter" id="sim-marcar">'+ico("marcar")+(SIM.marcas[SIM.i]? "Quitar marca":"Marcar para revisar")+'</button>'+
          (SIM.i<SIM.qs.length-1? '<button class="btn btn-pri" id="sim-sig">Siguiente'+ico("flecha")+'</button>'
                                : '<button class="btn btn-pri" id="sim-entregar">'+ico("bandera")+'Entregar examen</button>')+
        '</div>'+
      '</article>'+
      '<aside class="sim-lat">'+
        '<b style="color:var(--navy)">Mapa del examen</b>'+
        '<div class="mapa">'+mapa+'</div>'+
        '<div class="leyenda"><span><i style="background:var(--info-bg)"></i>Respondida</span><span><i style="background:var(--amarillo-c)"></i>Marcada para revisar</span><span><i style="background:var(--fondo)"></i>Sin responder</span></div>'+
        '<button class="btn btn-pri" id="sim-entregar2">'+ico("bandera")+'Entregar</button>'+
      '</aside>'+
    '</div>'
  );
  var tick = function(){
    var el = document.getElementById("sim-mmss"); if(!el || !SIM){ detenerTimers(); return; }
    var rest = Math.max(0, Math.round((SIM.fin-Date.now())/1000));
    el.textContent = fmtDur(rest);
    if(rest<=300) document.getElementById("sim-timer").classList.add("alerta");
    if(rest<=0){ toast("Se acabó el tiempo: entregamos tu examen"); entregarSim(); }
  };
  tick(); var iv = setInterval(tick,1000); timers.push(iv);
  document.querySelectorAll("#q-alts .alt").forEach(function(b){
    b.addEventListener("click", function(){
      SIM.resp[SIM.i] = +b.getAttribute("data-pos");
      if(SIM.i<SIM.qs.length-1){ SIM.i++; } pintarSim();
    });
  });
  document.querySelectorAll("[data-ir]").forEach(function(b){
    b.addEventListener("click", function(){ SIM.i = +b.getAttribute("data-ir"); pintarSim(); });
  });
  document.getElementById("sim-ant").addEventListener("click", function(){ if(SIM.i>0){ SIM.i--; pintarSim(); } });
  var sg = document.getElementById("sim-sig");
  if(sg) sg.addEventListener("click", function(){ SIM.i++; pintarSim(); });
  document.getElementById("sim-marcar").addEventListener("click", function(){ SIM.marcas[SIM.i] = !SIM.marcas[SIM.i]; pintarSim(); });
  [document.getElementById("sim-entregar"), document.getElementById("sim-entregar2")].forEach(function(b){
    if(b) b.addEventListener("click", confirmarEntrega);
  });
  document.getElementById("sim-salir").addEventListener("click", function(){
    modal("¿Abandonar el simulacro?", "Se perderá el avance de esta prueba (no afecta tu progreso de estudio).", "Abandonar", function(){ detenerTimers(); SIM=null; irA("#/home"); render(); });
  });
}
function confirmarEntrega(){
  var faltan = SIM.qs.length - Object.keys(SIM.resp).length;
  if(faltan>0) modal("Te quedan "+faltan+" sin responder", "En el examen real, una pregunta en blanco es una pregunta mala. ¿Quieres entregar igual o seguir respondiendo?", "Entregar igual", entregarSim, "Seguir respondiendo");
  else modal("¿Entregar el examen?", "Respondiste las "+SIM.qs.length+" preguntas. Al entregar verás tu puntaje y la revisión completa.", "Entregar", entregarSim);
}
function entregarSim(){
  detenerTimers();
  if(!SIM) return;
  var EX = DATA.examen;
  var puntaje = 0, detalle = [];
  SIM.qs.forEach(function(it, i){
    var ok = SIM.resp[i]===it.correctaPos;
    var pts = it.esDoble? 2 : 1;
    if(ok) puntaje += pts;
    registrarRespuesta(it.q.id, !!ok);
    detalle.push({ id:it.q.id, ok:!!ok, doble:!!it.esDoble, marcada:!!SIM.marcas[i], resp:SIM.resp[i] });
  });
  var aprobado = puntaje>=EX.aprueba;
  var dur = Math.round((Date.now()-SIM.ini)/1000);
  marcarRachaDia();
  P.sims.push({ ts:Date.now(), puntaje:puntaje, aprobado:aprobado, dur:dur, detalle:detalle });
  persistir();
  sonido(aprobado? "aprobado":"fin");
  var qsSim = SIM.qs; SIM = null;
  pintarResultadoSim(P.sims[P.sims.length-1], qsSim);
}
function pintarResultadoSim(sim, qsSim){
  var EX = DATA.examen;
  var porCap = {};
  qsSim.forEach(function(it, i){
    var c = String(it.q.capitulo);
    porCap[c] = porCap[c]||{ ok:0, n:0 };
    porCap[c].n++; if(sim.detalle[i].ok) porCap[c].ok++;
  });
  var desg = DATA.capitulos.filter(function(c){ return porCap[String(c.id)]; }).map(function(c){
    var d = porCap[String(c.id)], pct = Math.round(100*d.ok/d.n);
    return '<div class="desg-fila"><span>'+esc(c.label)+'</span><div class="barra"><i style="width:'+pct+'%;background:'+(pct>=80?"var(--turq)":pct>=50?"var(--warn)":"var(--err)")+'"></i></div><span class="num" style="text-align:right">'+d.ok+'/'+d.n+'</span></div>';
  }).join("");
  var rev = qsSim.map(function(it, i){
    var d = sim.detalle[i], q = it.q;
    var tuya = d.resp!=null? q.opciones[it.orden[d.resp]] : null;
    var buena = q.opciones[q.correcta];
    return '<article class="rev-item">'+
      '<div class="badges">'+(d.ok? '<span class="chip chip-dom">Correcta'+(d.doble?" ×2":"")+'</span>' : '<span class="chip" style="background:var(--err-bg);color:var(--err-f)">Incorrecta'+(d.doble?" ×2":"")+'</span>')+'<span class="chip chip-turq">'+esc(q.temaLabel||q.seccion||"")+'</span></div>'+
      '<p class="q">'+(i+1)+'. '+esc(q.pregunta)+'</p>'+
      (d.ok? '<div class="rev-resp buena">Tu respuesta: '+esc(buena)+'</div>'
           : (tuya!=null? '<div class="rev-resp tuya-mal">Tu respuesta: '+esc(tuya)+'</div>' : '<div class="rev-resp tuya-mal">No respondiste esta pregunta</div>')+
             '<div class="rev-resp buena">Correcta: '+esc(buena)+'</div>')+
      '<p class="sub" style="margin-top:8px;font-size:14px">'+esc(q.explicacion||"")+'</p>'+
      '<details class="cita" style="background:var(--fondo)"><summary>'+ico("libro")+'Respaldo en el libro oficial</summary>'+
        '<blockquote>“'+esc(q.cita)+'”</blockquote>'+
        '<span class="ref">Libro CONASET (feb. 2026) · '+esc(q.seccion||"")+' · página '+q.pagina+'</span>'+
      '</details>'+
    '</article>';
  }).join("");
  shell(
    '<div style="max-width:820px;margin:0 auto;display:grid;gap:18px">'+
    '<div class="res-hero '+(sim.aprobado?"ap":"rep")+'">'+
      '<span class="eyebrow" style="color:var(--turq-c)">Simulacro terminado · '+fmtDur(sim.dur)+' min</span>'+
      '<div class="puntaje">'+sim.puntaje+'<small>/'+EX.puntajeMax+'</small></div>'+
      '<span class="res-veredicto '+(sim.aprobado?"ap":"rep")+'">'+(sim.aprobado? "APROBADO":"AÚN NO — SIGUE ENTRENANDO")+'</span>'+
      '<p>'+(sim.aprobado? "Con este puntaje habrías aprobado el examen real (mínimo "+EX.aprueba+" de "+EX.puntajeMax+")." : "Necesitas "+EX.aprueba+" puntos: te faltaron "+(EX.aprueba-sim.puntaje)+". Lo que fallaste ya quedó en tu repaso inteligente.")+'</p>'+
    '</div>'+
    '<section class="card"><h2 style="font-size:18px;margin-bottom:12px">Resultado por capítulo</h2><div class="desglose">'+desg+'</div></section>'+
    '<div class="fila" style="gap:12px;flex-wrap:wrap">'+
      '<a class="btn btn-pri" href="#/simulacro">'+ico("repaso")+'Otro simulacro</a>'+
      '<a class="btn btn-sec" href="#/repaso">Repasar mis falladas</a>'+
      '<a class="btn btn-ter" href="#/progreso">Ver mi ranking</a>'+
    '</div>'+
    '<h2 style="font-size:19px">Revisión pregunta por pregunta</h2>'+rev+
    '</div>'
  );
}

/* ---------- vista: señales ---------- */
var senFiltro = "todas";
/* Arte OFICIAL del anexo del libro CONASET (páginas 150-160), extraído del PDF
   de la edición 27-feb-2026 y reproducido SIN alteración (RB-013: la señalética
   es información normativa, jamás pieza de marca; símbolo y nombre intactos).
   Cada señal vive en senales/<id>.png — ruta relativa: funciona igual en
   producción y abierto con doble clic. Variantes reales del libro (espejos
   izquierda/derecha, versión auto/camión, los 9 cruces) comparten nombre y se
   distinguen por id (-2, -3…). */
/* SENAL_V rompe la caché larga de /senales/ (max-age 7d) cuando se renueva el
   arte: subirla junto con la versión del app cada vez que cambie algún PNG. */
var SENAL_V = "3";
function senalImg(s, px){
  px = px || 96;
  return '<img class="senal-img" src="senales/'+s.id+'.png?v='+SENAL_V+'" alt="Señal: '+esc(s.nombre)+'" loading="lazy" style="max-width:'+px+'px;max-height:'+px+'px">';
}
function vSenales(){
  var senales = DATA.senales||[];
  var nFam = function(f){ return f==="todas"? senales.length : senales.filter(function(s){ return s.familia===f; }).length; };
  var fam = [["todas","Todas"],["reglamentaria","Reglamentarias"],["preventiva","Preventivas"],["informativa","Informativas"],["transitoria","Transitorias"]];
  var filtros = fam.map(function(f){ return '<button class="filtro'+(senFiltro===f[0]?" activa":"")+'" data-fam="'+f[0]+'">'+f[1]+' · '+nFam(f[0])+'</button>'; }).join("");
  var lista = senales.filter(function(s){ return senFiltro==="todas" || s.familia===senFiltro; });
  /* punto de estado por señal (control de la trivia): turquesa = la dominas,
     rojo = te falla, sin punto = aún no la respondes */
  var regT = P.senales||{};
  var pool = poolTrivia();
  var vistasT = pool.filter(function(s){ return regT[s.id]; }).length;
  var cards = lista.map(function(s){
    var r = regT[s.id];
    var dot = r? '<span class="sen-dot '+(r.a>=r.f? "ok":"mal")+'" title="Trivia: '+r.a+' '+plural(r.a,"acierto","aciertos")+' · '+r.f+' '+plural(r.f,"fallo","fallos")+'"></span>' : "";
    return '<div class="sen-card">'+dot+'<div class="sen-art">'+senalImg(s)+'</div><b>'+esc(s.nombre)+'</b>'+(s.descripcion? '<span>'+esc(s.descripcion)+'</span>' : "")+'</div>';
  }).join("");
  shell(
    '<div class="sec-head"><div><span class="eyebrow">Anexo del libro oficial · páginas 150–160</span>'+
    '<h1 style="font-size:24px;margin-top:4px">Señales de tránsito</h1>'+
    '<p class="sub">Reglamentarias: obligan o prohíben. Preventivas: advierten un peligro. Informativas: orientan y guían. Transitorias: trabajos en la vía.'+
    (vistasT? ' Tu control en la trivia: <b style="color:var(--navy)">'+vistasT+'</b> de '+pool.length+' respondidas (punto turquesa = la dominas, rojo = te falla).' : '')+'</p></div>'+
    '<button class="btn btn-pri" id="sen-quiz">'+ico("trivia")+'Jugar la trivia</button></div>'+
    '<div class="filtros">'+filtros+'</div>'+
    '<div class="sen-grid">'+cards+'</div>'+
    '<p class="sub" style="margin-top:14px;font-size:12.5px">Arte oficial del anexo del Libro para la Conducción en Chile (edición 27-feb-2026), reproducido sin modificación.</p>'
  );
  document.querySelectorAll("[data-fam]").forEach(function(b){
    b.addEventListener("click", function(){ senFiltro = b.getAttribute("data-fam"); vSenales(); });
  });
  document.getElementById("sen-quiz").addEventListener("click", function(){ irA("#/trivia"); });
}

/* ---------- vista: trivia de señales ----------
   Una señal grande, 4 alternativas UNIFORMES (RB-014: nada de un color por
   alternativa — confundía; mismo lenguaje que el quiz) con número 1-4 para
   el teclado. El color aparece SOLO como feedback: verde la correcta, rojo
   la elegida incorrecta. Sin premio por velocidad (RB-004). */
var TR = null;
/* Señales cuyo ARTE OFICIAL trae escrito su propio nombre (o lo delata):
   mostrarlas regalaría la respuesta. El bitmap del libro no se altera jamás
   (RB-013), así que quedan fuera de la trivia; siguen íntegras en la galería.
   Auditado página a página contra el PDF (150-160). Las letras-símbolo (la E
   de estacionamiento, SOS, cifras como 300 m) NO delatan el nombre y se juegan. */
var TRIVIA_EXCLUIR = { "pare":1, "pare-ninos":1, "no-cambiar-de-pista":1,
  "preferencia-ciclistas-al-virar-derecha":1, "preferencia-ciclistas-al-virar-izquierda":1,
  "preferencia-ciclistas-al-cambiar-de-pista":1, "preferencia-ciclistas-al-cambiar-de-pista-2":1,
  "prohibida-circulacion-de-vehiculos-motorizados":1, "no-peatones":1,
  "velocidad-maxima":1, "velocidad-minima":1, "velocidad-maxima-zona-30":1,
  "fin-prohibicion-o-restriccion":1, "solo-televia-o-sistema-complementario":1,
  "preferencia-al-sentido-contrario":1, "control":1, "uso-obligatorio-de-cadenas":1,
  "solo-motocicletas":1, "via-segregada-buses":1, "via-segregada-buses-2":1,
  "solo-transporte-publico":1, "estacionamiento-reservado":1,
  "permitido-virar-derecha-con-luz-roja":1, "permitido-virar-izquierda-con-luz-roja":1,
  "proximidad-de-senal-pare":1, "peligro":1,
  "zona-30":1, "fin-zona-30":1, "salida-inmediata":1, "parada-mixta":1, "pista-solo-buses":1,
  "control-fotografico":1, "control-con-camara":1, "fin-ciclovia":1,
  "zona-espera-especial-ciclos":1, "zona-espera-especial-ciclos-2":1, "zona-espera-especial-ciclos-3":1,
  "zona-de-espera-adelantada-motos":1, "zona-de-espera-adelantada-motos-2":1,
  "fin-trabajos-en-la-via":1, "peligro-2":1, "desvio":1, "proximidad-de-desvio":1, "fin-de-desvio":1 };
function armarRondaTrivia(n){
  var senales = (DATA.senales||[]).filter(function(s){ return !TRIVIA_EXCLUIR[s.id]; });
  /* CONTROL del usuario: la ronda parte por las señales que AÚN NO responde,
     sigue con las falladas y recién al final repite las dominadas — así
     cualquier tamaño de ronda avanza la cobertura del catálogo completo. */
  var reg = P.senales||{};
  var noVistas = shuffle(senales.filter(function(s){ return !reg[s.id]; }));
  var falladas = shuffle(senales.filter(function(s){ var r = reg[s.id]; return r && r.f >= r.a; }));
  var dominadas = shuffle(senales.filter(function(s){ var r = reg[s.id]; return r && r.f < r.a; }));
  var elegidas = shuffle(noVistas.concat(falladas).concat(dominadas).slice(0, n));
  return elegidas.map(function(s){
    /* las variantes reales del libro comparten NOMBRE (espejos, auto/camión,
       los 9 cruces): los distractores se eligen por nombre distinto y sin
       repetirse, o la respuesta correcta aparecería dos veces en las tarjetas */
    var vistos = {}; vistos[s.nombre] = 1;
    var candidatos = shuffle(senales.filter(function(x){ return x.familia===s.familia; }))
             .concat(shuffle(senales.filter(function(x){ return x.familia!==s.familia; })));
    var distractores = [];
    candidatos.forEach(function(x){
      if(distractores.length<3 && !vistos[x.nombre]){ vistos[x.nombre]=1; distractores.push(x.nombre); }
    });
    var opciones = shuffle([s.nombre].concat(distractores));
    return { s:s, opciones:opciones, correcta:opciones.indexOf(s.nombre) };
  });
}
/* Tamaño de ronda elegido por el usuario (persistente): 10/25/50 o 0 = todas. */
function tamRonda(pool){
  var t = (P.trivia && P.trivia.tam);
  return t === 0 ? pool : (t || 10);
}
function poolTrivia(){
  return (DATA.senales||[]).filter(function(s){ return !TRIVIA_EXCLUIR[s.id]; });
}
function vTrivia(){
  if(TR && !TR.fin){ pintarTrivia(); return; }
  TR = null;
  if(!P.trivia) P.trivia = {};
  var t = P.trivia;
  /* migración del récord viejo (x/10) al récord porcentual por ronda */
  if(t.mejorPct == null && t.mejor != null) t.mejorPct = t.mejor * 10;
  var pool = poolTrivia();
  var reg = P.senales||{};
  var vistas = 0, aciertos = 0, intentos = 0;
  pool.forEach(function(s){
    var r = reg[s.id]; if(!r) return;
    vistas++; aciertos += r.a; intentos += r.a + r.f;
  });
  var pct = intentos? Math.round(100*aciertos/intentos) : 0;
  var tamSel = (t.tam === 0)? 0 : (t.tam || 10);
  var botones = [10, 25, 50, 0].map(function(k){
    var etiqueta = k? String(k) : "Todas · "+pool.length;
    return '<button class="filtro'+(tamSel===k? " activa":"")+'" data-tam="'+k+'">'+etiqueta+'</button>';
  }).join("");
  shell(
    '<div style="max-width:760px;margin:0 auto">'+
    '<span class="eyebrow">Trivia de señales · reconocimiento de un vistazo</span>'+
    '<h1 style="font-size:26px;margin:6px 0 14px">¿Reconoces la señal? Toca su tarjeta</h1>'+
    '<div class="card" style="display:grid;gap:14px">'+
      '<div class="fila">'+ico("senal","")+'<span><b>Elige cuántas señales</b> jugar en la ronda ('+pool.length+' entran al juego; las que traen escrito su propio nombre solo se estudian en la galería).</span></div>'+
      '<div class="filtros" id="tr-tams" style="margin:0">'+botones+'</div>'+
      '<div class="fila">'+ico("trivia","")+'<span>La ronda parte por las que <b>aún no respondes</b> y sigue con tus <b>falladas</b>. Verde la correcta, rojo si te equivocas.</span></div>'+
      '<div class="fila">'+ico("llama","")+'<span>Suma <b>puntos y racha</b>. Sin premio por velocidad: piensa lo que necesites.</span></div>'+
    '</div>'+
    '<section class="card" style="margin-top:14px;display:grid;gap:8px" id="tr-control">'+
      '<div class="fila" style="justify-content:space-between;flex-wrap:wrap"><b style="color:var(--navy)">Tu control del catálogo</b><span class="sub"><b id="tr-vistas" style="color:var(--navy)">'+vistas+'</b> de '+pool.length+' respondidas'+(intentos? ' · '+pct+'% de acierto':'')+'</span></div>'+
      '<div class="barra"><i style="width:'+Math.round(100*vistas/pool.length)+'%"></i></div>'+
      (t.jugadas? '<span class="sub">'+t.jugadas+' '+plural(t.jugadas,"ronda jugada","rondas jugadas")+(t.mejorPct != null? ' · mejor ronda: <b style="color:var(--navy)">'+t.mejorPct+'%</b>':'')+'. En la galería, cada señal lleva su punto de estado.</span>'
                 : '<span class="sub">Aún no respondes ninguna: tu avance quedará registrado señal por señal.</span>')+
    '</section>'+
    '<div class="fila" style="margin-top:18px;gap:12px;flex-wrap:wrap">'+
      '<button class="btn btn-pri" id="tr-partir" style="font-size:17px;padding:12px 28px">'+ico("flecha")+'Partir la trivia</button>'+
      '<a class="btn btn-ter" href="#/senales">Ver la galería primero</a>'+
    '</div></div>'
  );
  document.querySelectorAll("#tr-tams .filtro").forEach(function(b){
    b.addEventListener("click", function(){
      P.trivia.tam = +b.getAttribute("data-tam"); persistir(); vTrivia();
    });
  });
  document.getElementById("tr-partir").addEventListener("click", function(){
    TR = { qs: armarRondaTrivia(tamRonda(pool.length)), i:0, aciertos:0, puntos:0, racha:0, mejorRacha:0, resuelto:false, fin:false };
    pintarTrivia();
  });
}
function pintarTrivia(){
  if(TR.i >= TR.qs.length){ finalizarTrivia(); return; }
  var it = TR.qs[TR.i];
  var cartas = it.opciones.map(function(op, i){
    return '<button class="tk-carta" data-op="'+i+'"><span class="tk-num">'+(i+1)+'</span><span class="tk-nombre">'+esc(op)+'</span></button>';
  }).join("");
  shell(
    '<div class="quiz-top">'+
      '<button class="btn-ter" id="tr-salir" style="padding-left:0">'+ico("salir")+'Salir</button>'+
      '<div class="quiz-prog crece"><div class="fila" style="justify-content:space-between;font-size:13.5px;color:var(--gris-m);margin-bottom:4px"><span>Señal '+(TR.i+1)+' de '+TR.qs.length+'</span><span>Racha '+TR.racha+' · '+TR.puntos+' pts</span></div>'+
      '<div class="barra"><i style="width:'+Math.round(100*TR.i/TR.qs.length)+'%"></i></div></div>'+
    '</div>'+
    '<div class="tk-zona">'+
      '<div class="tk-senal">'+senalImg(it.s, 190)+'</div>'+
      '<div class="tk-cartas" id="tk-cartas">'+cartas+'</div>'+
      '<p class="sub" style="text-align:center;font-size:13px">Responde tocando una tarjeta o con las teclas 1–4</p>'+
    '</div>'
  );
  TR.resuelto = false;
  document.getElementById("tr-salir").addEventListener("click", function(){
    modal("¿Salir de la trivia?", "Se pierde la ronda actual (tu récord se conserva).", "Salir", function(){ TR=null; document.onkeydown=null; irA("#/senales"); });
  });
  document.querySelectorAll("#tk-cartas .tk-carta").forEach(function(b){
    b.addEventListener("click", function(){ responderTrivia(+b.getAttribute("data-op")); });
  });
  document.onkeydown = function(ev){
    if(!TR || TR.fin) return;
    if(!TR.resuelto && ev.key>="1" && ev.key<="4") responderTrivia(+ev.key-1);
  };
}
function responderTrivia(pos){
  if(!TR || TR.resuelto) return;
  TR.resuelto = true;
  var it = TR.qs[TR.i];
  var ok = pos === it.correcta;
  /* Feedback CLARO y legible: la correcta se marca en verde con check, la
     elegida incorrecta en rojo; las demás quedan tal cual (nada de atenuar
     hasta lo ilegible — corrección del usuario). */
  document.querySelectorAll("#tk-cartas .tk-carta").forEach(function(c, i){
    c.disabled = true;
    if(i === it.correcta){ c.classList.add("ok"); c.insertAdjacentHTML("beforeend", '<span class="tk-res">'+ico("check")+'</span>'); }
    else if(i === pos) c.classList.add("mal");
  });
  if(ok){
    TR.aciertos++; TR.racha++; TR.mejorRacha = Math.max(TR.mejorRacha, TR.racha);
    TR.puntos += 10 + (TR.racha>=3? 2:0);
    sonido("ok");
  } else { TR.racha = 0; sonido("mal"); }
  /* CONTROL por señal (pedido del usuario): cada respuesta queda registrada
     en el perfil — vistas/aciertos/fallos — y sobrevive aunque salga a mitad
     de ronda. Alimenta la barra de cobertura, la prioridad de las rondas y
     los puntos de estado de la galería. */
  if(!P.senales) P.senales = {};
  var reg = P.senales[it.s.id] || (P.senales[it.s.id] = { v:0, a:0, f:0 });
  reg.v++; if(ok) reg.a++; else reg.f++;
  persistir();
  var espera = ok? 900 : 1700; /* con fallo se da más tiempo para VER la correcta */
  TR.i++; /* se avanza YA: si el usuario navega a mitad del feedback, al volver no se repite ni recuenta la señal */
  var t = setTimeout(function(){ if(!TR || TR.fin) return; pintarTrivia(); }, espera);
  timers.push(t);
}
function finalizarTrivia(){
  document.onkeydown = null;
  TR.fin = true;
  if(!P.trivia) P.trivia = {};
  P.trivia.jugadas = (P.trivia.jugadas||0) + 1;
  /* el récord es PORCENTUAL por ronda (los tamaños ahora varían); se migra el
     récord viejo x/10 en vTrivia */
  var pctRonda = Math.round(100*TR.aciertos/TR.qs.length);
  var nuevoRecord = pctRonda > (P.trivia.mejorPct||0);
  if(nuevoRecord) P.trivia.mejorPct = pctRonda;
  P.trivia.mejorRacha = Math.max(P.trivia.mejorRacha||0, TR.mejorRacha);
  P.puntos = (P.puntos||0) + TR.puntos;
  marcarRachaDia();
  persistir();
  var pool = poolTrivia();
  var vistas = pool.filter(function(s){ return (P.senales||{})[s.id]; }).length;
  sonido(pctRonda>=80? "aprobado":"fin");
  shell(
    '<div style="max-width:640px;margin:0 auto">'+
    '<section class="card" style="text-align:center;display:grid;gap:10px;padding:34px">'+
      '<span class="eyebrow">Ronda terminada</span>'+
      '<div style="font-size:52px;font-weight:600;color:var(--navy)">'+TR.aciertos+'<small style="font-size:24px;color:var(--gris-m)">/'+TR.qs.length+'</small></div>'+
      (nuevoRecord? '<span class="chip" style="background:var(--amarillo-c);color:var(--navy);justify-self:center">¡Nuevo récord: '+pctRonda+'%!</span>' : '<span class="sub">Esta ronda: '+pctRonda+'% · tu mejor ronda: '+(P.trivia.mejorPct||0)+'%</span>')+
      '<p class="sub">+'+TR.puntos+' puntos de entrenamiento · mejor racha de la ronda: '+TR.mejorRacha+'</p>'+
      '<p class="sub">Control del catálogo: <b style="color:var(--navy)">'+vistas+'</b> de '+pool.length+' señales respondidas</p>'+
      '<div class="barra" style="max-width:320px;justify-self:center;width:100%"><i style="width:'+Math.round(100*vistas/pool.length)+'%"></i></div>'+
      '<div class="fila" style="justify-content:center;gap:12px;margin-top:8px;flex-wrap:wrap">'+
        '<button class="btn btn-pri" id="tr-otra">'+ico("flecha")+'Jugar otra ronda</button>'+
        '<a class="btn btn-ter" href="#/senales">Volver a señales</a>'+
      '</div>'+
    '</section></div>'
  );
  document.getElementById("tr-otra").addEventListener("click", function(){
    TR = { qs: armarRondaTrivia(tamRonda(poolTrivia().length)), i:0, aciertos:0, puntos:0, racha:0, mejorRacha:0, resuelto:false, fin:false };
    pintarTrivia();
  });
}

/* ---------- vista: progreso (ranking + control por pregunta) ---------- */
var progFiltro = { cap:"todos", estado:"todas" };
function vProgreso(){
  var EX = DATA.examen;
  var sims = P.sims.slice().reverse();
  var mejor = P.sims.reduce(function(m,s){ return Math.max(m,s.puntaje); },0);
  var ranking = P.sims.slice().sort(function(a,b){ return b.puntaje-a.puntaje || a.dur-b.dur; }).slice(0,10);
  var grafico = P.sims.slice(-12).map(function(s){
    var h = Math.max(6, Math.round(120*s.puntaje/EX.puntajeMax));
    return '<div class="col '+(s.aprobado?"ap":"")+'" title="'+s.puntaje+'/'+EX.puntajeMax+' · '+fmtFecha(s.ts)+'"><i style="height:'+h+'px"></i><span>'+s.puntaje+'</span></div>';
  }).join("");
  var filasRank = ranking.map(function(s,i){
    return '<tr><td><b>'+(i+1)+'º</b>'+(s.puntaje===mejor && i===0? ' <span class="chip chip-doble">Récord</span>':"")+'</td><td class="num">'+s.puntaje+'/'+EX.puntajeMax+'</td>'+
    '<td>'+(s.aprobado? '<span class="chip chip-dom">Aprobado</span>':'<span class="chip" style="background:var(--err-bg);color:var(--err-f)">Reprobado</span>')+'</td>'+
    '<td class="num">'+fmtDur(s.dur)+'</td><td class="num">'+fmtFecha(s.ts)+'</td></tr>';
  }).join("");
  var capsOpt = '<option value="todos">Todos los capítulos</option>'+DATA.capitulos.map(function(c){ return '<option value="'+c.id+'"'+(String(progFiltro.cap)===String(c.id)?" selected":"")+'>'+esc(c.label)+'</option>'; }).join("");
  shell(
    '<div class="sec-head"><h1 style="font-size:24px">Tu progreso</h1>'+
    '<button class="btn btn-sec" id="btn-csv">'+ico("descarga")+'Exportar control (CSV)</button></div>'+
    '<div class="secciones">'+
    '<section class="card"><div class="sec-head"><h2 style="font-size:18px">Ranking de simulacros</h2><span class="sub">Mejor marca: <b style="color:var(--navy)">'+(mejor||"—")+(mejor? "/"+EX.puntajeMax:"")+'</b> · Meta: '+EX.aprueba+' puntos</span></div>'+
      (P.sims.length?
        '<div class="graf linea-meta">'+grafico+'</div><p class="sub" style="font-size:12.5px;margin-top:4px">'+(P.sims.length===1? "Tu primer simulacro" : "Últimos "+Math.min(12,P.sims.length)+" simulacros")+' · turquesa = aprobado</p>'+
        '<div class="tabla-wrap" style="margin-top:12px"><table class="tabla"><thead><tr><th>Puesto</th><th>Puntaje</th><th>Resultado</th><th>Duración</th><th>Fecha</th></tr></thead><tbody>'+filasRank+'</tbody></table></div>'
        : '<p class="sub">Aún no rindes simulacros. Tu primer intento define tu línea base — hazlo sin miedo.</p><a class="btn btn-pri" style="margin-top:12px" href="#/simulacro">'+ico("crono")+'Rendir el primero</a>')+
    '</section>'+
    '<section class="card"><h2 style="font-size:18px;margin-bottom:12px">Dominio por capítulo</h2><div class="desglose">'+
      DATA.capitulos.map(function(c){
        var d = dominioCap(c.id);
        return '<div class="desg-fila"><span>'+esc(c.label)+'</span><div class="barra"><i style="width:'+d+'%"></i></div><span class="num" style="text-align:right">'+d+'%</span></div>';
      }).join("")+
    '</div></section>'+
    '<section class="card"><div class="sec-head"><h2 style="font-size:18px">Control por pregunta</h2>'+
      '<div class="fila" style="gap:10px;flex-wrap:wrap">'+
      '<select id="f-cap" class="filtro" style="min-height:40px;border:2px solid #cfd6e4;background:#fff">'+capsOpt+'</select>'+
      '<select id="f-est" class="filtro" style="min-height:40px;border:2px solid #cfd6e4;background:#fff">'+
        '<option value="todas"'+(progFiltro.estado==="todas"?" selected":"")+'>Todas</option>'+
        '<option value="debiles"'+(progFiltro.estado==="debiles"?" selected":"")+'>Mis débiles</option>'+
        '<option value="nuevas"'+(progFiltro.estado==="nuevas"?" selected":"")+'>Nunca vistas</option>'+
        '<option value="dominadas"'+(progFiltro.estado==="dominadas"?" selected":"")+'>Dominadas</option>'+
      '</select></div></div>'+
      '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Pregunta</th><th>Capítulo</th><th>Vistas</th><th>Aciertos</th><th>Fallos</th><th>Precisión</th><th>Racha</th><th>Dominio</th><th>Próximo repaso</th></tr></thead><tbody id="tb-control"></tbody></table></div>'+
      '<p class="sub" id="tb-resumen" style="font-size:13px;margin-top:10px"></p>'+
    '</section>'+
    '</div>'
  );
  pintarControl();
  document.getElementById("f-cap").addEventListener("change", function(){ progFiltro.cap=this.value; pintarControl(); });
  document.getElementById("f-est").addEventListener("change", function(){ progFiltro.estado=this.value; pintarControl(); });
  document.getElementById("btn-csv").addEventListener("click", exportarCSV);
}
function filtrarControl(){
  return DATA.preguntas.filter(function(q){
    if(progFiltro.cap!=="todos" && String(q.capitulo)!==String(progFiltro.cap)) return false;
    var p = progDe(q.id);
    if(progFiltro.estado==="debiles") return p && p.f>0 && p.caja<=2;
    if(progFiltro.estado==="nuevas") return !p;
    if(progFiltro.estado==="dominadas") return p && p.caja>=3;
    return true;
  });
}
function cajaLabel(caja){
  return ["Nueva","Recién vista","Aprendiendo","Dominada","Firme","Blindada"][caja]||"—";
}
function pintarControl(){
  var lista = filtrarControl();
  var capLbl = {}; DATA.capitulos.forEach(function(c){ capLbl[String(c.id)] = c.label; });
  var filas = lista.slice(0,400).map(function(q){
    var p = progDe(q.id);
    var prec = p && p.v? Math.round(100*p.a/p.v) : null;
    var prox = p? (p.prox<=Date.now()? '<b style="color:var(--warn-f)">Hoy</b>' : new Date(p.prox).toLocaleDateString("es-CL",{day:"2-digit",month:"short"})) : "—";
    return '<tr><td style="max-width:340px"><b>'+esc(q.pregunta.length>90? q.pregunta.slice(0,88)+"…" : q.pregunta)+'</b>'+(q.doble? ' <span class="chip chip-doble">×2</span>':"")+'</td>'+
      '<td>'+esc(capLbl[String(q.capitulo)]||q.capitulo)+'</td>'+
      '<td class="num">'+(p? p.v:0)+'</td><td class="num">'+(p? p.a:0)+'</td><td class="num">'+(p? p.f:0)+'</td>'+
      '<td class="num">'+(prec==null? "—" : '<span class="mini-b"><i style="width:'+prec+'%;background:'+(prec>=80?"var(--turq)":prec>=50?"var(--warn)":"var(--err)")+'"></i></span> '+prec+'%')+'</td>'+
      '<td class="num">'+(p? p.r:0)+'</td><td>'+cajaLabel(p? p.caja:0)+'</td><td class="num">'+prox+'</td></tr>';
  }).join("");
  document.getElementById("tb-control").innerHTML = filas || '<tr><td colspan="9" class="sub" style="padding:18px">No hay preguntas con este filtro.</td></tr>';
  document.getElementById("tb-resumen").textContent = lista.length+" "+plural(lista.length,"pregunta","preguntas")+" en este filtro · banco total: "+DATA.preguntas.length+" preguntas construidas desde el libro oficial.";
}
function exportarCSV(){
  var capLbl = {}; DATA.capitulos.forEach(function(c){ capLbl[String(c.id)] = c.label; });
  var filas = [["ID","Capitulo","Tema","Pregunta","Doble puntaje","Vistas","Aciertos","Fallos","Precision %","Racha","Dominio (caja)","Proximo repaso","Ultima vez","Pagina libro"]];
  DATA.preguntas.forEach(function(q){
    var p = progDe(q.id);
    filas.push([ q.id, capLbl[String(q.capitulo)]||q.capitulo, q.temaLabel||"", q.pregunta, q.doble? "SI":"NO",
      p? p.v:0, p? p.a:0, p? p.f:0, (p&&p.v)? Math.round(100*p.a/p.v):"", p? p.r:0, p? cajaLabel(p.caja):"Nueva",
      p? new Date(p.prox).toLocaleDateString("es-CL"):"", p? new Date(p.ult).toLocaleString("es-CL"):"", q.pagina ]);
  });
  var csv = "﻿"+filas.map(function(f){ return f.map(function(c){ c=String(c==null?"":c); return '"'+c.replace(/"/g,'""')+'"'; }).join(";"); }).join("\r\n");
  descargar("toma_el_volante_control_preguntas.csv", csv, "text/csv;charset=utf-8");
  toast("Control por pregunta exportado");
}
function descargar(nombre, contenido, mime){
  var blob = new Blob([contenido], { type:mime });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

/* ---------- vista: configuración ---------- */
function vConfig(){
  var per = perfilActivo(), cfg = perfilCfg();
  function swHTML(id, on, tit, det){
    return '<div class="sw"><div class="crece"><b>'+tit+'</b><span>'+det+'</span></div><button class="toggle'+(on?" on":"")+'" id="'+id+'" role="switch" aria-checked="'+(on?"true":"false")+'" aria-label="'+esc(tit)+'"></button></div>';
  }
  shell(
    '<h1 style="font-size:24px;margin-bottom:16px">Configuración</h1>'+
    '<div class="cfg-grid">'+
    '<section class="card"><h2 style="font-size:17px;margin-bottom:8px">Tu perfil</h2>'+
      '<div class="campo"><label for="cfg-nombre">Nombre</label><input id="cfg-nombre" type="text" maxlength="24" value="'+esc(per.nombre)+'"></div>'+
      '<div class="campo" style="margin-top:12px"><label for="cfg-meta">Meta de repaso diario (preguntas)</label>'+
      '<select id="cfg-meta">'+[10,15,20,30,40].map(function(n){ return '<option value="'+n+'"'+(cfg.meta===n?" selected":"")+'>'+n+' por día</option>'; }).join("")+'</select></div>'+
      '<button class="btn btn-pri" id="cfg-guardar" style="margin-top:14px">Guardar cambios</button>'+
      '<div style="margin-top:18px;padding-top:4px;display:flex;gap:18px;flex-wrap:wrap">'+
      '<button class="btn btn-ter" id="cfg-cambiar" style="padding-left:0">'+ico("usuarios")+'Cambiar de perfil</button>'+
      (location.protocol.indexOf("http")===0? '<a class="btn btn-ter" href="/api/salir" style="padding-left:0">'+ico("salir")+'Cerrar acceso al sitio</a>' : "")+
      '</div>'+
    '</section>'+
    '<section class="card"><h2 style="font-size:17px;margin-bottom:4px">Cómo quieres entrenar</h2>'+
      swHTML("sw-t20", cfg.timer20, "Temporizador de foco (20 segundos)", "Al agotarse aparece una pista y se descarta una alternativa. Entrena tu ventana de atención sin castigarte.")+
      swHTML("sw-sonido", cfg.sonido, "Sonidos de respuesta", "Refuerzo auditivo sutil al acertar o fallar.")+
      swHTML("sw-fz", cfg.fzGrande, "Texto más grande", "Sube el tamaño base de toda la letra del aplicativo.")+
    '</section>'+
    '<section class="card"><h2 style="font-size:17px;margin-bottom:8px">Tus datos</h2>'+
      '<p class="sub" style="font-size:14px">Todo tu avance vive solo en este equipo (localStorage del navegador). Haz respaldos si cambiarás de computador.</p>'+
      '<div class="fila" style="gap:10px;margin-top:12px;flex-wrap:wrap">'+
      '<button class="btn btn-sec" id="cfg-exportar">'+ico("descarga")+'Descargar respaldo</button>'+
      '<button class="btn btn-sec" id="cfg-importar">Restaurar respaldo</button>'+
      '<input type="file" id="cfg-file" accept="application/json" class="oculto">'+
      '</div>'+
      '<div style="margin-top:16px"><button class="btn btn-peligro" id="cfg-reset">Borrar todo mi progreso</button></div>'+
    '</section>'+
    '<section class="card"><h2 style="font-size:17px;margin-bottom:8px">Acerca de Toma el Volante</h2>'+
      '<p class="sub" style="font-size:14px">Entrenador del examen teórico Clase B de Chile. Las '+DATA.preguntas.length+' preguntas y '+DATA.fichas.length+' fichas fueron construidas desde el <b>Libro para la Conducción en Chile</b> (CONASET, edición febrero 2026), cada una con su cita y página de respaldo. El simulacro replica la modalidad oficial del examen (35 preguntas, 3 de doble puntaje, 38 puntos, mínimo 33, 45 minutos).</p>'+
      '<p class="sub" style="font-size:13px;margin-top:10px">Material de estudio independiente: no es el examen oficial ni sus preguntas reales (ese banco no es público). Fuente oficial gratuita: mejoresconductores.conaset.cl</p>'+
      '<p class="sub" style="font-size:13px;margin-top:10px">Desarrollado por Gamonal.</p>'+
    '</section>'+
    '</div>'
  );
  function tg(id, campo){
    document.getElementById(id).addEventListener("click", function(){
      P.cfg[campo] = !P.cfg[campo]; persistir();
      this.classList.toggle("on", P.cfg[campo]);
      this.setAttribute("aria-checked", P.cfg[campo]? "true":"false");
      if(campo==="fzGrande") document.body.classList.toggle("fz-grande", P.cfg.fzGrande);
      if(campo==="sonido" && P.cfg.sonido) sonido("ok");
    });
  }
  tg("sw-t20","timer20"); tg("sw-sonido","sonido"); tg("sw-fz","fzGrande");
  document.getElementById("cfg-guardar").addEventListener("click", function(){
    var n = document.getElementById("cfg-nombre").value.trim();
    if(n){ perfilActivo().nombre = n; guardarRoot(); }
    P.cfg.meta = +document.getElementById("cfg-meta").value || 20; persistir();
    toast("Cambios guardados");
  });
  document.getElementById("cfg-cambiar").addEventListener("click", function(){
    ROOT.activo = null; guardarRoot(); P = null; irA("#/login");
  });
  document.getElementById("cfg-exportar").addEventListener("click", function(){
    var respaldo = { app:"toma-el-volante", v:1, exportado:new Date().toISOString(), perfil:perfilActivo(), datos:P };
    descargar("toma_el_volante_respaldo_"+hoyStr()+".json", JSON.stringify(respaldo, null, 1), "application/json");
    toast("Respaldo descargado");
  });
  document.getElementById("cfg-importar").addEventListener("click", function(){ document.getElementById("cfg-file").click(); });
  document.getElementById("cfg-file").addEventListener("change", function(){
    var f = this.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{
        var j = JSON.parse(r.result);
        if(!j || (j.app!=="toma-el-volante" && j.app!=="ruta-b") || !j.datos || !j.datos.cfg) throw new Error("formato");
        modal("¿Restaurar este respaldo?", "Reemplazará el avance actual de este perfil por el del archivo ("+(j.exportado? j.exportado.slice(0,10):"fecha desconocida")+").", "Restaurar", function(){
          P = j.datos; persistir(); toast("Respaldo restaurado"); render();
        });
      }catch(e){ toast("El archivo no es un respaldo válido de Toma el Volante"); }
    };
    r.readAsText(f);
  });
  document.getElementById("cfg-reset").addEventListener("click", function(){
    modal("¿Borrar TODO tu progreso?", "Se elimina el avance, ranking y control de preguntas de este perfil. Esta acción no se puede deshacer (descarga antes un respaldo).", "Borrar todo", function(){
      P = perfilNuevoDatos(); persistir(); toast("Progreso reiniciado"); render();
    });
  });
}

/* ---------- modal de confirmación ---------- */
function modal(titulo, detalle, accion, alConfirmar, cancelarTxt){
  var v = mk('<div class="velo" role="dialog" aria-modal="true" aria-label="'+esc(titulo)+'">'+
    '<div class="modal"><h3>'+esc(titulo)+'</h3><p class="sub">'+esc(detalle)+'</p>'+
    '<div class="fila" style="justify-content:flex-end;gap:10px;flex-wrap:wrap">'+
    '<button class="btn btn-sec" data-m="no">'+esc(cancelarTxt||"Cancelar")+'</button>'+
    '<button class="btn btn-pri" data-m="si">'+esc(accion)+'</button></div></div></div>');
  document.body.appendChild(v);
  v.querySelector("[data-m=no]").addEventListener("click", function(){ v.remove(); });
  v.querySelector("[data-m=si]").addEventListener("click", function(){ v.remove(); alConfirmar(); });
  v.addEventListener("click", function(ev){ if(ev.target===v) v.remove(); });
  v.querySelector("[data-m=si]").focus();
}

/* ---------- arranque ---------- */
function arrancar(){
  if(!DATA || !DATA.preguntas || !DATA.preguntas.length){
    raiz.innerHTML = '<div style="max-width:560px;margin:80px auto;text-align:center;padding:0 20px">'+simboloSVG(72)+
      '<h1 style="margin:18px 0 8px">Falta el banco de preguntas</h1>'+
      '<p style="color:#545454">No se encontró el archivo <b>datos_toma_el_volante.js</b> junto a este aplicativo. Debe estar en la misma carpeta que index.html.</p></div>';
    return;
  }
  if(ROOT.activo){ P = cargarPerfil(ROOT.activo); }
  if(!location.hash) location.hash = ROOT.activo? "#/home" : "#/login";
  render();
}
arrancar();

/* Interfaz de verificación/depuración (usada por las pruebas E2E) */
window.RUTAB = {
  version: "1.3.5",
  data: DATA,
  perfil: function(){ return P; },
  seleccionSimulacro: seleccionSimulacro,
  dominioGlobal: dominioGlobal,
  vencidasHoy: vencidasHoy,
  triviaEstado: function(){ return TR; },
  senalImg: senalImg
};

})();
