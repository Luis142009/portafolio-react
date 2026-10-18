import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import '../stylesheets/Fiesta.css';

// ---------------------------------------------------------
// MODO FIESTA (prueba)
//
// Al encenderlo:
//   · aparece "¡FIESTA!" letra por letra (GSAP)
//   · cae una bola disco que se balancea y brilla (GSAP)
//   · suben globos que se pueden REVENTAR con clic (GSAP)
//   · cañones de confeti desde las esquinas cada pocos segundos
//   · chispas que siguen al puntero
//   · los elementos del Hero laten, saltan y se mueven al ritmo
//   · el fondo cambia de color y hay luces suaves en los bordes
//   · cinta "¡FIESTA!" abajo
//
// Todo se dibuja en un portal sobre <body>: no toca el 3D del Hero.
// Esc o el botón para parar.
// Con "reducir movimiento" activado en el sistema queda la versión suave
// (luces fijas y cinta, sin animaciones).
// ---------------------------------------------------------

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORES = [
  '#ff3d9a', '#ffd400', '#00e0ff', '#8a5cff',
  '#35f28a', '#ff7a00', '#ffffff', '#f3b64a',
];

const COLORES_GLOBO = [
  '#ff3d9a', '#ffd400', '#00c2ff', '#8a5cff', '#35f28a', '#ff7a00',
];

// ---- Ajustes rápidos: prende/apaga efectos o cambia cantidades ----
const EFECTOS = {
  titulo: true,    // "¡FIESTA!" letra por letra
  bola: true,      // bola disco
  globos: true,    // globos que se revientan
  canones: true,   // cañones de confeti periódicos
  chispas: true,   // chispas que siguen al puntero
  latido: true,    // el Hero late / salta / se mueve
};

const CONFETI_POR_FRAME = 3;   // lluvia de confeti (más = más denso)
const MAX_GLOBOS = 9;          // globos a la vez
const GLOBO_CADA_MS = 1100;    // cada cuánto sale un globo
const CANON_CADA_MS = 3800;    // cada cuánto dispara un cañón
const LATIDO = 1.06;           // cuánto crece cada elemento en el latido
const BPM_PAUSA = 0.26;        // pausa entre latidos (0.26 ≈ 120 BPM)

const FRASE = '¡FIESTA!    🎊  ¡FIESTA!  ✨  🎶  ';
const CINTA = FRASE.repeat(8);
const TITULO = '¡FIESTA!'.split('');

const crear = (x, y, vx, vy, extra = {}) => ({
  x,
  y,
  vx,
  vy,
  w: 6 + Math.random() * 7,
  h: 4 + Math.random() * 6,
  rot: Math.random() * Math.PI * 2,
  vr: (Math.random() - 0.5) * 0.3,
  osc: Math.random() * Math.PI * 2,
  color: COLORES[(Math.random() * COLORES.length) | 0],
  circulo: Math.random() < 0.25,
  g: 0.12,       // gravedad
  vida: 1,       // 1 → 0 (solo si decae > 0)
  decae: 0,
  ...extra,
});

export default function Fiesta() {
  const [activa, setActiva] = useState(false);

  const activaRef = useRef(false);
  const canvasRef = useRef(null);
  const particulas = useRef([]);
  const raf = useRef(0);

  const globosRef = useRef(null);
  const bolaRef = useRef(null);
  const tituloRef = useRef(null);

  // ---------------------------------------------------------
  // Confeti y chispas (canvas)
  // ---------------------------------------------------------
  const bucle = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      raf.current = 0;
      return;
    }

    const ctx = canvas.getContext('2d');
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    // lluvia continua mientras la fiesta está encendida
    if (activaRef.current && !reduce) {
      for (let i = 0; i < CONFETI_POR_FRAME; i += 1) {
        particulas.current.push(
          crear(
            Math.random() * w,
            -12,
            (Math.random() - 0.5) * 2,
            1 + Math.random() * 2.5
          )
        );
      }
    }

    particulas.current = particulas.current.filter(
      (p) => p.y < h + 30 && p.vida > 0
    );

    particulas.current.forEach((p) => {
      p.vy += p.g;
      if (!p.decae) p.vy = Math.min(p.vy, 4.5);

      p.vx *= 0.99;
      p.osc += 0.08;
      p.x += p.vx + (p.decae ? 0 : Math.sin(p.osc) * 0.8);
      p.y += p.vy;
      p.rot += p.vr;
      p.vida -= p.decae;

      ctx.save();
      ctx.globalAlpha = p.decae ? Math.max(p.vida, 0) : 1;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (!p.decae) ctx.scale(1, Math.cos(p.osc * 1.5)); // aleteo
      ctx.fillStyle = p.color;

      if (p.circulo) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      ctx.restore();
    });

    if (particulas.current.length || activaRef.current) {
      raf.current = requestAnimationFrame(bucle);
    } else {
      raf.current = 0;
    }
  }, []);

  const arrancarBucle = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(bucle);
  }, [bucle]);

  // cañón: explosión de confeti desde un punto
  const explosion = useCallback(
    (x, y, cantidad, centro = -Math.PI / 2) => {
      if (reduce) return;

      for (let i = 0; i < cantidad; i += 1) {
        const ang = centro + (Math.random() - 0.5) * Math.PI * 0.8;
        const vel = 6 + Math.random() * 9;

        particulas.current.push(
          crear(x, y, Math.cos(ang) * vel, Math.sin(ang) * vel)
        );
      }

      arrancarBucle();
    },
    [arrancarBucle]
  );

  // estallido redondo (al reventar un globo)
  const estallido = useCallback(
    (x, y, color) => {
      if (reduce) return;

      for (let i = 0; i < 30; i += 1) {
        const ang = Math.random() * Math.PI * 2;
        const vel = 2 + Math.random() * 7;
        const tam = 4 + Math.random() * 5;

        particulas.current.push(
          crear(x, y, Math.cos(ang) * vel, Math.sin(ang) * vel - 1, {
            color: i % 3 === 0 ? '#ffffff' : color,
            circulo: true,
            w: tam,
            h: tam,
            g: 0.18,
            decae: 0.022,
          })
        );
      }

      arrancarBucle();
    },
    [arrancarBucle]
  );

  // tamaño del canvas
  useEffect(() => {
    const ajustar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    ajustar();
    window.addEventListener('resize', ajustar);

    return () => {
      window.removeEventListener('resize', ajustar);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  // ---------------------------------------------------------
  // Encender / apagar
  // ---------------------------------------------------------
  const detener = useCallback(() => {
    activaRef.current = false;
    setActiva(false);
  }, []);

  const alternar = () => {
    const siguiente = !activaRef.current;

    activaRef.current = siguiente;
    setActiva(siguiente);

    if (siguiente) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      explosion(w * 0.1, h * 0.85, 90, -Math.PI / 3);
      explosion(w * 0.9, h * 0.85, 90, (-2 * Math.PI) / 3);
      explosion(w * 0.5, h * 0.9, 60);

      arrancarBucle();
    }
  };

  // Clase en <body> (la usa el CSS: fondo, luces, cinta) + tecla Esc
  useEffect(() => {
    document.body.classList.toggle('party-on', activa);

    if (!activa) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') detener();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [activa, detener]);

  useEffect(
    () => () => {
      document.body.classList.remove('party-on');
    },
    []
  );

  // ---------------------------------------------------------
  // "¡FIESTA!" letra por letra
  // ---------------------------------------------------------
  useEffect(() => {
    const cont = tituloRef.current;

    if (!EFECTOS.titulo || !activa || reduce || !cont) return undefined;

    const letras = cont.querySelectorAll('.fiesta__letra');

    const tl = gsap.timeline({
      onComplete: () => gsap.set(cont, { autoAlpha: 0 }),
    });

    tl.set(cont, { autoAlpha: 1 })
      .fromTo(
        letras,
        {
          y: 180,
          scale: 0,
          autoAlpha: 0,
          rotation: () => gsap.utils.random(-70, 70),
        },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          rotation: 0,
          duration: 0.75,
          ease: 'back.out(2.4)',
          stagger: 0.07,
        }
      )
      .to(
        letras,
        {
          y: -16,
          duration: 0.18,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: 5,
          stagger: { each: 0.04 },
        },
        '>-0.15'
      )
      .to(
        letras,
        {
          y: -280,
          scale: 0.4,
          autoAlpha: 0,
          rotation: () => gsap.utils.random(-45, 45),
          duration: 0.55,
          ease: 'power2.in',
          stagger: 0.04,
        },
        '+=0.25'
      );

    return () => {
      tl.kill();
      gsap.set(cont, { autoAlpha: 0 });
    };
  }, [activa]);

  // ---------------------------------------------------------
  // Bola disco: baja con rebote, se balancea y brilla
  // ---------------------------------------------------------
  useEffect(() => {
    const bola = bolaRef.current;

    if (!EFECTOS.bola || !activa || reduce || !bola) return undefined;

    const brillos = bola.querySelectorAll('.fiesta__brillo');

    gsap.set(bola, { transformOrigin: '50% 0%' });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bola,
        { y: -420, rotation: -9 },
        { y: 0, duration: 1.3, ease: 'elastic.out(1, 0.45)', delay: 0.2 }
      );

      gsap.fromTo(
        bola,
        { rotation: -9 },
        {
          rotation: 9,
          duration: 1.7,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1,
        }
      );

      gsap.fromTo(
        brillos,
        { scale: 0, autoAlpha: 1, rotation: 0 },
        {
          scale: 1.3,
          autoAlpha: 0,
          rotation: 120,
          duration: 1,
          ease: 'power2.out',
          repeat: -1,
          repeatDelay: 0.2,
          stagger: 0.28,
        }
      );
    }, bola);

    return () => {
      ctx.kill();
      gsap.to(bola, { y: -420, rotation: 0, duration: 0.6, ease: 'power2.in' });
    };
  }, [activa]);

  // ---------------------------------------------------------
  // Globos (se revientan con clic), cañones y chispas del puntero
  // ---------------------------------------------------------
  useEffect(() => {
    if (!activa || reduce) return undefined;

    const cont = globosRef.current;
    const ids = [];
    const vivos = new Map(); // globo → timeline

    // --- Globos ---
    const quitar = (el) => {
      const tl = vivos.get(el);

      vivos.delete(el);
      if (tl) tl.kill();
      el.remove();
    };

    const reventar = (el, color) => {
      const tl = vivos.get(el);
      if (!tl) return;

      tl.kill();
      vivos.delete(el);

      const r = el.getBoundingClientRect();
      estallido(r.left + r.width / 2, r.top + r.height * 0.4, color);

      gsap.to(el, {
        scale: 1.6,
        autoAlpha: 0,
        duration: 0.18,
        ease: 'power2.out',
        onComplete: () => el.remove(),
      });
    };

    const crearGlobo = () => {
      if (!cont || vivos.size >= MAX_GLOBOS) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      const ancho = gsap.utils.random(46, 84);
      const color = gsap.utils.random(COLORES_GLOBO);
      const dur = gsap.utils.random(7, 12);

      const el = document.createElement('button');
      el.type = 'button';
      el.tabIndex = -1;
      el.className = 'fiesta__globo';
      el.setAttribute('aria-label', 'Reventar globo');
      el.style.setProperty('--c', color);
      el.style.width = `${ancho}px`;
      el.style.height = `${ancho * 1.2}px`;
      cont.appendChild(el);

      gsap.set(el, {
        x: gsap.utils.random(8, Math.max(9, w - ancho - 8)),
        y: h + 40,
        rotation: gsap.utils.random(-8, 8),
        transformOrigin: '50% 100%',
      });

      const tl = gsap.timeline();

      tl.to(
        el,
        {
          y: -(ancho * 1.2 + 220),
          duration: dur,
          ease: 'none',
          onComplete: () => quitar(el),
        },
        0
      )
        .to(
          el,
          {
            x: `+=${gsap.utils.random(-60, 60)}`,
            duration: dur / 4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 3,
          },
          0
        )
        .to(
          el,
          {
            rotation: gsap.utils.random(-12, 12),
            duration: 1.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: Math.ceil(dur / 1.4),
          },
          0
        );

      vivos.set(el, tl);
      el.addEventListener('click', () => reventar(el, color));
    };

    if (EFECTOS.globos) {
      for (let i = 0; i < 4; i += 1) {
        ids.push(setTimeout(crearGlobo, i * 400));
      }

      ids.push(setInterval(crearGlobo, GLOBO_CADA_MS));
    }

    // --- Cañones de confeti desde las esquinas ---
    if (EFECTOS.canones) {
      let lado = 0;

      ids.push(
        setInterval(() => {
          const w = window.innerWidth;
          const h = window.innerHeight;

          lado = 1 - lado;

          explosion(
            lado ? w * 0.06 : w * 0.94,
            h * 0.9,
            55,
            lado ? -Math.PI / 3 : (-2 * Math.PI) / 3
          );
        }, CANON_CADA_MS)
      );
    }

    // --- Chispas que siguen al puntero ---
    let ultimo = 0;

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;

      const ahora = performance.now();
      if (ahora - ultimo < 30) return;
      ultimo = ahora;

      for (let i = 0; i < 2; i += 1) {
        const tam = 3 + Math.random() * 4;

        particulas.current.push(
          crear(
            e.clientX,
            e.clientY,
            (Math.random() - 0.5) * 2.5,
            (Math.random() - 0.5) * 2.5 - 1,
            {
              circulo: true,
              w: tam,
              h: tam,
              g: 0.04,
              decae: 0.03,
            }
          )
        );
      }

      arrancarBucle();
    };

    if (EFECTOS.chispas) window.addEventListener('pointermove', onMove);

    return () => {
      ids.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });

      window.removeEventListener('pointermove', onMove);

      vivos.forEach((tl, el) => {
        tl.kill();

        gsap.to(el, {
          autoAlpha: 0,
          scale: 0.5,
          duration: 0.35,
          onComplete: () => el.remove(),
        });
      });

      vivos.clear();
    };
  }, [activa, explosion, estallido, arrancarBucle]);

  // ---------------------------------------------------------
  // Latido: el Hero late, salta y se mueve al ritmo (120 BPM)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!EFECTOS.latido || !activa || reduce) return undefined;

    const todos = gsap.utils.toArray(
      '.hero .frame--home .layer:not(.l-paper):not(.l-speech) .in'
    );

    if (!todos.length) return undefined;

    const char = gsap.utils.toArray('.hero .l-char .in');
    const titulo = gsap.utils.toArray('.hero .l-title .in');
    const vinilo = gsap.utils.toArray('.hero .l-vinyl .in');
    const estrellas = gsap.utils.toArray('.hero .l-star .in');
    const info = gsap.utils.toArray('.hero .l-info .in');

    const ctx = gsap.context(() => {
      // latido de todos (escala)
      gsap.fromTo(
        todos,
        { scale: 1 },
        {
          scale: LATIDO,
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: -1,
          repeatDelay: BPM_PAUSA,
          stagger: { each: 0.03 },
        }
      );

      // el personaje salta
      gsap.to(char, {
        y: -22,
        duration: 0.25,
        ease: 'power2.out',
        yoyo: true,
        repeat: -1,
      });

      // el título se bambolea
      gsap.fromTo(
        titulo,
        { rotation: -3 },
        {
          rotation: 3,
          duration: 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }
      );

      // el vinilo se mece
      gsap.fromTo(
        vinilo,
        { rotation: -6 },
        {
          rotation: 6,
          duration: 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }
      );

      // las estrellas giran de lado a lado
      gsap.fromTo(
        estrellas,
        { rotation: -25 },
        {
          rotation: 25,
          duration: 0.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.15,
        }
      );

      // la barra del nombre se desliza
      gsap.fromTo(
        info,
        { x: -8 },
        {
          x: 8,
          duration: 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }
      );
    });

    return () => {
      ctx.kill();

      gsap.to(todos, {
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
  }, [activa]);

  // ---------------------------------------------------------
  // RENDER (en un portal sobre <body>)
  // ---------------------------------------------------------
  return createPortal(
    <>
      <button
        className={'fiesta__btn' + (activa ? ' is-on' : '')}
        type="button"
        aria-pressed={activa}
        onClick={alternar}
      >
        <span aria-hidden="true">{activa ? '🛑' : '🎉'}</span>
        {activa ? 'Parar fiesta' : 'Fiesta'}
      </button>

      <div className="fiesta__luces" aria-hidden="true">
        <div className="fiesta__haz fiesta__haz--izq" />
        <div className="fiesta__haz fiesta__haz--der" />
        <div className="fiesta__blob fiesta__blob--1" />
        <div className="fiesta__blob fiesta__blob--2" />
        <div className="fiesta__blob fiesta__blob--3" />
        <div className="fiesta__flash" />
      </div>

      <div className="fiesta__bola" ref={bolaRef} aria-hidden="true">
        <span className="fiesta__bola-cuerda" />
        <span className="fiesta__bola-esfera">
          <i className="fiesta__brillo fiesta__brillo--1">✦</i>
          <i className="fiesta__brillo fiesta__brillo--2">✦</i>
          <i className="fiesta__brillo fiesta__brillo--3">✦</i>
          <i className="fiesta__brillo fiesta__brillo--4">✦</i>
        </span>
      </div>

      <div className="fiesta__globos" ref={globosRef} />

      <canvas ref={canvasRef} className="fiesta__confeti" aria-hidden="true" />

      <div className="fiesta__titulo" ref={tituloRef} aria-hidden="true">
        {TITULO.map((letra, i) => (
          <span
            key={i}
            className="fiesta__letra"
            style={{ '--c': COLORES[i % COLORES.length] }}
          >
            {letra}
          </span>
        ))}
      </div>

      <div className="fiesta__cinta" aria-hidden="true">
        <span>
          {CINTA}
          {CINTA}
        </span>
      </div>
    </>,
    document.body
  );
}