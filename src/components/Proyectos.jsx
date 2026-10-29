import { useEffect, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import '../stylesheets/Proyectos.css';

// Audio compartido (un solo AudioContext) y cuerdas de la telaraña
import { motorAudio, midiAHz } from './Audiomotor.js';
import { sonidoCuerda } from './Proyectoscuerdasbloque.js';

// Espacio de Starbucks (pantalla completa, como Inlec)
import Starbucks from './Starbucks.jsx';

import fondo from '../assets/seccion4.png';
import circulo from '../assets/circulo.png';
import titulo from '../assets/proyectos.png';
import personaje from '../assets/personaje7.png';
import bafleAzul from '../assets/bafleblue.png';
import bafleRojo from '../assets/baflered.png';
import fuegoIzq from '../assets/fuego.png';
import fuegoDer from '../assets/fuegode.png';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------
// ESCENA 4: PROYECTOS
//
// Se renderiza DENTRO de <div className="frame frame--projects">
// del Hero. No lleva contenedor propio: cada pieza es una
// ".layer" con su ".in", igual que Multimedia, así comparte
// el tilt 3D, la cámara y la entrada con el scroll.
//
// Capas (de atrás hacia adelante, según data-z):
//   fondo → círculo → FUEGO (vivo) → BRASAS → BAFLES →
//   RED DE ARAÑA (hilos) → RAYOS con los proyectos → DJ
//
// Los proyectos NACEN del cuerpo del DJ: cada barra ("rayo") parte
// del mismo punto (ORIGEN) y se abre en abanico hacia afuera, en
// perspectiva 3D. Entre los rayos hay hilos que forman una red
// de araña. El DJ queda por delante, así que los rayos parecen
// salir de detrás de su cuerpo.
//
// AUDIO: el motor (motorAudio, midiAHz) vive en ./Audiomotor.js y las
// cuerdas de piano + guitarra en ./Proyectoscuerdasbloque.js. Aquí solo
// se importan, así hay un único AudioContext para toda la escena.
//
// STARBUCKS: el rayo "starbuck" tiene accion: 'starbucks'. Al hacer clic
// se abre <Starbucks /> (./Starbucks.jsx): un espacio propio a pantalla
// completa, igual que Inlec, con el carrusel de posts. Se cierra con
// "Volver" o con Esc. Mientras está abierto, la escena de atrás no
// reacciona (ver enStarbucks en el segundo useEffect).
//
// FUEGO VIVO + INTERACCIÓN (ver el segundo useEffect):
//   · Las llamas parpadean al azar (altura, ancho, inclinación),
//     tienen ondas de calor (distorsión) y un brillo que respira.
//   · Suben brasas que se apagan al subir.
//   · Mouse / dedo cerca de una llama: se intensifica y se inclina
//     alejándose del cursor (como si soplaras el fuego).
//   · Click en una llama: llamarada + lluvia de brasas.
//   · Click en un bafle: golpe de bajo (destello, onda, llamarada).
//   · Click en el DJ: "DROP" → todo el fuego explota, los hilos
//     de la telaraña se encienden y suben las brasas.
//   · Pasar el mouse por un proyecto: el fuego de ese lado reacciona.
//   · Los bafles marcan el ritmo y el fuego late con ellos.
//   · TÍTULO "Proyectos": entra con rebote, flota, le pasa un brillo
//     cada pocos segundos y de vez en cuando hace un guiño. Con el
//     mouse encima se inclina en 3D hacia el cursor; con click hace
//     gelatina, suelta chispas, una onda y un "ding" de arcade.
//   · TELARAÑA con FÍSICAS (ver crearRed): cada cruce de hilos es un
//     nodo unido por resortes. Se mece sola con una brisa; si pasas
//     el mouse la rozas y se enreda; con click vibra y resuena. Un
//     click sobre un hilo lo puntea y suena como PIANO + GUITARRA
//     ELÉCTRICA (cada hilo una nota). El golpe de los bafles, el
//     título y el DROP también la sacuden, y el DROP la toca como
//     un arpegio.
// ---------------------------------------------------------

// Para cambiar los proyectos edita estas dos listas
// (texto, href y, si quieres, azul: true para el rayo azul).
// accion: 'starbucks' hace que el clic abra la ventana en vez de navegar.
const IZQUIERDA = [{ texto: 'Reproductor', href: '#' }];

const DERECHA = [
  { texto: 'starbuck', href: '#', accion: 'starbucks' },
  { texto: 'Inlec', href: '#', azul: true },
  { texto: 'onikuma', href: '#' },
];

// ---------------------------------------------------------
// GEOMETRÍA (px de referencia; el lienzo mide 597 de ancho)
//
// ORIGEN  = punto del cuerpo del DJ de donde nacen todos los rayos.
//           Muévelo si el DJ cambia de lugar.
// ang     = dirección del rayo en grados. Derecha: negativo = sube.
//           Izquierda: positivo = sube.
// largo   = longitud del rayo (se ve ~25% más largo por la perspectiva)
// alto    = grosor del rayo en su extremo exterior
// z       = qué tanto flota el texto delante del rayo
//
// Los rayos se asignan en orden: el 1.º de cada lista de arriba
// usa la 1.ª configuración de abajo, y así.
// ---------------------------------------------------------
const ORIGEN = { x: 300, y: 462 };

const RAYOS_IZQ = [{ ang: 13, largo: 305, alto: 62, z: 30 }];

const RAYOS_DER = [
  { ang: -40, largo: 305, alto: 76, z: 34 },
  { ang: -24, largo: 300, alto: 58, z: 22 },
  { ang: -9, largo: 290, alto: 58, z: 38 },
];

// Red de araña: hilos extra (sin texto), en grados de pantalla
// (0 = derecha, -90 = arriba, 180 = izquierda)
const HILOS_EXTRA = [-148, -125, -102, -80, -60, 14];

// Distancias (desde el origen) donde van los hilos que unen los rayos
const RADIOS_RED = [70, 120, 175, 235, 300, 365];

const CIELO = 170;   // los hilos no suben más de este punto
const SUELO = 640;   // ni bajan más de este
const HILO_MAX = 340;

// ---------------------------------------------------------
// FUEGO (px de referencia, lienzo de 597 de ancho)
//
// cx      = centro horizontal de cada llama (de donde salen brasas)
// BRASA_Y = franja vertical donde nacen las brasas [arriba, abajo]
// BAFLE   = centro de cada bafle (para la onda del golpe)
// PALETA  = colores de las brasas
// ---------------------------------------------------------
const FUEGO_CX = { izq: 45, der: 565 };
const BRASA_Y = [470, 590];
const BAFLE_CENTRO = { izq: { x: 66, y: 570 }, der: { x: 529, y: 570 } };
const PALETA = ['#fff1a8', '#ffd34a', '#ff9a2e', '#ff5a1f'];
const MAX_BRASAS = 70;

// ---------- cálculo de la red (se hace una sola vez) ----------

const aRad = (g) => (g * Math.PI) / 180;

// Dirección de pantalla de cada rayo con texto
const angulosRayos = [
  ...RAYOS_IZQ.map((r) => {
    let g = 180 + r.ang;
    if (g > 180) g -= 360;
    return g;
  }),
  ...RAYOS_DER.map((r) => r.ang),
];

const angulosRed = [...angulosRayos, ...HILOS_EXTRA].sort((a, b) => a - b);

function largoHilo(g) {
  const dx = Math.cos(aRad(g));
  const dy = Math.sin(aRad(g));
  let t = HILO_MAX;

  if (dx > 1e-6) t = Math.min(t, (597 - ORIGEN.x) / dx);
  if (dx < -1e-6) t = Math.min(t, (0 - ORIGEN.x) / dx);
  if (dy < -1e-6) t = Math.min(t, (CIELO - ORIGEN.y) / dy);
  if (dy > 1e-6) t = Math.min(t, (SUELO - ORIGEN.y) / dy);

  return t;
}

const HILOS = angulosRed.map((g) => {
  const len = largoHilo(g);
  return {
    g,
    len,
    x: ORIGEN.x + len * Math.cos(aRad(g)),
    y: ORIGEN.y + len * Math.sin(aRad(g)),
  };
});

// Hilos "de captura": curvas que se hunden hacia el centro y unen
// cada par de hilos vecinos, como los de una telaraña de verdad.
const ARCOS = [];

for (let i = 0; i < HILOS.length - 1; i += 1) {
  const a = HILOS[i];
  const b = HILOS[i + 1];
  const delta = aRad(b.g - a.g);
  const medio = aRad((a.g + b.g) / 2);

  RADIOS_RED.forEach((r, ri) => {
    if (r > Math.min(a.len, b.len) * 0.97) return;

    const p1 = [
      ORIGEN.x + r * Math.cos(aRad(a.g)),
      ORIGEN.y + r * Math.sin(aRad(a.g)),
    ];
    const p2 = [
      ORIGEN.x + r * Math.cos(aRad(b.g)),
      ORIGEN.y + r * Math.sin(aRad(b.g)),
    ];

    // punto de control: más cerca del centro que la cuerda (se "cuelga")
    const rc = r * Math.cos(delta / 2) * 0.86;
    const c = [ORIGEN.x + rc * Math.cos(medio), ORIGEN.y + rc * Math.sin(medio)];

    // i = hilo de la izquierda · ri = en qué anillo está (para las físicas)
    ARCOS.push({
      i,
      ri,
      d: `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
    });
  });
}

// ---------------------------------------------------------

// onActivar: función extra que se llama al hacer clic (la usa "starbuck"
// para abrir su ventana).
function Enlace({ texto, href = '#', onActivar, ...resto }) {
  return (
    <a
      className="pj-enlace"
      href={href}
      data-no-sonar="true"
      onClick={(e) => {
        // con href="#" no saltes al inicio de la página
        if (href === '#') e.preventDefault();
        if (onActivar) onActivar();
      }}
      {...resto}
    >
      {texto}
    </a>
  );
}

// Un rayo = forma negra (con grosor) + enlace flotando delante
function Rayo({ lado, proyecto, config, onAbrir }) {
  const { texto, href, azul, accion } = proyecto;

  return (
    <div
      className={
        'pj-rayo pj-rayo--' + lado + (azul ? ' pj-rayo--azul' : '')
      }
      style={{
        '--ox': ORIGEN.x,
        '--oy': ORIGEN.y,
        '--largo': config.largo,
        '--h': config.alto,
        '--ang': `${config.ang}deg`,
      }}
    >
      <span className="pj-rayo__forma" aria-hidden="true" />
      <Enlace
        texto={texto}
        href={href}
        style={{ '--z': config.z }}
        onActivar={accion && onAbrir ? () => onAbrir(accion) : undefined}
      />
    </div>
  );
}

// Una llama = imagen + brillo (copia borrosa que respira) + destello
// (resplandor que solo se enciende con las interacciones).
// El filtro de ondas de calor se aplica sobre el ".pj-llama".
function Llama({ src }) {
  return (
    <span className="pj-llama">
      <img className="pj-llama__img" src={src} alt="" draggable="false" />
      <img
        className="pj-llama__brillo"
        src={src}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <span className="pj-llama__destello" aria-hidden="true" />
    </span>
  );
}

// ---------------------------------------------------------
// SONIDO DE BAFLE (sintetizado con Web Audio, sin archivos)
//
// El motor de audio (motorAudio) vive en ./Audiomotor.js.
//
// Cada click en un bafle "golpea" el cono:
//   · cuerpo   → seno que cae de agudo a grave (el "bum")
//   · saturación → le da punch, como un parlante exigido
//   · armónico → triángulo al doble de frecuencia (el cono vibrando)
//   · chasquido → ráfaga corta de ruido filtrado (el ataque)
// El bafle azul (izq) es más grave y largo; el rojo (der) más
// seco y agudo, tipo tom. Cada golpe varía un poco, así no suena
// idéntico siempre.
//
// Para cambiar el carácter edita los números de sonidoBafle():
//   f0 / f1 → de qué frecuencia cae y a cuál llega (Hz)
//   duración del cuerpo → los .7 (izq) y .45 (der)
//   VOLUMEN → master.gain.value (en Audiomotor.js)
// ---------------------------------------------------------
function sonidoBafle(lado) {
  const a = motorAudio();
  if (!a) return null;

  // cada click también suma una capa a la canción (ver más abajo)
  const progreso = subirNivel(a, lado);

  const { ctx, master, buf, curva } = a;
  const t = ctx.currentTime;
  const izq = lado === 'izq';
  const azar = 1 + (Math.random() - 0.5) * 0.05;

  const f0 = (izq ? 150 : 210) * azar;
  const f1 = izq ? 42 : 58;

  // salida con paneo: el bafle azul suena a la izquierda, el rojo a la derecha
  const salida = ctx.createGain();
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = izq ? -0.6 : 0.6;
    salida.connect(pan);
    pan.connect(master);
  } else {
    salida.connect(master);
  }

  // cuerpo: seno que cae de agudo a grave + saturación
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + 0.22);

  const sat = ctx.createWaveShaper();
  sat.curve = curva;
  sat.oversample = '2x';

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (izq ? 0.7 : 0.45));

  osc.connect(sat);
  sat.connect(g);
  g.connect(salida);
  osc.start(t);
  osc.stop(t + 0.8);

  // armónico: el cono vibrando (triángulo al doble de frecuencia)
  const arm = ctx.createOscillator();
  arm.type = 'triangle';
  arm.frequency.setValueAtTime(f0 * 2, t);
  arm.frequency.exponentialRampToValueAtTime(f1 * 2, t + 0.15);

  const ga = ctx.createGain();
  ga.gain.setValueAtTime(0.25, t);
  ga.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  arm.connect(ga);
  ga.connect(salida);
  arm.start(t);
  arm.stop(t + 0.25);

  // chasquido del ataque: ruido filtrado muy corto
  const ruido = ctx.createBufferSource();
  ruido.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = izq ? 1800 : 3200;
  bp.Q.value = 0.8;

  const gr = ctx.createGain();
  gr.gain.setValueAtTime(0.35, t);
  gr.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

  ruido.connect(bp);
  bp.connect(gr);
  gr.connect(salida);
  ruido.start(t);

  return progreso;
}

// ---------------------------------------------------------
// CANCIÓN QUE SE CONSTRUYE CON LOS CLICS
//
// Cada click en un bafle desbloquea una capa nueva y el ritmo
// arranca solo (120 BPM, Am – F – C – G, 4 compases en bucle).
// Los dos bafles se reparten la canción:
//
//   BAFLE AZUL (izq) = RITMO
//     1 clic  → bombo
//     2 clics → hi-hat
//     3 clics → palmada (tiempos 2 y 4)
//     4 clics → ritmo completo (bombo extra + hi-hat rápido)
//
//   BAFLE ROJO (der) = MELODÍA
//     1 clic  → bajo
//     2 clics → acordes
//     3 clics → arpegio
//     4 clics → brillo (octava arriba)
//
// Cuando los DOS llegan al nivel 4: suena un platillo y se dispara
// el DROP en pantalla. Más clics con una capa ya completa
// hacen un "relleno" de palmadas.
// Si dejas de tocar ~9 s, la canción se apaga sola y se reinicia.
//
// NIVEL_MAX    → cuántas capas tiene cada bafle
// SILENCIO_MS  → cuánto espera sin clics antes de apagarse
// BPM          → velocidad (los bafles pulsan a 120)
// ---------------------------------------------------------
const BPM = 120;
const PASO = 60 / BPM / 4; // una semicorchea, en segundos
const NIVEL_MAX = 4;
const SILENCIO_MS = 9000;

// bajo = nota grave del compás · notas = acorde (números MIDI)
const ACORDES = [
  { bajo: 33, notas: [57, 60, 64] }, // Am
  { bajo: 29, notas: [53, 57, 60] }, // F
  { bajo: 36, notas: [55, 60, 64] }, // C
  { bajo: 31, notas: [55, 59, 62] }, // G
];

const cancion = {
  activa: false,
  cerrando: false,
  completa: false,
  paso: 0,
  proximo: 0,
  timer: null,
  cierre: null,
  ultimoClick: 0,
  nivel: { izq: 0, der: 0 },
  onPaso: null, // la escena se engancha aquí para que el fuego lata
};

// ---------- instrumentos ----------

function ruidoFiltrado(a, t, tipo, freq, q, vol, dur) {
  const { ctx, bus, buf } = a;

  const n = ctx.createBufferSource();
  n.buffer = buf;
  n.loop = true;

  const f = ctx.createBiquadFilter();
  f.type = tipo;
  f.frequency.value = freq;
  f.Q.value = q;

  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  n.connect(f);
  f.connect(g);
  g.connect(bus);
  n.start(t);
  n.stop(t + dur + 0.02);
}

function bombo(a, t) {
  const { ctx, bus } = a;

  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.35);
}

const hihat = (a, t, vol = 0.18) => ruidoFiltrado(a, t, 'highpass', 7000, 0.7, vol, 0.045);

function palmada(a, t) {
  // tres golpecitos seguidos + cola: suena a palmada
  ruidoFiltrado(a, t, 'bandpass', 1500, 1, 0.45, 0.02);
  ruidoFiltrado(a, t + 0.012, 'bandpass', 1500, 1, 0.45, 0.02);
  ruidoFiltrado(a, t + 0.024, 'bandpass', 1500, 1, 0.5, 0.14);
}

function platillo(a, t) {
  ruidoFiltrado(a, t, 'highpass', 5000, 0.6, 0.5, 1.3);
}

// nota con filtro que se cierra (sirve para bajo, acordes y arpegio)
function tono(a, t, midi, dur, tipo, vol, corte, detune = 0) {
  const { ctx, bus } = a;

  const o = ctx.createOscillator();
  o.type = tipo;
  o.frequency.value = midiAHz(midi);
  o.detune.value = detune;

  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(corte, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(120, corte * 0.3), t + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(f);
  f.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// ---------- secuenciador ----------

function tocarPaso(a, p, t) {
  const { ctx } = a;
  const s = p % 16; // paso dentro del compás
  const ac = ACORDES[Math.floor(p / 16) % 4];
  const ni = cancion.nivel.izq;
  const nd = cancion.nivel.der;

  // avisa a la escena (en el momento exacto en que suena)
  const avisar = (lado) => {
    const ms = Math.max(0, (t - ctx.currentTime) * 1000);
    setTimeout(() => {
      if (cancion.activa && cancion.onPaso) cancion.onPaso(lado);
    }, ms);
  };

  // ----- RITMO (bafle azul) -----
  if (ni >= 1 && s % 4 === 0) {
    bombo(a, t);
    avisar('izq');
  }
  if (ni >= 4 && s === 10) bombo(a, t);
  if (ni >= 2 && s % 4 === 2) hihat(a, t);
  if (ni >= 4 && s % 2 === 1) hihat(a, t, 0.08);
  if (ni >= 3 && (s === 4 || s === 12)) palmada(a, t);

  // ----- MELODÍA (bafle rojo) -----
  if (nd >= 1 && s % 2 === 0) {
    const octava = s % 8 === 6 ? 12 : 0;
    const acento = s === 0 ? 1.25 : 1;
    tono(a, t, ac.bajo + octava, PASO * 1.7, 'sawtooth', 0.28 * acento, 500);
    tono(a, t, ac.bajo + octava, PASO * 1.7, 'sine', 0.35 * acento, 400);
    if (s % 4 === 2) avisar('der');
  }
  if (nd >= 2 && (s === 0 || s === 8)) {
    ac.notas.forEach((n, i) => {
      tono(a, t, n, PASO * 7, 'sawtooth', 0.06, 1400, i % 2 ? 7 : -7);
    });
  }
  if (nd >= 3 && s % 2 === 0) {
    const idx = (s >> 1) % 4;
    const nota = ac.notas[[0, 1, 2, 1][idx]] + 12;
    tono(a, t, nota, PASO * 1.5, 'triangle', 0.14, 3500);
    if (nd >= 4) tono(a, t, nota + 12, PASO * 1.2, 'square', 0.04, 4500);
  }
  if (nd >= 4 && s % 4 === 3) {
    tono(a, t, ac.notas[2] + 24, PASO * 1.2, 'triangle', 0.08, 5000);
  }
}

function planificar(a) {
  const { ctx, bus } = a;

  // programa los pasos que caen en los próximos 120 ms
  while (cancion.proximo < ctx.currentTime + 0.12) {
    tocarPaso(a, cancion.paso, cancion.proximo);
    cancion.proximo += PASO;
    cancion.paso = (cancion.paso + 1) % 64;
  }

  // si dejaron de tocar, se apaga con un fade
  if (!cancion.cerrando && performance.now() - cancion.ultimoClick > SILENCIO_MS) {
    cancion.cerrando = true;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    cancion.cierre = setTimeout(detenerCancion, 1300);
  }
}

function detenerCancion() {
  clearInterval(cancion.timer);
  clearTimeout(cancion.cierre);

  cancion.activa = false;
  cancion.cerrando = false;
  cancion.completa = false;
  cancion.timer = null;
  cancion.cierre = null;
  cancion.nivel = { izq: 0, der: 0 };
}

// Un click en un bafle: sube su nivel y devuelve qué pasó
function subirNivel(a, lado) {
  const { ctx, bus } = a;

  cancion.ultimoClick = performance.now();

  // si se estaba apagando y vuelven a tocar, se cancela el fade
  if (cancion.cierre) {
    clearTimeout(cancion.cierre);
    cancion.cierre = null;
  }
  if (cancion.cerrando || !cancion.activa) {
    cancion.cerrando = false;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0.7, ctx.currentTime);
  }

  // primer click: arranca el ritmo
  if (!cancion.activa) {
    cancion.activa = true;
    cancion.paso = 0;
    cancion.proximo = ctx.currentTime + 0.06;
    cancion.timer = setInterval(() => planificar(a), 25);
  }

  let desbloqueo = false;
  let relleno = false;

  if (cancion.nivel[lado] < NIVEL_MAX) {
    cancion.nivel[lado] += 1;
    desbloqueo = true;
  } else {
    // capa completa: relleno de palmadas
    relleno = true;
    for (let i = 0; i < 3; i += 1) palmada(a, ctx.currentTime + i * 0.07);
  }

  // los dos bafles al máximo: ¡platillo!
  const completa =
    !cancion.completa &&
    cancion.nivel.izq >= NIVEL_MAX &&
    cancion.nivel.der >= NIVEL_MAX;

  if (completa) {
    cancion.completa = true;
    platillo(a, ctx.currentTime + 0.02);
  }

  return { nivel: cancion.nivel[lado], desbloqueo, relleno, completa };
}

// ---------------------------------------------------------
// FÍSICAS DE LA TELARAÑA
//
// Cada cruce entre un hilo y un anillo es un NODO con masa. Los
// nodos están unidos por RESORTES (a lo largo de cada hilo y entre
// hilos vecinos). El centro (el DJ) y las puntas de los hilos están
// fijos. Cada nodo también es jalado suavemente a su posición de
// reposo, así que la red siempre vuelve a su forma.
//
// Con eso la red hace sola:
//   · vibrar y resonar después de un golpe (se va apagando)
//   · propagar las ondas de un hilo a los vecinos
//   · mecerse con una brisa suave
//
// AJUSTES (prueba valores):
//   K_RADIAL → rigidez a lo largo de los hilos (más = más tensos)
//   K_ARCO   → rigidez de los hilos que los unen
//   K_CASA   → qué tan rápido vuelve a su forma
//   AMORT    → cuánto dura la vibración (0.99 = dura mucho · 0.95 = corta)
//   VIENTO   → fuerza de la brisa (0 = quieta)
// El dibujo se actualiza en el atributo "d" de los mismos <path>
// que pinta React, así que la animación de entrada sigue igual.
// ---------------------------------------------------------
const K_RADIAL = 0.2;
const K_ARCO = 0.12;
const K_CASA = 0.02;
const AMORT = 0.987;
const VIENTO = 1.5;
const PASO_FISICA = 1 / 60;

function distSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1e-6;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function crearRed(frame, activo) {
  const svg = frame.querySelector('.pj-red__svg');
  const pathsH = Array.from(frame.querySelectorAll('.pj-red__hilos path'));
  const pathsA = Array.from(frame.querySelectorAll('.pj-red__arcos path'));

  if (!svg || pathsH.length !== HILOS.length || pathsA.length !== ARCOS.length) {
    return null;
  }

  const nodo = (x, y, fijo) => ({
    x,
    y,
    rx: x,
    ry: y,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    fijo,
    ph: 0,
  });

  // ---------- nodos ----------
  const libres = [];

  const cadenas = HILOS.map((h, i) => {
    const nodos = [nodo(ORIGEN.x, ORIGEN.y, true)]; // el DJ: fijo
    const porRi = {};

    RADIOS_RED.forEach((r, ri) => {
      if (r > h.len * 0.97) return;

      const n = nodo(
        ORIGEN.x + r * Math.cos(aRad(h.g)),
        ORIGEN.y + r * Math.sin(aRad(h.g)),
        false
      );
      n.ph = i * 0.6 + ri * 0.9; // desfase de la brisa
      nodos.push(n);
      porRi[ri] = n;
      libres.push(n);
    });

    nodos.push(nodo(h.x, h.y, true)); // la punta: fija
    return { nodos, porRi };
  });

  const arcos = ARCOS.map((ar, k) => ({
    A: cadenas[ar.i].porRi[ar.ri],
    B: cadenas[ar.i + 1].porRi[ar.ri],
    ri: ar.ri,
    path: pathsA[k],
  })).filter((ar) => ar.A && ar.B);

  // ---------- resortes ----------
  const muelles = [];

  const unir = (a, b, k) => {
    if (a.fijo && b.fijo) return;
    muelles.push({ a, b, k, largo: Math.hypot(a.rx - b.rx, a.ry - b.ry) });
  };

  cadenas.forEach((c) => {
    for (let n = 0; n < c.nodos.length - 1; n += 1) {
      unir(c.nodos[n], c.nodos[n + 1], K_RADIAL);
    }
  });

  arcos.forEach((ar) => unir(ar.A, ar.B, K_ARCO));

  // ---------- un paso de simulación ----------
  const paso = (t) => {
    libres.forEach((n) => {
      // vuelve a su forma + brisa suave
      n.fx = (n.rx - n.x) * K_CASA + Math.sin(t * 1.7 + n.ph) * VIENTO * 0.1;
      n.fy = (n.ry - n.y) * K_CASA + Math.cos(t * 1.3 + n.ph * 1.7) * VIENTO * 0.1;
    });

    muelles.forEach((m) => {
      const dx = m.b.x - m.a.x;
      const dy = m.b.y - m.a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const f = (d - m.largo) * m.k;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;

      if (!m.a.fijo) {
        m.a.fx += fx;
        m.a.fy += fy;
      }
      if (!m.b.fijo) {
        m.b.fx -= fx;
        m.b.fy -= fy;
      }
    });

    libres.forEach((n) => {
      n.vx = (n.vx + n.fx) * AMORT;
      n.vy = (n.vy + n.fy) * AMORT;
      n.x += n.vx;
      n.y += n.vy;
    });
  };

  // ---------- dibujo ----------
  const f1 = (v) => v.toFixed(1);

  // Hilo suave que pasa por los nodos (recto cuando está en reposo)
  const trazoCadena = (nn) => {
    const m = nn.length;
    let d = `M${f1(nn[0].x)} ${f1(nn[0].y)}L${f1((nn[0].x + nn[1].x) / 2)} ${f1(
      (nn[0].y + nn[1].y) / 2
    )}`;

    for (let i = 1; i < m - 1; i += 1) {
      const p = nn[i];
      const q = nn[i + 1];
      d += `Q${f1(p.x)} ${f1(p.y)} ${f1((p.x + q.x) / 2)} ${f1((p.y + q.y) / 2)}`;
    }

    return `${d}L${f1(nn[m - 1].x)} ${f1(nn[m - 1].y)}`;
  };

  const dibujar = () => {
    cadenas.forEach((c, i) => pathsH[i].setAttribute('d', trazoCadena(c.nodos)));

    arcos.forEach((ar) => {
      // el punto de control "cuelga" hacia el centro, igual que en reposo
      const mx = (ar.A.x + ar.B.x) / 2;
      const my = (ar.A.y + ar.B.y) / 2;
      const cx = ORIGEN.x + (mx - ORIGEN.x) * 0.86;
      const cy = ORIGEN.y + (my - ORIGEN.y) * 0.86;

      ar.path.setAttribute(
        'd',
        `M${f1(ar.A.x)} ${f1(ar.A.y)}Q${f1(cx)} ${f1(cy)} ${f1(ar.B.x)} ${f1(ar.B.y)}`
      );
    });
  };

  // ---------- bucle (paso fijo de 1/60 s en cualquier pantalla) ----------
  let acc = 0;
  let tiempo = 0;

  const tick = (_t, dtMs) => {
    if (!activo()) return;

    acc += Math.min(dtMs, 50) / 1000;

    let pasos = 0;
    while (acc >= PASO_FISICA && pasos < 4) {
      paso(tiempo);
      tiempo += PASO_FISICA;
      acc -= PASO_FISICA;
      pasos += 1;
    }
    if (acc > PASO_FISICA) acc = 0;

    if (pasos) dibujar();
  };

  gsap.ticker.add(tick);

  // ---------- API ----------

  // pantalla (px) → coordenadas de la telaraña (lienzo de 597 × 881)
  const aSvg = (cx, cy) => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: ((cx - r.left) * 597) / r.width, y: ((cy - r.top) * 881) / r.height };
  };

  // Golpe: empuja los nodos cercanos hacia afuera del punto (x, y)
  const impulso = (x, y, fuerza = 4, R = 110) => {
    libres.forEach((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      const d = Math.hypot(dx, dy);
      const f = Math.exp(-(d * d) / (R * R));
      if (f < 0.02) return;

      const ux = d > 1e-3 ? dx / d : Math.random() - 0.5;
      const uy = d > 1e-3 ? dy / d : Math.random() - 0.5;

      n.vx += ux * fuerza * f;
      n.vy += uy * fuerza * f;
    });
  };

  // Roce: el mouse arrastra los hilos por los que pasa
  const arrastre = (x, y, vx, vy, R = 40) => {
    libres.forEach((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      const f = Math.exp(-(dx * dx + dy * dy) / (R * R));
      if (f < 0.05) return;

      n.vx += vx * 0.15 * f;
      n.vy += vy * 0.15 * f;
    });
  };

  // Hilo (o arco) más cercano a un punto, para saber cuál puntear
  const cerca = (x, y) => {
    let mejor = null;

    cadenas.forEach((c, i) => {
      for (let n = 0; n < c.nodos.length - 1; n += 1) {
        const a = c.nodos[n];
        const b = c.nodos[n + 1];
        const d = distSegmento(x, y, a.x, a.y, b.x, b.y);
        if (!mejor || d < mejor.dist) mejor = { i, dist: d };
      }
    });

    arcos.forEach((ar) => {
      const d = distSegmento(x, y, ar.A.x, ar.A.y, ar.B.x, ar.B.y);
      if (!mejor || d < mejor.dist) mejor = { i: ar.ri * 2 + 1, dist: d };
    });

    return mejor;
  };

  const destruir = () => gsap.ticker.remove(tick);

  return { aSvg, impulso, arrastre, cerca, destruir };
}

const configDe = (lista, i) => lista[Math.min(i, lista.length - 1)];

// "Ding" de arcade para el click en el título: dos notas cuadradas
// seguidas (una nota al azar de la escala pentatónica + su quinta).
const NOTAS_TITULO = [659.25, 783.99, 880, 987.77, 1174.66];

function sonidoTitulo() {
  const a = motorAudio();
  if (!a) return;

  const { ctx, master } = a;
  const t = ctx.currentTime;
  const f = NOTAS_TITULO[Math.floor(Math.random() * NOTAS_TITULO.length)];

  [f, f * 1.5].forEach((hz, i) => {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = hz;

    const g = ctx.createGain();
    const ti = t + i * 0.07;
    g.gain.setValueAtTime(0.0001, ti);
    g.gain.exponentialRampToValueAtTime(0.12, ti + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.16);

    o.connect(g);
    g.connect(master);
    o.start(ti);
    o.stop(ti + 0.2);
  });
}

// (sonidoCuerda — piano + guitarra eléctrica — se importa desde
//  ./Proyectoscuerdasbloque.js)

export default function Proyectos({ izquierda = IZQUIERDA, derecha = DERECHA }) {
  // Espacio abierto ahora mismo: 'starbucks' o null
  const [ventana, setVentana] = useState(null);

  // ---------------------------------------------------------
  // APARICIÓN TIPO VIDEOJUEGO: la telaraña sale del DJ
  //
  // Cuando la escena entra en pantalla:
  //   1. Los hilos radiales se disparan desde el cuerpo del DJ
  //      hacia afuera (como lanzar telaraña).
  //   2. Los rayos se estiran desde el DJ hasta su largo completo,
  //      con un pequeño rebote.
  //   3. Los hilos que los unen se tejen, de adentro hacia afuera.
  //   4. Los bafles rebotan, el fuego se enciende desde abajo y cada
  //      proyecto aparece con barrido "pixelado" (como un menú de arcade).
  // Al salir de pantalla se reinicia, así se repite al volver.
  //
  // Solo anima hilos, formas, enlaces, llamas y bafles (no el ".in"
  // de cada capa, que ya lo anima el Hero con el scroll).
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (reduce) return undefined;

    const ctx = gsap.context(() => {
      const q = (sel) => gsap.utils.toArray(`.frame--projects ${sel}`);

      const hilos = q('.pj-red__hilos path');
      const arcos = q('.pj-red__arcos path');
      const formas = q('.pj-rayo__forma');
      const linksIzq = q('.pj-rayo--izq .pj-enlace');
      const linksDer = q('.pj-rayo--der .pj-enlace');
      const bafles = q('.pj-bafle .in img');
      const llamas = q('.pj-llama');
      const tituloEnt = q('.pj-titulo__ent');

      if (!formas.length) return;

      const tl = gsap.timeline({ paused: true });

      // 1) Hilos radiales: salen del cuerpo del DJ hacia afuera
      tl.fromTo(
        hilos,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.03,
          clearProps: 'strokeDasharray,strokeDashoffset',
        },
        0
      )

        // 2) Los rayos se estiran desde el DJ (cada uno desde su raíz)
        .fromTo(
          formas,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.55,
            ease: 'back.out(1.7)',
            stagger: 0.09,
            clearProps: 'transform',
          },
          0.12
        )

        // 3) Hilos de captura: se tejen de adentro hacia afuera
        .fromTo(
          arcos,
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 0.35,
            ease: 'power1.out',
            stagger: 0.025,
            clearProps: 'strokeDasharray,strokeDashoffset',
          },
          0.35
        )

        // 4a) Los bafles rebotan con el golpe
        .fromTo(
          bafles,
          { y: 16 },
          { y: 0, duration: 0.6, ease: 'bounce.out', stagger: 0.12 },
          0.5
        )

        // 3b) El título entra con rebote (pop + giro)
        .fromTo(
          tituloEnt,
          { scale: 0, rotation: -14, opacity: 0, y: 30, transformOrigin: '50% 50%' },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(2)',
            clearProps: 'transform,opacity',
          },
          0.3
        )

        // 4b) El fuego se enciende desde la base
        .fromTo(
          llamas,
          { scaleY: 0, opacity: 0 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.7,
            ease: 'back.out(1.6)',
            stagger: 0.1,
            clearProps: 'transform,opacity',
          },
          0.55
        )

        // 4c) Los proyectos aparecen con barrido pixelado, uno por uno
        //     (solo opacidad + barrido: el transform del enlace lleva
        //     su profundidad 3D y no se toca)
        .fromTo(
          linksIzq,
          { clipPath: 'inset(-20% 100% -20% -10%)', opacity: 0 },
          {
            clipPath: 'inset(-20% -10% -20% -10%)',
            opacity: 1,
            duration: 0.42,
            ease: 'steps(6)',
            stagger: 0.16,
            clearProps: 'clipPath,opacity',
          },
          0.6
        )
        .fromTo(
          linksDer,
          { clipPath: 'inset(-20% 100% -20% -10%)', opacity: 0 },
          {
            clipPath: 'inset(-20% -10% -20% -10%)',
            opacity: 1,
            duration: 0.42,
            ease: 'steps(6)',
            stagger: 0.18,
            clearProps: 'clipPath,opacity',
          },
          0.78
        );

      // Se dispara cuando un rayo entra bien en pantalla
      // (mide la posición real, así funciona con la cámara 3D del Hero)
      const objetivo = document.querySelector('.frame--projects .pj-rayo--der');
      if (!objetivo || typeof IntersectionObserver === 'undefined') {
        tl.progress(1);
        return;
      }

      let jugado = false;

      const io = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((e) => {
            if (e.intersectionRatio >= 0.6 && !jugado) {
              jugado = true;
              tl.restart();
            } else if (!e.isIntersecting && jugado) {
              jugado = false;
              tl.pause(0);
            }
          });
        },
        { threshold: [0, 0.6] }
      );

      io.observe(objetivo);

      return () => io.disconnect();
    });

    return () => ctx.revert();
  }, []);

  // ---------------------------------------------------------
  // MOVIMIENTO CONTINUO + FUEGO VIVO + INTERACCIÓN
  //
  // Solo anima las imágenes internas (no toca el ".in" que anima
  // el Hero al hacer scroll).
  //
  // Reglas para no pelear entre animaciones:
  //   · ".pj-llama__img"      → solo el parpadeo continuo
  //   · ".pj-llama"           → solo llamaradas (click / hover / ritmo)
  //   · ".pj-llama__brillo"   → solo el brillo que respira
  //   · ".pj-llama__destello" → solo los destellos de interacción
  // ---------------------------------------------------------
  useEffect(() => {
    if (reduce) return undefined;

    const frame = document.querySelector('.frame--projects');
    if (!frame) return undefined;

    const $ = (sel) => frame.querySelector(sel);
    const rand = gsap.utils.random;
    const clamp = gsap.utils.clamp;

    const caja = $('.pj-brasas .in');
    const turb = document.getElementById('pj-llama-turb');
    const desp = document.getElementById('pj-llama-desp');
    const dj = $('.pj-personaje .in img');

    // Título "Proyectos"
    //   tMov    → interacción (inclinación 3D, escala, gelatina)
    //   tCuerpo → flotar continuo
    //   tImg    → solo para medir dónde está el mouse
    //   tBrillo → barrido de luz
    const tMov = $('.pj-titulo__mov');
    const tCuerpo = $('.pj-titulo__cuerpo');
    const tImg = $('.pj-titulo__cuerpo img');
    const tBrillo = $('.pj-titulo__brillo');
    const hayTitulo = !!(tMov && tCuerpo && tImg && tBrillo);

    let sobreTitulo = false;
    let tRY = null;
    let tRX = null;

    if (hayTitulo) {
      gsap.set(tMov, { transformPerspective: 700, transformOrigin: '50% 50%' });
      tRY = gsap.quickTo(tMov, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      tRX = gsap.quickTo(tMov, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    }

    // Datos de cada llama (izquierda / derecha)
    const fuegos = {};
    ['izq', 'der'].forEach((n) => {
      const capa = $(`.pj-fuego--${n}`);
      const bafle = $(`.pj-bafle--${n === 'izq' ? 'azul' : 'rojo'} .in img`);
      if (!capa || !bafle) return;

      fuegos[n] = {
        nombre: n,
        cx: FUEGO_CX[n],
        img: capa.querySelector('.pj-llama__img'),
        brillo: capa.querySelector('.pj-llama__brillo'),
        llama: capa.querySelector('.pj-llama'),
        destello: capa.querySelector('.pj-llama__destello'),
        bafle,
        calor: 0,   // qué tan "excitado" está (cursor cerca)
        viento: 0,  // inclinación actual (-1 a 1)
        vObj: 0,    // inclinación objetivo
      };
    });

    if (!caja || !dj || !fuegos.izq || !fuegos.der) return undefined;

    const lista = [fuegos.izq, fuegos.der];

    let vivo = true;
    let visible = true;
    let dropTl = null;
    let cursorActivo = false;

    // Intensidad global del fuego (1 = normal). El DROP la sube.
    const estado = { k: 1 };

    // Telaraña con físicas (null si algo no coincide: queda estática)
    const red = crearRed(frame, () => visible && vivo);
    let ultimoPunto = null; // para medir cuánto se mueve el mouse

    // Sacude la telaraña desde un punto (coordenadas de referencia)
    const sacudir = (x, y, fuerza = 4, R = 110) => {
      if (red) red.impulso(x, y, fuerza, R);
    };

    const escala = () => caja.offsetWidth / 597;

    // ---------- pool de brasas ----------
    const libres = [];
    const todas = [];
    for (let i = 0; i < MAX_BRASAS; i += 1) {
      const b = document.createElement('span');
      b.className = 'pj-brasa';
      caja.appendChild(b);
      libres.push(b);
      todas.push(b);
    }

    const brasa = (nombre, fuerza = 1) => {
      const b = libres.pop();
      if (!b) return;

      const f = fuegos[nombre];
      const s = escala();
      const x0 = (f.cx + rand(-32, 32)) * s;
      const y0 = rand(BRASA_Y[0], BRASA_Y[1]) * s;

      gsap.set(b, {
        x: x0,
        y: y0,
        opacity: 1,
        scale: rand(0.6, 1.5) * (fuerza > 1 ? 1.2 : 1),
        rotation: 0,
        backgroundColor: rand(PALETA),
      });

      gsap.to(b, {
        y: y0 - rand(130, 300) * s * Math.min(fuerza, 1.6),
        x: x0 + (rand(-55, 55) - f.viento * 40) * s,
        opacity: 0,
        scale: 0,
        rotation: rand(-180, 180),
        duration: rand(1.1, 2.3),
        ease: 'power1.out',
        onComplete: () => libres.push(b),
      });
    };

    const rafaga = (nombre, n, fuerza = 1) => {
      for (let i = 0; i < n; i += 1) {
        gsap.delayedCall(i * 0.025, () => {
          if (vivo) brasa(nombre, fuerza);
        });
      }
    };

    // Onda expansiva (anillo) en coordenadas de referencia
    const onda = (x, y, tam = 70) => {
      const o = document.createElement('span');
      o.className = 'pj-onda';
      caja.appendChild(o);

      const s = escala();
      gsap.set(o, {
        x: x * s,
        y: y * s,
        width: tam * s,
        height: tam * s,
        xPercent: -50,
        yPercent: -50,
        scale: 0.2,
        opacity: 0.9,
      });
      gsap.to(o, {
        scale: 2.6,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => o.remove(),
      });
    };

    // ---------- TÍTULO ----------

    // Chispa que sale de un punto cualquiera (coordenadas de referencia)
    const chispaEn = (xRef, yRef, fuerza = 1) => {
      const b = libres.pop();
      if (!b) return;

      const s = escala();
      const x0 = xRef * s;
      const y0 = yRef * s;

      gsap.set(b, {
        x: x0,
        y: y0,
        opacity: 1,
        scale: rand(0.7, 1.6),
        rotation: 0,
        backgroundColor: rand(PALETA),
      });

      gsap.to(b, {
        x: x0 + rand(-90, 90) * s * fuerza,
        y: y0 + rand(-130, 40) * s * fuerza,
        opacity: 0,
        scale: 0,
        rotation: rand(-270, 270),
        duration: rand(0.7, 1.4),
        ease: 'power2.out',
        onComplete: () => libres.push(b),
      });
    };

    // Barrido de luz que recorre las letras
    const barridoBrillo = () => {
      if (!hayTitulo || !visible) return;

      gsap.fromTo(
        tBrillo,
        { backgroundPosition: '150% 0%' },
        {
          backgroundPosition: '-50% 0%',
          duration: 0.9,
          ease: 'power2.inOut',
          overwrite: 'auto',
        }
      );
    };

    const tituloSalir = () => {
      sobreTitulo = false;
      tRY(0);
      tRX(0);
      gsap.to(tMov, {
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    const tituloClick = () => {
      const base = sobreTitulo ? 1.07 : 1;

      gsap.killTweensOf(tMov, 'scale,scaleX,scaleY,rotation');
      gsap
        .timeline()
        .to(tMov, { scaleX: base * 1.22, scaleY: base * 0.8, duration: 0.1 })
        .to(tMov, { scaleX: base * 0.9, scaleY: base * 1.12, duration: 0.12 })
        .to(tMov, {
          scaleX: base,
          scaleY: base,
          duration: 0.8,
          ease: 'elastic.out(1, 0.35)',
        });

      barridoBrillo();
      onda(155, 276, 120);
      sacudir(155, 276, 4, 150);
      sonidoTitulo();

      for (let i = 0; i < 16; i += 1) {
        gsap.delayedCall(i * 0.02, () => {
          if (vivo) chispaEn(rand(40, 270), rand(255, 300), 1);
        });
      }
    };

    // Vida propia del título: brillo cada tanto y un guiño
    const brilloLoop = () => {
      if (!vivo) return;
      barridoBrillo();
      gsap.delayedCall(rand(3.2, 5.5), brilloLoop);
    };

    const guino = () => {
      if (!vivo) return;

      if (visible && !sobreTitulo) {
        gsap.to(tMov, {
          keyframes: [
            { rotation: -3, duration: 0.07 },
            { rotation: 3, duration: 0.09 },
            { rotation: -1.5, duration: 0.08 },
            { rotation: 0, duration: 0.1 },
          ],
          overwrite: 'auto',
        });
      }

      gsap.delayedCall(rand(4, 7), guino);
    };

    // Llamarada: la llama se estira de golpe y vuelve con rebote
    const llamarada = (nombre, fuerza = 1) => {
      const f = fuegos[nombre];

      gsap.fromTo(
        f.llama,
        { scaleY: 1 + 0.4 * fuerza, scaleX: 1 + 0.1 * fuerza },
        {
          scaleY: 1,
          scaleX: 1,
          duration: 1,
          ease: 'elastic.out(1, 0.35)',
          overwrite: 'auto',
        }
      );

      gsap.fromTo(
        f.destello,
        { opacity: 0.85 * Math.min(fuerza, 1.2), scale: 0.5 },
        {
          opacity: 0,
          scale: 1.5,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto',
        }
      );
    };

    // ---------- parpadeo de las llamas ----------
    // Cada llama se reprograma sola con valores al azar: así nunca
    // se repite el mismo movimiento (como una llama de verdad).
    const parpadeo = (f) => {
      if (!vivo) return;

      if (!visible) {
        gsap.delayedCall(0.4, () => parpadeo(f));
        return;
      }

      f.viento += (f.vObj - f.viento) * 0.5;

      const k = estado.k + f.calor;
      const alto = 1 + (k - 1) * 0.14;

      gsap.to(f.img, {
        scaleY: rand(0.9, 1.1) * alto,
        scaleX: rand(0.94, 1.06),
        skewX: rand(-3, 3) * k - f.viento * 9,
        rotation: rand(-1.2, 1.2) - f.viento * 2,
        duration: rand(0.07, 0.2),
        ease: 'sine.inOut',
        onComplete: () => parpadeo(f),
      });

      gsap.to(f.brillo, {
        opacity: clamp(0, 1, rand(0.35, 0.7) * k),
        duration: rand(0.1, 0.3),
        overwrite: 'auto',
      });
    };

    // Chispas continuas: más rápido cuanto más intenso el fuego
    const chispear = () => {
      if (!vivo) return;

      if (visible) {
        brasa(Math.random() < 0.5 ? 'izq' : 'der', 1);
      }

      const calor = (fuegos.izq.calor + fuegos.der.calor) / 2;
      gsap.delayedCall(rand(0.12, 0.4) / (estado.k + calor), chispear);
    };

    // Ritmo: las llamas laten con los bafles
    const latido = (nombre) => {
      if (!vivo || !visible) return;
      llamarada(nombre, 0.35);
      if (Math.random() < 0.7) brasa(nombre, 1);

      // la telaraña "respira" con cada golpe de la canción
      sacudir(BAFLE_CENTRO[nombre].x, BAFLE_CENTRO[nombre].y, 1.2, 240);
    };

    // ---------- DROP (click en el DJ) ----------
    const drop = () => {
      ['izq', 'der'].forEach((n) => {
        llamarada(n, 1.6);
        rafaga(n, 16, 1.4);
      });

      onda(ORIGEN.x, ORIGEN.y + 40, 160);

      // onda de choque desde el DJ + la telaraña se toca como un arpegio
      // de piano y guitarra
      sacudir(ORIGEN.x, ORIGEN.y, 6, 420);
      for (let i = 0; i < HILOS.length; i += 1) sonidoCuerda(i, i * 0.045, 0.8);

      // los hilos de la telaraña se encienden y se apagan
      gsap.fromTo(
        frame.querySelectorAll('.pj-red path'),
        { stroke: '#f3b64a' },
        { stroke: '#0b0b12', duration: 1.4, ease: 'power2.out', clearProps: 'stroke' }
      );

      if (dropTl) dropTl.kill();
      dropTl = gsap
        .timeline()
        .to(estado, { k: 2.2, duration: 0.15 })
        .to(estado, { k: 1, duration: 2.2, ease: 'power2.inOut' }, '+=0.6');
    };

    // Golpe de bajo (click en un bafle)
    const golpeBafle = (nombre) => {
      const f = fuegos[nombre];
      const c = BAFLE_CENTRO[nombre];

      // suena el golpe y suma una capa a la canción
      const prog = sonidoBafle(nombre);
      const nueva = !!(prog && prog.desbloqueo);

      llamarada(nombre, nueva ? 1.2 : 0.9);
      rafaga(nombre, nueva ? 14 : 10, 1);
      onda(c.x, c.y, nueva ? 120 : 90);
      sacudir(c.x, c.y, nueva ? 5.5 : 4, 200);

      // los dos bafles al máximo: DROP
      if (prog && prog.completa) drop();

      gsap.fromTo(
        f.bafle,
        { filter: 'brightness(1.7)' },
        { filter: 'brightness(1)', duration: 0.4, ease: 'power2.out', clearProps: 'filter' }
      );
    };

    // ---------- detección con el mouse / dedo ----------
    // Se escucha en window y se mide con getBoundingClientRect:
    // así funciona aunque las capas tengan pointer-events: none
    // y con la cámara 3D del Hero.
    const dentro = (el, x, y, fx = 0) => {
      const r = el.getBoundingClientRect();
      const pad = r.width * fx;
      return x >= r.left + pad && x <= r.right - pad && y >= r.top && y <= r.bottom;
    };

    const enEscena = (x, y) => {
      const r = frame.getBoundingClientRect();
      return y >= r.top && y <= r.bottom && x >= r.left && x <= r.right;
    };

    const ponerCursor = (si) => {
      if (si === cursorActivo) return;
      cursorActivo = si;
      document.body.style.cursor = si ? 'pointer' : '';
    };

    // ¿El puntero está sobre el espacio de Starbucks (que tapa toda la pantalla)?
    const enStarbucks = (e) =>
      !!(e.target && e.target.closest && e.target.closest('.stx'));

    const onMove = (e) => {
      // con Starbucks abierto, la escena de atrás se queda quieta
      if (enStarbucks(e)) {
        if (sobreTitulo) tituloSalir();
        lista.forEach((f) => {
          f.vObj = 0;
        });
        ultimoPunto = null;
        ponerCursor(false);
        return;
      }

      if (!visible || !enEscena(e.clientX, e.clientY)) {
        lista.forEach((f) => {
          f.vObj = 0;
          if (f.calorObj !== 0) {
            f.calorObj = 0;
            gsap.to(f, { calor: 0, duration: 0.5, overwrite: 'auto' });
          }
        });
        if (sobreTitulo) tituloSalir();
        ultimoPunto = null;
        ponerCursor(false);
        return;
      }

      let sobre = false;

      // el mouse roza la telaraña: arrastra los hilos por los que pasa
      if (red) {
        const p = red.aSvg(e.clientX, e.clientY);
        if (p) {
          if (ultimoPunto) {
            red.arrastre(
              p.x,
              p.y,
              clamp(-25, 25, p.x - ultimoPunto.x),
              clamp(-25, 25, p.y - ultimoPunto.y)
            );
          }
          ultimoPunto = p;
        }
      }

      lista.forEach((f) => {
        const r = f.img.getBoundingClientRect();
        const cerca =
          dentro(f.img, e.clientX, e.clientY, 0.15) ||
          dentro(f.bafle, e.clientX, e.clientY, 0.05);

        // el fuego se inclina alejándose del cursor
        const cx = r.left + r.width / 2;
        f.vObj = cerca ? clamp(-1, 1, (e.clientX - cx) / (r.width / 2)) : 0;

        const c = cerca ? 0.7 : 0;
        if (c !== f.calorObj) {
          f.calorObj = c;
          gsap.to(f, { calor: c, duration: 0.5, overwrite: 'auto' });
        }

        if (cerca) sobre = true;
      });

      // el título se inclina en 3D hacia el cursor
      if (hayTitulo) {
        if (dentro(tImg, e.clientX, e.clientY, 0.02)) {
          const r = tImg.getBoundingClientRect();
          const nx = clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2));
          const ny = clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2));

          tRY(nx * 16);
          tRX(-ny * 12);

          if (!sobreTitulo) {
            sobreTitulo = true;
            gsap.to(tMov, {
              scale: 1.07,
              duration: 0.35,
              ease: 'back.out(2.5)',
              overwrite: 'auto',
            });
            barridoBrillo();
          }

          sobre = true;
        } else if (sobreTitulo) {
          tituloSalir();
        }
      }

      if (!sobre && dentro(dj, e.clientX, e.clientY, 0.1)) sobre = true;

      ponerCursor(sobre);
    };

    const onLeaveVentana = () => {
      if (sobreTitulo) tituloSalir();

      lista.forEach((f) => {
        f.vObj = 0;
        f.calorObj = 0;
        gsap.to(f, { calor: 0, duration: 0.5, overwrite: 'auto' });
      });
      ponerCursor(false);
    };

    const onClick = (e) => {
      // un clic dentro de Starbucks no debe tocar la escena de atrás
      if (enStarbucks(e)) return;

      if (!visible || !enEscena(e.clientX, e.clientY)) return;
      if (e.target.closest && e.target.closest('a, button, input, textarea')) return;

      const x = e.clientX;
      const y = e.clientY;

      // posición del click sobre la telaraña
      const pv = red ? red.aSvg(x, y) : null;

      // 0.º el título
      if (hayTitulo && dentro(tImg, x, y, 0.02)) {
        tituloClick();
        return;
      }

      // 1.º bafles (están delante del fuego)
      for (let i = 0; i < lista.length; i += 1) {
        if (dentro(lista[i].bafle, x, y, 0.05)) {
          golpeBafle(lista[i].nombre);
          return;
        }
      }

      // 1.5.º un hilo de la telaraña: se puntea y suena (piano + guitarra)
      //       (tiene prioridad sobre el fuego y el DJ)
      if (red && pv) {
        const c = red.cerca(pv.x, pv.y);

        if (c && c.dist < 22) {
          red.impulso(pv.x, pv.y, 4.5, 110);
          sonidoCuerda(c.i, 0, 1);
          return;
        }
      }

      // 2.º llamas
      for (let i = 0; i < lista.length; i += 1) {
        if (dentro(lista[i].img, x, y, 0.15)) {
          llamarada(lista[i].nombre, 1.1);
          rafaga(lista[i].nombre, 14, 1.2);
          sacudir(lista[i].cx, 500, 3, 160);
          return;
        }
      }

      // 3.º el DJ
      if (dentro(dj, x, y, 0.1)) {
        drop();
        return;
      }

      // 4.º cualquier otro lugar: la telaraña vibra desde ahí
      if (pv) red.impulso(pv.x, pv.y, 3.5, 120);
    };

    // Pasar el mouse por un proyecto: el fuego de ese lado reacciona
    const onOver = (e) => {
      const a = e.target.closest && e.target.closest('.frame--projects .pj-enlace');
      if (!a || a.contains(e.relatedTarget)) return;

      const n = a.closest('.pj-rayo--izq') ? 'izq' : 'der';
      llamarada(n, 0.6);
      rafaga(n, 5, 1);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('pointerover', onOver);
    document.documentElement.addEventListener('pointerleave', onLeaveVentana);

    // Pausa todo cuando la escena no se ve (ahorra batería)
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([en]) => {
          visible = en.isIntersecting;
        },
        { threshold: 0 }
      );
      io.observe(frame);
    }

    // La canción hace latir el fuego en cada golpe (bombo = izq, bajo = der)
    cancion.onPaso = latido;

    // ---------- animaciones continuas ----------
    const ctx = gsap.context(() => {
      // Bafles: pulsan al ritmo y hacen latir el fuego de su lado
      let cuenta = { izq: 0, der: 0 };

      gsap.to(fuegos.izq.bafle, {
        scale: 1.05,
        transformOrigin: '50% 100%',
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        onRepeat: () => {
          cuenta.izq += 1;
          if (cuenta.izq % 2 === 0) latido('izq');
        },
      });

      gsap.to(fuegos.der.bafle, {
        scale: 1.05,
        transformOrigin: '50% 100%',
        duration: 0.5,
        delay: 0.25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        onRepeat: () => {
          cuenta.der += 1;
          if (cuenta.der % 2 === 0) latido('der');
        },
      });

      gsap.to('.frame--projects .pj-personaje .in img', {
        y: -8,
        rotation: 1,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.frame--projects .pj-circulo .in img', {
        scale: 1.03,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Ondas de calor: el ruido del filtro SVG cambia todo el tiempo
      if (turb && desp) {
        const ond = { fx: 0.012, fy: 0.05 };
        let n = 0;

        gsap.to(ond, {
          fx: 0.02,
          fy: 0.078,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          onUpdate: () => {
            if (!visible) return;
            n += 1;

            turb.setAttribute(
              'baseFrequency',
              `${ond.fx.toFixed(4)} ${ond.fy.toFixed(4)}`
            );

            // salta de semilla cada pocos cuadros: la llama "tiembla"
            if (n % 6 === 0) turb.setAttribute('seed', String((n / 6) % 24));

            const w = fuegos.izq.img.offsetWidth || 120;
            desp.setAttribute('scale', (w * 0.035 * estado.k).toFixed(1));
          },
        });
      }

      // Título: flota, respira y de vez en cuando brilla / hace un guiño
      if (hayTitulo) {
        gsap.to(tCuerpo, {
          yPercent: -5,
          rotation: 1.2,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        gsap.to(tCuerpo, {
          scale: 1.025,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        gsap.delayedCall(1.2, brilloLoop);
        gsap.delayedCall(2.5, guino);
      }

      // Se encienden las llamas y las brasas
      gsap.set([fuegos.izq.img, fuegos.der.img], { transformOrigin: '50% 100%' });
      parpadeo(fuegos.izq);
      gsap.delayedCall(0.11, () => parpadeo(fuegos.der));
      chispear();
    });

    return () => {
      vivo = false;

      cancion.onPaso = null;
      detenerCancion();
      if (red) red.destruir();

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeaveVentana);
      if (io) io.disconnect();

      ponerCursor(false);

      if (dropTl) dropTl.kill();
      gsap.killTweensOf(todas);
      gsap.killTweensOf(lista);
      gsap.killTweensOf(estado);
      lista.forEach((f) =>
        gsap.killTweensOf([f.img, f.brillo, f.llama, f.destello, f.bafle])
      );
      if (hayTitulo) gsap.killTweensOf([tMov, tCuerpo, tBrillo]);

      ctx.revert();

      caja.querySelectorAll('.pj-brasa, .pj-onda').forEach((el) => el.remove());
    };
  }, []);

  return (
    <>
      {/* Filtro SVG de ondas de calor (lo usan las llamas) */}
      <svg className="pj-filtros" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="pj-llama-ondas"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              id="pj-llama-turb"
              type="fractalNoise"
              baseFrequency="0.012 0.05"
              numOctaves="2"
              seed="3"
              result="ruido"
            />
            <feDisplacementMap
              id="pj-llama-desp"
              in="SourceGraphic"
              in2="ruido"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="layer pj pj-fondo" data-z="0" data-depth="4">
        <div className="in">
          <img src={fondo} alt="" draggable="false" />
        </div>
      </div>

      {/* TÍTULO: ent = entrada · mov = interacción · cuerpo = flota
          (cada uno anima propiedades distintas para no pelear) */}
      <div className="layer pj pj-titulo" data-z="32" data-depth="16">
        <div className="in">
          <span className="pj-titulo__ent">
            <span className="pj-titulo__mov">
              <span className="pj-titulo__cuerpo">
                <img src={titulo} alt="Proyectos" draggable="false" />
                <span
                  className="pj-titulo__brillo"
                  aria-hidden="true"
                  style={{ '--titulo': `url(${titulo})` }}
                />
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="layer pj pj-circulo" data-z="6" data-depth="8">
        <div className="in">
          <img src={circulo} alt="" draggable="false" />
        </div>
      </div>

      {/* FUEGO VIVO: parpadea, tiene ondas de calor y reacciona al mouse */}
      <div className="layer pj pj-fuego pj-fuego--izq" data-z="8" data-depth="10">
        <div className="in">
          <Llama src={fuegoIzq} />
        </div>
      </div>

      <div className="layer pj pj-fuego pj-fuego--der" data-z="8" data-depth="10">
        <div className="in">
          <Llama src={fuegoDer} />
        </div>
      </div>

      {/* BRASAS y ondas expansivas (las crea el useEffect) */}
      <div className="layer pj pj-brasas" data-z="15" data-depth="12" aria-hidden="true">
        <div className="in" />
      </div>

      {/* Bafles (detrás del DJ) */}
      <div className="layer pj pj-bafle pj-bafle--azul" data-z="16" data-depth="30">
        <div className="in">
          <img src={bafleAzul} alt="" draggable="false" />
        </div>
      </div>

      <div className="layer pj pj-bafle pj-bafle--rojo" data-z="16" data-depth="30">
        <div className="in">
          <img src={bafleRojo} alt="" draggable="false" />
        </div>
      </div>

      {/* RED DE ARAÑA: hilos que parten del cuerpo del DJ */}
      <div className="layer pj pj-red" data-z="17" data-depth="14" aria-hidden="true">
        <div className="in">
          <svg className="pj-red__svg" viewBox="0 0 597 881" focusable="false">
            <g className="pj-red__hilos">
              {HILOS.map((h) => (
                <path
                  key={h.g}
                  d={`M${ORIGEN.x} ${ORIGEN.y}L${h.x.toFixed(1)} ${h.y.toFixed(1)}`}
                  pathLength="1"
                />
              ))}
            </g>
            <g className="pj-red__arcos">
              {ARCOS.map((ar) => (
                <path key={ar.d} d={ar.d} pathLength="1" />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* RAYOS con los proyectos: nacen del cuerpo del DJ */}
      <div className="layer pj pj-rayos" data-z="18" data-depth="12">
        <div className="in">
          <nav className="pj-rayos__nav" aria-label="Proyectos">
            {izquierda.map((p, i) => (
              <Rayo
                key={p.texto}
                lado="izq"
                proyecto={p}
                config={configDe(RAYOS_IZQ, i)}
                onAbrir={setVentana}
              />
            ))}
            {derecha.map((p, i) => (
              <Rayo
                key={p.texto}
                lado="der"
                proyecto={p}
                config={configDe(RAYOS_DER, i)}
                onAbrir={setVentana}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="layer pj pj-personaje" data-z="20" data-depth="24">
        <div className="in">
          <img
            src={personaje}
            alt="Luis como DJ, con la mesa de mezclas Speak / Die"
            draggable="false"
          />
        </div>
      </div>

      {/* ESPACIO DE STARBUCKS: se abre con el clic en "starbuck" (va en un
          portal, fuera del 3D del Hero) */}
      <Starbucks
        abierto={ventana === 'starbucks'}
        onCerrar={() => setVentana(null)}
      />
    </>
  );
}