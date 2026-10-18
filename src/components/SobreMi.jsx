import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import sobremi from '../assets/sobremi.png';
import tarjeta from '../assets/tarjeta-cafe.png';
import luis from '../assets/luis-saludo.png';
import nota from '../assets/nota.png';
import estrella from '../assets/estrella.png';
import disenoTitulo from '../assets/diseno-titulo.png';
import software from '../assets/software.png';
import papelTop from '../assets/papel-top.png';
import papelMid from '../assets/papel-mid.png';
import papelBottom from '../assets/papel-bottom.png';
import OsuGame from './Osugame.jsx';

import '../stylesheets/Sobremi.css';

gsap.registerPlugin(ScrollTrigger);

const ABOUT_TRIGGER = 'top 85%';

// Ancho de diseño de respaldo. El valor real se lee del CSS (--dw)
// para que JS y CSS usen SIEMPRE el mismo número.
const FALLBACK_DESIGN_WIDTH = 1818;

// true  = respeta "reducir movimiento" del sistema (sin animaciones de entrada)
// false = anima siempre (útil si tu celular tiene ahorro de batería / quitar animaciones)
const RESPECT_REDUCED_MOTION = true;

// ============================================================
// HABILIDADES
// y  = posición vertical de la barra (%)
// dx = ajuste horizontal por fila (cqw). Positivo = más lejos
//      del ícono. Compensa la curvatura de la columna de íconos.
// ============================================================

const SKILLS = [
  { id: 'ai',    name: 'Adobe Illustrator',   level: 88, y: 5,    dx: 0 },
  { id: 'ae',    name: 'Adobe After Effects', level: 78, y: 30.5, dx: 1 },
  { id: 'ps',    name: 'Adobe Photoshop',     level: 82, y: 56,   dx: 2 },
  { id: 'canva', name: 'Canva',               level: 72, y: 81.5, dx: 6 },
];

// ============================================================
// PROFUNDIDAD 3D
// ============================================================

const DEPTH = {
  '.l-sm-bg': -30,
  '.l-sm-card': 5,
  '.l-sm-estrella': 10,
  '.l-sm-char': 15,
  '.l-sm-nota': 20,
  '.sm-bg__bottom--front': 25,
  '.l-sm-list': 28,
  '.l-sm-title': 35,
};

// ============================================================
// PARALLAX CON EL MOUSE
// ============================================================

const PARALLAX = [
  ['.sm-bg__bottom--front', 14, 1],
  ['.l-sm-title', 22, 2],
  ['.sm-diseno', 20, 2],
  ['.l-sm-card', 32, 2.5],
  ['.l-sm-nota', 52, 4],
  ['.l-sm-estrella', 62, 3],
];

const MAX_TILT = 1;

// ============================================================
// ELEMENTOS QUE DEBEN ESTAR VISIBLES
// ============================================================

const VISIBLE_TARGETS = [
  '.l-sm-title .in',
  '.l-sm-card .in',
  '.l-sm-char .in',
  '.l-sm-nota .in',
  '.l-sm-estrella .in',
  '.l-sm-list .in',
  '.sm-text',
  '.sm-diseno',
  '.sm-sub',
  '.sm-software',
  '.sm-bar__track',
  '.sm-word',
  '.sm-word__inner',
].join(', ');

// ============================================================
// REVEAL TEXT
// Divide el texto en palabras para animarlas individualmente.
// Permite elegir la etiqueta para conservar la estructura HTML.
// ============================================================

function RevealText({ children, className = '', as = 'span' }) {
  const Tag = as;
  const words = children.trim().split(/\s+/);

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span className="sm-word" key={`${word}-${i}`}>
          <span className="sm-word__inner">{word}</span>
        </span>
      )).reduce((result, word, i) => {
        if (i > 0) result.push(' ');
        result.push(word);
        return result;
      }, [])}
    </Tag>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function SobreMi() {
  const anchor = useRef(null);

  useLayoutEffect(() => {
    const section = anchor.current?.closest('.frame--about');

    if (!section) return;

    // --------------------------------------------------------
    // ESCALA: lee --dw del CSS (mismo valor que usa el CSS)
    // y garantiza que --fw exista (si el Hero no lo definió
    // todavía, lo pone con el ancho real del marco).
    // --------------------------------------------------------

    const getDesignWidth = () => {
      const v = parseFloat(
        getComputedStyle(section).getPropertyValue('--dw')
      );
      return v > 0 ? v : FALLBACK_DESIGN_WIDTH;
    };

    const getSu = () => section.offsetWidth / getDesignWidth();

    if (!getComputedStyle(section).getPropertyValue('--fw').trim()) {
      section.style.setProperty('--fw', `${section.offsetWidth}px`);
    }

    // --------------------------------------------------------
    // REFRESH ROBUSTO PARA CELULAR
    // - imágenes que cargan tarde
    // - barra de direcciones que cambia la altura
    // - el evento 'load' ya pudo haber pasado
    // --------------------------------------------------------

    let refreshRaf = 0;

    const refresh = () => {
      cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    window.addEventListener('load', refresh);

    const imgs = Array.from(section.querySelectorAll('img'));

    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', refresh, { once: true });
      }
    });

    let ro = null;

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(refresh);
      ro.observe(section);
    }

    refresh();

    // --------------------------------------------------------
    // MATCH MEDIA
    // --------------------------------------------------------

    const mm = gsap.matchMedia(section);

    mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        motion: '(prefers-reduced-motion: no-preference)',
        fine: '(hover: hover) and (pointer: fine)',
      },
      (context) => {
        const { reduce: reduceMQ, fine } = context.conditions;
        const reduce = RESPECT_REDUCED_MOTION && reduceMQ;

        const su = getSu();

        // ----------------------------------------------------
        // ESTADO BASE
        // ----------------------------------------------------

        gsap.set('.l-sm-bg, .l-sm-bg .in', {
          autoAlpha: 1,
          x: 0,
          y: 0,
        });

        gsap.set(
          '.l-sm-title--front, .sm-bg__bottom--front',
          { autoAlpha: 1 }
        );

        Object.entries(DEPTH).forEach(([selector, z]) => {
          gsap.set(selector, { z });
        });

        // ----------------------------------------------------
        // MOVIMIENTO REDUCIDO
        // Todo visible sin animaciones de entrada.
        // ----------------------------------------------------

        if (reduce) {
          gsap.set(VISIBLE_TARGETS, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            yPercent: 0,
          });

          gsap.set('.sm-bar__fill', {
            width: (i, el) => `${el.dataset.level}%`,
          });

          return;
        }

        // ----------------------------------------------------
        // ESTADO INICIAL DE LAS BARRAS
        // ----------------------------------------------------

        gsap.set('.sm-bar__fill', {
          width: '0%',
        });

        // ----------------------------------------------------
        // LOOPS CONTINUOS
        // ----------------------------------------------------

        const loops = gsap.timeline({ paused: true });

        const loop = (target, vars) =>
          loops.to(
            target,
            {
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              ...vars,
            },
            gsap.utils.random(0, 1.2)
          );

        loop('.l-sm-estrella img', {
          y: -10 * su,
          rotation: 12,
          duration: 1.8,
        });

        loop('.l-sm-nota img', {
          y: -12 * su,
          rotation: 8,
          duration: 1.8,
        });

        loop('.l-sm-char img', {
          y: -12 * su,
          rotation: 1.5,
          duration: 2.6,
        });

        loop('.sm-diseno', {
          yPercent: -3,
          duration: 2.4,
        });

        loop('.sm-software', {
          yPercent: 2,
          duration: 2.2,
        });

        // ----------------------------------------------------
        // TIMELINE PRINCIPAL
        // ----------------------------------------------------

        const tl = gsap.timeline({
          paused: true,
          defaults: {
            ease: 'power3.out',
          },
          onReverseComplete: () => loops.pause(0),
        });

        // ====================================================
        // 1. TARJETA + TEXTO PALABRA POR PALABRA
        // ====================================================

        tl.addLabel('card', 0.2)

          .fromTo(
            '.l-sm-card .in',
            {
              autoAlpha: 0,
              x: -220 * su,
              rotation: -8,
            },
            {
              autoAlpha: 1,
              x: 0,
              rotation: 0,
              duration: 1.1,
              ease: 'power4.out',
            },
            'card'
          )

          // REVEAL TIPOGRÁFICO
          .fromTo(
            '.sm-text .sm-word__inner',
            {
              yPercent: 115,
              autoAlpha: 0,
              rotationX: -35,
              transformOrigin: '50% 100%',
            },
            {
              yPercent: 0,
              autoAlpha: 1,
              rotationX: 0,
              duration: 0.65,
              stagger: {
                each: 0.045,
                from: 'start',
              },
              ease: 'power4.out',
            },
            'card+=0.35'
          )

          // ==================================================
          // 2. TÍTULO SOBRE MÍ
          // ==================================================

          .addLabel('title', 0.45)

          .fromTo(
            '.l-sm-title--front .in',
            {
              autoAlpha: 0,
              scale: 0.2,
              rotation: -12,
              transformOrigin: '50% 50%',
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 1.1,
              ease: 'back.out(1.9)',
            },
            'title'
          )

          // ==================================================
          // 3. PERSONAJE, NOTA Y ESTRELLA
          // ==================================================

          .addLabel('chars', 0.6)

          .fromTo(
            '.l-sm-char .in',
            {
              autoAlpha: 0,
              y: 240 * su,
              rotation: 8,
              scale: 0.7,
              transformOrigin: '50% 100%',
            },
            {
              autoAlpha: 1,
              y: 0,
              rotation: 0,
              scale: 1,
              duration: 1.2,
              ease: 'back.out(1.5)',
            },
            'chars'
          )

          .fromTo(
            '.l-sm-nota .in',
            {
              autoAlpha: 0,
              scale: 0,
              rotation: -120,
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 1,
              ease: 'elastic.out(1, .55)',
            },
            'chars+=0.5'
          )

          .fromTo(
            '.l-sm-estrella .in',
            {
              autoAlpha: 0,
              scale: 0,
              rotation: -90,
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 1,
              ease: 'back.out(1.8)',
            },
            'chars+=0.6'
          )

          // Los loops empiezan cuando la escena está entrando.
          .add(() => {
            if (!tl.reversed()) loops.play();
          }, 'chars+=1.2')

          // ==================================================
          // 4. HOJA DE SOFTWARE
          // ==================================================

          .addLabel('list', 0.7)

          .fromTo(
            '.l-sm-list .in',
            {
              autoAlpha: 0,
              x: 260 * su,
              rotation: 10,
            },
            {
              autoAlpha: 1,
              x: 0,
              rotation: 0,
              duration: 1.1,
              ease: 'power4.out',
            },
            'list'
          )

          .fromTo(
            '.sm-diseno',
            {
              autoAlpha: 0,
              scale: 0.3,
              rotation: -10,
              transformOrigin: '50% 50%',
            },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 0.9,
              ease: 'back.out(1.8)',
            },
            'list+=0.6'
          )

          // REVEAL TIPOGRÁFICO DE LA DESCRIPCIÓN
          .fromTo(
            '.sm-sub .sm-word__inner',
            {
              yPercent: 115,
              autoAlpha: 0,
              rotationX: -25,
              transformOrigin: '50% 100%',
            },
            {
              yPercent: 0,
              autoAlpha: 1,
              rotationX: 0,
              duration: 0.6,
              stagger: {
                each: 0.055,
                from: 'start',
              },
              ease: 'power4.out',
            },
            'list+=0.85'
          )

          .fromTo(
            '.sm-software',
            {
              autoAlpha: 0,
              scale: 0.6,
              y: 40 * su,
              transformOrigin: '50% 50%',
            },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              duration: 0.8,
              ease: 'back.out(1.6)',
            },
            'list+=0.8'
          )

          // ==================================================
          // 5. BARRAS DE HABILIDADES
          // ==================================================

          .addLabel('bars', 'list+=1.05')

          .fromTo(
            '.sm-bar__track',
            {
              autoAlpha: 0,
              x: -30 * su,
            },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.5,
              stagger: 0.12,
            },
            'bars'
          )

          .to(
            '.sm-bar__fill',
            {
              width: (i, el) => `${el.dataset.level}%`,
              duration: 1.5,
              ease: 'expo.out',
              stagger: 0.12,
            },
            'bars+=0.2'
          );

        // ----------------------------------------------------
        // ENTRADA: IntersectionObserver (funciona con sticky/3D)
        // ----------------------------------------------------

        let entered = false;

        const io = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              entered = true;
              tl.timeScale(1).play();

              if (tl.progress() === 1) loops.play();
            } else if (entered) {
              loops.pause();
            }
          },
          { threshold: 0.05 }
        );

        io.observe(section);

        // ----------------------------------------------------
        // MICROINTERACCIONES
        // ----------------------------------------------------

        const cleanups = [];

        if (fine) {
          // PARALLAX POR CAPAS

          const movers = PARALLAX.map(
            ([selector, depth, tilt]) => {
              const el = section.querySelector(selector);

              if (!el) return null;

              gsap.set(el, {
                transformPerspective: 1200,
              });

              const opts = {
                duration: 0.9,
                ease: 'power3.out',
              };

              return {
                depth,
                tilt: tilt * MAX_TILT,
                setX: gsap.quickTo(el, 'x', opts),
                setY: gsap.quickTo(el, 'y', opts),
                setRY: gsap.quickTo(el, 'rotationY', opts),
                setRX: gsap.quickTo(el, 'rotationX', opts),
              };
            }
          ).filter(Boolean);

          const onMove = (e) => {
            const s = getSu();

            const nx =
              (e.clientX / window.innerWidth - 0.5) * 2;

            const ny =
              (e.clientY / window.innerHeight - 0.5) * 2;

            movers.forEach(
              ({ depth, tilt, setX, setY, setRY, setRX }) => {
                setX(-nx * depth * s);
                setY(-ny * depth * s * 0.6);
                setRY(nx * tilt);
                setRX(-ny * tilt);
              }
            );
          };

          const onLeave = () => {
            movers.forEach(
              ({ setX, setY, setRY, setRX }) => {
                setX(0);
                setY(0);
                setRY(0);
                setRX(0);
              }
            );
          };

          section.addEventListener('pointermove', onMove);
          section.addEventListener('pointerleave', onLeave);

          cleanups.push(() => {
            section.removeEventListener('pointermove', onMove);
            section.removeEventListener('pointerleave', onLeave);
          });

          // HOVER DE LA NOTA MUSICAL

          const notaImg = section.querySelector('.l-sm-nota img');
          const notaBtn = section.querySelector('.l-sm-nota');

          if (notaImg && notaBtn) {
            const grow = () => {
              gsap.to(notaImg, {
                scale: 1.2,
                duration: 0.5,
                ease: 'back.out(2.5)',
                overwrite: 'auto',
              });
            };

            const shrink = () => {
              gsap.to(notaImg, {
                scale: 1,
                duration: 0.4,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            };

            notaBtn.addEventListener('pointerenter', grow);
            notaBtn.addEventListener('pointerleave', shrink);

            cleanups.push(() => {
              notaBtn.removeEventListener('pointerenter', grow);
              notaBtn.removeEventListener('pointerleave', shrink);
            });
          }
        }

        // ----------------------------------------------------
        // EFECTOS AL DAR CLICK (sin partículas)
        // Solo funcionan cuando la animación de entrada terminó.
        // Cada efecto devuelve su timeline para saber cuándo acaba.
        // (La nota NO se toca: su click abre OsuGame.)
        // ----------------------------------------------------

        const gelatina = (el) =>
          gsap
            .timeline()
            .to(el, { scaleX: 1.2, scaleY: 0.8, duration: 0.12 })
            .to(el, { scaleX: 0.88, scaleY: 1.12, duration: 0.12 })
            .to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' });

        const onClick = (selector, label, effect) => {
          const el = section.querySelector(selector);

          if (!el) return;

          const run = () => {
            if (tl.progress() < 1 || el._busy) return;

            const t = effect(el);

            if (t) {
              el._busy = true;
              t.eventCallback('onComplete', () => {
                el._busy = false;
              });
            }
          };

          const onKey = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              run();
            }
          };

          el.style.cursor = 'pointer';
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', label);
          el.tabIndex = 0;
          el.addEventListener('click', run);
          el.addEventListener('keydown', onKey);

          cleanups.push(() => {
            el.removeEventListener('click', run);
            el.removeEventListener('keydown', onKey);
          });
        };

        // Título "Sobre mí": gelatina
        onClick('.l-sm-title .in', 'Sobre mí', (el) => gelatina(el));

        // Tarjeta: bamboleo
        onClick('.l-sm-card .in', 'Tarjeta', (el) =>
          gsap
            .timeline()
            .set(el, { transformOrigin: '50% 0%' })
            .to(el, { rotation: -3, duration: 0.12 })
            .to(el, { rotation: 2.5, duration: 0.14 })
            .to(el, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,.3)' })
        );

        // Luis: salto con squash & stretch
        onClick('.l-sm-char .in', 'Luis', (el) => {
          const s = getSu();

          return gsap
            .timeline()
            .set(el, { transformOrigin: '50% 100%' })
            .to(el, { scaleX: 1.08, scaleY: 0.9, duration: 0.12, ease: 'power2.out' })
            .to(el, {
              y: -90 * s,
              scaleX: 0.95,
              scaleY: 1.07,
              rotation: -4,
              duration: 0.32,
              ease: 'power2.out',
            })
            .to(el, {
              y: 0,
              scaleX: 1.06,
              scaleY: 0.94,
              rotation: 0,
              duration: 0.35,
              ease: 'bounce.out',
            })
            .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' });
        });

        // Estrella: giro completo + pop
        onClick('.l-sm-estrella .in', 'Estrella', (el) =>
          gsap
            .timeline()
            .to(el, { rotation: '+=360', scale: 1.3, duration: 0.7, ease: 'back.inOut(2)' })
            .set(el, { rotation: 0 })
            .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' })
        );

        // Título "Diseño": gelatina
        onClick('.sm-diseno', 'Diseño', (el) => gelatina(el));

        // Programas: las barras se vuelven a cargar
        onClick('.sm-software', 'Volver a cargar las barras', (el) =>
          gsap.fromTo(
            el.querySelectorAll('.sm-bar__fill'),
            { width: '0%' },
            {
              width: (i, f) => `${f.dataset.level}%`,
              duration: 1.5,
              ease: 'expo.out',
              stagger: 0.12,
            }
          )
        );

        // ----------------------------------------------------
        // LIMPIEZA
        // ----------------------------------------------------

        return () => {
          io.disconnect();
          cleanups.forEach((fn) => fn());

          tl.kill();
          loops.kill();
        };
      }
    );

    return () => {
      cancelAnimationFrame(refreshRaf);
      window.removeEventListener('load', refresh);
      imgs.forEach((img) => img.removeEventListener('load', refresh));
      ro?.disconnect();
      mm.revert();
    };
  }, []);

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <>
      {/* FONDO DE PAPEL */}

      <div className="l-sm l-sm-bg" ref={anchor}>
        <div className="in">
          <div className="sm-bg">
            <div
              className="sm-bg__mid"
              style={{
                backgroundImage: `url(${papelMid})`,
              }}
            />

            <img
              className="sm-bg__top"
              src={papelTop}
              alt=""
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}

      <div className="about__stage">
        {/* TARJETA DE PRESENTACIÓN */}

        <div className="l-sm l-sm-card">
          <div className="in">
            <div className="sm-card">
              <img
                src={tarjeta}
                alt=""
                draggable="false"
              />

              <div className="sm-text">
                <p>
                  <RevealText>
                    Diseño porque me gusta pensar, música porque la
                    necesito y duermo porque debería. Me gusta dibujar,
                    crear personajes, jugar videojuegos y convertir
                    ideas random en cosas que realmente existen.
                  </RevealText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LUIS SALUDANDO */}

        <div className="l-sm l-sm-char">
          <div className="in">
            <img
              src={luis}
              alt="Luis saludando"
              draggable="false"
            />
          </div>
        </div>

        {/* NOTA MUSICAL: ABRE OSUGAME */}

        <div className="l-sm l-sm-nota">
          <div className="in">
            <OsuGame>
              <img
                src={nota}
                alt=""
                draggable="false"
              />
            </OsuGame>
          </div>
        </div>

        {/* ESTRELLA DECORATIVA */}

        <div className="l-sm l-sm-estrella">
          <div className="in">
            <img
              src={estrella}
              alt=""
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* TÍTULO SOBRE MÍ */}

      <div className="l-sm l-sm-title l-sm-title--front">
        <div className="in">
          <img
            src={sobremi}
            alt="Sobre mí"
            draggable="false"
          />
        </div>
      </div>

      {/* PAPEL RASGADO INFERIOR */}

      <img
        className="sm-bg__bottom sm-bg__bottom--front"
        src={papelBottom}
        alt=""
        draggable="false"
      />

      {/* CONTENIDO DE LA HOJA */}

      <div className="l-sm l-sm-list l-sm-list--front">
        <div className="in">
          <div className="sm-list">
            <img
              className="sm-diseno"
              src={disenoTitulo}
              alt="Diseño"
              draggable="false"
            />

            {/* DESCRIPCIÓN CON REVELADO TIPOGRÁFICO */}

            <RevealText as="p" className="sm-sub">
              Estos son los software que manejo para diseño y
              creación de recursos y diseño de personajes.
            </RevealText>

            {/* PROGRAMAS + BARRAS */}

            <div className="sm-software">
              <img
                className="sm-software__img"
                src={software}
                alt="Illustrator, After Effects, Photoshop y Canva"
                draggable="false"
              />

              {/* BARRAS DE NIVEL */}

              <div className="sm-bars">
                {SKILLS.map((skill) => (
                  <div
                    key={skill.id}
                    className="sm-bar"
                    style={{
                      top: `${skill.y}%`,
                      '--bar-dx': `${skill.dx}cqw`,
                    }}
                    role="progressbar"
                    aria-label={skill.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={skill.level}
                  >
                    <div className="sm-bar__track">
                      <span
                        className="sm-bar__fill"
                        data-level={skill.level}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}