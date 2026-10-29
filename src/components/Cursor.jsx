import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import estrella from '../assets/estrella.png';
import cancion from '../assets/danse.mp3';

import '../stylesheets/Cursor.css';

const fine =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(hover: hover) and (pointer: fine)').matches;

// Modo juego: tiempo exacto de cada nota y su carril original (0-9).
// Ahora usamos los 10 carriles tal cual: uno por cada tecla blanca (A S D F G H J K L Ñ).
const NOTAS_T = [0.209, 0.998, 1.753, 2.543, 3.344, 4.145, 4.923, 5.7, 6.455, 7.245, 8.835, 14.327, 15.859, 16.579, 18.123, 18.762, 19.911, 20.863, 21.467, 21.838, 22.372, 22.756, 23.324, 23.661, 23.928, 24.23, 24.555, 24.834, 25.124, 25.414, 25.728, 26.041, 26.401, 27.957, 29.141, 29.478, 30.058, 30.383, 30.941, 31.904, 32.403, 33.913, 34.064, 34.215, 34.493, 35.085, 35.225, 35.364, 35.712, 35.852, 35.991, 36.258, 36.56, 36.722, 36.978, 37.442, 37.872, 38.325, 38.475, 39.474, 39.741, 40.054, 40.194, 40.612, 41.169, 41.552, 41.866, 42.214, 42.562, 42.864, 43.189, 44.095, 44.71, 45.023, 45.395, 45.976, 46.312, 48.147, 48.448, 48.739, 49.122, 49.958, 50.573, 52.744, 53.046, 53.975, 54.288, 54.892, 55.217, 55.519, 55.856, 56.123, 56.39, 56.703, 56.842, 57.098, 57.539, 57.678, 57.818, 58.073, 58.387, 58.642, 58.781, 58.921, 59.246, 59.385, 59.757, 60.012, 60.163, 60.43, 60.801, 61.08, 61.336, 61.603, 61.858, 62.102, 62.601, 63.007, 63.321, 63.565, 63.704, 64.122, 64.389, 64.656, 64.946, 65.086, 65.48, 66.305, 66.525, 66.827, 66.966, 67.326, 67.605, 67.849, 68.116, 68.267, 68.627, 68.917, 69.068, 69.312, 69.706, 70.206, 70.763, 71.018, 71.332, 71.68, 72.005, 72.551, 72.957, 73.77, 74.385, 74.629, 75.5, 76.08, 76.312, 77.148, 77.601, 77.845, 78.809, 79.424, 79.563, 79.702, 80.004, 80.144, 80.527, 81.386, 81.711, 81.85, 82.117, 82.826, 83.058, 83.383, 83.789, 84.474, 84.741, 85.194, 85.589, 94.865, 96.467, 100.252, 100.589, 100.926, 102.145, 102.284, 102.679, 102.992, 103.248, 103.387, 103.642, 103.84, 104.083, 104.676, 104.885, 105.163, 105.581, 105.767, 106.022, 106.173, 106.463, 106.626, 106.777, 106.916, 107.346, 107.497, 107.648, 107.938, 108.286, 108.867, 109.145, 109.529, 109.726, 110.434, 110.887, 111.282, 111.491, 111.792, 112.001, 112.268, 112.419, 112.733, 112.872, 113.139, 113.279, 113.615, 113.755, 113.917, 114.161, 114.463, 114.602, 114.753, 115.032, 115.438, 115.705, 115.96, 116.251, 116.506, 116.762, 117.052, 117.33, 117.644, 117.923, 118.224, 118.549, 120.07, 120.361, 120.906, 121.22, 121.371, 121.51, 121.754, 122.067, 122.346, 122.601, 122.903, 123.193, 123.472, 123.739, 123.878, 124.018, 124.285, 124.424, 125.109, 125.411, 125.562, 125.817, 126.224, 126.433, 126.711, 127.106, 127.396, 128.116, 128.255, 128.395, 128.789, 129.649, 129.881, 130.45, 130.705, 130.891, 131.274, 131.843, 132.122, 132.412, 132.957, 133.236, 133.41, 133.793, 134.084, 134.374, 134.641, 135.082, 135.465, 135.628, 135.895, 136.301, 136.858, 137.125, 137.706, 137.845, 137.985, 138.275, 138.414, 138.553, 139.424, 139.68, 139.842, 140.237, 140.399, 140.794, 141.084, 141.34, 142.153, 142.71, 143.0, 143.581, 143.871, 144.405, 144.695, 145.241, 145.543, 146.088, 146.39, 146.657, 146.924, 147.191, 147.458, 147.737, 148.027, 148.538, 148.863, 150.024, 150.593, 150.883, 151.429, 151.708, 151.975, 152.288, 152.822, 153.124, 153.391, 153.67, 153.983, 154.227, 154.494, 154.773, 155.086, 155.341, 155.632, 155.91, 156.177, 156.468, 156.77, 157.025, 157.327, 157.861, 158.163, 158.441, 158.697, 159.022, 159.556, 159.869, 160.16, 160.403, 160.717, 160.984, 161.239, 161.53, 162.075, 162.366, 162.934, 163.225, 163.527, 163.782, 164.084, 164.374, 164.618, 164.92, 165.187, 165.454, 165.756, 166.046, 166.301, 167.636, 167.903, 168.171, 168.705, 169.006, 169.517, 169.819, 170.307, 170.632, 171.131, 171.433, 171.944, 172.234, 172.756, 173.035, 173.325, 173.546, 173.836, 174.08, 174.347, 174.614, 174.869, 175.125, 175.427, 181.859, 195.059, 216.097, 216.886, 217.165, 217.432, 217.71, 217.954, 218.256, 218.477, 218.778, 219.057, 219.312, 219.847, 220.114, 220.276, 220.659, 220.961, 221.17, 221.437, 221.716, 222.018, 227.091, 228.809, 230.597, 231.468, 231.805, 232.374, 232.687, 233.233, 233.535, 233.802, 234.08, 234.44, 234.719, 234.963, 235.265, 235.404, 235.659, 235.892, 236.159, 236.681, 236.983, 237.122, 237.517, 237.807, 238.086, 238.364, 238.643, 238.922, 239.189, 239.583, 240.454, 241.035, 241.371, 242.289, 243.229, 243.81, 244.123, 245.087, 245.981, 248.779, 249.371, 249.696, 250.253, 250.578, 251.182, 251.495, 252.401, 252.993, 253.306, 254.235, 258.984, 259.889, 260.853, 261.77, 261.933, 262.653, 263.488, 264.406, 265.3, 266.147, 267.006, 267.912, 268.771, 268.98, 270.002, 270.269, 270.536, 271.372, 272.219, 272.718, 273.032, 273.566, 273.868, 274.646, 274.924, 275.226, 275.528, 275.818, 276.132, 276.422, 276.666, 276.968, 277.246, 278.129, 278.314, 278.628, 278.895, 279.174, 279.487, 279.777, 280.044, 280.323, 280.602, 280.915, 281.159, 281.472, 281.612, 282.041, 282.331, 282.668, 282.947, 283.469, 283.736, 284.003, 284.294, 284.561, 284.862, 286.314, 286.848, 287.126, 287.393, 287.672, 287.846, 288.845, 289.564, 289.924, 290.226, 290.505, 290.783, 291.062, 291.318, 291.654, 310.88, 311.74, 312.599, 314.758, 315.002, 315.397, 315.664, 316.105, 316.244, 316.395, 316.639, 316.918, 317.301, 317.568, 318.404, 319.147, 319.565, 319.936, 323.965, 326.264, 328.423, 329.004, 329.271, 329.526, 329.793, 330.118, 330.35, 330.629, 331.221, 335.377, 335.61, 335.923, 336.062, 336.759, 337.281, 338.117, 338.419, 338.593, 338.93, 339.267, 339.801, 340.59, 340.904, 341.438, 342.227, 342.692, 345.455, 348.648, 348.903, 349.402, 349.693, 350.145, 351.782, 352.56, 353.361, 354.162, 354.673, 354.94, 355.196, 355.451, 355.695, 357.111, 357.251, 357.994, 358.272, 358.539, 358.783, 359.549, 360.339, 361.094, 361.419, 361.686, 361.941, 362.173, 362.417, 362.649, 362.905, 363.137, 363.392, 363.81, 365.529, 366.005, 366.225, 366.481, 366.701, 366.968, 367.421, 367.688, 369.128, 369.383, 369.813, 370.59, 371.287, 372.03, 372.75, 373.493, 374.224, 374.491, 374.921, 375.176, 376.349, 378.95, 379.414, 379.867, 380.238, 390.618, 395.343, 397.096, 403.621, 404.236, 409.693, 412.398, 418.052, 418.366, 418.54, 419.004, 420.107, 420.258, 422.696, 422.986, 423.149, 425.459, 426.272];
const NOTAS_L = '4444444444410110499449497494949402244532522333642438638588768573400675555546550407506242546266226424624111116653555419442426649313615555449999949740220828220807897898667956858562122474455444581681961789195445445442818880696086999996467464946402756111561662525441000623666622267256695653555729223599918777009819207067878797866787794111163851931851080001913611390151314359116729127171181922799812191991922276661551551152755152018087729609739579789729778356356696695775889757475775111778676111998766149479448079977775837773331889950147107343500710604060999087877888658658769577772598822221441472122180055382056306979820997806257157350221777239070206100097879076755744452144800';

// ---- Piano: 10 teclas blancas (A S D F G H J K L Ñ) y 7 negras (W E T Y U O P) ----
// Las blancas son los 10 carriles del juego. Las negras solo suenan en modo libre.
const CODIGOS_BLANCAS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']; // Semicolon = la tecla Ñ en teclado español
const ETIQUETAS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
const NOMBRES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do', 'Re', 'Mi'];
const MIDI_BLANCAS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];

// despues = índice de la tecla blanca a cuya derecha va la negra
const NEGRAS = [
  { codigo: 'KeyW', etiqueta: 'W', despues: 0, midi: 61 },
  { codigo: 'KeyE', etiqueta: 'E', despues: 1, midi: 63 },
  { codigo: 'KeyT', etiqueta: 'T', despues: 3, midi: 66 },
  { codigo: 'KeyY', etiqueta: 'Y', despues: 4, midi: 68 },
  { codigo: 'KeyU', etiqueta: 'U', despues: 5, midi: 70 },
  { codigo: 'KeyO', etiqueta: 'O', despues: 7, midi: 73 },
  { codigo: 'KeyP', etiqueta: 'P', despues: 8, midi: 75 },
];

// ---- Modo libre ----
const DURACION = 2; // cada clic o tecla mantiene la canción sonando este tiempo más (s)
const DESVANECER = 0.7; // al dejar de tocar, la música se apaga en este tiempo
const VOLUMEN = 1.6; // volumen del modo libre
const IDLE_PIANO = 6000; // ms sin tocar para que el piano se esconda

// ---- Cámara 3D del piano ----
const INCLINACION_LIBRE = 24; // grados que se inclina hacia atrás en modo libre
const INCLINACION_JUEGO = 38; // más inclinado en modo juego: efecto "autopista"
const PARALLAX_X = 9; // grados máximos de giro lateral según el mouse
const PARALLAX_Y = 5; // grados extra de inclinación según el mouse
const ELEVACION_NEGRA = 16; // px que flotan las teclas negras sobre las blancas
const SACUDIDA = 1; // multiplicador de los golpes de cámara (0 = sin sacudidas)

// ---- Música de fondo (al desbloquearla) ----
const VOLUMEN_FONDO = 1;
const ENTRADA_FONDO = 1.5; // segundos que tarda en subir al volumen de fondo

// ---- Escena macabra (al desbloquear la música) ----
const N_FANTASMAS = 14;
const N_ESQUELETOS = 7;
const N_HUESOS = 22;

// ---- Modo juego (como FNF) ----
const META = 50; // aciertos en total (aunque falles y el combo vuelva a 0) para desbloquear la música de fondo
const HITOS = [15, 60]; // aciertos totales que muestran el cartel de arriba
const FRASES_HITO = { 15: '¡Sigue así!', 60: '¡Música desbloqueada!' };

const SEPARACION_MIN = 0.3; // segundos mínimos entre notas (sube = más fácil)
const CAIDA = 1.6; // segundos que tarda una nota en bajar hasta la línea (sube = más lento)
const VENTANA_PERFECTO = 0.06; // ± segundos para "¡Perfecto!"
const VENTANA_BIEN = 0.13; // ± segundos para "¡Bien!"; fuera de esto es fallo
const AJUSTE_AUDIO = 0; // si las notas llegan TARDE al sonido, súbelo (ej. 0.05); si llegan temprano, bájalo

// ---- Notas largas (se derivan solas de los huecos entre notas) ----
// Una nota se vuelve larga si hasta la siguiente nota hay al menos LARGA_MIN_HUECO segundos.
// Dura hasta (siguiente - LARGA_MARGEN), máximo LARGA_MAX. Pon LARGA_MIN_HUECO = Infinity para quitarlas.
const LARGA_MIN_HUECO = 1.1;
const LARGA_MAX = 1.6;
const LARGA_MARGEN = 0.45;
const SOLTAR_TOL = 0.15; // puedes soltar hasta esto antes del final sin fallar (s)

// ---- Notas negras (bonus): se tocan con W E T Y U O P ----
// 1 de cada NEGRA_CADA notas de la canción pasa a ser negra y cae entre dos carriles.
// Pon NEGRA_CADA = 0 para quitarlas.
const NEGRA_CADA = 6;
const VIDA_NEGRA = 0.06; // vida extra por acertar una negra (más que una blanca)

const VIDA_INICIAL = 0.6; // la vida va de 0 a 1
const VIDA_PERFECTO = 0.04;
const VIDA_BIEN = 0.025;
const VIDA_FALLO = 0.1; // pierde esto cuando se pasa una nota
const VIDA_SOBRA = 0.03; // pierde esto si pulsas una tecla sin nota
const VIDA_SOSTENER = 0.05; // gana esto por segundo mientras sostienes una larga
const VIDA_LARGA = 0.04; // bono al completar una larga
const VOLUMEN_JUEGO = 1.2;
const ALTO_CARRIL_MAX = 440; // px
const TAM_NOTA = 30; // px de alto de la cabeza de la nota (se pasa al CSS como --nota)

// Colores que el JS sigue usando (los demás viven en Cursor.css)
const CIAN = '#2fd4ff';
const AMARILLO = '#ffd23f';
const COLORES = ETIQUETAS.map((_, i) => `hsl(${190 + i * 8} 90% 55%)`);

// Notas del juego: un carril (0-9) por tecla blanca, separadas al menos SEPARACION_MIN
const NOTAS = [];
{
  let ultimo = -Infinity;
  NOTAS_T.forEach((t, k) => {
    if (t - ultimo >= SEPARACION_MIN) {
      const lane = Math.min(ETIQUETAS.length - 1, Number(NOTAS_L[k]) || 0);
      NOTAS.push({ t, lane, d: 0, negra: false, bk: -1 });
      ultimo = t;
    }
  });

  // Duración de las notas largas (0 = nota normal)
  NOTAS.forEach((n, k) => {
    const sig = NOTAS[k + 1];
    const hueco = sig ? sig.t - n.t : Infinity;
    n.d = hueco >= LARGA_MIN_HUECO ? Math.min(LARGA_MAX, hueco - LARGA_MARGEN) : 0;
  });

  // Notas negras: algunas notas normales (nunca las largas) pasan a la tecla negra más cercana
  if (NEGRA_CADA > 0) {
    NOTAS.forEach((n, k) => {
      if (n.d > 0 || k % NEGRA_CADA !== NEGRA_CADA - 1) return;
      let j = NEGRAS.findIndex((b) => b.despues === n.lane);
      if (j < 0) j = NEGRAS.findIndex((b) => b.despues === n.lane - 1);
      if (j >= 0) {
        n.negra = true;
        n.bk = j;
      }
    });
  }
}

export default function Cursor() {
  const ref = useRef(null);
  const audio = useRef(null);
  const buffer = useRef(null);
  const cargando = useRef(null);
  const hudRef = useRef(null);
  const estrellaRef = useRef(null); // botón de la esquina para rejugar la canción completa
  const barraRef = useRef(null);
  const pianoRef = useRef(null);
  const camaraRef = useRef(null); // cámara 3D (respira / se sacude)
  const escenaRef = useRef(null); // plano inclinado (parallax con el mouse)
  const tecladoRef = useRef(null); // marco del teclado (reflejo de luz)
  const carrilRef = useRef(null);
  const juicioRef = useRef(null);
  const columnasRef = useRef([]);
  const teclasRef = useRef([]); // teclas blancas
  const negrasRef = useRef([]); // teclas negras
  const pulsarRef = useRef(null); // toca una tecla (las teclas en pantalla la usan)
  const soltarRef = useRef(null); // suelta una tecla (las teclas en pantalla la usan)
  const iniciarRef = useRef(null); // empieza el juego (el botón ¡Jugar! la usa)
  const ultimaPos = useRef(null); // segundo de la canción donde quedó el modo libre
  const actual = useRef(null); // reproducción del modo libre
  const liberada = useRef(false); // true cuando la música ya es de fondo
  const [combo, setCombo] = useState(0);
  const [modo, setModo] = useState('libre'); // 'libre' | 'juego'
  const [fondo, setFondo] = useState(false); // true cuando la música ya está desbloqueada

  useEffect(() => {
    if (!fine) return;

    const cur = ref.current;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });

    gsap.set(cur, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.7 });

    // Las teclas se inclinan en 3D desde su borde de atrás (arriba), como un piano de verdad
    // (la perspectiva ahora la da .piano; cada tecla solo necesita su eje de giro)
    gsap.set([...teclasRef.current, ...negrasRef.current].filter(Boolean), {
      transformOrigin: '50% 0%',
    });

    // Las negras flotan sobre las blancas; cada tecla blanca guarda el color de su carril
    gsap.set(negrasRef.current.filter(Boolean), { z: ELEVACION_NEGRA });
    teclasRef.current.forEach((el, i) => el && el.style.setProperty('--c', COLORES[i]));

    // ---------- Cámara 3D ----------
    // Escena inclinada hacia atrás, con "respiración" suave y parallax con el mouse
    const rotX = gsap.quickTo(escenaRef.current, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const rotY = gsap.quickTo(escenaRef.current, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    // La cámara lleva la inclinación base; la escena solo el parallax (así no se pisan)
    gsap.set(escenaRef.current, { rotationX: 0, transformOrigin: '50% 100%' });
    gsap.set(camaraRef.current, { rotationX: INCLINACION_LIBRE, transformOrigin: '50% 100%' });

    // Respiración: la cámara flota muy despacio
    const respiracion = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
    respiracion.to(camaraRef.current, { y: -5, z: 14, rotationZ: 0.35, duration: 2.6 });

    function inclinar(grados, duracion = 0.8) {
      gsap.to(camaraRef.current, {
        rotationX: grados,
        duration: duracion,
        ease: 'power3.inOut',
      });
    }

    // Golpe de cámara: la escena se empuja hacia atrás y rebota
    function golpeCamara(fuerza = 1, lado = 0) {
      const f = fuerza * SACUDIDA;
      if (!f) return;
      gsap.fromTo(
        escenaRef.current,
        { z: -26 * f, rotationZ: lado * 1.6 * f },
        { z: 0, rotationZ: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }
      );
    }

    // Onda de luz sobre el plano, desde la tecla pulsada
    function ondaTecla(i, negra) {
      const el = elTecla(i, negra);
      const cont = tecladoRef.current;
      if (!el || !cont) return;
      const color = negra ? CIAN : COLORES[i];
      const r = el.getBoundingClientRect();
      const c = cont.getBoundingClientRect();
      const onda = document.createElement('div');
      onda.className = 'piano-onda';
      onda.style.setProperty('--c', color);
      onda.style.top = `${r.top - c.top + r.height * 0.7}px`;
      onda.style.marginLeft = `${r.left + r.width / 2 - c.left - c.width / 2}px`;
      cont.appendChild(onda);
      gsap.fromTo(
        onda,
        { xPercent: -50, yPercent: -50, scaleX: 0.1, scaleY: 0.03, opacity: 0.9 },
        {
          scaleX: 2.4,
          scaleY: 0.7,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          onComplete: () => onda.remove(),
        }
      );
    }

    // Haz de luz que sube por el carril al acertar
    function hazCarril(i, perfecto) {
      const col = columnasRef.current[i];
      if (!col) return;
      const haz = document.createElement('div');
      haz.className = 'piano-haz';
      haz.style.setProperty('--c', perfecto ? AMARILLO : COLORES[i]);
      col.appendChild(haz);
      gsap.fromTo(
        haz,
        { opacity: 0.9, scaleY: 0.2 },
        {
          opacity: 0,
          scaleY: 1,
          duration: perfecto ? 0.55 : 0.4,
          ease: 'power2.out',
          onComplete: () => haz.remove(),
        }
      );
    }

    // Parallax: la escena sigue al mouse y el reflejo recorre las teclas
    const parallax = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      rotY(nx * PARALLAX_X * 2);
      rotX(-ny * PARALLAX_Y * 2);
      if (tecladoRef.current) {
        tecladoRef.current.style.setProperty('--luz', `${Math.round((nx + 0.5) * 100)}%`);
      }
    };

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

    function animarEstrella() {
      gsap.fromTo(
        cur,
        { scale: 1.5, rotation: '+=45' },
        { scale: 1, duration: 0.35, ease: 'back.out(2)', overwrite: 'auto' }
      );
    }

    // Simula un clic del mouse: el cursor se "presiona", gira y rebota, con un aro que se expande
    function clicCursor(perfecto = false) {
      gsap.fromTo(
        cur,
        { scale: perfecto ? 0.65 : 0.98, rotation: '+=0' },
        {
          scale: 1,
          rotation: perfecto ? '+=90' : '+=45',
          duration: 0.35,
          ease: 'back.out(3)',
          overwrite: 'auto',
        }
      );

      // Aro que sale desde el centro del cursor (como la onda de un clic)
      const r = cur.getBoundingClientRect();
      const aro = document.createElement('div');
      Object.assign(aro.style, {
        position: 'fixed',
        left: `${r.left + r.width / 2}px`,
        top: `${r.top + r.height / 2}px`,
        width: '28px',
        height: '28px',
        boxSizing: 'border-box',
        border: `3px solid ${perfecto ? AMARILLO : CIAN}`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 10000,
      });
      document.body.appendChild(aro);
      gsap.fromTo(
        aro,
        { xPercent: -50, yPercent: -50, scale: 0.4, opacity: 0.9 },
        {
          scale: 2.2,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          onComplete: () => aro.remove(),
        }
      );
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
        } catch { }
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

    // Clic suelto en la página: melodía rítmica sintetizada (suena siempre, esté o no desbloqueada la canción)
    async function tocarCancionAleatoria() {
      const ctx = obtenerContexto();
      if (!ctx || juego.activo) return;
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        // Importante: solo añade notas al mismo AudioContext; nunca pausa ni reinicia el fondo.
        tocarClickPunk(ctx);
      } catch (error) {
        console.error('No se pudo reproducir el piano rítmico:', error);
      }
    }

    // Tecla del piano (tras desbloquear): suena SU nota, encima de la música de fondo
    async function tocarNotaTecla(midi) {
      const ctx = obtenerContexto();
      if (!ctx || !liberada.current || juego.activo) return;
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        const t = ctx.currentTime + 0.012;
        crearNotaAleatoria(ctx, midi, t, 0.55, 'triangle', 0.085);
        crearNotaAleatoria(ctx, midi - 12, t + 0.01, 0.6, 'sine', 0.03);
        crearNotaAleatoria(ctx, midi + 12, t + 0.012, 0.4, 'sine', 0.02);
      } catch (error) {
        console.error('No se pudo reproducir la nota:', error);
      }
    }

    // ---------- Piano: mostrar / esconder ----------
    let pianoVisible = false;
    let temporizadorPiano = null;

    gsap.set(pianoRef.current, { xPercent: -50, y: 200, autoAlpha: 0, rotationX: -18 });
    gsap.set(hudRef.current, { opacity: 0 });
    gsap.set(juicioRef.current, { xPercent: -50, opacity: 0 });

    function ocultarPiano() {
      if (juego.activo) return;
      pianoVisible = false;
      gsap.to(pianoRef.current, {
        y: 200,
        rotationX: -18,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }

    function reiniciarIdle() {
      clearTimeout(temporizadorPiano);
      if (!juego.activo) {
        temporizadorPiano = setTimeout(ocultarPiano, IDLE_PIANO);
      }
    }

    function mostrarPiano() {
      if (!pianoVisible) {
        pianoVisible = true;
        gsap.to(pianoRef.current, {
          y: 0,
          rotationX: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: 'back.out(1.6)',
          overwrite: 'auto',
        });
        // Las teclas "caen" una tras otra al aparecer el piano
        gsap.fromTo(
          [...teclasRef.current].filter(Boolean),
          { z: -40, opacity: 0.4 },
          { z: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.035, overwrite: 'auto' }
        );
        gsap.fromTo(
          negrasRef.current.filter(Boolean),
          { z: ELEVACION_NEGRA + 50 },
          { z: ELEVACION_NEGRA, duration: 0.55, ease: 'bounce.out', stagger: 0.05, delay: 0.2, overwrite: 'auto' }
        );
      }
      reiniciarIdle();
    }

    // ---------- Teclas: estado y animación 3D ----------
    const abajoBlancas = ETIQUETAS.map(() => false); // teclas blancas que están sostenidas ahora

    function elTecla(i, negra) {
      return (negra ? negrasRef.current : teclasRef.current)[i];
    }

    // La tecla se hunde: se inclina hacia adentro desde el borde de atrás y baja un poco
    function bajarTecla(i, negra) {
      const el = elTecla(i, negra);
      if (!el) return;
      if (!negra) abajoBlancas[i] = true;
      el.classList.add('is-down');
      gsap.to(el, {
        rotationX: negra ? -9 : -6,
        y: negra ? 3 : 4,
        z: negra ? ELEVACION_NEGRA - 9 : -7,
        scaleY: 0.985,
        duration: 0.06,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }

    // Al soltarla vuelve rebotando, como un resorte
    function subirTecla(i, negra) {
      const el = elTecla(i, negra);
      if (!el) return;
      if (!negra) abajoBlancas[i] = false;
      el.classList.remove('is-down');
      gsap.to(el, {
        rotationX: 0,
        y: 0,
        z: negra ? ELEVACION_NEGRA : 0,
        scaleY: 1,
        duration: 0.55,
        ease: 'elastic.out(1, 0.45)',
        overwrite: 'auto',
      });
    }

    function soltarTodas() {
      ETIQUETAS.forEach((_, i) => subirTecla(i, false));
      NEGRAS.forEach((_, j) => subirTecla(j, true));
    }

    // Estrellitas que salen de la tecla
    function chispasTecla(i, negra, cantidad = 4, alcance = 46) {
      const el = elTecla(i, negra);
      if (!el) return;
      const r = el.getBoundingClientRect();
      explosion(r.left + r.width / 2, r.top + r.height * (negra ? 0.35 : 0.2), cantidad, alcance, 14);
      ondaTecla(i, negra);
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

    // Cartel discreto arriba: "15x", "30x"  (estilos en Cursor.css)
    function mostrarHito(n) {
      const caja = document.createElement('div');
      caja.className = 'piano-hito';
      caja.setAttribute('aria-hidden', 'true');

      const num = document.createElement('div');
      num.className = 'piano-hito__num';
      num.textContent = `${n}x`;

      const frase = document.createElement('div');
      frase.className = 'piano-hito__frase';
      frase.textContent = FRASES_HITO[n] || '';
      frase.hidden = !frase.textContent;

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
      completo: false, // true cuando se rejuega la canción entera desde la estrella
    };

    // Estado del vinilo (para devolver el fondo como estaba al terminar la partida completa)
    let fondoPausado = false;

    // Segundo de la canción que se está escuchando ahora mismo
    function posicion() {
      const ctx = audio.current;
      const latencia = ctx.outputLatency || ctx.baseLatency || 0;
      return ctx.currentTime - juego.t0 - latencia + AJUSTE_AUDIO;
    }

    function limpiarNotas() {
      juego.activas.forEach((n) => {
        n.pulso?.kill();
        n.el.remove();
      });
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

    // Nota que baja por su carril; si es larga lleva una cola  (estilos en Cursor.css)
    function crearNota(d, vel) {
      const el = document.createElement('div');
      el.className = d.negra ? 'piano-nota piano-nota--negra' : 'piano-nota';
      el.style.setProperty('--nota', `${TAM_NOTA}px`);
      el.style.setProperty('--c', d.negra ? AMARILLO : COLORES[d.lane]);

      // Las negras caen justo entre dos carriles
      let padre = columnasRef.current[d.lane];
      if (d.negra) {
        const izq = columnasRef.current[NEGRAS[d.bk].despues].getBoundingClientRect();
        const der = columnasRef.current[NEGRAS[d.bk].despues + 1].getBoundingClientRect();
        const carril = carrilRef.current.getBoundingClientRect();
        const ancho = izq.width * 0.7;
        el.style.width = `${ancho}px`;
        el.style.left = `${(izq.right + der.left) / 2 - carril.left - ancho / 2}px`;
        el.style.right = 'auto';
        padre = carrilRef.current;
      }

      let cola = null;
      if (d.d > 0) {
        cola = document.createElement('div');
        cola.className = 'piano-nota__cola';
        cola.style.height = `${d.d * vel}px`;
        el.appendChild(cola);
      }

      const cuerpo = document.createElement('div');
      cuerpo.className = 'piano-nota__cuerpo';
      cuerpo.textContent = d.negra ? NEGRAS[d.bk].etiqueta : ETIQUETAS[d.lane];
      el.appendChild(cuerpo);

      padre.appendChild(el);

      juego.activas.push({ ...d, el, cuerpo, cola, resuelta: false, sostenida: false, pulso: null });
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

    // suave = se pasó una nota negra (bonus): pierde algo de vida pero no el combo
    function fallo(suave = false) {
      if (suave) {
        juego.vida = Math.max(0, juego.vida - VIDA_FALLO / 2);
        juicio('Fallo', '#ff7a7a', 0.5);
        if (juego.vida <= 0) terminarJuego('Se acabó la música');
        return;
      }
      juego.combo = 0;
      juego.vida = Math.max(0, juego.vida - VIDA_FALLO);
      setCombo(0);
      juicio('Fallo', '#ff7a7a', 0.5);
      bajarVolumen();
      if (juego.vida <= 0) terminarJuego('Se acabó la música');
    }

    function acierto(nota, diff) {
      const perfecto = diff <= VENTANA_PERFECTO;

      if (nota.d > 0) {
        // Nota larga: la cabeza se queda en la línea mientras la sostienes
        nota.sostenida = true;
        nota.cuerpo.classList.add('is-sostenida');
        nota.pulso = gsap.to(nota.cuerpo, {
          scale: 1.12,
          duration: 0.18,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      } else {
        nota.resuelta = true;
        juego.activas.splice(juego.activas.indexOf(nota), 1);
        gsap.to(nota.cuerpo, {
          scale: 1.8,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => nota.el.remove(),
        });
      }

      juego.combo += 1;
      juego.aciertos += 1;
      juego.vida = Math.min(
        1,
        juego.vida + (nota.negra ? VIDA_NEGRA : perfecto ? VIDA_PERFECTO : VIDA_BIEN)
      );
      setCombo(juego.combo);

      juicio(perfecto ? '¡Perfecto!' : '¡Bien!', perfecto ? AMARILLO : CIAN);
      clicCursor(perfecto); // el cursor "hace clic" con cada nota acertada
      if (nota.negra) chispasTecla(nota.bk, true, perfecto ? 8 : 5, perfecto ? 90 : 60);
      else chispasTecla(nota.lane, false, perfecto ? 7 : 4, perfecto ? 80 : 55);
      hazCarril(nota.lane, perfecto);
      golpeCamara(perfecto ? 0.9 : 0.5, (nota.lane - 4.5) / 4.5);
      gsap.fromTo(
        hudRef.current,
        { scale: 1.08 },
        { scale: 1, duration: 0.15, ease: 'power2.out' }
      );

      // En la partida completa (estrella) no se repiten los hitos ni el desbloqueo
      if (!juego.completo && HITOS.includes(juego.aciertos)) mostrarHito(juego.aciertos);
      if (!juego.completo && juego.aciertos >= META) liberarMusica();
    }

    // Terminaste de sostener una larga
    function completarLarga(n, k) {
      n.resuelta = true;
      juego.activas.splice(k, 1);
      n.pulso?.kill();

      juego.vida = Math.min(1, juego.vida + VIDA_LARGA);
      juicio('¡Largo!', AMARILLO, 0.6);
      chispasTecla(n.lane, false, 6, 70);

      gsap.to(n.cuerpo, { scale: 1.7, opacity: 0, duration: 0.25, overwrite: 'auto' });
      gsap.to(n.cola, { opacity: 0, duration: 0.2, onComplete: () => n.el.remove() });
    }

    // Soltaste una larga antes de tiempo
    function soltarLarga(n, k) {
      n.resuelta = true;
      juego.activas.splice(k, 1);
      n.pulso?.kill();

      n.cuerpo.style.background = '#8a8fa3';
      n.cola.style.background = '#8a8fa3';
      gsap.to(n.cuerpo, { scale: 1, opacity: 0, duration: 0.25, overwrite: 'auto' });
      gsap.to(n.cola, { opacity: 0, duration: 0.25, onComplete: () => n.el.remove() });

      fallo();
    }

    // El jugador pulsa la tecla negra j (W E T Y U O P): solo cuenta si hay una nota negra a tiempo
    function golpearNegra(j) {
      const pos = posicion();
      const nota = juego.activas.find(
        (n) => !n.resuelta && n.negra && n.bk === j && Math.abs(n.t - pos) <= VENTANA_BIEN
      );

      if (nota) {
        acierto(nota, Math.abs(nota.t - pos));
      } else {
        // Pulsar una negra sin nota resta la mitad que una blanca
        juego.vida = Math.max(0, juego.vida - VIDA_SOBRA / 2);
        if (juego.vida <= 0) terminarJuego('Se acabó la música');
      }
    }

    // El jugador pulsa la tecla blanca del carril i
    function golpear(i) {
      const pos = posicion();
      const nota = juego.activas.find(
        (n) =>
          !n.resuelta &&
          !n.sostenida &&
          !n.negra &&
          n.lane === i &&
          Math.abs(n.t - pos) <= VENTANA_BIEN
      );

      if (nota) {
        acierto(nota, Math.abs(nota.t - pos));
      } else {
        juego.vida = Math.max(0, juego.vida - VIDA_SOBRA);
        if (juego.vida <= 0) terminarJuego('Se acabó la música');
      }
    }

    // completo = true cuando viene de la estrella: rejuega la canción entera desde 0
    // (la música de fondo se apaga mientras dura la partida y vuelve al terminar)
    async function iniciarJuego(completo = false) {
      completo = completo === true;
      if (juego.activo) return;
      if (liberada.current !== completo) return; // normal: solo sin desbloquear · completo: solo desbloqueada
      if (performance.now() < juego.cooldown) return;

      const ctx = obtenerContexto();
      if (!ctx) return;

      try {
        if (ctx.state === 'suspended') await ctx.resume();

        const buf = await cargarCancion();
        if (!buf || audio.current !== ctx || juego.activo || liberada.current !== completo) return;

        const ahora = ctx.currentTime;

        // Partida completa: se apaga la música de fondo que sonaba en bucle
        if (completo && juego.ganancia && juego.fuente) {
          const gf = juego.ganancia.gain;
          gf.cancelScheduledValues(ahora);
          gf.setValueAtTime(gf.value, ahora);
          gf.linearRampToValueAtTime(0, ahora + 0.2);
          try {
            juego.fuente.stop(ahora + 0.25);
          } catch {
            /* ya había terminado */
          }
        }
        liberada.current = false;
        juego.completo = completo;

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

        // Avisa a Hero: Laferte debe callarse mientras dura el juego
        window.dispatchEvent(new CustomEvent('musica-juego'));

        setCombo(0);
        setModo('juego');
        inclinar(INCLINACION_JUEGO, 1);
        clearTimeout(temporizadorPiano);
        mostrarPiano();
        clearTimeout(temporizadorPiano); // durante el juego el piano no se esconde

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

      // Avisa a Hero: el vinilo vuelve a estar libre (Laferte podrá retomarse)
      window.dispatchEvent(new CustomEvent('musica-juego-fin'));

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
      inclinar(INCLINACION_LIBRE, 0.8);
      setModo('libre');
      setCombo(0);
      gsap.to(hudRef.current, { opacity: 0, duration: 0.4, overwrite: 'auto' });
      juicio(texto, '#ffffff', 1.6);

      juego.cooldown = performance.now() + 1200;

      // Fin de una partida completa (estrella): la música de fondo vuelve desde el principio
      if (juego.completo) {
        juego.completo = false;
        restaurarFondo();
      }

      reiniciarIdle();
    }

    // Vuelve la canción en bucle como música de fondo (después de una partida completa)
    function restaurarFondo() {
      const ctx = audio.current;
      const buf = buffer.current;
      if (!ctx || !buf) return;

      const ahora = ctx.currentTime + 0.6; // espera a que se apague la partida
      const fuente = ctx.createBufferSource();
      const ganancia = ctx.createGain();

      fuente.buffer = buf;
      fuente.loop = true;
      fuente.loopStart = 0;
      fuente.loopEnd = buf.duration;
      ganancia.gain.setValueAtTime(0, ahora);
      ganancia.gain.linearRampToValueAtTime(fondoPausado ? 0 : VOLUMEN_FONDO, ahora + ENTRADA_FONDO);
      fuente.connect(ganancia);
      ganancia.connect(ctx.destination);
      fuente.start(ahora, 0);

      juego.fuente = fuente;
      juego.ganancia = ganancia;
      liberada.current = true;

      window.dispatchEvent(
        new CustomEvent('musica-fondo', { detail: { sonando: !fondoPausado } })
      );
    }

    // 50 aciertos en total: la canción que ya suena pasa a ser la música de fondo
    function liberarMusica() {
      const ctx = audio.current;
      const buf = buffer.current;
      if (!ctx || !buf || liberada.current || !juego.fuente) return;

      liberada.current = true;
      juego.activo = false;
      setFondo(true);

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

      // Avisa al resto de la página: Laferte se detiene y el vinilo controla Danse
      window.dispatchEvent(
        new CustomEvent('musica-fondo', { detail: { sonando: true } })
      );

      // Fantasmas y esqueletos 💀
      escenaMacabra();

      // Impacto de cámara: el piano se hunde, rebota y las teclas saltan en ola desde el centro
      gsap
        .timeline()
        .to(escenaRef.current, { z: -90, duration: 0.15, ease: 'power2.in', overwrite: 'auto' })
        .to(escenaRef.current, { z: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
        .fromTo(
          teclasRef.current.filter(Boolean),
          { z: 0 },
          { z: 26, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', stagger: { each: 0.045, from: 'center' } },
          0.1
        );
    }

    // El vinilo pausa / reanuda SOLO la música de fondo.
    // El contexto de audio sigue activo para que los clics de piano puedan sonar encima
    // sin reactivar accidentalmente la canción cuando el vinilo está pausado.
    const controlMusica = (e) => {
      fondoPausado = !e.detail?.sonando;
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
    const latido = (_tiempo, delta = 16) => {
      if (!juego.activo) return;

      const pos = posicion();
      const vel = juego.alto / CAIDA;

      while (juego.idx < NOTAS.length && NOTAS[juego.idx].t - pos < CAIDA) {
        crearNota(NOTAS[juego.idx], vel);
        juego.idx += 1;
      }

      for (let k = juego.activas.length - 1; k >= 0; k -= 1) {
        const n = juego.activas[k];

        // Nota larga que se está sosteniendo
        if (n.sostenida) {
          const restante = n.t + n.d - pos;

          if (restante <= 0) {
            completarLarga(n, k);
            continue;
          }

          if (!abajoBlancas[n.lane] && restante > SOLTAR_TOL) {
            soltarLarga(n, k);
            if (!juego.activo) return;
            continue;
          }

          // La cabeza se queda en la línea y la cola se va acortando
          n.el.style.transform = `translateY(${juego.alto - TAM_NOTA / 2}px)`;
          n.cola.style.height = `${restante * vel}px`;
          juego.vida = Math.min(1, juego.vida + VIDA_SOSTENER * (delta / 1000));
          continue;
        }

        if (pos - n.t > VENTANA_BIEN) {
          // Se pasó sin que la tocaran
          n.resuelta = true;
          juego.activas.splice(k, 1);
          n.cuerpo.style.background = '#8a8fa3';
          if (n.cola) {
            n.cola.style.background = '#8a8fa3';
            gsap.to(n.cola, { opacity: 0, duration: 0.25 });
          }
          gsap.to(n.cuerpo, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => n.el.remove(),
          });
          fallo(n.negra);
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
      // Los clics sobre el piano y sobre el vinilo / reproductor no hacen sonar Danse:
      // el vinilo controla Laferte y la música de fondo por su cuenta.
      if (e?.target?.closest?.('[data-piano], [data-no-sonar]')) return;

      // Un clic normal: el cursor rebota y suena el piano sintetizado (melodía rítmica),
      // con la música desbloqueada o sin ella, pero NO aparece el piano.
      // El juego se abre únicamente con la estrella de abajo.
      animarEstrella();

      if (juego.activo) return;
      tocarCancionAleatoria();
    }

    // Una tecla del piano (con teclado o mouse). Solo cuenta durante el juego.
    function tocarTecla(i, negra = false) {
      if (!juego.activo) return;

      bajarTecla(i, negra);
      if (negra) golpearNegra(i);
      else golpear(i);
    }

    // Soltar una tecla: solo si estaba hundida (así el mouse al pasar por encima no la afecta)
    function soltarTecla(i, negra = false) {
      const el = elTecla(i, negra);
      if (el?.classList.contains('is-down')) subirTecla(i, negra);
    }

    pulsarRef.current = tocarTecla;
    soltarRef.current = soltarTecla;
    iniciarRef.current = iniciarJuego;

    function indiceBlanca(e) {
      const i = CODIGOS_BLANCAS.indexOf(e.code);
      if (i >= 0) return i;
      return e.key === 'ñ' || e.key === 'Ñ' ? ETIQUETAS.length - 1 : -1;
    }

    function indiceNegra(e) {
      return NEGRAS.findIndex((n) => n.codigo === e.code);
    }

    const teclado = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = e.target;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return;

      if (e.key === 'Escape' && juego.activo && !e.repeat) {
        terminarJuego('Juego cancelado');
        return;
      }

      // Fuera del juego el teclado no hace nada (la página funciona normal)
      if (!juego.activo) return;

      // Solo cuentan las teclas del piano
      const blanca = indiceBlanca(e);
      const negra = blanca < 0 ? indiceNegra(e) : -1;
      if (blanca < 0 && negra < 0) return;

      // Durante el juego las teclas no deben hacer nada más en la página
      e.preventDefault();

      // Tecla mantenida: no cuenta otro golpe
      if (e.repeat) return;

      if (blanca >= 0) tocarTecla(blanca, false);
      else tocarTecla(negra, true);
    };

    const alSoltar = (e) => {
      const blanca = indiceBlanca(e);
      if (blanca >= 0) {
        soltarTecla(blanca, false);
        return;
      }
      const negra = indiceNegra(e);
      if (negra >= 0) soltarTecla(negra, true);
    };

    // Carga la canción en cuanto el usuario se mueve, para que la 1.ª nota no tarde
    const precargar = () => cargarCancion();

    const move = (e) => {
      cx(e.clientX);
      cy(e.clientY);

      gsap.to(cur, {
        opacity: 1,
        ...(juego.activo ? {} : { scale: 1 }), // durante el juego no tocamos la escala (así no cancela el "clic")
        duration: 0.25,
        overwrite: 'auto',
      });
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
    window.addEventListener('keyup', alSoltar);
    window.addEventListener('blur', soltarTodas);
    window.addEventListener('pointermove', precargar, { once: true });
    window.addEventListener('pointermove', move);
    window.addEventListener('pointermove', parallax);
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);

    return () => {
      document.removeEventListener('click', tocarNota);
      window.removeEventListener('musica-control', controlMusica);
      window.removeEventListener('keydown', teclado);
      window.removeEventListener('keyup', alSoltar);
      window.removeEventListener('blur', soltarTodas);
      window.removeEventListener('pointermove', precargar);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointermove', parallax);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      gsap.ticker.remove(latido);
      clearTimeout(temporizadorPiano);
      respiracion.kill();

      gsap.killTweensOf([
        cur,
        hudRef.current,
        pianoRef.current,
        camaraRef.current,
        escenaRef.current,
        carrilRef.current,
        juicioRef.current,
        ...teclasRef.current,
        ...negrasRef.current,
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
      soltarRef.current = null;
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

  // Estrella de la esquina: entra con un giro y luego late y se balancea
  // Siempre visible (fuera del juego): es la entrada al piano. Antes de desbloquear la canción
  // empieza la partida normal (50 aciertos); después, la canción completa.
  const mostrarEstrella = fine && modo === 'libre';
  useEffect(() => {
    const el = estrellaRef.current;
    if (!mostrarEstrella || !el) return undefined;

    const img = el.querySelector('img');
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { scale: 0, rotation: -270, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(2)', delay: 1 }
    ).to(
      img,
      { rotation: 14, scale: 1.12, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 },
      '>'
    );

    const entrar = () =>
      gsap.to(el, { scale: 1.18, rotation: 72, duration: 0.45, ease: 'back.out(2.5)', overwrite: 'auto' });
    const salir = () =>
      gsap.to(el, { scale: 1, rotation: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    el.addEventListener('pointerenter', entrar);
    el.addEventListener('pointerleave', salir);

    return () => {
      el.removeEventListener('pointerenter', entrar);
      el.removeEventListener('pointerleave', salir);
      tl.kill();
      gsap.killTweensOf([el, img]);
    };
  }, [mostrarEstrella]);

  // Handlers de las teclas en pantalla (mouse / touch)
  const alPulsar = (i, negra) => (e) => {
    e.preventDefault();
    pulsarRef.current?.(i, negra);
  };
  const alSoltarTecla = (i, negra) => () => soltarRef.current?.(i, negra);

  return (
    <>
      {/* zIndex alto para que el cursor se vea por encima del piano */}
      <div className="cursor" ref={ref} aria-hidden="true" style={{ zIndex: 10001 }} />

      {fine && (
        <>
          {/* Combo y vida (solo durante el juego) */}
          <div className="piano-hud" ref={hudRef} aria-hidden="true">
            <div className="piano-hud__combo">{combo}x</div>
            <div className="piano-hud__vida">
              <div className="piano-hud__vida-fill" ref={barraRef} />
            </div>
          </div>

          {/* Carriles + piano */}
          <div
            className="piano"
            ref={pianoRef}
            data-piano="true"
            role="group"
            aria-label="Piano virtual"
          >
            <div className="piano-camara" ref={camaraRef}>
              <div className="piano-escena" ref={escenaRef}>
                {/* Carriles por donde bajan las notas (uno por tecla blanca) */}
                <div className="piano-carril" ref={carrilRef}>
                  {ETIQUETAS.map((t, i) => (
                    <div
                      key={t}
                      className="piano-columna"
                      ref={(el) => {
                        columnasRef.current[i] = el;
                      }}
                    />
                  ))}

                  <div className="piano-juicio" ref={juicioRef} aria-hidden="true" />
                </div>

                {/* Teclado: 10 blancas (A S D F G H J K L Ñ) y 7 negras (W E T Y U O P) */}
                <div className="piano-teclado" ref={tecladoRef}>
                  <div className="piano-teclas">
                    {ETIQUETAS.map((t, i) => {
                      const j = NEGRAS.findIndex((n) => n.despues === i);

                      return (
                        <div className="piano-slot" key={t}>
                          <button
                            type="button"
                            className="piano-tecla"
                            tabIndex={-1}
                            ref={(el) => {
                              teclasRef.current[i] = el;
                            }}
                            aria-label={`Tecla ${t}, ${NOMBRES[i]}`}
                            onPointerDown={alPulsar(i, false)}
                            onPointerUp={alSoltarTecla(i, false)}
                            onPointerLeave={alSoltarTecla(i, false)}
                            onPointerCancel={alSoltarTecla(i, false)}
                          >
                            <span className="piano-tecla__etiqueta">{t}</span>
                          </button>

                          {j >= 0 && (
                            <button
                              type="button"
                              className="piano-negra"
                              tabIndex={-1}
                              ref={(el) => {
                                negrasRef.current[j] = el;
                              }}
                              aria-label={`Tecla ${NEGRAS[j].etiqueta}, sostenido`}
                              onPointerDown={alPulsar(j, true)}
                              onPointerUp={alSoltarTecla(j, true)}
                              onPointerLeave={alSoltarTecla(j, true)}
                              onPointerCancel={alSoltarTecla(j, true)}
                            >
                              <span className="piano-negra__bisel" aria-hidden="true" />
                              <span className="piano-negra__etiqueta">{NEGRAS[j].etiqueta}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="piano-sombra" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Estrella: entrada al juego del piano (infinito). Sin desbloquear: partida normal
              hasta 50 aciertos; desbloqueada: la canción completa desde 0 */}
          {modo === 'libre' && (
            <button
              type="button"
              className="piano-estrella"
              ref={estrellaRef}
              data-no-sonar="true"
              aria-label={fondo ? 'Jugar la canción completa desde el inicio' : 'Jugar al piano'}
              title={fondo ? 'Jugar la canción completa' : 'Jugar al piano'}
              onClick={() => iniciarRef.current?.(fondo)}
            >
              <img src={estrella} alt="" />
            </button>
          )}
        </>
      )}
    </>
  );
}