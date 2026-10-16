
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ProgressBar from './ProgressBar.jsx';
import estrella from '../assets/estrella.png';

// ─────────────────────────────────────────────────────────────
// TIEMPOS DEL LOADER (segundos)
// ─────────────────────────────────────────────────────────────
const TIEMPO_MINIMO = 5;
const SUBIDA_A_90 = 4;
const SUBIDA_A_100 = 0.8;

// Configuración de la música
const VOLUMEN_PIANO = 0.16;
const TEMPO_PIANO = 430;

// Frases de carga
const FRASES = [
  { hasta: 25, texto: 'Afinando el piano…' },
  { hasta: 50, texto: 'Poniendo a girar el vinilo…' },
  { hasta: 75, texto: 'Pegando las estrellas…' },
  { hasta: 99, texto: 'Casi listo…' },
  { hasta: 100, texto: '¡Listo!' },
];

const TITULO = 'Cargando portafolio'.split('');
const NOTAS = ['♪', '♫', '♪', '♫', '♪', '♪', '♫', '♪'];

// Melodía original: notas, duraciones y silencios en pulsos.
// Inspiración: piano delicado, nocturno y un poco misterioso.
const MELODIA = [
  [659.25, 1],
  [783.99, 1],
  [987.77, 2],
  [783.99, 1],
  [659.25, 1],
  [587.33, 2],
  [523.25, 1],
  [587.33, 1],
  [659.25, 2],
  [392.00, 1],
  [523.25, 1],
  [659.25, 2],
  [587.33, 1],
  [523.25, 1],
  [493.88, 2],
  [587.33, 1],
  [659.25, 1],
  [783.99, 2],
  [659.25, 1],
  [587.33, 1],
  [523.25, 3],
];

export default function Loader({ revealed, onFinish, onGone }) {
  const ref = useRef(null);
  const giro = useRef(null);
  const estallo = useRef(false);

  // Referencias del sistema musical
  const audioRef = useRef(null);
  const masterRef = useRef(null);
  const musicaTimer = useRef(null);
  const musicaActiva = useRef(false);
  const musicaDetenida = useRef(false);
  const notaActual = useRef(0);

  const [pct, setPct] = useState(0);

  // ───────────────────────────────────────────────────────────
  // MÚSICA DE PIANO GENERADA CON WEB AUDIO API
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = VOLUMEN_PIANO;
    master.connect(ctx.destination);
    masterRef.current = master;

    let eliminado = false;

    // Sonido sintetizado con armónicos y una envolvente
    // de caída para recordar el ataque de un piano.
    const tocarNota = (frecuencia, duracion = 0.7) => {
      if (
        eliminado ||
        musicaDetenida.current ||
        ctx.state !== 'running'
      ) {
        return;
      }

      const ahora = ctx.currentTime;
      const salida = ctx.createGain();
      const filtro = ctx.createBiquadFilter();

      filtro.type = 'lowpass';
      filtro.frequency.setValueAtTime(4200, ahora);
      filtro.frequency.exponentialRampToValueAtTime(
        900,
        ahora + duracion
      );

      salida.gain.setValueAtTime(0.0001, ahora);
      salida.gain.exponentialRampToValueAtTime(
        0.65,
        ahora + 0.012
      );
      salida.gain.exponentialRampToValueAtTime(
        0.22,
        ahora + 0.12
      );
      salida.gain.exponentialRampToValueAtTime(
        0.0001,
        ahora + duracion
      );

      filtro.connect(salida);
      salida.connect(master);

      const fundamental = ctx.createOscillator();
      const armonico = ctx.createOscillator();
      const brillo = ctx.createGain();

      fundamental.type = 'triangle';
      fundamental.frequency.setValueAtTime(frecuencia, ahora);

      armonico.type = 'sine';
      armonico.frequency.setValueAtTime(
        frecuencia * 2,
        ahora
      );

      brillo.gain.value = 0.13;
      armonico.connect(brillo);
      brillo.connect(filtro);
      fundamental.connect(filtro);

      fundamental.start(ahora);
      armonico.start(ahora);

      fundamental.stop(ahora + duracion + 0.03);
      armonico.stop(ahora + duracion + 0.03);

      fundamental.onended = () => {
        fundamental.disconnect();
        armonico.disconnect();
        brillo.disconnect();
        filtro.disconnect();
        salida.disconnect();
      };
    };

    // Reproduce la melodía en bucle mientras se carga.
    const reproducirSiguiente = () => {
      if (
        eliminado ||
        musicaDetenida.current ||
        !musicaActiva.current
      ) {
        return;
      }

      const [frecuencia, pulsos] =
        MELODIA[notaActual.current];

      tocarNota(frecuencia, 0.75);

      // Un acompañamiento suave en las notas principales.
      if (notaActual.current % 4 === 0) {
        tocarNota(frecuencia / 2, 1.1);
      }

      notaActual.current =
        (notaActual.current + 1) % MELODIA.length;

      musicaTimer.current = window.setTimeout(
        reproducirSiguiente,
        TEMPO_PIANO * pulsos
      );
    };

    const iniciarMusica = async () => {
      if (
        eliminado ||
        musicaDetenida.current ||
        musicaActiva.current
      ) {
        return;
      }

      try {
        if (ctx.state !== 'running') {
          await ctx.resume();
        }

        if (
          eliminado ||
          musicaDetenida.current ||
          ctx.state !== 'running'
        ) {
          return;
        }

        musicaActiva.current = true;
        reproducirSiguiente();
      } catch {
        // Algunos navegadores exigen una interacción del usuario.
      }
    };

    // Intentamos iniciar automáticamente.
    iniciarMusica();

    // Si el navegador bloquea el audio automático,
    // la primera interacción habilita la música.
    const habilitarAudio = () => {
      iniciarMusica();
    };

    window.addEventListener('pointerdown', habilitarAudio);
    window.addEventListener('keydown', habilitarAudio);

    // Al desmontar, detener y liberar todo el audio.
    return () => {
      eliminado = true;
      musicaDetenida.current = true;
      musicaActiva.current = false;

      clearTimeout(musicaTimer.current);

      window.removeEventListener(
        'pointerdown',
        habilitarAudio
      );
      window.removeEventListener(
        'keydown',
        habilitarAudio
      );

      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }

      audioRef.current = null;
      masterRef.current = null;
    };
  }, []);

  // Detener la música cuando termina la carga.
  useEffect(() => {
    if (pct < 100 || musicaDetenida.current) return;

    musicaDetenida.current = true;
    musicaActiva.current = false;

    clearTimeout(musicaTimer.current);

    const ctx = audioRef.current;
    const master = masterRef.current;

    if (!ctx || ctx.state === 'closed') return;

    // Fundido de salida para que el piano no se corte bruscamente.
    if (master && ctx.state === 'running') {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(
        master.gain.value,
        ctx.currentTime
      );
      master.gain.linearRampToValueAtTime(
        0,
        ctx.currentTime + 0.3
      );
    }

    const timer = window.setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }

      if (audioRef.current === ctx) {
        audioRef.current = null;
        masterRef.current = null;
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pct]);

  // ───────────────────────────────────────────────────────────
  // PROGRESO: 0 → 90 → 100
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const state = { p: 0 };
    const inicio = Date.now();

    const render = () => setPct(state.p);

    const toNinety = gsap.to(state, {
      p: 90,
      duration: SUBIDA_A_90,
      ease: 'power1.out',
      onUpdate: render,
    });

    let timer;
    let toHundred;

    const finish = () => {
      toNinety.kill();

      toHundred = gsap.to(state, {
        p: 100,
        duration: SUBIDA_A_100,
        ease: 'power2.out',
        onUpdate: render,
        onComplete: onFinish,
      });
    };

    const programar = (extra) => {
      const falta =
        TIEMPO_MINIMO * 1000 - (Date.now() - inicio);

      timer = setTimeout(
        finish,
        Math.max(extra, falta)
      );
    };

    const onLoad = () => programar(400);

    if (document.readyState === 'complete') {
      programar(1200);
    } else {
      window.addEventListener('load', onLoad, {
        once: true,
      });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', onLoad);

      toNinety.kill();
      toHundred && toHundred.kill();
    };
  }, [onFinish]);

  // ───────────────────────────────────────────────────────────
  // ENTRADA Y ANIMACIONES CONTINUAS
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const reducir = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const ctx = gsap.context(() => {
      gsap.from('.ld-vinyl', {
        scale: 0,
        rotation: -120,
        duration: 1,
        ease: 'back.out(1.6)',
      });

      gsap.from('.loader__tag', {
        y: -30,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'back.out(2)',
      });

      gsap.from('.ld-frase', {
        opacity: 0,
        y: 14,
        duration: 0.5,
        delay: 0.5,
      });

      gsap.from('#loader .bar', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: 'power3.out',
      });

      gsap.from('.loader__role', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.8,
      });

      gsap.from('.ld-star', {
        scale: 0,
        rotation: -180,
        duration: 0.8,
        delay: 0.7,
        stagger: 0.15,
        ease: 'back.out(2)',
      });

      if (reducir) return;

      // El vinilo se acelera con el progreso.
      giro.current = gsap.to('.ld-disc', {
        rotation: 360,
        duration: 2.4,
        repeat: -1,
        ease: 'none',
      });

      // Ola en el título.
      gsap.to('.ld-l', {
        y: -7,
        duration: 0.4,
        ease: 'sine.inOut',
        stagger: {
          each: 0.06,
          repeat: -1,
          yoyo: true,
        },
      });

      // Estrellas flotantes.
      gsap.utils.toArray('.ld-star').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 ? 14 : -14,
          rotation: i % 2 ? 25 : -25,
          duration: 1.6 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      // Notas que salen del vinilo.
      gsap.utils.toArray('.ld-note').forEach((el, i) => {
        gsap.set(el, { opacity: 0 });

        const tl = gsap.timeline({
          repeat: -1,
          repeatRefresh: true,
          delay: 1 + i * 0.4,
        });

        tl.fromTo(
          el,
          {
            x: 0,
            y: 0,
            scale: 0.4,
            rotation: 0,
          },
          {
            x: () => gsap.utils.random(-170, 170),
            y: () => gsap.utils.random(-240, -120),
            rotation: () => gsap.utils.random(-45, 45),
            scale: 1,
            duration: 2.2,
            ease: 'power1.out',
          },
          0
        )
          .fromTo(
            el,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            0
          )
          .to(
            el,
            { opacity: 0, duration: 0.7 },
            1.5
          );
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  // El vinilo acelera a medida que aumenta el porcentaje.
  useEffect(() => {
    giro.current &&
      giro.current.timeScale(1 + pct / 18);
  }, [pct]);

  // Estallido al completar la carga.
  useEffect(() => {
    if (
      pct < 99.5 ||
      estallo.current ||
      !ref.current
    ) {
      return;
    }

    estallo.current = true;

    const q = (s) => ref.current.querySelectorAll(s);

    gsap.fromTo(
      q('.ld-ring'),
      { scale: 0.7, opacity: 1 },
      {
        scale: 2.6,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.12,
      }
    );

    gsap.fromTo(
      q('.ld-vinyl'),
      { scale: 1 },
      {
        scale: 1.12,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      }
    );
  }, [pct]);

  // Salida del loader.
  useEffect(() => {
    if (!revealed || !ref.current) return;

    const tween = gsap.to(ref.current, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut',
      onComplete: onGone,
    });

    return () => tween.kill();
  }, [revealed, onGone]);

  const frase = (
    FRASES.find((f) => pct <= f.hasta) ||
    FRASES[FRASES.length - 1]
  ).texto;

  return (
    <div id="loader" ref={ref} aria-live="polite">
      <style>{`
        #loader {
          overflow: hidden;
        }

        .ld-star {
          position: absolute;
          width: clamp(34px, 7vw, 84px);
          height: auto;
          pointer-events: none;
          filter: drop-shadow(
            0 4px 0 rgba(11, 42, 122, .5)
          );
        }

        .ld-star--a {
          top: 9%;
          left: 8%;
        }

        .ld-star--b {
          top: 14%;
          right: 9%;
          width: clamp(28px, 5vw, 64px);
        }

        .ld-star--c {
          bottom: 10%;
          left: 12%;
          width: clamp(26px, 4.5vw, 56px);
        }

        .ld-star--d {
          bottom: 14%;
          right: 8%;
        }

        .loader__inner {
          position: relative;
          z-index: 2;
        }

        .loader__tag {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
        }

        .ld-l {
          display: inline-block;
          white-space: pre;
        }

        .ld-vinyl {
          position: relative;
          width: min(46vw, 34svh, 300px);
          aspect-ratio: 1;
          margin: 0 auto 1.4rem;
        }

        .ld-disc {
          position: absolute;
          inset: 0;
          border: 4px solid var(--ink);
          border-radius: 50%;
          background:
            conic-gradient(
              from 20deg,
              rgba(255,255,255,.22),
              transparent 18%,
              transparent 50%,
              rgba(255,255,255,.18) 68%,
              transparent 85%,
              rgba(255,255,255,.22)
            ),
            repeating-radial-gradient(
              circle,
              #101018 0 3px,
              #1d1d2a 3px 5px
            );
          box-shadow:
            0 8px 0 rgba(43, 26, 26, .55),
            0 18px 34px rgba(0, 0, 0, .35);
        }

        .ld-label {
          position: absolute;
          left: 50%;
          top: 50%;
          display: grid;
          place-items: center;
          width: 40%;
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border: 3px solid var(--ink);
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(255,255,255,.35) 1.2px,
              transparent 1.6px
            ) 0 0 / 8px 8px,
            var(--gold);
          container-type: inline-size;
        }

        .ld-label::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 9%;
          aspect-ratio: 1;
          transform: translate(-50%, -165%);
          border-radius: 50%;
          background: var(--ink);
        }

        .ld-pct {
          margin-top: 14%;
          color: var(--ink);
          font-family: "Titan", var(--font-title), sans-serif;
          font-size: 30cqw;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .ld-ring {
          position: absolute;
          inset: 0;
          border: 5px solid #fff;
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
        }

        .ld-notes {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .ld-note {
          position: absolute;
          left: -.5em;
          top: -.5em;
          color: #fff;
          font-family: "Titan", var(--font-title), sans-serif;
          font-size: clamp(22px, 4vw, 38px);
          text-shadow: 0 3px 0 var(--ink);
          opacity: 0;
        }

        .ld-frase {
          min-height: 1.6em;
          margin-top: .9rem;
          font-family: "Smile", var(--font-body), sans-serif;
          font-size: clamp(.95rem, 2.8vw, 1.2rem);
          text-shadow: 0 2px 0 var(--ink);
        }

        .loader__role {
          font-family: "Smile", var(--font-body), sans-serif;
          color: #fff;
        }

        .ld-frase span {
          display: inline-block;
          animation:
            ld-pop .35s cubic-bezier(.34, 1.56, .64, 1) both;
        }

        @keyframes ld-pop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.9);
          }

          to {
            opacity: 1;
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ld-frase span {
            animation: none;
          }
        }
      `}</style>

      <img
        className="ld-star ld-star--a"
        src={estrella}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      <img
        className="ld-star ld-star--b"
        src={estrella}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      <img
        className="ld-star ld-star--c"
        src={estrella}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      <img
        className="ld-star ld-star--d"
        src={estrella}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      <div className="loader__inner">
        <p
          className="loader__tag"
          aria-label="Cargando portafolio"
        >
          {TITULO.map((c, i) => (
            <span
              key={i}
              className="ld-l"
              aria-hidden="true"
            >
              {c}
            </span>
          ))}
        </p>

        <div className="ld-vinyl" aria-hidden="true">
          <div className="ld-notes">
            {NOTAS.map((n, i) => (
              <span key={i} className="ld-note">
                {n}
              </span>
            ))}
          </div>

          <span className="ld-ring" />
          <span className="ld-ring" />
          <div className="ld-disc" />

          <div className="ld-label">
            <span className="ld-pct">
              {Math.round(pct)}
            </span>
          </div>
        </div>

        <ProgressBar
          variant="loader"
          name="Luis Miguel Moreno Santos"
          value={pct}
          label="Cargando portafolio"
        />

        <p className="ld-frase">
          <span key={frase}>{frase}</span>
        </p>

        <p className="loader__role">
          Productor Multimedia
        </p>
      </div>
    </div>
  );
}
