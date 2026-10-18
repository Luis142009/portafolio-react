import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import cancionUrl from '../assets/expectations.mp3';
import estrella from '../assets/estrella.png';
import stared from '../assets/stared.png';
import carita from '../assets/carita.png';
import '../stylesheets/Violin.css';
import { CHART } from './violinChart.js';

// ---------------------------------------------------------
// AJUSTES DE DIFICULTAD
// ---------------------------------------------------------
const APROX = 1.55;
const POS_MIN = 0.2;
const POS_MAX = 0.93;
const VENT = { perfecto: 0.08, bien: 0.14, ok: 0.22 };
const PRE = 2.4;
const DESFASE = 0;
const INCL = 1;
const VEL_MIN = 110;
const TOL_X = 1.55;
const MUSICA = 0.9;
const MAX_FALLOS = 20;

// Vida: cada fallo quita 5% y cada acierto devuelve 3%.
const VIDA_FALLO = 1 / MAX_FALLOS;
const VIDA_ACIERTO = 0.03;

// Aciertos necesarios para desbloquear Expectations en "Mis canciones"
const META_DESBLOQUEO = 40;

// 3D
const TILT = 40;
const PERSP = 1100;

// De arriba hacia abajo: Mi, La, Re y Sol
const CUERDAS = [
  { nombre: 'Mi', color: '#ffe27a', y: 17, tecla: '1', hz: 2900, g: 2, ic: '#0b2a7a' },
  { nombre: 'La', color: '#7fe3ff', y: 39, tecla: '2', hz: 2100, g: 2.6, ic: '#0b2a7a' },
  { nombre: 'Re', color: '#ffd23f', y: 61, tecla: '3', hz: 1500, g: 3.4, ic: '#0b2a7a' },
  { nombre: 'Sol', color: '#4d8dff', y: 83, tecla: '4', hz: 1000, g: 4.4, ic: '#ffffff' },
];

const TECLAS = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  a: 0,
  s: 1,
  d: 2,
  f: 3,
};

// ---------------------------------------------------------
// PARTITURA
// ---------------------------------------------------------
function crearPartitura() {
  let prevDir = 'arriba';
  let prevI = -1;

  return CHART.map(([t, i, len], id) => {
    let dir;

    if (prevI < 0) dir = 'abajo';
    else if (i > prevI) dir = 'abajo';
    else if (i < prevI) dir = 'arriba';
    else dir = prevDir === 'abajo' ? 'arriba' : 'abajo';

    prevDir = dir;
    prevI = i;

    return {
      id,
      i,
      t,
      len,
      hold: len > 0,
      dir,
    };
  });
}

function asignarPosiciones(lista) {
  let semilla = 20260;

  const rnd = () => {
    semilla = (semilla * 1664525 + 1013904223) >>> 0;
    return semilla / 4294967296;
  };

  const porCuerda = [[], [], [], []];

  lista.forEach((n) => {
    const vivas = porCuerda[n.i].filter(
      (p) => n.t - APROX < p.t + p.len + 0.5
    );

    let mejor = 0.5;
    let mejorD = -1;

    for (let k = 0; k < 14; k++) {
      const f = POS_MIN + rnd() * (POS_MAX - POS_MIN);

      const d = vivas.length
        ? Math.min(...vivas.map((p) => Math.abs(p.f - f)))
        : 1;

      if (d > mejorD) {
        mejorD = d;
        mejor = f;
      }

      if (d >= 0.14) break;
    }

    n.uf = mejor;
    porCuerda[n.i].push({
      t: n.t,
      len: n.len,
      f: mejor,
    });
  });

  return lista;
}

const PARTITURA = asignarPosiciones(crearPartitura());

const ULTIMA = PARTITURA[PARTITURA.length - 1] || {
  t: 0,
  len: 0,
};

const FIN = ULTIMA.t + ULTIMA.len + 1.6;

// ---------------------------------------------------------
// MATEMÁTICA 3D
// ---------------------------------------------------------
function invertir3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1e-9;

  return [
    A,
    -(b * i - c * h),
    b * f - c * e,
    B,
    a * i - c * g,
    -(a * f - c * d),
    C,
    -(a * h - b * g),
    a * e - b * d,
  ].map((v) => v / det);
}

// ---------------------------------------------------------
// AUDIO
// ---------------------------------------------------------
function crearAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;

  if (!AC) return null;

  try {
    const ac = new AC();
    const comp = ac.createDynamicsCompressor();
    const salida = ac.createGain();
    const musica = ac.createGain();

    salida.gain.value = 0.9;
    musica.gain.value = MUSICA;

    salida.connect(comp);
    musica.connect(comp);
    comp.connect(ac.destination);

    if (ac.resume) ac.resume();

    return {
      ac,
      salida,
      musica,
      ruido: null,
      buffer: null,
    };
  } catch (e) {
    return null;
  }
}

async function cargarCancion(audio) {
  if (!audio || audio.buffer) return;

  try {
    const res = await fetch(cancionUrl);
    const datos = await res.arrayBuffer();

    audio.buffer = await new Promise((ok, mal) => {
      audio.ac.decodeAudioData(datos, ok, mal);
    });
  } catch (e) {
    console.warn('No se pudo cargar la canción', e);
  }
}

function bufferRuido(audio) {
  const { ac } = audio;

  if (!audio.ruido) {
    const largo = Math.floor(ac.sampleRate * 1);
    const buf = ac.createBuffer(1, largo, ac.sampleRate);
    const datos = buf.getChannelData(0);

    for (let k = 0; k < largo; k++) {
      datos[k] = Math.random() * 2 - 1;
    }

    audio.ruido = buf;
  }

  return audio.ruido;
}

function swish(audio, ci, fuerza) {
  const { ac, salida } = audio;
  const t = ac.currentTime;

  const src = ac.createBufferSource();
  src.buffer = bufferRuido(audio);

  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(CUERDAS[ci].hz * 0.7, t);
  f.frequency.exponentialRampToValueAtTime(
    CUERDAS[ci].hz * 1.5,
    t + 0.1
  );
  f.Q.value = 1.4;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09 * fuerza, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

  src.connect(f);
  f.connect(g);
  g.connect(salida);

  src.start(t);
  src.stop(t + 0.18);
}

function friccion(audio, ci) {
  const { ac, salida } = audio;
  const t = ac.currentTime;

  const src = ac.createBufferSource();
  src.buffer = bufferRuido(audio);
  src.loop = true;

  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = CUERDAS[ci].hz;
  f.Q.value = 2.5;

  const lfo = ac.createOscillator();
  lfo.frequency.value = 9;

  const lfoG = ac.createGain();
  lfoG.gain.value = 0.012;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.04, t + 0.05);

  lfo.connect(lfoG);
  lfoG.connect(g.gain);
  src.connect(f);
  f.connect(g);
  g.connect(salida);

  src.start(t);
  lfo.start(t);

  let parado = false;

  return {
    parar() {
      if (parado) return;

      parado = true;

      const c = ac.currentTime;

      g.gain.cancelScheduledValues(c);
      g.gain.setTargetAtTime(0.0001, c, 0.04);

      try {
        src.stop(c + 0.3);
        lfo.stop(c + 0.3);
      } catch (e) {
        // Ya estaban detenidos.
      }
    },
  };
}

function tic(audio, cuando, agudo) {
  const { ac, salida } = audio;

  const o = ac.createOscillator();
  o.type = 'sine';
  o.frequency.value = agudo ? 1500 : 1000;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, cuando);
  g.gain.exponentialRampToValueAtTime(0.18, cuando + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.08);

  o.connect(g);
  g.connect(salida);

  o.start(cuando);
  o.stop(cuando + 0.1);
}

// ---------------------------------------------------------
// COMPONENTE PÚBLICO
// ---------------------------------------------------------
export default function Violin({ children }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        className="vio-btn"
        aria-label="Tocar el violín"
        onClick={() => setAbierto(true)}
      >
        <span className="vio-hint" aria-hidden="true">
          ¡Tócame!
        </span>

        {children}
      </button>

      {abierto &&
        createPortal(
          <Juego onCerrar={() => setAbierto(false)} />,
          document.body
        )}
    </>
  );
}

// ---------------------------------------------------------
// JUEGO
// ---------------------------------------------------------
function Juego({ onCerrar }) {
  const raizRef = useRef(null);
  const audioRef = useRef(null);

  const [fase, setFase] = useState('menu');
  const [intento, setIntento] = useState(0);
  const [res, setRes] = useState(null);

  useEffect(() => {
    const raiz = raizRef.current;

    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };

    const noScroll = (e) => e.preventDefault();

    window.addEventListener('keydown', onKey);
    raiz.addEventListener('wheel', noScroll, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKey);
      raiz.removeEventListener('wheel', noScroll);

      if (audioRef.current?.ac) {
        audioRef.current.ac.close().catch(() => {});
      }
    };
  }, [onCerrar]);

  useEffect(() => {
    if (fase !== 'menu') return undefined;

    const raiz = raizRef.current;

    const ctx = gsap.context(() => {
      gsap.from('.vio-card', {
        scale: 0.7,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'back.out(1.8)',
      });

      gsap.from('.vio-letra', {
        y: -60,
        autoAlpha: 0,
        rotation: () => gsap.utils.random(-25, 25),
        duration: 0.7,
        ease: 'back.out(2.2)',
        stagger: 0.07,
        delay: 0.15,
      });
    }, raiz);

    return () => ctx.revert();
  }, [fase]);

  // Mientras se juega se esconde la estrella del componente Cursor
  // (Cursor.css: body.vio-jugando .cursor { display: none })
  useEffect(() => {
    const jugando = fase === 'jugando';

    document.body.classList.toggle('vio-jugando', jugando);

    return () => document.body.classList.remove('vio-jugando');
  }, [fase]);

  const jugar = async () => {
    if (!audioRef.current || audioRef.current.ac.state === 'closed') {
      audioRef.current = crearAudio();
    } else if (audioRef.current.ac.resume) {
      await audioRef.current.ac.resume();
    }

    if (audioRef.current && !audioRef.current.buffer) {
      setFase('cargando');
      await cargarCancion(audioRef.current);
    }

    setIntento((n) => n + 1);
    setFase('jugando');
  };

  return (
    <div
      className={`vio${fase === 'jugando' ? ' vio--jugando' : ''}`}
      ref={raizRef}
      role="dialog"
      aria-modal="true"
      aria-label="Reto del violín"
    >
      <div className="vio__aros" aria-hidden="true">
        <span className="vio-deco vio-deco--disco vio-deco--a" />
        <span className="vio-deco vio-deco--disco vio-deco--b" />
        <span className="vio-deco vio-deco--disco vio-deco--c" />

        <img
          className="vio-estrella vio-estrella--a"
          src={estrella}
          alt=""
          draggable="false"
        />

        <img
          className="vio-estrella vio-estrella--b"
          src={estrella}
          alt=""
          draggable="false"
        />

        <img
          className="vio-estrella vio-estrella--c"
          src={estrella}
          alt=""
          draggable="false"
        />

        <img
          className="vio-estrella vio-estrella--d"
          src={estrella}
          alt=""
          draggable="false"
        />
      </div>

      <button
        type="button"
        className="vio-cerrar"
        onClick={onCerrar}
        aria-label="Cerrar"
      >
        <img src={stared} alt="" draggable="false" />
      </button>

      {fase === 'jugando' && (
        <Partida
          key={intento}
          audio={audioRef.current}
          onFin={(r) => {
            setRes(r);
            setFase('fin');
          }}
        />
      )}

      {fase === 'cargando' && (
        <div className="vio-card">
          <div className="vio-card__tag">Afinando el violín…</div>

          <div className="vio-cargando" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {fase === 'menu' && (
        <div className="vio-card">
          <div className="vio-card__tag">
            Reto de ritmo · Expectations
          </div>

          <h2 className="vio-title" aria-label="Violín">
            {'VIOLÍN'.split('').map((l, i) => (
              <span className="vio-letra" key={i} aria-hidden="true">
                {l}
              </span>
            ))}
          </h2>

          <ul className="vio-reglas">
            <li>
              Cada línea es una <b className="vio-oro">cuerda</b>: Mi, La,
              Re y Sol.
            </li>

            <li>
              Las caritas aparecen y van creciendo. Cuando llenen su anillo,
              pártelas cruzando la cuerda por encima con un golpe rápido de
              arco.
            </li>

            <li>
              En las notas largas sigue serruchando la cuerda hasta que se
              vacíe el anillo.
            </li>

            <li>
              Con teclado: <b className="vio-oro">1 2 3 4</b> (o A S D F) =
              Mi, La, Re y Sol.
            </li>

            <li>
              Consigue <b className="vio-oro">{META_DESBLOQUEO} aciertos</b>{' '}
              para desbloquear la canción <b className="vio-oro">Expectations</b>.
            </li>

            <li>
              Cada <b className="vio-rojo">fallo</b> te quita vida y cada{' '}
              <b className="vio-oro">acierto</b> te la devuelve. Si la barra
              se vacía, pierdes.
            </li>
          </ul>

          <div className="vio-botones">
            <button type="button" className="vio-btn-j" onClick={jugar}>
              ¡Tocar!
            </button>

            <button
              type="button"
              className="vio-btn-j vio-btn-j--sec"
              onClick={onCerrar}
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {fase === 'fin' && res && (
        <Resultados res={res} onOtra={jugar} onCerrar={onCerrar} />
      )}
    </div>
  );
}

// ---------------------------------------------------------
// RESULTADOS
// ---------------------------------------------------------
function Resultados({ res, onOtra, onCerrar }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.vio-card', {
        y: 60,
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power3.out',
      });

      gsap.fromTo(
        '.vio-rank',
        { scale: 3, autoAlpha: 0, rotation: -20 },
        {
          scale: 1,
          autoAlpha: 1,
          rotation: 0,
          duration: 0.7,
          delay: 0.35,
          ease: 'back.out(1.8)',
        }
      );
    }, ref.current);

    return () => ctx.revert();
  }, []);

  return (
    <div className="vio-card" ref={ref}>
      <div className="vio-card__tag">
        {res.fallo ? '¡Te quedaste sin vida!' : '¡Canción completa!'}
      </div>

      <div className="vio-fin">
        <div className="vio-fin__datos">
          <div className="vio-fila vio-fila--grande">
            <span>Puntaje</span>
            <b>{res.score.toLocaleString('es-CO')}</b>
          </div>

          <div className="vio-fila">
            <span>Precisión</span>
            <b>{res.acc.toFixed(1)}%</b>
          </div>

          <div className="vio-fila">
            <span>Aciertos</span>
            <b>
              {res.aciertos}/{META_DESBLOQUEO}
              {res.aciertos >= META_DESBLOQUEO ? ' ✓' : ''}
            </b>
          </div>

          <div className="vio-fila">
            <span>Mejor combo</span>
            <b>{res.maxCombo}x</b>
          </div>

          <div className="vio-fila vio-fila--juicios">
            <span className="vio-cian">Perfecto {res.cont.p}</span>
            <span className="vio-oro">Bien {res.cont.b}</span>
            <span>Ok {res.cont.o}</span>
            <span className="vio-rojo">Fallo {res.cont.f}</span>
          </div>
        </div>

        <div className="vio-rank" data-rank={res.rank}>
          {res.rank}
        </div>
      </div>

      <div className="vio-botones">
        <button type="button" className="vio-btn-j" onClick={onOtra}>
          Otra vez
        </button>

        <button
          type="button"
          className="vio-btn-j vio-btn-j--sec"
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ARCO SVG
// ---------------------------------------------------------
function Arco() {
  return (
    <svg
      className="vio-arco__img"
      viewBox="0 0 215 715"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#fff"
        d="M169 34 Q101 330 33 626 L52 632 Q118 340 181 36 Z"
      />

      <path
        fill="#fff"
        d="M164 38 L167 22 Q171 15 179 17 L195 19 Q200 24 195 34 L194 46 L188 42 L186 31 L181 29 L178 42 Z"
      />

      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        d="M192 46 Q124 340 63 624"
      />

      <path
        fill="#fff"
        fillRule="evenodd"
        d="M41 616 L63 612 L66 664 Q54 672 38 668 L34 640 Z
           M44 653 m-5.5 0 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 Z"
      />

      <path
        fill="#fff"
        d="M16 683 Q14 674 24 671 L36 666 L40 676 L30 690 Q19 694 16 683 Z"
      />

      <path
        fill="none"
        stroke="#1a63d6"
        strokeWidth="2"
        d="M46 626 L47 640 M56 624 L57 640"
      />
    </svg>
  );
}

// ---------------------------------------------------------
// PARTIDA
// ---------------------------------------------------------
function Partida({ audio, onFin }) {
  const campoRef = useRef(null);
  const planoRef = useRef(null);
  const juiciosRef = useRef(null);
  const arcoRef = useRef(null);
  const trazoRef = useRef(null);
  const scoreRef = useRef(null);
  const accRef = useRef(null);
  const comboRef = useRef(null);
  const vidaRef = useRef(null);
  const progRef = useRef(null);
  const cuentaRef = useRef(null);

  useEffect(() => {
    const campo = campoRef.current;
    const plano = planoRef.current;
    const raiz = campo.closest('.vio');
    const juicios = juiciosRef.current;
    const arco = arcoRef.current;
    const lineas = [...campo.querySelectorAll('.vio-cuerda')];
    const cv = trazoRef.current;
    const pincel = cv.getContext('2d');

    const ac = audio ? audio.ac : null;
    const reloj = ac
      ? () => ac.currentTime
      : () => performance.now() / 1000;

    const t0 = reloj() + 0.4 + PRE;
    const lat = ac ? ac.outputLatency || ac.baseLatency || 0 : 0;

    const ahora = () => reloj() - t0 - lat;
    const tEvento = (pms) => ahora() - (performance.now() - pms) / 1000;

    // Estado del juego
    const S = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      vida: 1,
      cont: { p: 0, b: 0, o: 0, f: 0 },
      juzgadas: 0,
      fin: false,
      desbloqueada: false,
      cuenta: 0,
      activas: {},
      teclas: new Set(),
      puntero: {
        x: window.innerWidth * 0.55,
        y: window.innerHeight * 0.5,
      },
      inclina: 0,
      ultMov: 0,
      ultCruce: [-9, -9, -9, -9],
      trazo: [],
      destello: 0,
      resaltada: -1,
      ultTick: performance.now(),
      fuente: null,
      raf: 0,
    };

    const hist = new Map();
    const notasCapa = campo.querySelector('.vio__notas');

    const notas = [...campo.querySelectorAll('.vio-nota')].map((el, k) => ({
      ...PARTITURA[k],
      el,
      cuerpo: el.querySelector('.vio-nota__cuerpo'),
      timer: el.querySelector('.vio-nota__timer circle'),
      hit: false,
      juzgada: false,
      oculta: false,
      soltada: false,
    }));

    const M = { W: 1, H: 1, nota: 40 };
    const R = { left: 0, top: 0, width: 1, height: 1 };

    const Hm = {
      f: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      i: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    };

    const medir = () => {
      const r = campo.getBoundingClientRect();

      R.left = r.left;
      R.top = r.top;
      R.width = r.width;
      R.height = r.height;

      M.W = campo.clientWidth;
      M.H = campo.clientHeight;
      M.nota = Math.max(34, M.H * 0.15);

      campo.style.setProperty('--nota', `${M.nota}px`);

      const css = getComputedStyle(plano).transform;
      const m = css && css !== 'none' ? new DOMMatrix(css) : new DOMMatrix();

      Hm.f = [
        m.m11, m.m21, m.m41,
        m.m12, m.m22, m.m42,
        m.m14, m.m24, m.m44,
      ];

      Hm.i = invertir3(Hm.f);

      const dpr = window.devicePixelRatio || 1;

      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      pincel.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(campo);
    window.addEventListener('resize', medir);
    window.addEventListener('orientationchange', medir);

    // Geometría 3D
    const sen = Math.sin((INCL * Math.PI) / 180);
    const cos = Math.cos((INCL * Math.PI) / 180);

    const aPantalla = (px, py) => {
      const f = Hm.f;
      const w = f[6] * px + f[7] * py + f[8];

      return {
        x: R.left + R.width / 2 + (f[0] * px + f[1] * py + f[2]) / w,
        y: R.top + R.height / 2 + (f[3] * px + f[4] * py + f[5]) / w,
        k: 1 / w,
      };
    };

    const dePantalla = (sx, sy) => {
      const v = Hm.i;
      const dx = sx - (R.left + R.width / 2);
      const dy = sy - (R.top + R.height / 2);
      const w = v[6] * dx + v[7] * dy + v[8];

      return {
        x: (v[0] * dx + v[1] * dy + v[2]) / w,
        y: (v[3] * dx + v[4] * dy + v[5]) / w,
      };
    };

    const aLocal = (sx, sy) => {
      const p = dePantalla(sx, sy);

      return {
        u: p.x * cos + p.y * sen,
        v: -p.x * sen + p.y * cos,
      };
    };

    const deLocal = (u, v) =>
      aPantalla(u * cos - v * sen, u * sen + v * cos);

    const vCuerda = (ci) => (CUERDAS[ci].y / 100 - 0.5) * M.H;

    const puntoNota = (n) => {
      const p = deLocal(n.uf * M.W - M.W / 2, vCuerda(n.i));

      return {
        x: p.x - R.left,
        y: p.y - R.top,
        k: p.k,
      };
    };

    const cuerdaCercana = (sx, sy) => {
      const v = aLocal(sx, sy).v;
      let mejor = 0;
      let dist = Infinity;

      for (let i = 0; i < CUERDAS.length; i++) {
        const d = Math.abs(v - vCuerda(i));

        if (d < dist) {
          dist = d;
          mejor = i;
        }
      }

      return mejor;
    };

    // HUD
    const pintarHud = () => {
      scoreRef.current.textContent = String(Math.round(S.score)).padStart(7, '0');
      comboRef.current.textContent = S.combo > 1 ? `${S.combo}x` : '';
      vidaRef.current.style.transform = `scaleX(${Math.max(0, S.vida)})`;

      const pts = 300 * S.cont.p + 100 * S.cont.b + 50 * S.cont.o;
      const acc = S.juzgadas ? (pts / (300 * S.juzgadas)) * 100 : 100;

      accRef.current.textContent = `${acc.toFixed(1)}%`;
    };

    pintarHud();

    const popup = (texto, n, color, chico) => {
      const pt = puntoNota(n);
      const d = document.createElement('div');

      d.className = chico ? 'vio-juicio vio-juicio--chico' : 'vio-juicio';
      d.textContent = texto;
      d.style.top = `${pt.y}px`;
      d.style.left = `${pt.x}px`;
      d.style.color = color;
      d.style.setProperty('--nota', `${M.nota * pt.k}px`);
      juicios.appendChild(d);

      gsap.fromTo(
        d,
        { scale: 0.4, autoAlpha: 1, xPercent: -50, yPercent: -170 },
        { scale: 1.1, duration: 0.18, ease: 'back.out(3)' }
      );

      gsap.to(d, {
        y: -34,
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.35,
        onComplete: () => d.remove(),
      });
    };

    const vibrar = (ci, fuerza = 3.2) => {
      const l = lineas[ci];

      if (!l) return;

      gsap.killTweensOf(l);

      gsap.fromTo(
        l,
        { scaleY: fuerza },
        { scaleY: 1, duration: 0.55, ease: 'elastic.out(1,.22)' }
      );
    };

    const rajaFx = (n, th) => {
      const c = CUERDAS[n.i].color;
      const pt = puntoNota(n);
      const nota = M.nota * pt.k;

      const raja = document.createElement('div');

      raja.className = 'vio-raja';
      raja.style.top = `${pt.y}px`;
      raja.style.left = `${pt.x}px`;
      raja.style.setProperty('--c', c);
      raja.style.setProperty('--nota', `${nota}px`);
      juicios.appendChild(raja);

      const sentido = th >= 0 ? 1 : -1;

      gsap.fromTo(
        raja,
        {
          xPercent: -50,
          yPercent: -50 - 45 * sentido,
          scaleY: 0.1,
          rotation: th,
          autoAlpha: 1,
        },
        {
          yPercent: -50 + 25 * sentido,
          scaleY: 1,
          duration: 0.12,
          ease: 'power3.out',
        }
      );

      gsap.to(raja, {
        autoAlpha: 0,
        duration: 0.2,
        delay: 0.1,
        onComplete: () => raja.remove(),
      });

      for (let k = 0; k < 9; k++) {
        const p = document.createElement('span');

        p.className = 'vio-chispa';
        p.style.top = `${pt.y}px`;
        p.style.left = `${pt.x}px`;
        p.style.background = k % 2 ? '#fff' : c;
        p.style.setProperty('--nota', `${nota}px`);
        juicios.appendChild(p);

        gsap.fromTo(
          p,
          { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, autoAlpha: 1 },
          {
            x: gsap.utils.random(-nota * 1.1, nota * 1.1),
            y: gsap.utils.random(-nota * 0.9, nota * 0.9),
            scale: 0,
            autoAlpha: 0,
            duration: gsap.utils.random(0.3, 0.55),
            ease: 'power2.out',
            onComplete: () => p.remove(),
          }
        );
      }
    };

    // Parte la nota (con su carita) en dos mitades que caen
    const partirNota = (n, th) => {
      const rad = (th * Math.PI) / 180;
      const dx = Math.sin(rad);
      const dy = -Math.cos(rad);
      const nx = Math.cos(rad);
      const ny = Math.sin(rad);
      const L = 90;

      const punto = (a, b) =>
        `${(50 + L * (a * dx + b * nx)).toFixed(1)}% ${(50 + L * (a * dy + b * ny)).toFixed(1)}%`;

      [-1, 1].forEach((lado) => {
        const mitad = n.el.cloneNode(true);

        mitad.style.visibility = 'visible';

        mitad
          .querySelectorAll('.vio-nota__aro, .vio-nota__timer')
          .forEach((e) => e.remove());

        mitad.classList.remove('is-lista', 'is-sostenida');

        const cu = mitad.querySelector('.vio-nota__cuerpo');

        // El clip-path recorta el cuerpo completo: círculo + carita
        cu.style.clipPath = `polygon(${punto(1, 0)}, ${punto(-1, 0)}, ${punto(-1, lado)}, ${punto(1, lado)})`;
        notasCapa.appendChild(mitad);

        const sep = M.nota * gsap.utils.random(0.55, 0.95);

        gsap.to(cu, {
          x: lado * nx * sep,
          rotation: lado * gsap.utils.random(25, 75),
          duration: 0.6,
          ease: 'power1.out',
        });

        gsap.to(cu, {
          y: lado * ny * sep + M.nota * gsap.utils.random(0.9, 1.5),
          duration: 0.6,
          ease: 'power2.in',
        });

        gsap.to(cu, {
          autoAlpha: 0,
          duration: 0.28,
          delay: 0.3,
          onComplete: () => mitad.remove(),
        });
      });
    };

    // Canción
    if (audio && ac && audio.buffer) {
      const fuente = ac.createBufferSource();

      fuente.buffer = audio.buffer;
      fuente.connect(audio.musica);
      fuente.start(t0);
      S.fuente = fuente;
    }

    const pararMusica = (suave) => {
      const f = S.fuente;

      if (!f) return;

      S.fuente = null;

      try {
        if (suave && ac) {
          audio.musica.gain.cancelScheduledValues(ac.currentTime);
          audio.musica.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2);
          f.stop(ac.currentTime + 1);
        } else {
          f.stop();
        }
      } catch (e) {
        // La fuente ya estaba detenida.
      }
    };

    const apagonMusica = () => {
      if (!ac || !audio.musica) return;

      const c = ac.currentTime;

      audio.musica.gain.cancelScheduledValues(c);
      audio.musica.gain.setTargetAtTime(MUSICA * 0.35, c, 0.015);
      audio.musica.gain.setTargetAtTime(MUSICA, c + 0.28, 0.12);
    };

    // Al empezar la partida se callan las demás canciones
    // (Canciones.jsx escucha este evento y pausa el vinilo).
    window.dispatchEvent(new CustomEvent('violin-juego'));

    // Desbloqueo de Expectations: META_DESBLOQUEO aciertos.
    // Se avisa una sola vez, al terminar la partida o al cerrar el juego.
    const revisarDesbloqueo = () => {
      const aciertos = S.cont.p + S.cont.b + S.cont.o;

      if (S.desbloqueada || aciertos < META_DESBLOQUEO) return;

      S.desbloqueada = true;

      window.dispatchEvent(
        new CustomEvent('cancion-desbloqueada', {
          detail: { id: 'expectations' },
        })
      );
    };

    // Fin de partida
    const terminar = (fallo) => {
      if (S.fin) return;

      S.fin = true;
      revisarDesbloqueo();

      cancelAnimationFrame(S.raf);
      pararMusica(true);

      Object.values(S.activas).forEach((a) => a.fric && a.fric.parar());
      S.activas = {};

      pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const pts = 300 * S.cont.p + 100 * S.cont.b + 50 * S.cont.o;
      const acc = S.juzgadas ? (pts / (300 * S.juzgadas)) * 100 : 0;

      let rank = 'D';

      if (fallo) rank = 'F';
      else if (acc >= 96) rank = 'S';
      else if (acc >= 90) rank = 'A';
      else if (acc >= 80) rank = 'B';
      else if (acc >= 65) rank = 'C';

      setTimeout(
        () =>
          onFin({
            score: Math.round(S.score),
            maxCombo: S.maxCombo,
            acc,
            cont: S.cont,
            aciertos: S.cont.p + S.cont.b + S.cont.o,
            rank,
            fallo,
          }),
        fallo ? 500 : 900
      );
    };

    // Acierto
    const golpear = (ci, t, dir, uc) => {
      if (S.fin) return;

      const radio = M.nota * 0.5 * TOL_X;

      const n = notas
        .filter(
          (x) =>
            !x.juzgada &&
            x.i === ci &&
            Math.abs(x.t - t) <= VENT.ok &&
            (uc == null ||
              Math.abs(uc - (x.uf * M.W - M.W / 2)) <= radio)
        )
        .sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];

      if (!n) return;

      const d = Math.abs(n.t - t);

      let tipo = 'o';
      let txt = 'Ok';
      let color = '#c9d6ff';
      let base = 50;

      if (d <= VENT.perfecto) {
        tipo = 'p';
        txt = '¡Perfecto!';
        color = '#2fd4ff';
        base = 300;
      } else if (d <= VENT.bien) {
        tipo = 'b';
        txt = '¡Bien!';
        color = '#ffd23f';
        base = 100;
      }

      const bonoDir = !dir || dir === n.dir ? 1.25 : 1;

      n.hit = true;
      n.juzgada = true;

      S.cont[tipo] += 1;
      S.juzgadas += 1;
      S.combo += 1;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      S.score += base * bonoDir * (1 + Math.min(S.combo, 50) / 25);

      // Cada acierto regenera un poco de vida
      S.vida = Math.min(1, S.vida + VIDA_ACIERTO);

      popup(txt, n, color);

      const th = (dir === 'arriba' ? -1 : 1) * 12 + gsap.utils.random(-8, 8);

      rajaFx(n, th);

      gsap.fromTo(
        comboRef.current,
        { scale: 1.35 },
        { scale: 1, duration: 0.2, ease: 'back.out(3)' }
      );

      if (audio) swish(audio, ci, tipo === 'p' ? 1 : 0.7);

      arco.classList.add('is-rajando');
      S.destello = performance.now() + 130;

      if (n.hold) {
        S.activas[ci] = {
          n,
          fric: audio ? friccion(audio, ci) : null,
          tecla: !dir,
          sinContacto: 0,
        };

        n.el.classList.add('is-sostenida');
        gsap.to(n.cuerpo, { scale: 1.1, duration: 0.15 });
      } else {
        partirNota(n, th);
        n.oculta = true;
        n.el.style.visibility = 'hidden';
      }

      pintarHud();
    };

    const cerrarLarga = (ci, completa) => {
      const a = S.activas[ci];

      if (!a) return;

      delete S.activas[ci];

      if (a.fric) a.fric.parar();

      a.n.oculta = true;
      vibrar(ci, 1.8);

      if (completa) {
        S.score += 100;
        S.vida = Math.min(1, S.vida + VIDA_ACIERTO);

        popup('¡Sostenida!', a.n, '#ffd23f', true);
        rajaFx(a.n, gsap.utils.random(-14, 14));
        partirNota(a.n, gsap.utils.random(-14, 14));

        a.n.el.style.visibility = 'hidden';
        pintarHud();
      } else {
        a.n.soltada = true;

        gsap.to(a.n.el, {
          autoAlpha: 0,
          duration: 0.25,
          onComplete: () => {
            a.n.el.style.visibility = 'hidden';
          },
        });
      }
    };

    // -------------------------------------------------------
    // FALLOS: cada fallo quita vida; con la barra vacía se pierde.
    // Sin texto flotante al fallar.
    // -------------------------------------------------------
    const fallar = (n) => {
      if (n.juzgada || S.fin) return;

      n.juzgada = true;
      S.cont.f += 1;
      S.juzgadas += 1;
      S.combo = 0;

      S.vida = Math.max(0, S.vida - VIDA_FALLO);

      n.el.classList.add('is-fallada');
      apagonMusica();

      gsap.fromTo(
        campo,
        { x: -5 },
        { x: 0, duration: 0.3, ease: 'elastic.out(1,.3)' }
      );

      pintarHud();

      if (S.vida <= 0.0001) {
        terminar(true);
      }
    };

    const resaltar = (ci) => {
      if (S.resaltada === ci) return;

      S.resaltada = ci;
      lineas.forEach((l, i) => l.classList.toggle('is-activa', i === ci));
    };

    // Entradas de ratón y dedo
    const cruce = (ci, uc, pc, dir, vel) => {
      if (Math.abs(vel) < VEL_MIN) return;

      S.ultCruce[ci] = pc / 1000;

      vibrar(ci, Math.min(4.2, 2 + Math.abs(vel) / 900));

      golpear(ci, tEvento(pc) - DESFASE, dir, uc);
    };

    const procesar = (id, x, y, p) => {
      S.puntero.x = x;
      S.puntero.y = y;
      S.trazo.push({ x, y, p });

      let h = hist.get(id);

      if (!h) {
        h = [];
        hist.set(id, h);
      }

      const prev = h[h.length - 1];

      h.push({ x, y, p });

      while (h.length > 2 && p - h[0].p > 110) h.shift();

      if (!prev || S.fin) return;

      if (Math.hypot(x - prev.x, y - prev.y) > 1.5) {
        S.ultMov = p / 1000;
      }

      const viejo = h[0];
      const vel = ((y - viejo.y) / Math.max(20, p - viejo.p)) * 1000;

      const l0 = aLocal(prev.x, prev.y);
      const l1 = aLocal(x, y);

      for (let ci = 0; ci < CUERDAS.length; ci++) {
        const vc = vCuerda(ci);
        const d0 = l0.v - vc;
        const d1 = l1.v - vc;

        if ((d0 < 0 && d1 >= 0) || (d0 > 0 && d1 <= 0)) {
          const f = d0 / (d0 - d1);
          const uc = l0.u + (l1.u - l0.u) * f;
          const pc = prev.p + (p - prev.p) * f;

          cruce(ci, uc, pc, d1 > d0 ? 'abajo' : 'arriba', vel);
        }
      }
    };

    const abajo = (e) => {
      if (e.target.closest('button') || S.fin) return;

      e.preventDefault();
      hist.delete(e.pointerId);

      try {
        raiz.setPointerCapture(e.pointerId);
      } catch (err) {
        // No pasa nada.
      }

      procesar(e.pointerId, e.clientX, e.clientY, e.timeStamp);
    };

    const mover = (e) => {
      const lista = e.getCoalescedEvents ? e.getCoalescedEvents() : null;

      if (lista && lista.length) {
        lista.forEach((c) =>
          procesar(e.pointerId, c.clientX, c.clientY, c.timeStamp)
        );
      } else {
        procesar(e.pointerId, e.clientX, e.clientY, e.timeStamp);
      }
    };

    const arriba = (e) => {
      hist.delete(e.pointerId);
    };

    // Entradas de teclado
    const teclaAbajo = (e) => {
      const k = e.key.toLowerCase();
      const ci = TECLAS[k];

      if (ci === undefined || e.repeat || S.fin || S.teclas.has(k)) return;

      e.preventDefault();
      S.teclas.add(k);

      const t = ahora() - DESFASE;

      const cand = notas
        .filter(
          (x) =>
            !x.juzgada &&
            x.i === ci &&
            Math.abs(x.t - t) <= VENT.ok
        )
        .sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];

      const pt = deLocal(
        cand ? cand.uf * M.W - M.W / 2 : 0,
        vCuerda(ci)
      );

      S.puntero.x = pt.x;
      S.puntero.y = pt.y;
      S.ultCruce[ci] = performance.now() / 1000;

      vibrar(ci);
      golpear(ci, t, null, null);

      if (S.activas[ci]) S.activas[ci].k = k;
    };

    const teclaArriba = (e) => {
      const k = e.key.toLowerCase();
      const ci = TECLAS[k];

      if (ci === undefined) return;

      S.teclas.delete(k);

      const a = S.activas[ci];

      if (a && a.tecla) {
        cerrarLarga(ci, ahora() >= a.n.t + a.n.len - 0.18);
      }
    };

    const sostenida = (ci, ahoraP) => {
      if (ahoraP - S.ultCruce[ci] < 0.5) return true;

      const enBanda =
        Math.abs(aLocal(S.puntero.x, S.puntero.y).v - vCuerda(ci)) <= M.H * 0.1;

      return enBanda && ahoraP - S.ultMov < 0.3;
    };

    raiz.addEventListener('pointerdown', abajo);
    raiz.addEventListener('pointermove', mover);
    raiz.addEventListener('pointerup', arriba);
    raiz.addEventListener('pointercancel', arriba);
    raiz.addEventListener('pointerleave', arriba);

    window.addEventListener('keydown', teclaAbajo);
    window.addEventListener('keyup', teclaArriba);

    // Cuenta regresiva
    const textosCuenta = ['3', '2', '1', '¡Toca!'];
    const paso = PRE / 4;

    if (audio) {
      for (let k = 0; k < 4; k++) {
        tic(audio, t0 - PRE + k * paso, k === 3);
      }
    }

    const mostrarCuenta = (k) => {
      const el = cuentaRef.current;

      el.textContent = textosCuenta[k];

      gsap.killTweensOf(el);

      gsap.fromTo(
        el,
        { scale: 1.7, autoAlpha: 1 },
        { scale: 0.9, autoAlpha: 0, duration: 0.65, ease: 'power2.out' }
      );
    };

    // Trazo del arco
    const dibujarTrazo = (ahoraP) => {
      pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const vida = 170;

      while (S.trazo.length && ahoraP - S.trazo[0].p > vida) {
        S.trazo.shift();
      }

      pincel.lineCap = 'round';

      for (let k = 1; k < S.trazo.length; k++) {
        const a = S.trazo[k - 1];
        const b = S.trazo[k];

        if (b.p - a.p > 60) continue;

        const f = 1 - (ahoraP - b.p) / vida;

        pincel.strokeStyle = `rgba(255,255,255,${(0.75 * f).toFixed(3)})`;
        pincel.lineWidth = 2 + 9 * f;

        pincel.beginPath();
        pincel.moveTo(a.x, a.y);
        pincel.lineTo(b.x, b.y);
        pincel.stroke();
      }
    };

    // Bucle principal
    const tick = () => {
      if (S.fin) return;

      const t = ahora();
      const pms = performance.now();
      const dtFrame = Math.min(0.1, (pms - S.ultTick) / 1000);

      S.ultTick = pms;

      while (S.cuenta < 4 && t >= -PRE + S.cuenta * paso) {
        mostrarCuenta(S.cuenta);
        S.cuenta += 1;
      }

      for (let k = 0; k < notas.length; k++) {
        const n = notas[k];
        const dt = n.t - t;
        const finNota = n.t + n.len - t;

        if (!n.juzgada && t > n.t + VENT.ok) {
          fallar(n);
        }

        if (S.fin) return;

        const a = S.activas[n.i];

        if (a && a.n === n && t >= n.t + n.len) {
          cerrarLarga(n.i, true);
        }

        if (n.oculta) continue;

        const visible = dt < APROX + 0.1 && finNota > -0.9;

        if (!visible) {
          if (n.el.style.visibility !== 'hidden') {
            n.el.style.visibility = 'hidden';
          }

          continue;
        }

        if (n.el.style.visibility !== 'visible') {
          n.el.style.visibility = 'visible';
        }

        const pc = deLocal(
          n.uf * M.W - M.W / 2,
          vCuerda(n.i)
        );

        n.el.style.transform =
          `translate3d(${(pc.x - R.left).toFixed(1)}px,` +
          `${(pc.y - R.top).toFixed(1)}px,0) scale(${pc.k.toFixed(3)})`;

        if (!n.hit) {
          const prog = Math.min(
            1,
            Math.max(0, (t - (n.t - APROX)) / APROX)
          );

          n.cuerpo.style.transform = `scale(${prog.toFixed(3)})`;
          n.cuerpo.style.opacity = Math.min(1, prog * 5).toFixed(3);

          n.el.classList.toggle(
            'is-lista',
            !n.juzgada && Math.abs(dt) <= VENT.ok
          );
        } else if (n.hold && !n.soltada && n.timer) {
          const r = Math.max(0, Math.min(1, finNota / n.len));

          n.timer.style.strokeDashoffset = (100 * (1 - r)).toFixed(1);
        }
      }

      const ahoraP = pms / 1000;

      Object.keys(S.activas).forEach((key) => {
        const ci = Number(key);
        const a = S.activas[ci];

        if (!a) return;

        const vivo = a.tecla
          ? !a.k || S.teclas.has(a.k)
          : sostenida(ci, ahoraP);

        a.sinContacto = vivo ? 0 : a.sinContacto + dtFrame;

        if (a.sinContacto > 0.3) {
          cerrarLarga(ci, t >= a.n.t + a.n.len - 0.18);
          return;
        }

        lineas[ci].style.transform =
          `scaleY(${(2.4 + Math.sin(ahoraP * 80) * 1.1).toFixed(2)})`;
      });

      progRef.current.style.transform =
        `scaleX(${Math.min(1, Math.max(0, t / FIN))})`;

      resaltar(cuerdaCercana(S.puntero.x, S.puntero.y));

      const sostiene = Object.keys(S.activas).length > 0;
      const vaiven =
        S.teclas.size && sostiene ? Math.sin(ahoraP * 24) * 14 : 0;

      const vx =
        S.trazo.length > 1
          ? S.trazo[S.trazo.length - 1].x - S.trazo[0].x
          : 0;

      S.inclina +=
        (Math.max(-9, Math.min(9, vx * 0.05)) - S.inclina) * 0.2;

      arco.style.transform =
        `translate3d(${S.puntero.x}px,${S.puntero.y + vaiven}px,0) ` +
        `translate(-50%,-50%) rotate(${S.inclina.toFixed(2)}deg)`;

      arco.classList.toggle('is-presionado', sostiene);

      if (pms > S.destello) {
        arco.classList.remove('is-rajando');
      }

      dibujarTrazo(pms);

      if (t > FIN) {
        terminar(false);
        return;
      }

      S.raf = requestAnimationFrame(tick);
    };

    S.raf = requestAnimationFrame(tick);

    // Limpieza
    return () => {
      S.fin = true;

      // Si se cierra el juego a mitad de partida con 40+ aciertos,
      // la canción también se desbloquea.
      revisarDesbloqueo();

      cancelAnimationFrame(S.raf);
      ro.disconnect();

      window.removeEventListener('resize', medir);
      window.removeEventListener('orientationchange', medir);

      raiz.removeEventListener('pointerdown', abajo);
      raiz.removeEventListener('pointermove', mover);
      raiz.removeEventListener('pointerup', arriba);
      raiz.removeEventListener('pointercancel', arriba);
      raiz.removeEventListener('pointerleave', arriba);

      window.removeEventListener('keydown', teclaAbajo);
      window.removeEventListener('keyup', teclaArriba);

      pararMusica(false);

      Object.values(S.activas).forEach((a) => a.fric && a.fric.parar());

      gsap.killTweensOf(campo.querySelectorAll('*'));
      gsap.killTweensOf([campo, cuentaRef.current, comboRef.current]);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="vio__hud">
        <div className="vio__barras">
          <div className="vio__vida">
            <div className="vio__vida-fill" ref={vidaRef} />
          </div>

          <div className="vio__prog">
            <div className="vio__prog-fill" ref={progRef} />
          </div>
        </div>

        <div className="vio__stats">
          <div className="vio__score" ref={scoreRef}>
            0000000
          </div>

          <div className="vio__acc" ref={accRef}>
            100.0%
          </div>
        </div>
      </div>

      <div className="vio__combo" ref={comboRef} aria-hidden="true" />
      <div className="vio__cuenta" ref={cuentaRef} aria-live="polite" />

      <div className="vio__zona">
        <div className="vio__campo" ref={campoRef}>
          <div
            className="vio__plano"
            ref={planoRef}
            style={{
              transform: `perspective(${PERSP}px) rotateX(${TILT}deg)`,
              '--tilt': `${TILT}deg`,
              '--sa': Math.sin((TILT * Math.PI) / 180).toFixed(4),
            }}
          >
            <div
              className="vio__cuerdas"
              style={{ transform: `rotate(${INCL}deg)` }}
            >
              {CUERDAS.map((c) => (
                <div className="vio-fila-cuerda" key={c.nombre}>
                  <div
                    className="vio-carril"
                    style={{ top: `${c.y}%`, '--c': c.color }}
                  />

                  <div
                    className="vio-cuerda"
                    style={{
                      top: `${c.y}%`,
                      '--c': c.color,
                      '--g': `${c.g}px`,
                    }}
                  />

                  <div
                    className="vio-etiqueta"
                    style={{ top: `${c.y}%`, '--c': c.color }}
                  >
                    {c.nombre}
                    <small>{c.tecla}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="vio__notas">
            {PARTITURA.map((n) => (
              <div
                key={n.id}
                className={`vio-nota${n.hold ? ' vio-nota--larga' : ''}`}
                style={{
                  '--c': CUERDAS[n.i].color,
                  '--ic': CUERDAS[n.i].ic,
                }}
              >
                <span className="vio-nota__aro" />

                {n.hold && (
                  <svg
                    className="vio-nota__timer"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                  >
                    <circle cx="50" cy="50" r="47" pathLength="100" />
                  </svg>
                )}

                <div className="vio-nota__cuerpo">
                  <img
                    className="vio-nota__carita"
                    src={carita}
                    alt=""
                    draggable="false"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="vio__juicios" ref={juiciosRef} />
        </div>
      </div>

      <canvas className="vio__trazo" ref={trazoRef} aria-hidden="true" />

      <div className="vio-arco" ref={arcoRef} aria-hidden="true">
        <Arco />
      </div>
    </>
  );
}