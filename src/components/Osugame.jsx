import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

import estrella from '../assets/estrella.png';
import stared from '../assets/stared.png';
import cancion from '../assets/cry.mp3';

import '../stylesheets/Osu.css';

/* =========================================================
   RETO DE RITMO · "cry"  (estilo osu!)
   Pon <OsuGame /> dentro de SobreMi (o donde quieras el botón).
   El juego se abre a pantalla completa en un portal sobre <body>.
   ========================================================= */

// ---- Mapa de notas, sacado del análisis de cry.mp3 ----
// [milisegundos, x (0-512), y (0-384), número de combo, fuerza del golpe]
const MAPA = [[3322,256,192,1,0.55],[4814,58,195,1,0.54],[6272,229,77,1,0.34],[7651,318,186,1,0.41],[8420,228,324,1,1.05],[8680,162,277,2,0.78],[8933,112,214,3,0.52],[9209,190,193,4,0.5],[9562,258,280,5,0.85],[9899,348,265,6,0.23],[10266,429,232,7,0.62],[10612,417,152,8,0.44],[10953,333,109,9,0.84],[11323,282,192,10,0.32],[11667,217,241,1,1.13],[12017,170,174,2,0.48],[12366,169,93,3,1.23],[12722,88,120,4,0.4],[13059,106,216,5,0.86],[13404,170,266,6,0.47],[13745,209,196,7,0.86],[14120,288,212,8,0.86],[14389,318,288,9,0.63],[14648,237,296,10,0.74],[14884,259,219,1,0.71],[15237,314,137,2,1.09],[15588,338,61,3,0.35],[15941,419,64,4,0.89],[16262,411,146,5,0.26],[16615,331,150,6,1],[16968,230,170,7,0.39],[17335,253,93,8,1.04],[17660,318,139,9,0.47],[18024,389,101,10,1.15],[18354,420,190,1,0.4],[18726,323,230,2,1.06],[19055,293,147,3,0.52],[19421,227,194,4,0.62],[19784,152,235,5,0.84],[20059,87,283,6,0.57],[20308,66,200,7,0.68],[20598,119,126,8,0.19],[20889,171,64,9,0.89],[21246,266,63,10,0.3],[21621,324,123,1,0.82],[21972,388,175,2,0.53],[22321,447,121,3,0.89],[22692,370,68,4,0.37],[23026,312,159,5,0.97],[23381,255,250,6,0.44],[23721,172,265,7,1.12],[24058,103,322,8,0.42],[24400,65,243,9,1.04],[24776,108,144,10,0.62],[25134,175,92,1,0.62],[25499,269,60,2,0.67],[25768,317,125,3,0.72],[26035,280,197,4,0.65],[26305,326,263,5,0.55],[26647,399,299,6,0.67],[27001,392,212,7,0.2],[27345,315,183,8,0.57],[27704,221,183,9,0.27],[28060,221,264,10,0.67],[28421,117,254,1,0.3],[28744,156,324,2,0.8],[29126,234,296,3,0.35],[29444,178,235,4,1.07],[29819,77,152,5,0.32],[30175,142,80,6,0.85],[30508,162,163,7,0.4],[30871,221,218,8,0.89],[31221,161,314,9,0.28],[31548,141,235,10,1.03],[31922,199,149,1,0.55],[32248,175,70,2,0.82],[32627,256,78,3,0.31],[32979,333,115,4,0.85],[33340,403,180,5,0.5],[33684,346,237,6,0.71],[34044,250,296,7,0.25],[34380,180,251,8,0.82],[34734,196,150,9,0.37],[35080,129,85,10,0.85],[35449,87,164,1,0.23],[35783,154,232,2,1.03],[36114,116,302,3,0.89],[36518,202,301,4,0.49],[36875,283,242,5,0.39],[37231,371,228,6,0.8],[37560,355,307,7,0.51],[37919,269,282,8,0.74],[38305,192,306,9,0.29],[38663,115,278,10,0.63],[38996,135,183,1,0.69],[39348,130,93,2,0.79],[39690,212,56,3,0.29],[40059,213,138,4,0.9],[40420,226,221,5,0.38],[40758,266,294,6,0.82],[41116,163,307,7,0.32],[41469,64,266,8,0.78],[41859,82,183,9,0.65],[42192,90,101,10,0.67],[42566,167,132,1,0.37],[42923,247,119,2,0.75],[43281,291,190,3,0.48],[43650,278,269,4,0.64],[43967,206,319,5,0.27],[44350,156,255,6,0.94],[44710,75,278,7,0.55],[45056,82,179,8,0.83],[45423,151,221,9,0.28],[45756,111,293,10,0.83],[46130,64,217,1,0.52],[46518,73,135,2,0.4],[46842,172,132,3,0.33],[47184,228,192,4,0.76],[47545,180,256,5,0.45],[47922,119,310,6,0.42],[48272,106,198,7,0.4],[48767,223,106,1,0.62],[49329,360,119,2,0.79],[49653,445,164,3,0.3],[50034,384,231,4,0.88],[50374,430,309,5,0.34],[50748,342,316,6,0.69],[51102,269,254,7,0.27],[51465,292,175,8,0.83],[51789,361,130,9,0.39],[52155,435,164,10,0.82],[52478,395,234,1,0.28],[52856,335,288,2,0.92],[53211,257,261,3,0.46],[53551,180,283,4,0.69],[53931,84,255,5,0.78],[54243,118,182,6,0.61],[54477,66,119,7,0.52],[54743,150,67,8,0.39],[55119,191,143,9,0.56],[55446,258,203,10,0.23],[55822,245,288,1,0.65],[56161,157,248,2,0.46],[56508,223,202,3,0.59],[56886,295,133,4,0.36],[57242,374,116,5,0.98],[57590,456,128,6,0.28],[57943,413,199,7,0.71],[58277,324,170,8,0.4],[58654,369,103,9,0.98],[58992,437,60,10,0.37],[59361,442,166,1,0.64],[59721,431,248,2,0.86],[60005,350,241,3,0.66],[60282,346,160,4,0.73],[60541,392,92,5,0.49],[60861,454,146,6,0.78],[61586,393,312,1,0.67],[61908,374,232,2,0.45],[62275,329,162,3,0.82],[62659,267,93,4,0.18],[63005,163,89,5,0.73],[63365,68,122,6,0.62],[63720,97,202,7,0.81],[64081,163,269,8,0.26],[64397,245,277,9,0.82],[64752,328,274,10,0.27],[65112,407,248,1,0.76],[65490,412,158,2,0.35],[65836,446,80,3,0.73],[66192,367,61,4,0.51],[66553,287,83,5,0.7],[66921,198,121,6,0.33],[67250,117,132,7,0.9],[67610,155,228,8,0.34],[67985,149,308,9,0.69],[68347,232,313,10,0.21],[68668,323,285,1,0.75],[69025,350,200,2,0.52],[69416,429,214,3,0.63],[69740,444,294,4,0.42],[70085,362,275,5,0.51],[70469,264,293,6,0.44],[70810,185,311,7,0.97],[71158,143,241,8,0.27],[71705,214,168,1,0.75],[72214,203,59,2,0.77],[72584,287,76,3,0.29],[72924,366,62,4,0.53],[73269,446,59,5,0.36],[73625,446,149,6,0.65],[74006,363,163,7,0.31],[74357,281,119,8,0.64],[74699,202,144,9,0.4],[75074,142,208,10,0.71],[75407,61,239,1,0.39],[75793,60,325,2,0.77],[76134,136,277,3,0.57],[76482,173,187,4,0.64],[76874,289,209,5,0.32],[77216,379,202,6,0.9],[77584,439,269,7,0.37],[77934,350,288,8,0.89],[78258,273,262,9,0.35],[78636,210,200,10,0.76],[78990,129,156,1,0.53],[79341,66,72,2,0.69],[79680,159,74,3,0.36],[80061,207,163,4,0.75],[80448,178,239,5,0.44],[80778,222,306,6,0.63],[81109,312,290,7,0.37],[81460,294,209,8,0.83],[81857,223,136,9,0.41],[82187,289,90,10,0.83],[82536,370,105,1,0.49],[83055,370,231,2,1],[83609,251,231,3,0.8],[84317,100,229,4,0.62],[84684,173,266,5,0.32],[85041,255,261,6,0.63],[85398,259,180,7,0.21],[85750,182,152,8,0.72],[86095,98,103,9,0.35],[86449,108,188,10,0.63],[86804,118,268,1,0.4],[87153,195,293,2,0.9],[87498,277,281,3,0.56],[87853,314,208,4,0.51],[88233,321,103,5,0.69],[88502,401,83,6,0.6],[88754,405,165,7,0.54],[89025,434,244,8,0.51],[89355,436,325,9,0.6],[89725,359,281,10,0.38],[90046,282,254,1,0.65],[90420,183,240,2,0.44],[90780,103,232,3,0.67],[91128,117,313,4,0.35],[91475,192,284,5,0.75],[91848,223,210,6,0.52],[92190,170,137,7,0.74],[92551,76,140,8,0.36],[92907,66,230,9,0.82],[93267,142,262,10,0.42],[93624,196,201,1,0.55],[93989,254,101,2,0.94],[94260,347,103,3,0.58],[94517,299,177,4,0.56],[94761,380,194,5,0.42],[95117,395,296,6,0.48],[95795,248,248,1,0.71],[96166,150,246,2,0.5],[96539,150,164,3,0.65],[96906,139,81,4,0.24],[97249,66,128,5,0.76],[97612,85,209,6,0.33],[97963,102,299,7,0.73],[98321,184,248,8,0.4],[98665,113,208,9,1.02],[99008,146,134,10,0.34],[99351,231,184,1,0.78],[99620,281,257,2,0.2],[99899,359,275,3,0.17],[100235,429,320,4,0.93],[100461,445,223,5,0.4],[100759,410,150,6,0.63],[101110,453,70,7,0.17],[101473,331,81,8,0.58],[101835,248,82,9,0.38],[102189,169,70,10,0.69],[102531,93,106,1,0.29],[102878,157,156,2,0.71],[103230,247,185,3,0.51],[103606,201,253,4,0.56],[104282,70,315,5,0.73],[104712,58,201,6,0.37],[105002,133,233,7,0.82],[105337,132,313,8,0.3],[105868,226,266,1,1.14],[106396,144,180,2,0.47],[107078,303,97,3,0.67],[107436,384,73,4,0.38],[107747,427,144,5,0.84],[108125,334,213,6,0.27],[108638,198,165,1,1.24],[109140,153,264,2,0.54],[109853,313,325,3,0.62],[110207,233,303,4,0.31],[110572,248,225,5,0.6],[111091,271,107,6,0.41],[111426,194,81,7,0.77],[111954,90,61,1,1.12],[112675,94,223,2,1.09],[113027,143,309,3,0.36],[113372,221,328,4,0.71],[113756,305,309,5,0.31],[114272,367,208,6,0.98],[114777,449,141,1,0.54],[115499,281,108,2,0.53],[115910,200,119,3,0.36],[116200,144,194,4,0.57],[116553,67,131,5,0.57],[117084,151,92,6,0.62],[117635,243,113,1,0.49],[118308,406,122,2,0.86],[118674,446,198,3,0.33],[119025,383,253,4,0.76],[119406,288,258,5,0.18],[119744,220,215,6,0.88],[120129,147,180,7,0.45],[120459,119,104,8,0.77],[120849,57,156,9,0.34],[121193,94,230,10,0.87],[121532,108,314,1,0.35],[121871,181,276,2,0.77],[122249,237,217,3,0.34],[122768,241,83,4,0.68],[123312,345,61,5,0.54],[124026,390,204,6,0.78],[124392,450,287,7,0.42],[124745,369,298,8,0.73],[125098,334,192,9,0.31],[125460,311,108,10,0.87],[125806,252,164,1,0.39],[126186,174,181,2,0.7],[126515,139,106,3,0.35],[126885,59,167,4,0.97],[127254,65,272,5,0.38],[127610,147,278,6,1],[127978,162,199,7,0.28],[128501,253,109,1,0.66],[129008,380,132,2,0.59],[129393,324,72,3,0.33],[129744,242,74,4,0.92],[130074,262,160,5,0.56],[130445,322,107,6,0.83],[130818,369,172,7,0.31],[131153,325,241,8,0.86],[131509,338,322,9,0.42],[131882,247,263,10,0.82],[132245,219,187,1,0.3],[132615,158,133,2,0.67],[132970,122,61,3,0.41],[133319,58,115,4,0.72],[133683,86,196,5,0.81],[133976,149,253,6,0.71],[134248,241,227,7,0.67],[134502,260,149,8,0.27],[134861,192,107,9,0.58],[135192,112,150,10,0.22],[135544,75,245,1,0.64],[135927,143,287,2,0.61],[136275,183,216,3,0.64],[136663,258,242,4,0.34],[136999,278,162,5,0.88],[137376,341,212,6,0.33],[137745,421,203,7,0.88],[138093,416,319,8,0.26],[138461,308,301,9,0.9],[138789,227,324,10,0.4],[139149,241,238,1,0.76],[139516,225,152,2,0.69],[139791,255,77,3,0.74],[140108,338,110,4,0.65],[140679,454,158,5,0.89],[141040,439,259,6,0.34],[141402,367,326,7,0.91],[141756,286,295,8,0.45],[142116,210,321,9,0.86],[142501,137,265,10,0.29],[142827,161,168,1,0.83],[143169,233,88,2,0.44],[143557,309,60,3,0.81],[143921,345,141,4,0.37],[144275,259,125,5,0.8],[144608,177,142,6,0.41],[144985,83,171,7,0.79],[145373,61,264,8,0.73],[145638,139,242,9,0.71],[145931,198,296,10,0.74],[146196,278,283,1,0.48],[146774,387,231,2,0.29],[147326,237,172,3,0.71],[147734,318,185,4,0.6],[148284,294,307,5,0.2],[148809,192,307,6,0.9],[149201,122,261,7,0.5],[149446,164,186,8,0.18],[149782,138,110,9,0.26],[150304,269,109,1,0.87],[150688,346,87,2,0.52],[151531,379,287,1,1.19],[151866,301,326,2,1],[152267,257,259,3,0.6],[152740,154,230,4,0.35]];

// ---- Ajustes ----
const CAMPO_W = 512;
const CAMPO_H = 384;

const APARICION = 0.9; // segundos que tarda el aro en cerrarse sobre la nota (sube = más fácil)
const FADE = 0.22; // la nota aparece en este tiempo
const AROS = 2.2; // tamaño inicial del aro (1 + AROS veces la nota)

// Ventanas de precisión (± segundos)
const V300 = 0.06; // ¡300!
const V100 = 0.11; // 100
const V50 = 0.16; // 50; fuera de esto es fallo

const ACIERTOS_DESBLOQUEO = 50; // aciertos en una partida (aunque falles) para desbloquear "cry" en Mis canciones
const ID_CANCION = 'cry'; // id de la canción en Canciones.jsx

const DEBUG_TECLAS = false; // pon true y abre la consola (F12) para ver por qué una tecla no cuenta

const AJUSTE_AUDIO = 0; // si las notas llegan TARDE al sonido, súbelo (ej. 0.03); si llegan temprano, bájalo

const VIDA_INICIAL = 0.7;
const VIDA_300 = 0.03;
const VIDA_100 = 0.015;
const VIDA_50 = 0.005;
const VIDA_FALLO = 0.09;

const INICIO_CANCION = 1.6; // segundo de la canción por donde se empieza
const PRE = 2.4; // segundos de cuenta regresiva antes de que suene
const VOLUMEN = 1;

const AMARILLO = '#ffd23f';
const CIAN = '#2fd4ff';
const COLORES = ['#2fd4ff', '#ffd23f', '#ff4d57', '#1b6fe0', '#8fe3ff']; // el rojo entra en la rotación de colores

const reduce =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Notas con su grupo de color ----
let grupoActual = -1;
const NOTAS = MAPA.map(([ms, x, y, n, f], i) => {
  if (n === 1) grupoActual += 1;
  return { i, t: ms / 1000, x, y, n, f, grupo: grupoActual };
});
const FIN = NOTAS[NOTAS.length - 1].t + 1.2;

// ---- Audio (un solo contexto y una sola descarga para todo el sitio) ----
let ctxGlobal = null;
let bufferGlobal = null;
let cargandoGlobal = null;

function obtenerContexto() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  if (!ctxGlobal) ctxGlobal = new C();
  return ctxGlobal;
}

function cargarCancion() {
  if (bufferGlobal) return Promise.resolve(bufferGlobal);
  if (cargandoGlobal) return cargandoGlobal;

  const ctx = obtenerContexto();
  if (!ctx) return Promise.resolve(null);

  cargandoGlobal = fetch(cancion)
    .then((r) => r.arrayBuffer())
    .then((d) => ctx.decodeAudioData(d))
    .then((b) => {
      bufferGlobal = b;
      return b;
    })
    .catch((error) => {
      console.error('No se pudo cargar cry.mp3:', error);
      cargandoGlobal = null;
      return null;
    });

  return cargandoGlobal;
}

// ---- Música de fondo del portafolio: se pausa durante el juego y se reanuda al salir ----
let fondoSonando = false;
let propio = false;
let cryDesbloqueada = false; // ya se desbloqueó en esta visita

if (typeof window !== 'undefined') {
  window.addEventListener('musica-fondo', (e) => {
    fondoSonando = Boolean(e.detail?.sonando);
  });
  window.addEventListener('musica-control', (e) => {
    if (!propio) fondoSonando = Boolean(e.detail?.sonando);
  });
}

function emitir(nombre, detail) {
  propio = true;
  window.dispatchEvent(new CustomEvent(nombre, { detail }));
  propio = false;
}

const rangoDe = (completo, acc) => {
  if (!completo) return 'F';
  if (acc >= 100) return 'SS';
  if (acc >= 95) return 'S';
  if (acc >= 90) return 'A';
  if (acc >= 80) return 'B';
  if (acc >= 70) return 'C';
  return 'D';
};

/* =========================================================
   JUEGO (pantalla completa)
   ========================================================= */

function Juego({ onCerrar }) {
  const root = useRef(null);
  const campo = useRef(null);
  const capa = useRef(null);
  const aros = useRef(null);
  const scoreEl = useRef(null);
  const accEl = useRef(null);
  const comboEl = useRef(null);
  const vidaEl = useRef(null);
  const progEl = useRef(null);
  const cuentaEl = useRef(null);
  const api = useRef({});
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;

  const [fase, setFase] = useState('menu'); // 'menu' | 'jugando' | 'fin'
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);

  // ---------------------------------------------------------
  // Lógica del juego
  // ---------------------------------------------------------
  useEffect(() => {
    const el = root.current;
    const campoEl = campo.current;
    const capaEl = capa.current;

    const g = {
      activo: false,
      destruido: false,
      saliendo: false,
      t0: 0,
      fuente: null,
      gan: null,
      idx: 0,
      pIdx: 0,
      activas: [],
      combo: 0,
      maxCombo: 0,
      puntos: 0,
      vida: VIDA_INICIAL,
      n300: 0,
      n100: 0,
      n50: 0,
      nFallo: 0,
      juzgadas: 0,
      fondoPrevio: false,
      px: window.innerWidth / 2,
      py: window.innerHeight / 2,
      puntero: false, // ya se ha visto el puntero moverse dentro del reto
      cuentaTl: null,
    };

    let size = 64;

    const medir = () => {
      const r = campoEl.getBoundingClientRect();
      size = Math.max(54, Math.min(112, r.width * 0.125));
      campoEl.style.setProperty('--nota', `${size}px`);
    };
    medir();
    window.addEventListener('resize', medir);

    // ---------- Música de fondo ----------
    const silenciarFondo = () => {
      g.fondoPrevio = fondoSonando;
      if (fondoSonando) emitir('musica-control', { sonando: false });
      emitir('musica-libre'); // Hero pausa a Laferte si estaba sonando
    };

    const restaurarFondo = () => {
      if (g.fondoPrevio) emitir('musica-control', { sonando: true });
      g.fondoPrevio = false;
    };

    // ---------- Reloj de audio ----------
    const posicion = () => {
      const ctx = ctxGlobal;
      const latencia = ctx.outputLatency || ctx.baseLatency || 0;
      return ctx.currentTime - g.t0 - latencia + AJUSTE_AUDIO;
    };

    const detenerAudio = (fade = 0.4) => {
      const ctx = ctxGlobal;
      if (!ctx || !g.fuente) return;
      const ahora = ctx.currentTime;
      try {
        g.gan.gain.cancelScheduledValues(ahora);
        g.gan.gain.setValueAtTime(g.gan.gain.value, ahora);
        g.gan.gain.linearRampToValueAtTime(0, ahora + fade);
        g.fuente.stop(ahora + fade + 0.05);
      } catch {
        /* ya había terminado */
      }
      g.fuente = null;
    };

    // ---------- HUD ----------
    const precision = () =>
      g.juzgadas ? ((g.n300 * 300 + g.n100 * 100 + g.n50 * 50) / (g.juzgadas * 300)) * 100 : 100;

    const pintarHUD = () => {
      if (scoreEl.current) scoreEl.current.textContent = String(Math.round(g.puntos)).padStart(7, '0');
      if (accEl.current) accEl.current.textContent = `${precision().toFixed(2)}%`;
      if (comboEl.current) comboEl.current.textContent = g.combo > 0 ? `${g.combo}x` : '';
      if (vidaEl.current) vidaEl.current.style.transform = `scaleX(${Math.max(0, g.vida)})`;
    };

    // ---------- Efectos ----------
    const juicio = (n, html, color) => {
      const d = document.createElement('div');
      d.className = 'osu-juicio';
      d.style.left = `${(n.x / CAMPO_W) * 100}%`;
      d.style.top = `${(n.y / CAMPO_H) * 100}%`;
      d.style.color = color;
      d.innerHTML = html;
      capaEl.appendChild(d);

      gsap.fromTo(
        d,
        { xPercent: -50, yPercent: -50, scale: 1.5, opacity: 1, y: 0 },
        { scale: 1, y: -36, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => d.remove() }
      );
    };

    const chispas = (n, cantidad) => {
      for (let i = 0; i < cantidad; i += 1) {
        const img = document.createElement('img');
        img.src = estrella;
        img.alt = '';
        img.className = 'osu-chispa';
        img.style.left = `${(n.x / CAMPO_W) * 100}%`;
        img.style.top = `${(n.y / CAMPO_H) * 100}%`;
        img.style.width = `${size * 0.32}px`;
        capaEl.appendChild(img);

        const a = (Math.PI * 2 * i) / cantidad + Math.random() * 0.5;
        gsap.fromTo(
          img,
          { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
          {
            x: Math.cos(a) * size * 1.1,
            y: Math.sin(a) * size * 1.1,
            scale: 0.2,
            opacity: 0,
            rotation: 180,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => img.remove(),
          }
        );
      }
    };

    const temblor = () => {
      if (reduce) return;
      gsap.fromTo(
        campoEl,
        { x: -9 },
        { x: 0, duration: 0.45, ease: 'elastic.out(2, 0.25)', overwrite: 'auto' }
      );
    };

    // Un golpe fuerte de la canción: aro que se expande y el campo "late"
    const pulso = (n) => {
      if (reduce) return;
      if (n.f < 0.95 && n.n !== 1) return;

      const r = document.createElement('div');
      r.className = 'osu-pulso';
      aros.current.appendChild(r);

      gsap.fromTo(
        r,
        { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0.55 },
        { scale: 2.6, opacity: 0, duration: 1, ease: 'power2.out', onComplete: () => r.remove() }
      );

      gsap.fromTo(
        campoEl,
        { scale: 1.012 },
        { scale: 1, duration: 0.28, ease: 'power2.out', overwrite: 'auto' }
      );
    };

    // ---------- Notas ----------
    const crearNota = (n) => {
      const e = document.createElement('div');
      e.className = 'osu-nota';
      e.style.left = `${(n.x / CAMPO_W) * 100}%`;
      e.style.top = `${(n.y / CAMPO_H) * 100}%`;
      e.style.zIndex = String(100000 - n.i);
      e.style.opacity = '0';
      e.style.setProperty('--c', COLORES[n.grupo % COLORES.length]);
      e.innerHTML = `<span class="osu-nota__aro"></span><span class="osu-nota__cuerpo">${n.n}</span>`;
      capaEl.appendChild(e);

      g.activas.push({ ...n, el: e, aro: e.firstChild, cuerpo: e.lastChild, resuelta: false });
    };

    const limpiarNotas = () => {
      g.activas.forEach((n) => {
        gsap.to(n.el, { opacity: 0, duration: 0.25, onComplete: () => n.el.remove() });
      });
      g.activas = [];
    };

    // ---------- Resultado de cada nota ----------
    const acierto = (n, diff, signed) => {
      const val = diff <= V300 ? 300 : diff <= V100 ? 100 : 50;

      n.resuelta = true;
      g.activas.splice(g.activas.indexOf(n), 1);

      g.combo += 1;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      g.juzgadas += 1;
      if (val === 300) g.n300 += 1;
      else if (val === 100) g.n100 += 1;
      else g.n50 += 1;

      // 50 aciertos en total: se desbloquea la canción en "Mis canciones"
      if (!cryDesbloqueada && g.n300 + g.n100 + g.n50 >= ACIERTOS_DESBLOQUEO) {
        cryDesbloqueada = true;
        window.dispatchEvent(
          new CustomEvent('cancion-desbloqueada', { detail: { id: ID_CANCION } })
        );
      }

      g.puntos += val * (1 + Math.min(g.combo, 60) / 30);
      g.vida = Math.min(
        1,
        g.vida + (val === 300 ? VIDA_300 : val === 100 ? VIDA_100 : VIDA_50)
      );

      const ms = Math.round(signed * 1000);
      const color = val === 300 ? AMARILLO : val === 100 ? CIAN : '#ffffff';
      juicio(n, `${val}<small>${ms > 0 ? '+' : ''}${ms} ms</small>`, color);
      chispas(n, val === 300 ? 7 : 4);

      // El círculo se vuelve blanco mientras se expande
      n.el.style.setProperty('--c', '#ffffff');

      gsap
        .timeline({ onComplete: () => n.el.remove() })
        .to(n.aro, { opacity: 0, duration: 0.1 }, 0)
        .to(n.cuerpo, { scale: val === 300 ? 1.9 : 1.6, opacity: 0, duration: 0.28, ease: 'power2.out' }, 0);

      if (comboEl.current) {
        gsap.fromTo(
          comboEl.current,
          { scale: 1.35 },
          { scale: 1, duration: 0.2, ease: 'back.out(3)', overwrite: 'auto' }
        );
      }

      pintarHUD();
    };

    const fallo = (n) => {
      n.resuelta = true;

      g.combo = 0;
      g.juzgadas += 1;
      g.nFallo += 1;
      g.vida = Math.max(0, g.vida - VIDA_FALLO);

      juicio(n, '✕', '#ff7a7a');
      temblor();

      n.cuerpo.style.filter = 'grayscale(1) brightness(.8)';
      gsap.to(n.aro, { opacity: 0, duration: 0.1 });
      gsap.to(n.el, { opacity: 0, y: 14, duration: 0.35, onComplete: () => n.el.remove() });

      pintarHUD();
      if (g.vida <= 0) terminar(false);
    };

    // El jugador pulsa en (clientX, clientY): solo cuenta la nota más próxima en el tiempo
    const golpear = (origen = 'clic') => {
      const n = g.activas.find((a) => !a.resuelta);
      if (!n) {
        if (DEBUG_TECLAS) console.log(`[reto] ${origen}: no hay ninguna nota en pantalla`);
        return;
      }

      const r = campoEl.getBoundingClientRect();
      const px = ((g.px - r.left) / r.width) * CAMPO_W;
      const py = ((g.py - r.top) / r.height) * CAMPO_H;
      const radio = ((size / 2) * 1.08 * CAMPO_W) / r.width;
      const dist = Math.hypot(px - n.x, py - n.y);

      // Con teclado, si el puntero nunca se ha movido no se puede saber dónde está:
      // en ese caso la tecla golpea la nota más próxima sin mirar la posición.
      const sinPuntero = origen === 'tecla' && !g.puntero;

      if (!sinPuntero && dist > radio) {
        if (DEBUG_TECLAS) {
          console.log(
            `[reto] ${origen}: el puntero está a ${Math.round(dist)} (radio ${Math.round(radio)}) de la nota ${n.n}`
          );
        }
        return;
      }

      const signed = posicion() - n.t; // negativo = temprano, positivo = tarde

      if (signed < -V50) {
        // Demasiado pronto: la nota se sacude, no cuenta
        gsap.fromTo(
          n.cuerpo,
          { x: -4 },
          { x: 0, duration: 0.3, ease: 'elastic.out(1.5, 0.3)', overwrite: 'auto' }
        );
        return;
      }

      acierto(n, Math.abs(signed), signed);
    };

    // ---------- Fin ----------
    const terminar = (completo) => {
      if (!g.activo) return;
      g.activo = false;

      detenerAudio(0.6);
      limpiarNotas();
      restaurarFondo();

      const acc = precision();
      setRes({
        completo,
        puntos: Math.round(g.puntos),
        acc,
        n300: g.n300,
        n100: g.n100,
        n50: g.n50,
        nFallo: g.nFallo,
        maxCombo: g.maxCombo,
        rango: rangoDe(completo, acc),
        desbloqueada: cryDesbloqueada,
      });
      setFase('fin');
    };

    // ---------- Empezar ----------
    const empezar = async () => {
      if (g.activo || g.destruido) return;

      const ctx = obtenerContexto();
      if (!ctx) return;

      setCargando(true);

      try {
        if (ctx.state === 'suspended') await ctx.resume();
        const buf = await cargarCancion();
        if (!buf || g.destruido) {
          setCargando(false);
          return;
        }

        setCargando(false);
        silenciarFondo();

        // Reinicia la partida
        g.idx = 0;
        g.pIdx = 0;
        g.combo = 0;
        g.maxCombo = 0;
        g.puntos = 0;
        g.vida = VIDA_INICIAL;
        g.n300 = 0;
        g.n100 = 0;
        g.n50 = 0;
        g.nFallo = 0;
        g.juzgadas = 0;
        limpiarNotas();
        capaEl.innerHTML = '';
        medir();
        pintarHUD();

        const arranque = ctx.currentTime + PRE;
        g.t0 = arranque - INICIO_CANCION;

        const fuente = ctx.createBufferSource();
        const gan = ctx.createGain();
        fuente.buffer = buf;
        gan.gain.value = VOLUMEN;
        fuente.connect(gan);
        gan.connect(ctx.destination);
        fuente.start(arranque, INICIO_CANCION);
        fuente.onended = () => {
          if (g.fuente === fuente && g.activo) terminar(true);
        };

        g.fuente = fuente;
        g.gan = gan;
        g.activo = true;
        setFase('jugando');

        // Cuenta regresiva
        const cuenta = cuentaEl.current;
        if (g.cuentaTl) g.cuentaTl.kill();
        const tl = gsap.timeline();
        ['3', '2', '1', '¡YA!'].forEach((txt, i) => {
          tl.call(() => {
            cuenta.textContent = txt;
          }, null, i * 0.6)
            .fromTo(
              cuenta,
              { scale: 2.4, opacity: 0, rotation: -8 },
              { scale: 1, opacity: 1, rotation: 0, duration: 0.28, ease: 'back.out(2.2)' },
              i * 0.6
            )
            .to(cuenta, { opacity: 0, scale: 0.8, duration: 0.2 }, i * 0.6 + 0.38);
        });
        g.cuentaTl = tl;
      } catch (error) {
        console.error('No se pudo empezar el reto:', error);
        setCargando(false);
      }
    };

    // ---------- Salir ----------
    const salir = () => {
      if (g.saliendo) return;
      g.saliendo = true;

      g.activo = false;
      detenerAudio(0.3);
      restaurarFondo();

      gsap.to(el, {
        opacity: 0,
        scale: 1.04,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => cerrarRef.current?.(),
      });
    };

    api.current = { empezar, salir };

    // ---------- Cada cuadro ----------
    const latido = () => {
      if (!g.activo) return;

      const pos = posicion();

      while (g.idx < NOTAS.length && NOTAS[g.idx].t - pos < APARICION) {
        crearNota(NOTAS[g.idx]);
        g.idx += 1;
      }

      for (let k = g.activas.length - 1; k >= 0; k -= 1) {
        const n = g.activas[k];
        const dt = n.t - pos;

        if (-dt > V50) {
          // Se pasó sin que la tocaran
          g.activas.splice(k, 1);
          fallo(n);
          if (!g.activo) return;
        } else {
          const a = Math.min(1, Math.max(0, (APARICION - dt) / FADE));
          n.el.style.opacity = a;
          n.aro.style.transform = `scale(${1 + AROS * Math.min(1, Math.max(0, dt / APARICION))})`;
        }
      }

      while (g.pIdx < NOTAS.length && NOTAS[g.pIdx].t <= pos) {
        pulso(NOTAS[g.pIdx]);
        g.pIdx += 1;
      }

      if (progEl.current) {
        progEl.current.style.transform = `scaleX(${Math.min(1, Math.max(0, pos / FIN))})`;
      }
      if (vidaEl.current) vidaEl.current.style.transform = `scaleX(${Math.max(0, g.vida)})`;

      if (pos > FIN && g.idx >= NOTAS.length && !g.activas.length) terminar(true);
    };

    gsap.ticker.add(latido);

    // ---------- Entradas ----------
    const abajo = (e) => {
      e.preventDefault();
      g.px = e.clientX;
      g.py = e.clientY;
      g.puntero = true;
      if (g.activo) golpear('clic');
    };

    // Se sigue al puntero en fase de captura para que nada lo bloquee
    const mover = (e) => {
      if (e.clientX == null) return;
      g.px = e.clientX;
      g.py = e.clientY;
      g.puntero = true;
    };

    const tecla = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!e.repeat) salir();
        return;
      }

      const k = (e.key || '').toLowerCase();

      if (e.code === 'KeyZ' || e.code === 'KeyX' || k === 'z' || k === 'x') {
        e.preventDefault();
        e.stopPropagation();
        if (DEBUG_TECLAS) console.log(`[reto] tecla ${e.code} (activo: ${g.activo}, repeat: ${e.repeat})`);
        if (!e.repeat && g.activo) golpear('tecla');
        return;
      }

      // Que las flechas y el espacio no hagan sonar el piano del portafolio
      if (e.code === 'Space' || (e.key || '').startsWith('Arrow')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Si cambias de pestaña el reloj de audio se detiene y el juego espera
    const visibilidad = () => {
      const ctx = ctxGlobal;
      if (!ctx || !g.activo) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    };

    campoEl.addEventListener('pointerdown', abajo);
    window.addEventListener('pointermove', mover, true);
    window.addEventListener('mousemove', mover, true);
    window.addEventListener('keydown', tecla, true);
    document.addEventListener('visibilitychange', visibilidad);

    return () => {
      g.destruido = true;
      gsap.ticker.remove(latido);
      window.removeEventListener('resize', medir);
      window.removeEventListener('pointermove', mover, true);
      window.removeEventListener('mousemove', mover, true);
      window.removeEventListener('keydown', tecla, true);
      document.removeEventListener('visibilitychange', visibilidad);
      campoEl.removeEventListener('pointerdown', abajo);

      if (g.cuentaTl) g.cuentaTl.kill();
      g.activo = false;
      detenerAudio(0.2);
      restaurarFondo();
      gsap.killTweensOf([el, campoEl]);
      if (ctxGlobal && ctxGlobal.state === 'suspended') ctxGlobal.resume();
    };
  }, []);

  // ---------------------------------------------------------
  // Animaciones GSAP de cada pantalla
  // ---------------------------------------------------------

  // Entrada: el telón se abre en círculo y todo cae en su sitio
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { clipPath: 'circle(0% at 50% 50%)' },
        { clipPath: 'circle(150% at 50% 50%)', duration: 0.85, ease: 'power3.inOut', clearProps: 'clipPath' }
      );

      gsap.from('.osu__campo', { y: 90, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.25 });

      gsap.to('.osu-deco', {
        y: 'random(-22, 22)',
        x: 'random(-14, 14)',
        duration: 'random(2.2, 3.8)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.25,
      });

      gsap.to('.osu-deco--estrella', { rotation: 360, duration: 16, repeat: -1, ease: 'none' });
    }, root);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (fase !== 'menu') return undefined;

    const ctx = gsap.context(() => {
      gsap.from('.osu-card', {
        scale: 0.6,
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'back.out(1.7)',
        delay: 0.4,
      });

      gsap.from('.osu-letra', {
        y: -140,
        rotation: () => gsap.utils.random(-45, 45),
        opacity: 0,
        scale: 0.2,
        duration: 1,
        ease: 'elastic.out(1, 0.5)',
        stagger: 0.12,
        delay: 0.65,
      });

      gsap.from('.osu-card li, .osu-card .osu-btn', {
        y: 18,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        delay: 1,
      });

      gsap.to('.osu-letra', {
        y: -6,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.18,
        delay: 2,
      });
    }, root);

    return () => ctx.revert();
  }, [fase]);

  useLayoutEffect(() => {
    if (fase !== 'jugando') return undefined;

    const ctx = gsap.context(() => {
      gsap.from('.osu__hud', { y: -80, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' });
      gsap.from('.osu__combo', { x: -80, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', delay: 0.15 });
    }, root);

    return () => ctx.revert();
  }, [fase]);

  // Resultados: puntos que suben, rango que cae como un sello
  useLayoutEffect(() => {
    if (fase !== 'fin' || !res) return undefined;

    const ctx = gsap.context(() => {
      const rootEl = root.current;

      gsap.from('.osu-card--fin', { scale: 0.6, opacity: 0, y: 50, duration: 0.7, ease: 'back.out(1.7)' });
      gsap.from('.osu-fila', { x: -40, opacity: 0, duration: 0.4, stagger: 0.09, delay: 0.5 });
      gsap.from('.osu-desbloqueo', { scale: 0.4, opacity: 0, duration: 0.6, ease: 'back.out(2.4)', delay: 1.3 });
      gsap.from('.osu-card--fin .osu-btn', { y: 20, opacity: 0, duration: 0.4, stagger: 0.1, delay: 1.5 });

      const o = { s: 0, a: 0 };
      const sEl = rootEl.querySelector('.osu-fin-score');
      const aEl = rootEl.querySelector('.osu-fin-acc');

      gsap.to(o, {
        s: res.puntos,
        a: res.acc,
        duration: 1.5,
        delay: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          if (sEl) sEl.textContent = String(Math.round(o.s)).padStart(7, '0');
          if (aEl) aEl.textContent = `${o.a.toFixed(2)}%`;
        },
      });

      gsap.fromTo(
        '.osu-rank',
        { scale: 5, rotation: -28, opacity: 0 },
        { scale: 1, rotation: -6, opacity: 1, duration: 0.7, ease: 'bounce.out', delay: 1.3 }
      );

      // Lluvia de estrellas al caer el sello
      const rank = rootEl.querySelector('.osu-rank');
      if (rank && res.completo) {
        gsap.delayedCall(1.55, () => {
          const r = rank.getBoundingClientRect();
          for (let i = 0; i < 12; i += 1) {
            const img = document.createElement('img');
            img.src = estrella;
            img.alt = '';
            img.className = 'osu-chispa osu-chispa--fija';
            img.style.left = `${r.left + r.width / 2}px`;
            img.style.top = `${r.top + r.height / 2}px`;
            img.style.width = '28px';
            rootEl.appendChild(img);

            const a = (Math.PI * 2 * i) / 12;
            gsap.fromTo(
              img,
              { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
              {
                x: Math.cos(a) * 150,
                y: Math.sin(a) * 150,
                scale: 0.2,
                opacity: 0,
                rotation: 200,
                duration: 0.9,
                ease: 'power2.out',
                onComplete: () => img.remove(),
              }
            );
          }
        });
      }
    }, root);

    return () => ctx.revert();
  }, [fase, res]);

  const empezar = () => api.current.empezar?.();
  const salir = () => api.current.salir?.();

  return (
    <div
      className="osu"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Reto de ritmo: cry"
      data-no-sonar="true"
      data-piano="true"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        /* Botón de salir: la estrella roja ES el botón (sin fondo, borde ni sombra) */
        .osu-star-cerrar {
          flex: none;
          display: block;
          width: clamp(44px, 6vw, 64px);
          padding: 0;
          border: 0;
          border-radius: 0;
          background: none;
          box-shadow: none;
          cursor: pointer;
          pointer-events: auto; /* el HUD tiene pointer-events: none */
          transition: transform .25s cubic-bezier(.34, 1.56, .64, 1), filter .25s;
        }
        .osu-star-cerrar img {
          display: block;
          width: 100%;
          height: auto;
          pointer-events: none;
          user-select: none;
        }
        .osu-star-cerrar:hover,
        .osu-star-cerrar:focus-visible {
          transform: scale(1.15) rotate(20deg);
          filter: drop-shadow(0 0 10px rgba(255, 210, 63, .9));
          outline: none;
        }
        .osu-star-cerrar:active { transform: scale(.9) rotate(-10deg); }

        /* ───────── Acentos rojos (como la estrella) ───────── */
        .osu {
          --o-rojo: #f73b44;
          --o-rojo-claro: #ff4d57;
        }
        /* barra de vida roja */
        .osu__vida-fill {
          background:
            radial-gradient(circle, rgba(255, 255, 255, .35) 1.2px, transparent 1.6px) 0 0 / 8px 8px,
            linear-gradient(180deg, #ff8a90, var(--o-rojo));
        }
        /* título: c-r-y en cian, oro y rojo */
        .osu-letra:nth-child(3) { color: var(--o-rojo-claro); }
        /* discos de decoración */
        .osu-deco--c { border-color: rgba(255, 90, 98, .65); }
        /* botón secundario (Salir) rojo */
        .osu-btn--sec {
          background: var(--o-rojo);
          color: #fff;
          text-shadow: 0 2px 0 rgba(43, 26, 26, .5);
        }
        /* puntos de decoración del campo con un toque rojo en el borde de la tarjeta */
        .osu-card { box-shadow: 0 6px 0 rgba(224, 38, 47, .55), 0 14px 30px rgba(0, 0, 0, .35); }
      `}</style>

      {/* Decoración de fondo */}
      <div className="osu__aros" ref={aros} aria-hidden="true" />
      <img className="osu-deco osu-deco--estrella osu-deco--a" src={estrella} alt="" aria-hidden="true" draggable="false" />
      <img className="osu-deco osu-deco--estrella osu-deco--b" src={estrella} alt="" aria-hidden="true" draggable="false" />
      <span className="osu-deco osu-deco--disco osu-deco--c" aria-hidden="true" />
      <span className="osu-deco osu-deco--disco osu-deco--d" aria-hidden="true" />

      {/* HUD */}
      <header className="osu__hud">
        <button type="button" className="osu-star-cerrar" aria-label="Salir del reto" onClick={salir}>
          <img src={stared} alt="" aria-hidden="true" draggable="false" />
        </button>

        <div className={'osu__barras' + (fase === 'menu' ? ' is-oculto' : '')} aria-hidden="true">
          <div className="osu__vida">
            <div className="osu__vida-fill" ref={vidaEl} />
          </div>
          <div className="osu__prog">
            <div className="osu__prog-fill" ref={progEl} />
          </div>
        </div>

        <div className={'osu__stats' + (fase === 'menu' ? ' is-oculto' : '')} aria-hidden="true">
          <div className="osu__score" ref={scoreEl}>
            0000000
          </div>
          <div className="osu__acc" ref={accEl}>
            100.00%
          </div>
        </div>
      </header>

      {/* Campo de juego */}
      <div className="osu__zona">
        <div className={'osu__campo' + (fase === 'jugando' ? '' : ' is-atenuado')} ref={campo}>
          <div className="osu__capa" ref={capa} />
        </div>
      </div>

      <div className={'osu__combo' + (fase === 'menu' ? ' is-oculto' : '')} ref={comboEl} aria-hidden="true" />
      <div className="osu__cuenta" ref={cuentaEl} aria-hidden="true" />

      {/* MENÚ */}
      {fase === 'menu' && (
        <section className="osu-card">
          <p className="osu-card__tag">Reto de ritmo</p>
          <h2 className="osu-title" aria-label="cry">
            {'cry'.split('').map((l, i) => (
              <span key={i} className="osu-letra" aria-hidden="true">
                {l}
              </span>
            ))}
          </h2>

          <ul className="osu-reglas">
            <li>Haz clic (o pulsa Z / X) sobre cada círculo justo cuando el aro blanco lo alcance.</li>
            <li>
              Cuanto más exacto: <b className="osu-oro">300</b> · <b className="osu-cian">100</b> · 50.
            </li>
            <li>Si fallas pierdes vida. Esc para salir.</li>
            <li>
              Consigue <b className="osu-oro">{ACIERTOS_DESBLOQUEO} aciertos</b> para desbloquear esta
              canción en <i>Mis canciones</i>.
            </li>
          </ul>

          <div className="osu-botones">
            <button type="button" className="osu-btn" onClick={empezar} disabled={cargando}>
              {cargando ? 'Cargando…' : '¡Jugar!'}
            </button>
            <button type="button" className="osu-btn osu-btn--sec" onClick={salir}>
              Salir
            </button>
          </div>
        </section>
      )}

      {/* RESULTADOS */}
      {fase === 'fin' && res && (
        <section className="osu-card osu-card--fin">
          <p className="osu-card__tag">{res.completo ? '¡Terminaste la canción!' : 'Se acabó la música'}</p>

          <div className="osu-fin">
            <div className="osu-fin__datos">
              <div className="osu-fila osu-fila--grande">
                <span>Puntos</span>
                <b className="osu-fin-score">0000000</b>
              </div>
              <div className="osu-fila">
                <span>Precisión</span>
                <b className="osu-fin-acc">0.00%</b>
              </div>
              <div className="osu-fila">
                <span>Combo máx.</span>
                <b>{res.maxCombo}x</b>
              </div>
              <div className="osu-fila osu-fila--juicios">
                <span className="osu-oro">300 · {res.n300}</span>
                <span className="osu-cian">100 · {res.n100}</span>
                <span>50 · {res.n50}</span>
                <span className="osu-rojo">✕ · {res.nFallo}</span>
              </div>
            </div>

            <div className="osu-rank" data-rank={res.rango} aria-label={`Rango ${res.rango}`}>
              {res.rango}
            </div>
          </div>

          {res.desbloqueada && (
            <p className="osu-desbloqueo">♪ «cry» desbloqueada en Mis canciones</p>
          )}

          <div className="osu-botones">
            <button type="button" className="osu-btn" onClick={empezar} disabled={cargando}>
              {cargando ? 'Cargando…' : 'Reintentar'}
            </button>
            <button type="button" className="osu-btn osu-btn--sec" onClick={salir}>
              Salir
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   BOTÓN que abre el reto
   · Sin hijos: muestra el botón amarillo "Reto de ritmo".
   · Con hijos: el hijo (por ejemplo la nota musical de Sobre mí)
     pasa a ser el botón que abre el reto.
   ========================================================= */

export default function OsuGame({ etiqueta = 'Reto de ritmo', children }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {children ? (
        <button
          type="button"
          className="osu-nota-btn"
          data-no-sonar="true"
          aria-haspopup="dialog"
          aria-label="Abrir el reto de ritmo: cry"
          onClick={() => setAbierto(true)}
        >
          {children}
          <span className="osu-hint" aria-hidden="true">
            ¡Juega!
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="osu-launch"
          data-no-sonar="true"
          aria-haspopup="dialog"
          onClick={() => setAbierto(true)}
        >
          <img src={estrella} alt="" aria-hidden="true" draggable="false" />
          <span>{etiqueta}</span>
          <small>cry</small>
        </button>
      )}

      {abierto && createPortal(<Juego onCerrar={() => setAbierto(false)} />, document.body)}
    </>
  );
}