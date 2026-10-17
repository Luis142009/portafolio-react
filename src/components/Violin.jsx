// =========================================================
// RETO DEL VIOLÍN  (estilo osu!, con el arco como cursor)
//
// Uso:
//   <Violin>
//     <img src={partitura} alt="" />
//   </Violin>
//
// El hijo se convierte en un botón; al darle click se abre el
// juego a pantalla completa (portal en <body>, así no le afectan
// los transform / perspective de la escena 3D).
//
// Cómo se juega:
//  - Cada línea es una cuerda (Mi, La, Re, Sol).
//  - Las notas viajan por su cuerda hacia el círculo de la izquierda.
//  - Pon el arco (mouse / dedo) sobre la cuerda y haz click justo
//    cuando la nota llegue al círculo. Notas largas: mantén el click.
//  - Teclado: 1 2 3 4 (o A S D F) = Mi La Re Sol.
//
// El sonido se sintetiza con Web Audio (no necesita archivos).
// Canción: "Oda a la alegría" (Beethoven, dominio público).
// =========================================================
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import '../stylesheets/Violin.css';

// ---------------------------------------------------------
// AJUSTES
// ---------------------------------------------------------
const BPM = 96;
const SPB = 60 / BPM; // segundos por pulso
const LEAD = 4 * SPB; // cuenta regresiva antes de la primera nota
const APROX = 2.2; // segundos que tarda una nota en cruzar el campo
const HIT_X = 0.14; // posición del círculo (fracción del ancho)
const VENT = { perfecto: 0.075, bien: 0.13, ok: 0.19 }; // ventanas de acierto (s)

// De arriba hacia abajo, como se ven en pantalla (la más aguda arriba)
const CUERDAS = [
  { nombre: 'Mi', midi: 76, color: '#ff7ab8', y: 17, tecla: '1' },
  { nombre: 'La', midi: 69, color: '#ffd23f', y: 39, tecla: '2' },
  { nombre: 'Re', midi: 62, color: '#2fd4ff', y: 61, tecla: '3' },
  { nombre: 'Sol', midi: 55, color: '#9d8cff', y: 83, tecla: '4' },
];

const TECLAS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, s: 1, d: 2, f: 3 };
const NOMBRES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// ---------------------------------------------------------
// PARTITURA: Oda a la alegría (en Re mayor)
// [nota MIDI, duración en pulsos]
// ---------------------------------------------------------
const frase = (final) => [
  [66, 1], [66, 1], [67, 1], [69, 1],
  [69, 1], [67, 1], [66, 1], [64, 1],
  [62, 1], [62, 1], [64, 1], [66, 1],
  ...(final ? [[64, 1.5], [62, 0.5], [62, 2]] : [[66, 1.5], [64, 0.5], [64, 2]]),
];

const alta = (f) => f.map(([m, b]) => [m + 12, b]);

const CANCION = [...frase(false), ...frase(true), ...alta(frase(false)), ...alta(frase(true))];

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Asigna cada nota a una cuerda que pueda tocarla (hasta +9 semitonos
// desde la cuerda al aire), alternando cuerdas cuando hay opción.
function crearPartitura() {
  let pulso = 0;
  let prev = -1;

  return CANCION.map(([midi, b], id) => {
    const cand = CUERDAS.map((c, i) => ({ i, d: midi - c.midi })).filter(
      (x) => x.d >= 0 && x.d <= 9
    );
    const opciones = cand.filter((x) => x.i !== prev);
    const elegida = (opciones.length ? opciones : cand)[0] || { i: 0 };

    const nota = {
      id,
      i: elegida.i,
      midi,
      nombre: NOMBRES[midi % 12],
      t: LEAD + pulso * SPB,
      len: b * SPB,
      hold: b >= 1.5,
    };

    prev = elegida.i;
    pulso += b;
    return nota;
  });
}

const PARTITURA = crearPartitura();
const ULTIMA = PARTITURA[PARTITURA.length - 1];
const FIN = ULTIMA.t + ULTIMA.len + 1.4;

// ---------------------------------------------------------
// AUDIO (Web Audio)
// ---------------------------------------------------------
function crearAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;

  if (!AC) return null;

  try {
    const ac = new AC();
    const comp = ac.createDynamicsCompressor();
    const salida = ac.createGain();

    salida.gain.value = 0.85;
    salida.connect(comp);
    comp.connect(ac.destination);

    if (ac.resume) ac.resume();

    return { ac, salida, ruido: null };
  } catch (e) {
    return null;
  }
}

// Una nota de violín: sierras desafinadas + filtro + vibrato que tarda en entrar
function voz(audio, freq) {
  const { ac, salida } = audio;
  const t = ac.currentTime;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.13, t + 0.06);

  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = Math.min(7000, freq * 7);
  filtro.Q.value = 0.9;

  const lfo = ac.createOscillator();
  lfo.frequency.value = 5.6;

  const lfoG = ac.createGain();
  lfoG.gain.setValueAtTime(0, t);
  lfoG.gain.linearRampToValueAtTime(freq * 0.007, t + 0.5);
  lfo.connect(lfoG);

  const osc = [0, 6, -6].map((cents) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = cents;
    lfoG.connect(o.frequency);
    o.connect(filtro);
    o.start(t);
    return o;
  });

  filtro.connect(g);
  g.connect(salida);
  lfo.start(t);

  let parado = false;

  return {
    parar(cuando) {
      if (parado) return;
      parado = true;

      const c = Math.max(cuando || 0, ac.currentTime);

      g.gain.cancelScheduledValues(c);
      g.gain.setTargetAtTime(0.0001, c, 0.05);

      [...osc, lfo].forEach((o) => {
        try {
          o.stop(c + 0.4);
        } catch (e) {
          /* ya detenido */
        }
      });
    },
  };
}

// Rasguño del arco cuando se toca sin nota
function rasguno(audio) {
  const { ac, salida } = audio;

  if (!audio.ruido) {
    const largo = Math.floor(ac.sampleRate * 0.25);
    const buf = ac.createBuffer(1, largo, ac.sampleRate);
    const datos = buf.getChannelData(0);

    for (let k = 0; k < largo; k++) datos[k] = Math.random() * 2 - 1;

    audio.ruido = buf;
  }

  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = audio.ruido;

  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2600;
  f.Q.value = 1.2;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

  src.connect(f);
  f.connect(g);
  g.connect(salida);
  src.start(t);
  src.stop(t + 0.16);
}

// Tic de la cuenta regresiva
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
        createPortal(<Juego onCerrar={() => setAbierto(false)} />, document.body)}
    </>
  );
}

// ---------------------------------------------------------
// JUEGO (menú → partida → resultados)
// ---------------------------------------------------------
function Juego({ onCerrar }) {
  const raizRef = useRef(null);
  const audioRef = useRef(null);

  const [fase, setFase] = useState('menu'); // menu | jugando | fin
  const [intento, setIntento] = useState(0);
  const [res, setRes] = useState(null);

  // Escape cierra · el scroll de la página queda bloqueado mientras juegas
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

      if (audioRef.current && audioRef.current.ac) {
        audioRef.current.ac.close().catch(() => {});
      }
    };
  }, [onCerrar]);

  // Animación de entrada del menú
  useEffect(() => {
    if (fase !== 'menu') return undefined;

    const raiz = raizRef.current;
    const ctx = gsap.context(() => {
      gsap.from('.vio-card', { scale: 0.7, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.8)' });
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

  const jugar = () => {
    // El AudioContext se crea aquí porque hay un click del usuario
    if (!audioRef.current || audioRef.current.ac.state === 'closed') {
      audioRef.current = crearAudio();
    } else if (audioRef.current.ac.resume) {
      audioRef.current.ac.resume();
    }

    setIntento((n) => n + 1);
    setFase('jugando');
  };

  return (
    <div className="vio" ref={raizRef} role="dialog" aria-modal="true" aria-label="Reto del violín">
      <div className="vio__aros" aria-hidden="true">
        <span className="vio-deco vio-deco--disco vio-deco--a" />
        <span className="vio-deco vio-deco--disco vio-deco--b" />
        <span className="vio-deco vio-deco--disco vio-deco--c" />
      </div>

      <button type="button" className="vio-cerrar" onClick={onCerrar} aria-label="Cerrar">
        ✕
      </button>

      {fase !== 'menu' && (
        <Partida
          key={intento}
          audio={audioRef.current}
          onFin={(r) => {
            setRes(r);
            setFase('fin');
          }}
        />
      )}

      {fase === 'menu' && (
        <div className="vio-card">
          <div className="vio-card__tag">Reto de ritmo · Oda a la alegría</div>

          <h2 className="vio-title" aria-label="Violín">
            {'VIOLÍN'.split('').map((l, i) => (
              <span className="vio-letra" key={i} aria-hidden="true">
                {l}
              </span>
            ))}
          </h2>

          <ul className="vio-reglas">
            <li>
              Cada línea es una <b className="vio-oro">cuerda</b>: Mi, La, Re y Sol.
            </li>
            <li>
              Mueve el <b className="vio-cian">arco</b> a la cuerda de la nota y{' '}
              <b className="vio-oro">haz click</b> cuando llegue al círculo.
            </li>
            <li>
              En las notas largas <b className="vio-cian">mantén</b> el click hasta que termine.
            </li>
            <li>
              Con teclado: <b className="vio-oro">1 2 3 4</b> (o A S D F) = Mi La Re Sol.
            </li>
            <li>
              Si fallas mucho se acaba la <b className="vio-rojo">vida</b>. ¡Sube el volumen!
            </li>
          </ul>

          <div className="vio-botones">
            <button type="button" className="vio-btn-j" onClick={jugar}>
              ¡Tocar!
            </button>
            <button type="button" className="vio-btn-j vio-btn-j--sec" onClick={onCerrar}>
              Salir
            </button>
          </div>
        </div>
      )}

      {fase === 'fin' && res && <Resultados res={res} onOtra={jugar} onCerrar={onCerrar} />}
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
      gsap.from('.vio-card', { y: 60, autoAlpha: 0, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo(
        '.vio-rank',
        { scale: 3, autoAlpha: 0, rotation: -20 },
        { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.7, delay: 0.35, ease: 'back.out(1.8)' }
      );
    }, ref.current);

    return () => ctx.revert();
  }, []);

  return (
    <div className="vio-card" ref={ref}>
      <div className="vio-card__tag">{res.fallo ? 'Se acabó la vida…' : '¡Canción completa!'}</div>

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
        <button type="button" className="vio-btn-j vio-btn-j--sec" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// PARTIDA
// ---------------------------------------------------------
function Partida({ audio, onFin }) {
  const campoRef = useRef(null);
  const juiciosRef = useRef(null);
  const arcoRef = useRef(null);
  const scoreRef = useRef(null);
  const accRef = useRef(null);
  const comboRef = useRef(null);
  const vidaRef = useRef(null);
  const progRef = useRef(null);
  const cuentaRef = useRef(null);

  useEffect(() => {
    const campo = campoRef.current;
    const raiz = campo.closest('.vio');
    const juicios = juiciosRef.current;
    const arco = arcoRef.current;
    const lineas = [...campo.querySelectorAll('.vio-cuerda')];

    const ac = audio ? audio.ac : null;
    const reloj = ac ? () => ac.currentTime : () => performance.now() / 1000;
    const t0 = reloj() + 0.4;
    const ahora = () => reloj() - t0;

    // ----- Estado -----
    const S = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      vida: 0.7,
      cont: { p: 0, b: 0, o: 0, f: 0 },
      juzgadas: 0,
      fin: false,
      cuenta: 0,
      activas: {}, // notas largas que se están sosteniendo, por cuerda
      punteros: new Map(),
      teclas: new Set(),
      puntero: { x: window.innerWidth * 0.55, y: window.innerHeight * 0.5 },
      bow: { x: window.innerWidth * 0.55, y: window.innerHeight * 0.5 },
      resaltada: -1,
      raf: 0,
    };

    const notas = [...campo.querySelectorAll('.vio-nota')].map((el, k) => ({
      ...PARTITURA[k],
      el,
      cuerpo: el.querySelector('.vio-nota__cuerpo'),
      cola: el.querySelector('.vio-nota__cola'),
      hit: false,
      juzgada: false,
      oculta: false,
      soltada: false,
    }));

    // ----- Medidas -----
    const M = { W: 1, H: 1, nota: 40, vel: 100, hitPx: 0 };

    const medir = () => {
      M.W = campo.clientWidth;
      M.H = campo.clientHeight;
      M.nota = Math.max(34, M.H * 0.15);
      M.hitPx = M.W * HIT_X;
      M.vel = (M.W * (1.04 - HIT_X)) / APROX; // px por segundo

      campo.style.setProperty('--nota', `${M.nota}px`);

      notas.forEach((n) => {
        if (n.cola) n.cola.style.width = `${n.len * M.vel}px`;
      });
    };

    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(campo);

    // ----- HUD -----
    const pintarHud = () => {
      scoreRef.current.textContent = String(Math.round(S.score)).padStart(7, '0');
      comboRef.current.textContent = S.combo > 1 ? `${S.combo}x` : '';
      vidaRef.current.style.transform = `scaleX(${Math.max(0, S.vida)})`;

      const pts = 300 * S.cont.p + 100 * S.cont.b + 50 * S.cont.o;
      const acc = S.juzgadas ? (pts / (300 * S.juzgadas)) * 100 : 100;

      accRef.current.textContent = `${acc.toFixed(1)}%`;
    };

    pintarHud();

    const popup = (texto, ci, color, chico) => {
      const d = document.createElement('div');

      d.className = chico ? 'vio-juicio vio-juicio--chico' : 'vio-juicio';
      d.textContent = texto;
      d.style.top = `${CUERDAS[ci].y}%`;
      d.style.left = `${HIT_X * 100}%`;
      d.style.color = color;
      juicios.appendChild(d);

      gsap.fromTo(
        d,
        { scale: 0.4, autoAlpha: 1, xPercent: -50, yPercent: -150 },
        { scale: 1.1, duration: 0.18, ease: 'back.out(3)' }
      );
      gsap.to(d, { y: -34, autoAlpha: 0, duration: 0.5, delay: 0.35, onComplete: () => d.remove() });
    };

    const vibrar = (ci) => {
      const l = lineas[ci];

      if (!l) return;

      gsap.killTweensOf(l);
      gsap.fromTo(
        l,
        { scaleY: 3.2 },
        { scaleY: 1, duration: 0.5, ease: 'elastic.out(1,.25)' }
      );
    };

    const sumarVida = (v) => {
      S.vida = Math.min(1, Math.max(0, S.vida + v));
    };

    // ----- Fin -----
    const terminar = (fallo) => {
      if (S.fin) return;

      S.fin = true;
      cancelAnimationFrame(S.raf);

      Object.values(S.activas).forEach((a) => a.voz && a.voz.parar());
      S.activas = {};

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
            rank,
            fallo,
          }),
        fallo ? 500 : 900
      );
    };

    // ----- Acierto -----
    const golpear = (ci, t) => {
      if (S.fin) return;

      const n = notas
        .filter((x) => !x.juzgada && x.i === ci && Math.abs(x.t - t) <= VENT.ok)
        .sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];

      // Sin nota: rasguño del arco
      if (!n) {
        if (audio) rasguno(audio);
        vibrar(ci);
        return;
      }

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

      n.hit = true;
      n.juzgada = true;
      S.cont[tipo] += 1;
      S.juzgadas += 1;
      S.combo += 1;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      S.score += base * (1 + Math.min(S.combo, 50) / 25);
      sumarVida(tipo === 'p' ? 0.04 : tipo === 'b' ? 0.02 : 0.01);

      popup(txt, ci, color);
      vibrar(ci);

      gsap.fromTo(comboRef.current, { scale: 1.35 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' });

      // Sonido
      let v = null;

      if (audio) {
        v = voz(audio, midiHz(n.midi));

        if (!n.hold) v.parar(audio.ac.currentTime + Math.max(0.15, n.len * 0.92));
      }

      if (n.hold) {
        S.activas[ci] = { n, voz: v };
        gsap.to(n.cuerpo, { scale: 1.12, duration: 0.15 });
      } else {
        n.oculta = true;
        gsap.to(n.cuerpo, {
          scale: 1.7,
          autoAlpha: 0,
          duration: 0.28,
          ease: 'power2.out',
          onComplete: () => {
            n.el.style.visibility = 'hidden';
          },
        });
      }

      pintarHud();
    };

    // Nota larga terminada (o soltada)
    const cerrarLarga = (ci, completa) => {
      const a = S.activas[ci];

      if (!a) return;

      delete S.activas[ci];

      if (a.voz) a.voz.parar();

      a.n.oculta = true;

      if (completa) {
        S.score += 100;
        popup('¡Sostenida!', ci, '#ffd23f', true);
        pintarHud();
      } else {
        a.n.soltada = true;
      }

      gsap.to(a.n.el, {
        autoAlpha: 0,
        duration: 0.25,
        onComplete: () => {
          a.n.el.style.visibility = 'hidden';
        },
      });
    };

    const liberar = (ci, t) => {
      const a = S.activas[ci];

      if (!a) return;

      cerrarLarga(ci, t >= a.n.t + a.n.len - 0.18);
    };

    // ----- Fallo -----
    const fallar = (n) => {
      n.juzgada = true;
      S.cont.f += 1;
      S.juzgadas += 1;
      S.combo = 0;
      sumarVida(-0.12);
      n.el.classList.add('is-fallada');
      popup('Fallo', n.i, '#ff7a7a');

      gsap.fromTo(
        campo,
        { x: -5 },
        { x: 0, duration: 0.3, ease: 'elastic.out(1,.3)' }
      );

      pintarHud();

      if (S.vida <= 0) terminar(true);
    };

    // ----- Cuerda más cercana a una altura de pantalla -----
    const cuerdaDesdeY = (y) => {
      const r = campo.getBoundingClientRect();
      let mejor = 0;
      let dist = Infinity;

      CUERDAS.forEach((c, i) => {
        const d = Math.abs(r.top + (r.height * c.y) / 100 - y);

        if (d < dist) {
          dist = d;
          mejor = i;
        }
      });

      return mejor;
    };

    const resaltar = (ci) => {
      if (S.resaltada === ci) return;

      S.resaltada = ci;
      lineas.forEach((l, i) => l.classList.toggle('is-activa', i === ci));
    };

    const arcoACuerda = (ci) => {
      const r = campo.getBoundingClientRect();

      S.puntero.y = r.top + (r.height * CUERDAS[ci].y) / 100;
      S.puntero.x = Math.min(Math.max(S.puntero.x, r.left + r.width * 0.25), r.right - 40);
    };

    // ----- Entradas: mouse / dedo -----
    const abajo = (e) => {
      if (e.target.closest('button') || S.fin) return;

      e.preventDefault();

      S.puntero.x = e.clientX;
      S.puntero.y = e.clientY;

      const ci = cuerdaDesdeY(e.clientY);

      S.punteros.set(e.pointerId, ci);

      try {
        raiz.setPointerCapture(e.pointerId);
      } catch (err) {
        /* no pasa nada */
      }

      arco.classList.add('is-presionado');
      resaltar(ci);
      golpear(ci, ahora());
    };

    const mover = (e) => {
      S.puntero.x = e.clientX;
      S.puntero.y = e.clientY;
      resaltar(cuerdaDesdeY(e.clientY));
    };

    const arriba = (e) => {
      const ci = S.punteros.get(e.pointerId);

      if (ci === undefined) return;

      S.punteros.delete(e.pointerId);
      liberar(ci, ahora());

      if (!S.punteros.size && !S.teclas.size) arco.classList.remove('is-presionado');
    };

    // ----- Entradas: teclado -----
    const teclaAbajo = (e) => {
      const ci = TECLAS[e.key.toLowerCase()];

      if (ci === undefined || e.repeat || S.fin || S.teclas.has(e.key.toLowerCase())) return;

      e.preventDefault();
      S.teclas.add(e.key.toLowerCase());
      arcoACuerda(ci);
      resaltar(ci);
      arco.classList.add('is-presionado');
      golpear(ci, ahora());
    };

    const teclaArriba = (e) => {
      const k = e.key.toLowerCase();
      const ci = TECLAS[k];

      if (ci === undefined) return;

      S.teclas.delete(k);
      liberar(ci, ahora());

      if (!S.punteros.size && !S.teclas.size) arco.classList.remove('is-presionado');
    };

    raiz.addEventListener('pointerdown', abajo);
    raiz.addEventListener('pointermove', mover);
    raiz.addEventListener('pointerup', arriba);
    raiz.addEventListener('pointercancel', arriba);
    window.addEventListener('keydown', teclaAbajo);
    window.addEventListener('keyup', teclaArriba);

    // ----- Cuenta regresiva -----
    const textosCuenta = ['3', '2', '1', '¡Toca!'];

    if (audio) {
      for (let k = 0; k < 4; k++) tic(audio, t0 + k * SPB, k === 3);
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

    // ----- Bucle principal -----
    const tick = () => {
      if (S.fin) return;

      const t = ahora();

      while (S.cuenta < 4 && t >= S.cuenta * SPB) {
        mostrarCuenta(S.cuenta);
        S.cuenta += 1;
      }

      for (let k = 0; k < notas.length; k++) {
        const n = notas[k];
        const dt = n.t - t;
        const finNota = n.t + n.len - t;

        // Fallo por no tocarla
        if (!n.juzgada && t > n.t + VENT.ok) fallar(n);

        if (S.fin) return;

        // Nota larga que llegó a su final sosteniéndola
        const a = S.activas[n.i];

        if (a && a.n === n && t >= n.t + n.len) cerrarLarga(n.i, true);

        if (n.oculta) continue;

        const visible = dt < APROX + 0.1 && finNota > -0.9;

        if (!visible) {
          if (n.el.style.visibility !== 'hidden') n.el.style.visibility = 'hidden';
          continue;
        }

        if (n.el.style.visibility !== 'visible') n.el.style.visibility = 'visible';

        let cabeza = M.hitPx + dt * M.vel;

        // Mientras la sostienes, la cabeza se queda en el círculo y la cola se acorta
        if (n.hit && n.hold && !n.soltada && t > n.t) {
          cabeza = M.hitPx;

          if (n.cola) n.cola.style.width = `${Math.max(0, finNota * M.vel)}px`;
        }

        n.el.style.transform = `translate3d(${cabeza - M.nota / 2}px,0,0)`;
      }

      // Barra de progreso
      progRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, t / FIN))})`;

      // Arco: sigue al puntero con suavidad
      S.bow.x += (S.puntero.x - S.bow.x) * 0.35;
      S.bow.y += (S.puntero.y - S.bow.y) * 0.35;

      const tocando = arco.classList.contains('is-presionado');
      const vaiven = tocando ? Math.sin(t * 22) * 7 : 0;

      arco.style.transform = `translate3d(${S.bow.x + vaiven}px,${S.bow.y}px,0) translate(-50%,-50%) rotate(-33deg)`;

      // Fin de la canción
      if (t > FIN) {
        terminar(false);
        return;
      }

      S.raf = requestAnimationFrame(tick);
    };

    S.raf = requestAnimationFrame(tick);

    // ----- Limpieza -----
    return () => {
      S.fin = true;
      cancelAnimationFrame(S.raf);
      ro.disconnect();

      raiz.removeEventListener('pointerdown', abajo);
      raiz.removeEventListener('pointermove', mover);
      raiz.removeEventListener('pointerup', arriba);
      raiz.removeEventListener('pointercancel', arriba);
      window.removeEventListener('keydown', teclaAbajo);
      window.removeEventListener('keyup', teclaArriba);

      Object.values(S.activas).forEach((a) => a.voz && a.voz.parar());

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
          <div className="vio__cuerdas">
            {CUERDAS.map((c) => (
              <div key={c.nombre}>
                <div className="vio-cuerda" style={{ top: `${c.y}%`, '--c': c.color }} />

                <div className="vio-etiqueta" style={{ top: `${c.y}%`, '--c': c.color }}>
                  {c.nombre}
                  <small>{c.tecla}</small>
                </div>

                <div
                  className="vio-diana"
                  style={{ top: `${c.y}%`, left: `${HIT_X * 100}%`, '--c': c.color }}
                />
              </div>
            ))}

            {PARTITURA.map((n) => (
              <div
                key={n.id}
                className={`vio-nota${n.hold ? ' vio-nota--larga' : ''}`}
                style={{ top: `${CUERDAS[n.i].y}%`, '--c': CUERDAS[n.i].color }}
              >
                {n.hold && <div className="vio-nota__cola" />}
                <div className="vio-nota__cuerpo">{n.nombre}</div>
              </div>
            ))}
          </div>

          <div className="vio__juicios" ref={juiciosRef} />
        </div>
      </div>

      {/* El arco: es el cursor */}
      <div className="vio-arco" ref={arcoRef} aria-hidden="true">
        <span className="vio-arco__talon" />
        <span className="vio-arco__punta" />
      </div>
    </>
  );
}