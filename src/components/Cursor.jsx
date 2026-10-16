import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import estrella from '../assets/estrella.png';
import cancion from '../assets/danse.mp3';

const fine =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(hover: hover) and (pointer: fine)').matches;

// Modo libre: tiempos (segundos) donde empieza cada nota de la canción.
// Cada clic o tecla hace sonar la canción.
const CORTES = [0.19,0.95,1.72,2.51,3.3,4.11,4.9,5.67,6.41,7.17,8.73,14.26,15.79,16.56,18.04,18.72,19.83,20.83,21.43,21.78,22.34,22.73,23.27,23.61,23.92,24.15,24.5,24.75,25.08,25.38,25.7,25.96,26.38,27.28,27.89,28.19,28.68,28.93,29.09,29.42,29.98,30.35,30.91,31.23,31.49,31.88,32.35,33.25,33.88,34.13,34.44,35.06,35.32,35.67,35.9,36.2,36.48,36.78,36.94,37.38,37.52,37.66,37.83,38.27,38.41,38.8,39.15,39.43,39.68,40.03,40.26,40.54,41.12,41.52,42.19,42.52,42.84,43.0,44.37,44.68,44.95,45.3,45.93,46.28,46.44,46.88,48.11,48.41,48.6,49.06,49.9,50.53,52.69,53.03,53.94,54.27,54.85,55.19,55.5,55.82,55.96,56.22,56.35,56.63,56.77,56.91,57.05,57.49,57.63,57.77,57.91,58.05,58.33,58.47,58.61,58.84,59.21,59.35,59.49,59.7,59.95,60.12,60.26,60.4,60.79,61.02,61.18,61.56,61.79,62.04,62.55,62.95,63.3,63.53,63.76,64.09,64.34,64.6,64.9,65.04,65.29,65.43,66.25,66.5,66.76,66.92,67.27,67.55,67.8,68.03,68.2,68.34,68.57,68.87,69.13,69.4,69.66,69.92,70.19,70.4,70.75,70.94,71.29,71.66,71.96,72.49,72.63,72.91,73.21,73.7,74.3,74.44,75.16,75.42,76.0,76.14,77.09,77.55,77.69,77.93,78.76,79.39,79.67,79.92,80.11,80.48,81.36,81.64,81.78,82.18,82.52,82.76,83.01,83.31,83.82,84.45,84.71,85.12,85.52,93.83,94.83,96.39,99.59,100.22,100.54,100.87,102.12,102.26,102.61,102.91,103.21,103.38,103.82,104.07,104.58,104.72,104.95,105.09,105.28,105.51,105.7,105.86,106.12,106.44,106.58,106.72,107.02,107.32,107.46,107.62,107.9,108.23,108.76,109.09,109.37,109.71,110.41,110.81,111.22,111.48,111.78,111.92,112.06,112.2,112.34,112.64,112.8,112.97,113.1,113.27,113.55,113.68,113.82,113.96,114.1,114.43,114.68,114.85,114.99,115.38,115.66,115.89,116.19,116.45,116.7,117.01,117.24,117.59,117.84,118.14,118.49,120.05,120.3,120.86,121.18,121.44,121.7,122.02,122.3,122.55,122.81,123.11,123.27,123.41,123.55,123.92,124.11,124.39,124.53,124.76,125.06,125.32,125.53,125.78,126.2,126.36,126.69,127.06,127.34,127.48,127.87,128.08,128.34,128.73,129.57,129.82,130.4,130.68,130.82,130.98,131.24,131.77,132.05,132.38,132.66,132.93,133.19,133.35,133.49,133.75,134.05,134.33,134.61,134.86,135.02,135.42,135.7,135.84,136.23,136.81,137.09,137.37,137.65,137.79,137.93,138.23,138.37,138.51,138.79,139.41,139.64,139.78,140.18,140.34,140.76,141.01,141.29,141.57,142.13,142.66,142.94,143.55,143.82,144.1,144.36,144.66,144.96,145.19,145.5,145.77,146.05,146.33,146.63,146.89,147.17,147.42,147.7,147.98,148.51,148.82,149.68,150.0,150.26,150.56,150.86,151.09,151.39,151.67,151.93,152.21,152.51,152.76,153.04,153.34,153.62,153.9,154.18,154.39,154.67,155.04,155.32,155.57,155.88,156.11,156.43,156.67,156.94,157.29,157.83,158.13,158.38,158.66,158.96,159.47,159.8,160.1,160.36,160.64,160.91,161.22,161.45,161.94,162.31,162.86,163.19,163.49,163.7,164.03,164.35,164.61,164.86,165.16,165.37,165.74,166.0,166.14,167.58,167.86,168.09,168.67,168.97,169.25,169.48,169.74,170.27,170.57,171.08,171.36,171.87,172.2,172.69,172.97,173.29,173.52,173.75,174.03,174.29,174.54,174.85,175.06,175.4,195.02,216.06,216.64,216.85,217.11,217.39,217.78,217.92,218.17,218.43,218.71,218.99,219.27,219.52,219.78,220.08,220.22,220.36,220.57,220.87,221.12,221.4,221.68,221.96,224.63,227.02,227.42,228.14,228.74,230.53,231.36,231.74,232.32,232.64,232.92,233.17,233.48,233.64,233.78,234.03,234.36,234.52,234.66,234.8,235.19,235.36,235.61,235.75,236.08,236.22,236.52,236.84,237.17,237.35,237.49,237.75,238.05,238.33,238.56,238.84,239.14,239.49,240.4,240.98,241.28,242.23,243.11,244.04,245.02,245.92,248.71,249.27,249.64,250.22,250.5,251.15,251.4,252.33,252.93,253.26,254.12,258.93,259.81,260.78,261.64,261.9,262.08,262.59,262.92,263.45,265.29,266.08,266.94,267.84,268.38,268.75,268.91,269.63,269.93,270.19,270.49,271.33,272.16,272.67,272.97,273.14,273.53,273.86,274.04,274.34,274.62,274.9,275.2,275.5,275.78,276.09,276.36,276.53,276.94,277.2,277.62,278.11,278.38,278.59,278.87,279.15,279.45,279.73,279.89,280.26,280.59,280.87,281.1,281.43,281.57,281.7,281.91,282.26,282.61,282.89,283.42,283.7,283.98,284.21,284.51,284.82,286.28,286.79,287.09,287.37,287.63,287.79,288.76,289.51,289.76,290.2,290.46,290.69,291.04,291.29,291.62,292.18,293.52,295.1,295.57,310.82,311.68,312.52,314.7,314.84,315.33,315.61,316.05,316.19,316.35,316.6,316.86,317.25,317.53,318.32,319.09,319.51,319.88,323.92,326.19,328.31,328.66,328.91,329.21,329.49,329.72,330.0,330.3,330.58,331.16,332.81,335.06,335.32,335.57,335.9,336.13,336.69,336.85,337.22,338.08,338.38,338.55,338.9,339.15,339.34,339.78,340.57,340.87,341.36,342.19,342.52,342.75,343.56,345.42,348.21,348.6,348.83,349.32,349.65,350.13,351.74,352.5,353.31,353.55,354.1,354.64,354.78,355.4,355.54,357.08,357.68,357.94,358.24,358.47,358.73,359.24,359.49,360.28,360.54,361.07,361.37,361.58,361.86,362.12,362.35,362.51,362.81,363.11,363.28,363.79,364.04,365.23,365.48,365.67,365.97,366.2,366.41,366.67,366.94,367.39,367.64,368.08,368.25,369.06,369.34,369.75,370.52,371.22,371.94,372.68,373.38,374.19,374.44,374.86,375.14,375.56,375.77,376.3,378.9,379.37,379.83,380.23,382.25,390.58,395.32,397.06,401.4,403.59,404.17,405.49,409.67,412.36,418.28,418.49,418.98,420.03,420.23,420.47,420.86,422.95,423.21,423.44,423.69,425.37,426.23];

// Modo juego: tiempo exacto de cada nota y su carril original (0-9).
// Se reducen a 4 carriles (izquierda, abajo, arriba, derecha) más abajo.
const NOTAS_T = [0.209,0.998,1.753,2.543,3.344,4.145,4.923,5.7,6.455,7.245,8.835,14.327,15.859,16.579,18.123,18.762,19.911,20.863,21.467,21.838,22.372,22.756,23.324,23.661,23.928,24.23,24.555,24.834,25.124,25.414,25.728,26.041,26.401,27.957,29.141,29.478,30.058,30.383,30.941,31.904,32.403,33.913,34.064,34.215,34.493,35.085,35.225,35.364,35.712,35.852,35.991,36.258,36.56,36.722,36.978,37.442,37.872,38.325,38.475,39.474,39.741,40.054,40.194,40.612,41.169,41.552,41.866,42.214,42.562,42.864,43.189,44.095,44.71,45.023,45.395,45.976,46.312,48.147,48.448,48.739,49.122,49.958,50.573,52.744,53.046,53.975,54.288,54.892,55.217,55.519,55.856,56.123,56.39,56.703,56.842,57.098,57.539,57.678,57.818,58.073,58.387,58.642,58.781,58.921,59.246,59.385,59.757,60.012,60.163,60.43,60.801,61.08,61.336,61.603,61.858,62.102,62.601,63.007,63.321,63.565,63.704,64.122,64.389,64.656,64.946,65.086,65.48,66.305,66.525,66.827,66.966,67.326,67.605,67.849,68.116,68.267,68.627,68.917,69.068,69.312,69.706,70.206,70.763,71.018,71.332,71.68,72.005,72.551,72.957,73.77,74.385,74.629,75.5,76.08,76.312,77.148,77.601,77.845,78.809,79.424,79.563,79.702,80.004,80.144,80.527,81.386,81.711,81.85,82.117,82.826,83.058,83.383,83.789,84.474,84.741,85.194,85.589,94.865,96.467,100.252,100.589,100.926,102.145,102.284,102.679,102.992,103.248,103.387,103.642,103.84,104.083,104.676,104.885,105.163,105.581,105.767,106.022,106.173,106.463,106.626,106.777,106.916,107.346,107.497,107.648,107.938,108.286,108.867,109.145,109.529,109.726,110.434,110.887,111.282,111.491,111.792,112.001,112.268,112.419,112.733,112.872,113.139,113.279,113.615,113.755,113.917,114.161,114.463,114.602,114.753,115.032,115.438,115.705,115.96,116.251,116.506,116.762,117.052,117.33,117.644,117.923,118.224,118.549,120.07,120.361,120.906,121.22,121.371,121.51,121.754,122.067,122.346,122.601,122.903,123.193,123.472,123.739,123.878,124.018,124.285,124.424,125.109,125.411,125.562,125.817,126.224,126.433,126.711,127.106,127.396,128.116,128.255,128.395,128.789,129.649,129.881,130.45,130.705,130.891,131.274,131.843,132.122,132.412,132.957,133.236,133.41,133.793,134.084,134.374,134.641,135.082,135.465,135.628,135.895,136.301,136.858,137.125,137.706,137.845,137.985,138.275,138.414,138.553,139.424,139.68,139.842,140.237,140.399,140.794,141.084,141.34,142.153,142.71,143.0,143.581,143.871,144.405,144.695,145.241,145.543,146.088,146.39,146.657,146.924,147.191,147.458,147.737,148.027,148.538,148.863,150.024,150.593,150.883,151.429,151.708,151.975,152.288,152.822,153.124,153.391,153.67,153.983,154.227,154.494,154.773,155.086,155.341,155.632,155.91,156.177,156.468,156.77,157.025,157.327,157.861,158.163,158.441,158.697,159.022,159.556,159.869,160.16,160.403,160.717,160.984,161.239,161.53,162.075,162.366,162.934,163.225,163.527,163.782,164.084,164.374,164.618,164.92,165.187,165.454,165.756,166.046,166.301,167.636,167.903,168.171,168.705,169.006,169.517,169.819,170.307,170.632,171.131,171.433,171.944,172.234,172.756,173.035,173.325,173.546,173.836,174.08,174.347,174.614,174.869,175.125,175.427,181.859,195.059,216.097,216.886,217.165,217.432,217.71,217.954,218.256,218.477,218.778,219.057,219.312,219.847,220.114,220.276,220.659,220.961,221.17,221.437,221.716,222.018,227.091,228.809,230.597,231.468,231.805,232.374,232.687,233.233,233.535,233.802,234.08,234.44,234.719,234.963,235.265,235.404,235.659,235.892,236.159,236.681,236.983,237.122,237.517,237.807,238.086,238.364,238.643,238.922,239.189,239.583,240.454,241.035,241.371,242.289,243.229,243.81,244.123,245.087,245.981,248.779,249.371,249.696,250.253,250.578,251.182,251.495,252.401,252.993,253.306,254.235,258.984,259.889,260.853,261.77,261.933,262.653,263.488,264.406,265.3,266.147,267.006,267.912,268.771,268.98,270.002,270.269,270.536,271.372,272.219,272.718,273.032,273.566,273.868,274.646,274.924,275.226,275.528,275.818,276.132,276.422,276.666,276.968,277.246,278.129,278.314,278.628,278.895,279.174,279.487,279.777,280.044,280.323,280.602,280.915,281.159,281.472,281.612,282.041,282.331,282.668,282.947,283.469,283.736,284.003,284.294,284.561,284.862,286.314,286.848,287.126,287.393,287.672,287.846,288.845,289.564,289.924,290.226,290.505,290.783,291.062,291.318,291.654,310.88,311.74,312.599,314.758,315.002,315.397,315.664,316.105,316.244,316.395,316.639,316.918,317.301,317.568,318.404,319.147,319.565,319.936,323.965,326.264,328.423,329.004,329.271,329.526,329.793,330.118,330.35,330.629,331.221,335.377,335.61,335.923,336.062,336.759,337.281,338.117,338.419,338.593,338.93,339.267,339.801,340.59,340.904,341.438,342.227,342.692,345.455,348.648,348.903,349.402,349.693,350.145,351.782,352.56,353.361,354.162,354.673,354.94,355.196,355.451,355.695,357.111,357.251,357.994,358.272,358.539,358.783,359.549,360.339,361.094,361.419,361.686,361.941,362.173,362.417,362.649,362.905,363.137,363.392,363.81,365.529,366.005,366.225,366.481,366.701,366.968,367.421,367.688,369.128,369.383,369.813,370.59,371.287,372.03,372.75,373.493,374.224,374.491,374.921,375.176,376.349,378.95,379.414,379.867,380.238,390.618,395.343,397.096,403.621,404.236,409.693,412.398,418.052,418.366,418.54,419.004,420.107,420.258,422.696,422.986,423.149,425.459,426.272];
const NOTAS_L = '4444444444410110499449497494949402244532522333642438638588768573400675555546550407506242546266226424624111116653555419442426649313615555449999949740220828220807897898667956858562122474455444581681961789195445445442818880696086999996467464946402756111561662525441000623666622267256695653555729223599918777009819207067878797866787794111163851931851080001913611390151314359116729127171181922799812191991922276661551551152755152018087729609739579789729778356356696695775889757475775111778676111998766149479448079977775837773331889950147107343500710604060999087877888658658769577772598822221441472122180055382056306979820997806257157350221777239070206100097879076755744452144800';

// Las 4 flechas (de izquierda a derecha = carril 0 a 3)
const TECLAS = ['←', '↓', '↑', '→'];
const CODIGOS = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
const NOMBRES = ['izquierda', 'abajo', 'arriba', 'derecha'];

// ---- Modo libre ----
const DURACION = 2; // cada clic o tecla mantiene la canción sonando este tiempo más (s)
const DESVANECER = 0.7; // al dejar de tocar, la música se apaga en este tiempo
const VOLUMEN = 1.6; // volumen del modo libre
const IDLE_PIANO = 6000; // ms sin tocar para que el piano se esconda

// ---- Música de fondo (al desbloquearla) ----
const VOLUMEN_FONDO = 1;
const ENTRADA_FONDO = 1.5; // segundos que tarda en subir al volumen de fondo

// ---- Escena macabra (al desbloquear la música) ----
const N_FANTASMAS = 14;
const N_ESQUELETOS = 7;
const N_HUESOS = 22;

// ---- Modo juego (como FNF) ----
const META = 30; // aciertos en total (aunque falles y el combo vuelva a 0) para desbloquear la música de fondo
const HITOS = [15, 30]; // aciertos totales que muestran el cartel de arriba
const FRASES_HITO = { 15: '¡Sigue así!', 30: '¡Música desbloqueada!' };

const SEPARACION_MIN = 0.3; // segundos mínimos entre notas (sube = más fácil)
const CAIDA = 1.6; // segundos que tarda una nota en bajar hasta la línea (sube = más lento)
const VENTANA_PERFECTO = 0.06; // ± segundos para "¡Perfecto!"
const VENTANA_BIEN = 0.13; // ± segundos para "¡Bien!"; fuera de esto es fallo
const AJUSTE_AUDIO = 0; // si las notas llegan TARDE al sonido, súbelo (ej. 0.05); si llegan temprano, bájalo

const VIDA_INICIAL = 0.6; // la vida va de 0 a 1
const VIDA_PERFECTO = 0.04;
const VIDA_BIEN = 0.025;
const VIDA_FALLO = 0.1; // pierde esto cuando se pasa una nota
const VIDA_SOBRA = 0.03; // pierde esto si pulsas una tecla sin nota
const VOLUMEN_JUEGO = 1.2;
const ALTO_CARRIL_MAX = 440; // px
const TAM_NOTA = 40; // px

// Colores de la estética del portafolio
const AZUL = '#1b6fe0';
const AZUL_OSCURO = '#0b2a7a';
const CIAN = '#2fd4ff';
const AMARILLO = '#ffd23f';
const COLORES = TECLAS.map((_, i) => `hsl(${190 + i * 40} 90% 55%)`);

// Teclas blancas estilo cómic del portafolio
const MARFIL = '#ffffff';

// Notas del juego: cada carril original (0-9) se reduce a 0-3,
// y se separan al menos SEPARACION_MIN
const NOTAS = [];
{
  let ultimo = -Infinity;
  NOTAS_T.forEach((t, k) => {
    if (t - ultimo >= SEPARACION_MIN) {
      const lane = Math.min(
        TECLAS.length - 1,
        Math.floor((Number(NOTAS_L[k]) * TECLAS.length) / 10)
      );
      NOTAS.push({ t, lane });
      ultimo = t;
    }
  });
}

export default function Cursor() {
  const ref = useRef(null);
  const audio = useRef(null);
  const buffer = useRef(null);
  const cargando = useRef(null);
  const hudRef = useRef(null);
  const barraRef = useRef(null);
  const pianoRef = useRef(null);
  const carrilRef = useRef(null);
  const juicioRef = useRef(null);
  const columnasRef = useRef([]);
  const teclasRef = useRef([]);
  const pulsarRef = useRef(null); // toca una tecla (las teclas en pantalla la usan)
  const iniciarRef = useRef(null); // empieza el juego (el botón ¡Jugar! la usa)
  const ultimaPos = useRef(null); // segundo de la canción donde quedó el modo libre
  const actual = useRef(null); // reproducción del modo libre
  const liberada = useRef(false); // true cuando la música ya es de fondo
  const [combo, setCombo] = useState(0);
  const [modo, setModo] = useState('libre'); // 'libre' | 'juego'

  useEffect(() => {
    if (!fine) return;

    const cur = ref.current;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });

    gsap.set(cur, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.7 });

    // ---------- Audio ----------
    function obtenerContexto() {
      if (!AudioContextClass) return null;
      if (!audio.current) audio.current = new AudioContextClass();
      return audio.current;
    }

    // Descarga y decodifica la canción una sola vez
    function cargarCancion() {
      if (buffer.current) return Promise.resolve(buffer.current);
      if (cargando.current) return cargando.current;

      const ctx = obtenerContexto();
      if (!ctx) return Promise.resolve(null);

      cargando.current = fetch(cancion)
        .then((r) => r.arrayBuffer())
        .then((datos) => ctx.decodeAudioData(datos))
        .then((buf) => {
          buffer.current = buf;
          return buf;
        })
        .catch((error) => {
          console.error('No se pudo cargar la canción:', error);
          cargando.current = null;
          return null;
        });

      return cargando.current;
    }

    // Siguiente nota de la canción desde donde se quedó el modo libre
    function puntoDeInicio(buf) {
      if (ultimaPos.current !== null && ultimaPos.current < buf.duration - 3) {
        const sig = CORTES.find((t) => t > ultimaPos.current - 0.05);
        return sig !== undefined ? sig : 0;
      }
      return CORTES[0];
    }

    function animarEstrella() {
      gsap.fromTo(
        cur,
        { scale: 1.5, rotation: '+=45' },
        { scale: 1, duration: 0.35, ease: 'back.out(2)', overwrite: 'auto' }
      );
    }

    // ---------- Modo libre: la canción suena al ritmo de tus clics y teclas ----------
    async function sonar() {
      if (liberada.current) return;

      const ctx = obtenerContexto();
      if (!ctx) return;

      try {
        if (ctx.state === 'suspended') await ctx.resume();

        const buf = await cargarCancion();
        if (!buf || audio.current !== ctx || liberada.current || juego.activo) return;

        const ahora = ctx.currentTime;
        const act = actual.current;

        if (act && ahora < act.fin) {
          // Ya suena: solo se alarga, sin cortar ni reiniciar nada
          const g = act.ganancia.gain;
          g.cancelScheduledValues(ahora);
          g.setValueAtTime(g.value, ahora);
          g.linearRampToValueAtTime(VOLUMEN, ahora + 0.06);

          act.fin = ahora + DURACION;
          g.setValueAtTime(VOLUMEN, act.fin - DESVANECER);
          g.linearRampToValueAtTime(0, act.fin);
          act.fuente.stop(act.fin + 0.05);
        } else {
          // Estaba en silencio: arranca en la siguiente nota desde donde se quedó
          const inicio = puntoDeInicio(buf);

          const fuente = ctx.createBufferSource();
          const ganancia = ctx.createGain();

          fuente.buffer = buf;
          fuente.connect(ganancia);
          ganancia.connect(ctx.destination);

          const fin = ahora + DURACION;

          ganancia.gain.setValueAtTime(0, ahora);
          ganancia.gain.linearRampToValueAtTime(VOLUMEN, ahora + 0.01);
          ganancia.gain.setValueAtTime(VOLUMEN, fin - DESVANECER);
          ganancia.gain.linearRampToValueAtTime(0, fin);

          fuente.start(ahora, inicio);
          fuente.stop(fin + 0.05);

          const nuevo = { fuente, ganancia, fin, inicio, inicioCtx: ahora };
          actual.current = nuevo;

          fuente.onended = () => {
            if (actual.current === nuevo && !liberada.current) {
              ultimaPos.current = nuevo.inicio + (nuevo.fin - nuevo.inicioCtx);
            }
          };
        }
      } catch (error) {
        console.error('No se pudo reproducir la canción:', error);
      }
    }

    // ---------- Piano libre: riff rítmico tipo FNF, sin cortar la canción de fondo ----------
    let vocesAleatorias = [];
    let clicsPiano = 0;
    let ultimoArpegioPiano = 0;

    function crearNotaAleatoria(ctx, midi, inicio, duracion, tipo = 'triangle', volumen = 0.12) {
      // Piano electrónico/chiptune: ataque corto, cuerpo brillante y caída rápida.
      const frecuencia = 440 * Math.pow(2, (midi - 69) / 12);
      const oscilador = ctx.createOscillator();
      const armonico = ctx.createOscillator();
      const ganancia = ctx.createGain();
      const filtro = ctx.createBiquadFilter();
      const gananciaArmonico = ctx.createGain();

      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(5200, inicio);
      filtro.frequency.exponentialRampToValueAtTime(1250, inicio + Math.max(0.06, duracion));
      filtro.Q.setValueAtTime(0.8, inicio);

      oscilador.type = tipo;
      oscilador.frequency.setValueAtTime(frecuencia, inicio);
      armonico.type = 'sine';
      armonico.frequency.setValueAtTime(frecuencia * 2.01, inicio);
      gananciaArmonico.gain.setValueAtTime(0.22, inicio);

      ganancia.gain.setValueAtTime(0.0001, inicio);
      ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.006);
      ganancia.gain.exponentialRampToValueAtTime(Math.max(0.0002, volumen * 0.28), inicio + Math.min(0.055, duracion * 0.35));
      ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

      oscilador.connect(filtro);
      armonico.connect(gananciaArmonico);
      gananciaArmonico.connect(filtro);
      filtro.connect(ganancia);
      ganancia.connect(ctx.destination);
      oscilador.start(inicio);
      armonico.start(inicio);
      oscilador.stop(inicio + duracion + 0.035);
      armonico.stop(inicio + duracion + 0.035);
      vocesAleatorias.push(oscilador, armonico);

      const limpiar = () => {
        vocesAleatorias = vocesAleatorias.filter((voz) => voz !== oscilador && voz !== armonico);
        try {
          oscilador.disconnect(); armonico.disconnect(); filtro.disconnect();
          ganancia.disconnect(); gananciaArmonico.disconnect();
        } catch {}
      };
      oscilador.onended = limpiar;
    }

    function tocarClickPunk(ctx) {
      const ahora = ctx.currentTime + 0.018;
      // Piano más cálido y armonioso: melodía en Do mayor, sin ondas cuadradas agresivas.
      const melodia = [72, 76, 79, 76, 74, 76, 79, 81,
                       79, 76, 72, 76, 74, 72, 69, 72,
                       72, 74, 76, 79, 81, 79, 76, 74,
                       67, 71, 74, 79, 76, 74, 72, 72];
      const acordes = [
        [48, 55, 60, 64], // Do mayor
        [45, 52, 57, 60], // La menor
        [41, 48, 53, 57], // Fa mayor
        [43, 50, 55, 59], // Sol mayor
      ];
      const paso = clicsPiano % melodia.length;
      const nota = melodia[paso];
      const acorde = acordes[Math.floor(paso / 8) % acordes.length];
      const sincopa = paso % 4 === 2 ? 0.025 : 0;
      const inicio = ahora + sincopa;

      // Nota principal redonda, como una tecla de piano suave.
      crearNotaAleatoria(ctx, nota, inicio, 0.34, 'triangle', 0.072);

      // Una octava suave en algunos clics para dar profundidad sin endurecer el sonido.
      if (paso % 3 === 0) {
        crearNotaAleatoria(ctx, nota - 12, inicio + 0.012, 0.38, 'sine', 0.026);
      }

      // Acompañamiento armónico espaciado: notas del acorde, suaves y ligeramente arpegiadas.
      if (paso % 4 === 0) {
        [acorde[1], acorde[2], acorde[3]].forEach((n, i) => {
          crearNotaAleatoria(ctx, n + 12, inicio + 0.045 + i * 0.055, 0.42, 'sine', 0.022);
        });
      }

      clicsPiano += 1;

      // Cada ocho clics aparece una pequeña frase fluida, sin sonidos eléctricos.
      if (clicsPiano % 8 === 0 && ctx.currentTime >= ultimoArpegioPiano) {
        ultimoArpegioPiano = ctx.currentTime + 0.7;
        const patron = paso < 16
          ? [72, 76, 79, 84, 79, 76, 74, 72]
          : [72, 74, 76, 79, 81, 79, 76, 72];
        const beat = 60 / 112 / 2;
        patron.forEach((n, i) => {
          crearNotaAleatoria(ctx, n, ahora + i * beat, 0.30, 'sine', 0.032);
        });
      }
    }

    async function tocarCancionAleatoria() {
      const ctx = obtenerContexto();
      if (!ctx || !liberada.current || juego.activo) return;
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        // Importante: solo añade notas al mismo AudioContext; nunca pausa ni reinicia el fondo.
        tocarClickPunk(ctx);
      } catch (error) {
        console.error('No se pudo reproducir el piano rítmico:', error);
      }
    }

    // ---------- Piano: mostrar / esconder ----------
    let pianoVisible = false;
    let temporizadorPiano = null;

    gsap.set(pianoRef.current, { xPercent: -50, y: 200, autoAlpha: 0 });
    gsap.set(hudRef.current, { opacity: 0 });
    gsap.set(juicioRef.current, { xPercent: -50, opacity: 0 });

    function ocultarPiano() {
      if (juego.activo) return;
      pianoVisible = false;
      gsap.to(pianoRef.current, {
        y: 200,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }

    function reiniciarIdle() {
      clearTimeout(temporizadorPiano);
      if (!juego.activo && !liberada.current) {
        temporizadorPiano = setTimeout(ocultarPiano, IDLE_PIANO);
      }
    }

    function mostrarPiano() {
      if (!pianoVisible) {
        pianoVisible = true;
        gsap.to(pianoRef.current, {
          y: 0,
          autoAlpha: 1,
          duration: 0.35,
          ease: 'back.out(1.6)',
          overwrite: 'auto',
        });
      }
      reiniciarIdle();
    }

    // La tecla se hunde y se tiñe un instante, luego vuelve al marfil
    function flashTecla(i) {
      const el = teclasRef.current[i];
      if (!el) return;
      gsap.fromTo(
        el,
        { backgroundColor: CIAN, y: 5 },
        { backgroundColor: MARFIL, y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }
      );
    }

    // ---------- Efectos ----------
    function explosion(x, y, cantidad, alcance, tam) {
      for (let i = 0; i < cantidad; i += 1) {
        const ang = (Math.PI * 2 * i) / cantidad;
        const img = document.createElement('img');
        img.src = estrella;
        img.alt = '';
        Object.assign(img.style, {
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          width: `${tam}px`,
          pointerEvents: 'none',
          zIndex: 9999,
        });
        document.body.appendChild(img);

        gsap.fromTo(
          img,
          { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, opacity: 1 },
          {
            x: Math.cos(ang) * alcance,
            y: Math.sin(ang) * alcance,
            scale: 0.2,
            opacity: 0,
            rotation: 180,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => img.remove(),
          }
        );
      }
    }

    // Cartel discreto arriba: "15x", "30x"
    function mostrarHito(n) {
      const caja = document.createElement('div');
      Object.assign(caja.style, {
        position: 'fixed',
        left: '50%',
        top: '70px',
        zIndex: 10000,
        pointerEvents: 'none',
        textAlign: 'center',
        fontWeight: '900',
        textTransform: 'uppercase',
      });
      caja.setAttribute('aria-hidden', 'true');

      const num = document.createElement('div');
      num.textContent = `${n}x`;
      Object.assign(num.style, {
        fontSize: 'clamp(48px, 7vw, 84px)',
        lineHeight: 1,
        color: CIAN,
        WebkitTextStroke: '8px #fff',
        paintOrder: 'stroke fill',
        textShadow: `4px 4px 0 ${AZUL_OSCURO}`,
      });

      const frase = document.createElement('div');
      frase.textContent = FRASES_HITO[n] || '';
      Object.assign(frase.style, {
        display: frase.textContent ? 'inline-block' : 'none',
        marginTop: '4px',
        padding: '2px 12px',
        background: AMARILLO,
        color: AZUL_OSCURO,
        border: `3px solid ${AZUL_OSCURO}`,
        borderRadius: '8px',
        fontSize: 'clamp(13px, 1.6vw, 18px)',
        boxShadow: `3px 3px 0 ${AZUL_OSCURO}`,
      });

      caja.append(num, frase);
      document.body.appendChild(caja);

      gsap.set(caja, { xPercent: -50 });

      gsap
        .timeline({ onComplete: () => caja.remove() })
        .fromTo(
          caja,
          { scale: 0.3, opacity: 0, y: -20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }
        )
        .to(caja, { duration: 0.7 })
        .to(caja, { y: -20, opacity: 0, duration: 0.3, ease: 'power2.in' });

      explosion(window.innerWidth / 2, 110, 8, 110, 24);
    }

    // ---------- Escena macabra: fantasmas, esqueletos y huesos al desbloquear la música ----------
    const extras = []; // todo lo que crea la escena, para limpiarlo si se desmonta el componente

    function elementoEscena(texto, tam, z = 9995) {
      const el = document.createElement('div');
      el.textContent = texto;
      el.setAttribute('aria-hidden', 'true');
      Object.assign(el.style, {
        position: 'fixed',
        left: 0,
        top: 0,
        fontSize: `${tam}px`,
        lineHeight: 1,
        zIndex: z,
        pointerEvents: 'none',
        userSelect: 'none',
        willChange: 'transform',
      });
      document.body.appendChild(el);
      extras.push(el);
      return el;
    }

    function escenaMacabra() {
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Viñeta oscura con destello inicial
      const vineta = document.createElement('div');
      Object.assign(vineta.style, {
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        pointerEvents: 'none',
        opacity: 0,
        background:
          'radial-gradient(ellipse at center, rgba(5,8,30,0) 25%, rgba(5,8,30,0.88) 100%)',
      });
      document.body.appendChild(vineta);
      extras.push(vineta);

      gsap
        .timeline({ onComplete: () => vineta.remove() })
        .fromTo(
          vineta,
          { backgroundColor: 'rgba(255,255,255,0.9)' },
          { backgroundColor: 'rgba(255,255,255,0)', duration: 0.4 },
          0
        )
        .to(vineta, { opacity: 1, duration: 1.2 }, 0)
        .to(vineta, { duration: 5.5 })
        .to(vineta, { opacity: 0, duration: 2 });

      // Fantasmas: suben flotando y se ondulan
      for (let i = 0; i < N_FANTASMAS; i += 1) {
        const tam = gsap.utils.random(36, 90);
        const g = elementoEscena('👻', tam);
        const x0 = gsap.utils.random(0, Math.max(0, W - tam));
        const dur = gsap.utils.random(5, 8);

        gsap.set(g, {
          x: x0,
          y: H + 60,
          opacity: 0,
          rotation: gsap.utils.random(-15, 15),
        });

        gsap
          .timeline({
            delay: gsap.utils.random(0.3, 3.5),
            onComplete: () => g.remove(),
          })
          .to(g, { y: -tam - 80, duration: dur, ease: 'none' }, 0)
          .to(g, { opacity: 0.85, duration: 1 }, 0)
          .to(g, { opacity: 0, duration: 1.2 }, dur - 1.2)
          .to(
            g,
            {
              x: `+=${gsap.utils.random(-120, 120)}`,
              rotation: gsap.utils.random(-25, 25),
              duration: dur / 4,
              ease: 'sine.inOut',
              repeat: 3,
              yoyo: true,
            },
            0
          );
      }

      // Esqueletos: salen del suelo y bailan (danse macabre)
      for (let i = 0; i < N_ESQUELETOS; i += 1) {
        const tam = gsap.utils.random(64, 96);
        const s = elementoEscena('💀', tam, 9996);
        const x = ((i + 0.5) / N_ESQUELETOS) * W - tam / 2;
        const baile = gsap.utils.random(0.28, 0.4);

        gsap.set(s, { x, y: H + 20, rotation: 0, transformOrigin: '50% 100%' });

        gsap
          .timeline({
            delay: 0.6 + i * 0.25,
            onComplete: () => s.remove(),
          })
          .to(s, { y: H - tam - 8, duration: 0.7, ease: 'back.out(1.8)' })
          // Balanceo + saltito al ritmo
          .to(
            s,
            { rotation: 18, duration: baile, ease: 'sine.inOut', repeat: 13, yoyo: true },
            '>'
          )
          .to(
            s,
            {
              y: `-=${gsap.utils.random(14, 30)}`,
              duration: baile / 2,
              ease: 'power1.out',
              repeat: 27,
              yoyo: true,
            },
            '<'
          )
          .to(s, { y: H + 40, opacity: 0, duration: 0.8, ease: 'power2.in' });
      }

      // Lluvia de huesos
      for (let i = 0; i < N_HUESOS; i += 1) {
        const h = elementoEscena('🦴', gsap.utils.random(20, 34), 9994);
        gsap.set(h, {
          x: gsap.utils.random(0, W),
          y: -50,
          rotation: gsap.utils.random(0, 360),
        });
        gsap.to(h, {
          y: H + 50,
          rotation: `+=${gsap.utils.random(-540, 540)}`,
          duration: gsap.utils.random(2.2, 4),
          delay: gsap.utils.random(1, 6),
          ease: 'power1.in',
          onComplete: () => h.remove(),
        });
      }
    }

    // Texto de juicio sobre la línea: "¡Perfecto!", "¡Bien!", "Fallo"
    function juicio(texto, color = CIAN, duracion = 0.7) {
      const el = juicioRef.current;
      if (!el) return;
      el.textContent = texto;
      el.style.color = color;
      gsap.fromTo(
        el,
        { opacity: 1, scale: 1.4, y: 0 },
        { opacity: 0, scale: 1, y: -20, duration: duracion, ease: 'power2.out', overwrite: 'auto' }
      );
    }

    // ---------- Modo juego ----------
    const juego = {
      activo: false,
      t0: 0, // instante (reloj de audio) en que la canción está en el segundo 0
      fuente: null,
      ganancia: null,
      idx: 0, // siguiente nota por aparecer
      activas: [], // notas que están bajando
      combo: 0,
      aciertos: 0, // aciertos totales de la partida (no se reinician al fallar)
      vida: 0,
      alto: 0,
      cooldown: 0,
    };

    // Segundo de la canción que se está escuchando ahora mismo
    function posicion() {
      const ctx = audio.current;
      const latencia = ctx.outputLatency || ctx.baseLatency || 0;
      return ctx.currentTime - juego.t0 - latencia + AJUSTE_AUDIO;
    }

    function limpiarNotas() {
      juego.activas.forEach((n) => n.el.remove());
      juego.activas = [];
    }

    function cerrarCarril() {
      gsap.to(carrilRef.current, {
        height: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }

    function crearNota(d) {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '0',
        width: `${TAM_NOTA}px`,
        height: `${TAM_NOTA}px`,
        marginLeft: `${-TAM_NOTA / 2}px`,
        pointerEvents: 'none',
        willChange: 'transform',
      });

      const cuerpo = document.createElement('div');
      Object.assign(cuerpo.style, {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: '10px',
        background: COLORES[d.lane],
        border: '3px solid #fff',
        boxShadow: `2px 2px 0 ${AZUL_OSCURO}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: '900',
        fontSize: '22px',
        textShadow: `1px 1px 0 ${AZUL_OSCURO}`,
      });
      cuerpo.textContent = TECLAS[d.lane];

      el.appendChild(cuerpo);
      columnasRef.current[d.lane].appendChild(el);

      juego.activas.push({ ...d, el, cuerpo, resuelta: false });
    }

    function bajarVolumen() {
      if (!juego.ganancia) return;
      const ctx = audio.current;
      const ahora = ctx.currentTime;
      const g = juego.ganancia.gain;
      g.cancelScheduledValues(ahora);
      g.setValueAtTime(VOLUMEN_JUEGO * 0.3, ahora);
      g.linearRampToValueAtTime(VOLUMEN_JUEGO, ahora + 0.6);
    }

    function fallo() {
      juego.combo = 0;
      juego.vida = Math.max(0, juego.vida - VIDA_FALLO);
      setCombo(0);
      juicio('Fallo', '#ff7a7a', 0.5);
      bajarVolumen();
      if (juego.vida <= 0) terminarJuego('Se acabó la música');
    }

    function acierto(nota, diff) {
      const perfecto = diff <= VENTANA_PERFECTO;

      nota.resuelta = true;
      juego.activas.splice(juego.activas.indexOf(nota), 1);
      gsap.to(nota.cuerpo, {
        scale: 1.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => nota.el.remove(),
      });

      juego.combo += 1;
      juego.aciertos += 1;
      juego.vida = Math.min(1, juego.vida + (perfecto ? VIDA_PERFECTO : VIDA_BIEN));
      setCombo(juego.combo);

      juicio(perfecto ? '¡Perfecto!' : '¡Bien!', perfecto ? AMARILLO : CIAN);
      gsap.fromTo(
        hudRef.current,
        { scale: 1.08 },
        { scale: 1, duration: 0.15, ease: 'power2.out' }
      );

      if (HITOS.includes(juego.aciertos)) mostrarHito(juego.aciertos);
      if (juego.aciertos >= META) liberarMusica();
    }

    // El jugador pulsa la tecla del carril i
    function golpear(i) {
      flashTecla(i);

      const pos = posicion();
      const nota = juego.activas.find(
        (n) => !n.resuelta && n.lane === i && Math.abs(n.t - pos) <= VENTANA_BIEN
      );

      if (nota) {
        acierto(nota, Math.abs(nota.t - pos));
      } else {
        juego.vida = Math.max(0, juego.vida - VIDA_SOBRA);
        if (juego.vida <= 0) terminarJuego('Se acabó la música');
      }
    }

    async function iniciarJuego() {
      if (juego.activo || liberada.current) return;
      if (performance.now() < juego.cooldown) return;

      const ctx = obtenerContexto();
      if (!ctx) return;

      try {
        if (ctx.state === 'suspended') await ctx.resume();

        const buf = await cargarCancion();
        if (!buf || audio.current !== ctx || juego.activo || liberada.current) return;

        const ahora = ctx.currentTime;

        // Se apaga lo que sonaba en modo libre
        const act = actual.current;
        if (act && ahora < act.fin) {
          const g = act.ganancia.gain;
          g.cancelScheduledValues(ahora);
          g.setValueAtTime(g.value, ahora);
          g.linearRampToValueAtTime(0, ahora + 0.15);
          act.fuente.stop(ahora + 0.2);
        }
        actual.current = null;

        // La canción arranca después de dejar caer las primeras notas
        juego.t0 = ahora + CAIDA + 0.15;
        juego.idx = 0;
        juego.activas = [];
        juego.combo = 0;
        juego.aciertos = 0;
        juego.vida = VIDA_INICIAL;
        juego.alto = Math.min(window.innerHeight * 0.55, ALTO_CARRIL_MAX);

        const fuente = ctx.createBufferSource();
        const ganancia = ctx.createGain();

        fuente.buffer = buf;
        ganancia.gain.value = VOLUMEN_JUEGO;
        fuente.connect(ganancia);
        ganancia.connect(ctx.destination);
        fuente.start(juego.t0, 0);

        fuente.onended = () => {
          if (juego.fuente === fuente && juego.activo) terminarJuego('¡Terminaste la canción!');
        };

        juego.fuente = fuente;
        juego.ganancia = ganancia;
        juego.activo = true;

        setCombo(0);
        setModo('juego');
        clearTimeout(temporizadorPiano);
        mostrarPiano();

        gsap.to(carrilRef.current, {
          height: juego.alto,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(hudRef.current, { opacity: 1, duration: 0.3, overwrite: 'auto' });
        juicio('¡Prepárate!', '#ffffff', 1.4);
      } catch (error) {
        console.error('No se pudo empezar el juego:', error);
      }
    }

    function terminarJuego(texto) {
      if (!juego.activo) return;
      juego.activo = false;

      const ctx = audio.current;
      if (ctx && juego.ganancia && juego.fuente) {
        const ahora = ctx.currentTime;
        const g = juego.ganancia.gain;
        g.cancelScheduledValues(ahora);
        g.setValueAtTime(g.value, ahora);
        g.linearRampToValueAtTime(0, ahora + 0.5);
        try {
          juego.fuente.stop(ahora + 0.55);
        } catch {
          /* ya había terminado */
        }
      }

      limpiarNotas();
      cerrarCarril();
      setModo('libre');
      setCombo(0);
      gsap.to(hudRef.current, { opacity: 0, duration: 0.4, overwrite: 'auto' });
      juicio(texto, '#ffffff', 1.6);

      juego.cooldown = performance.now() + 1200;
      reiniciarIdle();
    }

    // 30 aciertos en total: la canción que ya suena pasa a ser la música de fondo
    function liberarMusica() {
      const ctx = audio.current;
      const buf = buffer.current;
      if (!ctx || !buf || liberada.current || !juego.fuente) return;

      liberada.current = true;
      juego.activo = false;

      const ahora = ctx.currentTime;

      // Sin cortes: lo que suena se vuelve bucle y sube al volumen de fondo
      juego.fuente.loop = true;
      juego.fuente.loopStart = 0;
      juego.fuente.loopEnd = buf.duration;

      const g = juego.ganancia.gain;
      g.cancelScheduledValues(ahora);
      g.setValueAtTime(g.value, ahora);
      g.linearRampToValueAtTime(VOLUMEN_FONDO, ahora + ENTRADA_FONDO);

      limpiarNotas();
      cerrarCarril();
      clearTimeout(temporizadorPiano);
      ocultarPiano();
      setModo('libre');
      gsap.to(hudRef.current, { opacity: 0, duration: 0.6, delay: 0.8, overwrite: 'auto' });

      // Avisa al resto de la página (el disco empieza a girar, etc.)
      window.dispatchEvent(
        new CustomEvent('musica-fondo', { detail: { sonando: true } })
      );

      // Fantasmas y esqueletos 💀
      escenaMacabra();
    }

    // El vinilo pausa / reanuda SOLO la música de fondo.
    // El contexto de audio sigue activo para que los clics de piano puedan sonar encima
    // sin reactivar accidentalmente la canción cuando el vinilo está pausado.
    const controlMusica = (e) => {
      const ctx = audio.current;
      const gananciaFondo = juego.ganancia?.gain;
      if (!ctx || !liberada.current || !gananciaFondo) return;

      const ahora = ctx.currentTime;
      gananciaFondo.cancelScheduledValues(ahora);
      gananciaFondo.setValueAtTime(gananciaFondo.value, ahora);
      gananciaFondo.linearRampToValueAtTime(
        e.detail?.sonando ? VOLUMEN_FONDO : 0,
        ahora + 0.12
      );
    };

    // Cada cuadro: aparecen las notas que ya toca, bajan, y se marcan las que se pasaron
    const latido = () => {
      if (!juego.activo) return;

      const pos = posicion();
      const vel = juego.alto / CAIDA;

      while (juego.idx < NOTAS.length && NOTAS[juego.idx].t - pos < CAIDA) {
        crearNota(NOTAS[juego.idx]);
        juego.idx += 1;
      }

      for (let k = juego.activas.length - 1; k >= 0; k -= 1) {
        const n = juego.activas[k];

        if (pos - n.t > VENTANA_BIEN) {
          // Se pasó sin que la tocaran
          n.resuelta = true;
          juego.activas.splice(k, 1);
          n.cuerpo.style.background = '#8a8fa3';
          gsap.to(n.cuerpo, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => n.el.remove(),
          });
          fallo();
          if (!juego.activo) return;
        } else {
          const y = juego.alto - (n.t - pos) * vel - TAM_NOTA / 2;
          n.el.style.transform = `translateY(${y}px)`;
        }
      }

      if (barraRef.current) {
        barraRef.current.style.transform = `scaleX(${Math.max(0, juego.vida)})`;
      }
    };

    gsap.ticker.add(latido);

    // ---------- Entradas ----------
    function tocarNota(e) {
      // Los clics sobre el piano los maneja el piano
      if (e?.target?.closest?.('[data-piano]')) return;

      animarEstrella();

      // Tras desbloquear la música, cada clic crea una melodía aleatoria.
      if (juego.activo) return;
      if (liberada.current) {
        tocarCancionAleatoria();
        return;
      }

      mostrarPiano();
      sonar();
    }

    // Una tecla del piano (con teclado o mouse)
    function tocarTecla(i) {
      if (liberada.current) {
        flashTecla(i);
        animarEstrella();
        tocarCancionAleatoria();
        return;
      }

      if (juego.activo) {
        golpear(i);
        return;
      }

      flashTecla(i);
      animarEstrella();
      mostrarPiano();
      sonar();
    }

    pulsarRef.current = tocarTecla;
    iniciarRef.current = iniciarJuego;

    const teclado = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = e.target;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return;

      if (e.key === 'Escape' && juego.activo && !e.repeat) {
        terminarJuego('Juego cancelado');
        return;
      }

      // Espacio con el piano a la vista: empieza el juego
      if (e.code === 'Space' || e.key === ' ') {
        if (e.repeat) return;
        if (pianoVisible && !juego.activo && !liberada.current) {
          e.preventDefault();
          iniciarJuego();
        }
        return;
      }

      // Solo cuentan las 4 flechas
      const i = CODIGOS.indexOf(e.key);
      if (i < 0) return;

      // Durante el juego las flechas no deben mover la página
      if (juego.activo) e.preventDefault();

      // La estrella reacciona como un clic mientras la flecha siga presionada
      animarEstrella();

      if (e.repeat) {
        // Tecla mantenida: en modo libre la música sigue sonando; en el juego no cuenta otro golpe
        if (!juego.activo && !liberada.current) {
          mostrarPiano();
          sonar();
        }
        return;
      }

      tocarTecla(i);
    };

    // Carga la canción en cuanto el usuario se mueve, para que la 1.ª nota no tarde
    const precargar = () => cargarCancion();

    const move = (e) => {
      cx(e.clientX);
      cy(e.clientY);

      gsap.to(cur, { opacity: 1, scale: 1, duration: 0.25, overwrite: 'auto' });
    };

    const over = (e) => {
      if (e.target.closest?.('a, button, [role="button"]')) {
        gsap.to(cur, {
          scale: 1.5,
          rotation: '+=45',
          duration: 0.3,
          ease: 'back.out(2)',
          overwrite: 'auto',
        });
      }
    };

    const out = (e) => {
      if (e.target.closest?.('a, button, [role="button"]')) {
        gsap.to(cur, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      }
    };

    document.addEventListener('click', tocarNota);
    window.addEventListener('musica-control', controlMusica);
    window.addEventListener('keydown', teclado);
    window.addEventListener('pointermove', precargar, { once: true });
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);

    return () => {
      document.removeEventListener('click', tocarNota);
      window.removeEventListener('musica-control', controlMusica);
      window.removeEventListener('keydown', teclado);
      window.removeEventListener('pointermove', precargar);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      gsap.ticker.remove(latido);
      clearTimeout(temporizadorPiano);

      gsap.killTweensOf([
        cur,
        hudRef.current,
        pianoRef.current,
        carrilRef.current,
        juicioRef.current,
      ]);

      // Limpia la escena macabra si seguía en pantalla
      extras.forEach((el) => {
        gsap.killTweensOf(el);
        el.remove();
      });
      extras.length = 0;

      juego.activo = false;
      limpiarNotas();
      pulsarRef.current = null;
      iniciarRef.current = null;

      vocesAleatorias.forEach((voz) => {
        try {
          voz.stop();
        } catch {
          // La voz ya había terminado.
        }
      });
      vocesAleatorias = [];

      if (audio.current) {
        audio.current.close();
        audio.current = null;
      }

      buffer.current = null;
      cargando.current = null;
      actual.current = null;
      ultimaPos.current = null;
      liberada.current = false;
    };
  }, []);

  return (
    <>
      {/* zIndex alto para que la estrella se vea por encima del piano */}
      <div className="cursor" ref={ref} aria-hidden="true" style={{ zIndex: 10001 }}>
        <img src={estrella} alt="" />
      </div>

      {fine && (
        <>
          {/* Combo y vida (solo durante el juego) */}
          <div
            ref={hudRef}
            aria-hidden="true"
            style={{
              position: 'fixed',
              right: 16,
              top: 16,
              zIndex: 9998,
              minWidth: 92,
              padding: '6px 12px 8px',
              borderRadius: 10,
              background: AZUL,
              border: '2px solid #fff',
              boxShadow: `3px 3px 0 ${AZUL_OSCURO}`,
              textAlign: 'center',
              fontWeight: 800,
              pointerEvents: 'none',
              opacity: 0,
            }}
          >
            <div
              style={{
                fontSize: 24,
                lineHeight: 1,
                color: CIAN,
                WebkitTextStroke: '3px #fff',
                paintOrder: 'stroke fill',
                textShadow: `2px 2px 0 ${AZUL_OSCURO}`,
              }}
            >
              {combo}x
            </div>

            <div
              style={{
                marginTop: 6,
                height: 6,
                borderRadius: 3,
                background: AZUL_OSCURO,
                overflow: 'hidden',
              }}
            >
              <div
                ref={barraRef}
                style={{
                  height: '100%',
                  background: AMARILLO,
                  transformOrigin: 'left center',
                  transform: 'scaleX(0)',
                }}
              />
            </div>
          </div>

          {/* Carriles + piano */}
          <div
            ref={pianoRef}
            data-piano="true"
            role="group"
            aria-label="Piano virtual"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 16,
              zIndex: 9997,
              width: 'min(380px, 92vw)',
              opacity: 0,
              visibility: 'hidden',
            }}
          >
            {modo === 'libre' && (
              <button
                type="button"
                tabIndex={-1}
                onPointerDown={(e) => {
                  e.preventDefault();
                  iniciarRef.current?.();
                }}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 14px',
                  background: AMARILLO,
                  color: AZUL_OSCURO,
                  border: `3px solid ${AZUL_OSCURO}`,
                  borderRadius: 8,
                  boxShadow: `3px 3px 0 ${AZUL_OSCURO}`,
                  fontWeight: 900,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  cursor: 'inherit',
                }}
              >
                ¡Jugar! · espacio
              </button>
            )}

            {/* Carriles por donde bajan las notas */}
            <div
              ref={carrilRef}
              style={{
                position: 'relative',
                height: 0,
                display: 'flex',
                gap: 8,
                padding: '0 12px',
              }}
            >
              {TECLAS.map((t, i) => (
                <div
                  key={t}
                  ref={(el) => {
                    columnasRef.current[i] = el;
                  }}
                  style={{
                    flex: 1,
                    position: 'relative',
                    background:
                      'linear-gradient(to top, rgba(18,115,234,0.55), rgba(18,115,234,0.04))',
                    borderRadius: '8px 8px 0 0',
                  }}
                />
              ))}

              <div
                ref={juicioRef}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 56,
                  fontWeight: 900,
                  fontSize: 26,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  WebkitTextStroke: '5px ' + AZUL_OSCURO,
                  paintOrder: 'stroke fill',
                  opacity: 0,
                }}
              />
            </div>

            {/* Teclas: blancas con borde azul oscuro y tecla negra, sin fondo */}
            <div style={{ display: 'flex', gap: 8, padding: '0 12px' }}>
              {TECLAS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  tabIndex={-1}
                  ref={(el) => {
                    teclasRef.current[i] = el;
                  }}
                  aria-label={`Flecha ${NOMBRES[i]}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    pulsarRef.current?.(i);
                  }}
                  style={{
                    position: 'relative',
                    flex: 1,
                    height: 120,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: 8,
                    backgroundColor: MARFIL,
                    backgroundImage:
                      'linear-gradient(180deg, rgba(27,111,224,0.18), rgba(255,255,255,0) 35%)',
                    border: `3px solid ${AZUL_OSCURO}`,
                    borderRadius: '0 0 12px 12px',
                    boxShadow: `4px 4px 0 ${AZUL_OSCURO}`,
                    color: AZUL,
                    fontFamily: 'var(--font-title, inherit)',
                    fontWeight: 900,
                    fontSize: 26,
                    cursor: 'inherit',
                    overflow: 'hidden',
                  }}
                >
                  {/* Tecla negra con bisel cian */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '56%',
                      height: '52%',
                      borderRadius: '0 0 8px 8px',
                      background: `linear-gradient(90deg, ${AZUL_OSCURO}, #123a9c 50%, ${AZUL_OSCURO})`,
                      border: '2px solid #fff',
                      borderTop: 'none',
                      boxShadow: '2px 3px 0 rgba(11,42,122,0.5)',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '18%',
                        background: `linear-gradient(180deg, ${CIAN}, ${AZUL})`,
                      }}
                    />
                  </span>

                  <span style={{ position: 'relative', pointerEvents: 'none' }}>{t}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}