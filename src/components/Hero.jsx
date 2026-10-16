import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Player from './Player.jsx';
import SobreMi from './SobreMi.jsx';

import fondo from '../assets/fondo.png';
import hoja from '../assets/hoja.png';
import disco from '../assets/disco.png';
import estrella from '../assets/estrella.png';
import personaje from '../assets/personaje.png';
import titulo from '../assets/titulo.png';
import '../stylesheets/Sobremi.css';
gsap.registerPlugin(ScrollTrigger);

const PERSP = 1200;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Cuánto crece la sección 2 hacia abajo, en "pantallas".
// 0 = como antes · 0.5 = media pantalla más · 1 = una pantalla más
// Controla a la vez: el alto del hero, el alto de la sección 2 (CSS) y
// cuánto baja la cámara.
const ABOUT_EXTRA = 0.6;

/* ---------------------------------------------------------
   EFECTO PAPEL ARRUGADO (transición Inicio -> Sobre mí)
   Los valores están en "alturas de pantalla" de scroll desde
   el inicio del hero. Ajústalos probando:
   - CRUMPLE_START: dónde empieza a subir el papel rasgado
   - CRUMPLE_END:   dónde termina de abrirse y desaparece
   --------------------------------------------------------- */
const CRUMPLE_START = 0.55;
const CRUMPLE_END = 1.55;
// Pon true para ver marcadores de scroll (start/end) en pantalla
const CRUMPLE_DEBUG = false;

// Borde rasgado: puntos fijos (no aleatorios) para que no cambie en cada render
const TEAR_N = 30;
const TEAR_J = 16;
const TEAR_JAG = Array.from({ length: TEAR_N + 1 }, (_, i) => {
  const r = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
  return 0.6 * r + 0.4 * (i % 2);
});

const tearClip = (t) => {
  const pts = TEAR_JAG.map((j, i) => {
    const x = (i / TEAR_N) * 100;
    const y = (1 - t) * (100 + TEAR_J) - TEAR_J + j * TEAR_J;
    return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
  });

  return `polygon(${pts.join(',')},100% 101%,0% 101%)`;
};

export default function Hero({ revealed }) {
  const root = useRef(null);
  const stage = useRef(null);
  const cameraTrack = useRef(null);
  const spin = useRef(null);
  const speechIn = useRef(null);
  const isPlaying = useRef(false);
  const startedRef = useRef(false);
  const musicaFondo = useRef(false);

  const crumpleRef = useRef(null);
  const sheetRef = useRef(null);
  const dispRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // Preparar la profundidad de las capas 3D
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.layer').forEach((layer) => {
        const z = parseFloat(layer.dataset.z) || 0;
        const scale = layer.dataset.comp
          ? (PERSP / (PERSP - z)) * 1.2
          : 1;

        gsap.set(layer, { z, scale });
      });

      gsap.set('.layer .in', { autoAlpha: 0 });
    }, root);

    return () => ctx.revert();
  }, []);

  // Animación de entrada y movimiento de los elementos del inicio
  useEffect(() => {
    if (!revealed) return;

    const ctx = gsap.context(() => {
      const startLoops = () => {
        if (reduce) return;

        gsap.utils.toArray('.l-star img').forEach((img, i) => {
          gsap.to(img, {
            rotation: i % 2 ? -360 : 360,
            duration: 18 + i * 6,
            repeat: -1,
            ease: 'none',
          });

          gsap.to(img, {
            y: i % 2 ? 14 : -14,
            duration: 2.4 + i * 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        gsap.to('.l-char img', {
          y: -10,
          rotation: 1.2,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        gsap.to('.l-title img', {
          y: 8,
          rotation: -0.8,
          duration: 3.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        spin.current = gsap.to('.vinyl img', {
          rotation: 360,
          duration: 8,
          repeat: -1,
          ease: 'none',
          paused: !isPlaying.current,
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      tl.fromTo(
        '.l-bg .in',
        { autoAlpha: 0, scale: 1.15 },
        { autoAlpha: 1, scale: 1, duration: 1.6 },
        0.35
      )
        .fromTo(
          '.l-paper .in',
          {
            autoAlpha: 0,
            rotationY: 70,
            x: -260,
            transformPerspective: 900,
            transformOrigin: 'left center',
          },
          {
            autoAlpha: 1,
            rotationY: 0,
            x: 0,
            duration: 1.3,
          },
          0.6
        )
        .fromTo(
          '.l-title .in',
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
          0.95
        )
        .fromTo(
          '.l-char .in',
          { autoAlpha: 0, y: 220, rotation: 10, scale: 0.7 },
          {
            autoAlpha: 1,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.2,
            ease: 'back.out(1.5)',
          },
          1.1
        )
        .fromTo(
          '.l-vinyl .in',
          { autoAlpha: 0, x: -300, rotation: -240 },
          {
            autoAlpha: 1,
            x: 0,
            rotation: 0,
            duration: 1.4,
            ease: 'power4.out',
          },
          1.2
        )
        .fromTo(
          '.l-star .in',
          { autoAlpha: 0, scale: 0, rotation: -180 },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 1,
            ease: 'elastic.out(1, .55)',
            stagger: 0.15,
          },
          1.5
        )
        .fromTo(
          '.l-info .in',
          { autoAlpha: 0, x: 140 },
          { autoAlpha: 1, x: 0, duration: 0.9 },
          1.55
        )
        .add(startLoops, 2.2);
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // La cámara baja mientras el escenario conserva su propia transformación 3D
  useLayoutEffect(() => {
    if (!revealed || reduce) return;

    const ctx = gsap.context(() => {
      gsap.set(cameraTrack.current, { y: 0 });

      gsap.to(cameraTrack.current, {
        y: () => -window.innerHeight * (2 + ABOUT_EXTRA),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // Transición de papel arrugado: el papel rasgado sube, se arruga hasta
  // volverse una bolita, se abre de nuevo y se rompe para revelar "Sobre mí"
  useLayoutEffect(() => {
    if (!revealed || reduce) return;

    const ctx = gsap.context(() => {
      const wrap = crumpleRef.current;
      const sheet = sheetRef.current;
      const disp = dispRef.current;

      if (!wrap || !sheet || !disp) return;

      // Valores que se animan con onUpdate (clip-path y máscara)
      const p = { tear: 0, hole: -10 };

      const apply = () => {
        sheet.style.clipPath = tearClip(p.tear);
        sheet.style.setProperty('--hole', `${p.hole}%`);
      };

      gsap.set(sheet, {
        scale: 1,
        rotation: 0,
        borderRadius: '0%',
        transformOrigin: '50% 50%',
      });
      gsap.set('.crumple__creases', { autoAlpha: 0 });
      disp.setAttribute('scale', '0');
      gsap.set(
        '.scene-content--about span, .scene-content--about h2, .scene-content--about p',
        { autoAlpha: 0, y: 60 }
      );
      apply();

      const tl = gsap.timeline({
        defaults: { ease: 'none', immediateRender: false },
        scrollTrigger: {
          trigger: root.current,
          start: () => `top+=${window.innerHeight * CRUMPLE_START} top`,
          end: () => `top+=${window.innerHeight * CRUMPLE_END} top`,
          scrub: 0.8,
          markers: CRUMPLE_DEBUG,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            wrap.style.visibility = self.isActive ? 'visible' : 'hidden';
          },
        },
        onUpdate: apply,
      });

      // 1. El papel rasgado sube desde abajo
      tl.fromTo(p, { tear: 0 }, { tear: 1, duration: 0.28, ease: 'power1.in' }, 0)
        .fromTo(disp, { attr: { scale: 0 } }, { attr: { scale: 30 }, duration: 0.2 }, 0)

        // 2. Se arruga hasta hacerse una bolita
        .fromTo(
          disp,
          { attr: { scale: 30 } },
          { attr: { scale: 230 }, duration: 0.3, ease: 'power2.in' },
          0.2
        )
        .fromTo(
          sheet,
          { scale: 1, rotation: 0, borderRadius: '0%' },
          {
            scale: 0.3,
            rotation: -14,
            borderRadius: '48%',
            duration: 0.3,
            ease: 'power3.in',
          },
          0.2
        )
        .fromTo(
          '.crumple__creases',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.25 },
          0.2
        )

        // 3. Pequeño temblor mientras está hecha bolita
        .fromTo(
          sheet,
          { rotation: -14 },
          { rotation: -9, duration: 0.1, ease: 'sine.inOut' },
          0.5
        )

        // 4. Se vuelve a abrir
        .fromTo(
          sheet,
          { scale: 0.3, rotation: -9, borderRadius: '48%' },
          {
            scale: 1.4,
            rotation: 3,
            borderRadius: '0%',
            duration: 0.35,
            ease: 'power2.out',
          },
          0.6
        )
        .fromTo(
          disp,
          { attr: { scale: 230 } },
          { attr: { scale: 40 }, duration: 0.35, ease: 'power2.out' },
          0.6
        )
        .fromTo(
          '.crumple__creases',
          { autoAlpha: 1 },
          { autoAlpha: 0.35, duration: 0.35 },
          0.6
        )

        // 5. Se rompe desde el centro y deja ver la escena 2
        .fromTo(p, { hole: -10 }, { hole: 130, duration: 0.33, ease: 'power2.in' }, 0.65)

        // 6. El contenido de "Sobre mí" entra al final
        .fromTo(
          '.scene-content--about span, .scene-content--about h2, .scene-content--about p',
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.12,
            stagger: 0.05,
            ease: 'power2.out',
          },
          0.86
        );
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // Movimiento 3D con ratón, giroscopio o dedo
  useEffect(() => {
    if (reduce) return;

    const cleanups = [];

    const ctx = gsap.context(() => {
      const rx = gsap.quickTo(stage.current, 'rotationX', {
        duration: 0.9,
        ease: 'power3',
      });

      const ry = gsap.quickTo(stage.current, 'rotationY', {
        duration: 0.9,
        ease: 'power3',
      });

      const movers = gsap.utils.toArray('.layer').map((layer) => ({
        d: parseFloat(layer.dataset.depth) || 0,
        x: gsap.quickTo(layer, 'x', { duration: 1, ease: 'power3' }),
        y: gsap.quickTo(layer, 'y', { duration: 1, ease: 'power3' }),
      }));

      const tilt = (nx, ny) => {
        ry(nx * 9);
        rx(-ny * 7);

        movers.forEach((m) => {
          m.x(nx * m.d * -1);
          m.y(ny * m.d * -1);
        });
      };

      const listen = (target, type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        cleanups.push(() => target.removeEventListener(type, fn, opts));
      };

      if (fine) {
        listen(window, 'pointermove', (e) => {
          tilt(
            (e.clientX / window.innerWidth) * 2 - 1,
            (e.clientY / window.innerHeight) * 2 - 1
          );
        });
      } else if ('DeviceOrientationEvent' in window) {
        const onGyro = (e) => {
          if (e.gamma == null || e.beta == null) return;

          tilt(
            gsap.utils.clamp(-1, 1, e.gamma / 30),
            gsap.utils.clamp(-1, 1, (e.beta - 45) / 30)
          );
        };

        const enable = () => {
          if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then((permission) => {
                if (permission === 'granted') {
                  listen(window, 'deviceorientation', onGyro);
                }
              })
              .catch(() => {});
          } else {
            listen(window, 'deviceorientation', onGyro);
          }
        };

        listen(window, 'touchend', enable, { once: true });

        listen(
          window,
          'touchmove',
          (e) => {
            const touch = e.touches[0];

            tilt(
              (touch.clientX / window.innerWidth) * 2 - 1,
              (touch.clientY / window.innerHeight) * 2 - 1
            );
          },
          { passive: true }
        );
      }
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  // Activar el vinilo y mostrar el globo
  const encenderDisco = () => {
    startedRef.current = true;
    setStarted(true);
    isPlaying.current = true;
    setPlaying(true);

    if (spin.current) {
      spin.current.timeScale(0).play();

      gsap.to(spin.current, {
        timeScale: 1,
        duration: 0.8,
        ease: 'power2.out',
      });
    }

    gsap.fromTo(
      speechIn.current,
      {
        autoAlpha: 0,
        scale: 0.2,
        rotation: -6,
        transformOrigin: '0% 60%',
      },
      {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: 'back.out(1.6)',
      }
    );
  };

  const toggleVinyl = () => {
    if (!startedRef.current) {
      encenderDisco();
      return;
    }

    const next = !isPlaying.current;

    isPlaying.current = next;
    setPlaying(next);

    if (spin.current) {
      if (next) spin.current.play();

      gsap.to(spin.current, {
        timeScale: next ? 1 : 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }

    if (musicaFondo.current) {
      window.dispatchEvent(
        new CustomEvent('musica-control', {
          detail: { sonando: next },
        })
      );
    }
  };

  // Sincronizar con la música activada por el cursor
  useEffect(() => {
    const onMusicaFondo = () => {
      musicaFondo.current = true;

      if (!startedRef.current) {
        encenderDisco();
      } else if (!isPlaying.current) {
        isPlaying.current = true;
        setPlaying(true);

        if (spin.current) {
          spin.current.play();

          gsap.to(spin.current, {
            timeScale: 1,
            duration: 0.8,
            ease: 'power2.out',
          });
        }
      }
    };

    window.addEventListener('musica-fondo', onMusicaFondo);

    return () => {
      window.removeEventListener('musica-fondo', onMusicaFondo);
    };
  }, []);

  const vinylEnter = () => {
    if (spin.current && isPlaying.current) {
      gsap.to(spin.current, { timeScale: 3, duration: 0.5 });
    }
  };

  const vinylLeave = () => {
    if (spin.current && isPlaying.current) {
      gsap.to(spin.current, { timeScale: 1, duration: 0.8 });
    }
  };

  const poke = () => {
    gsap.fromTo(
      '.l-char .in',
      { scale: 1 },
      {
        scale: 1.08,
        rotation: 4,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      }
    );
  };

  const bajar = () => {
    window.scrollTo({
      top: root.current.offsetTop + window.innerHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  return (
    <header
      className="hero"
      id="inicio"
      ref={root}
      style={{ '--about-extra': ABOUT_EXTRA }}
    >
      <div className="stage-wrap">
        <div className="stage" ref={stage}>
          <div className="camera-track" ref={cameraTrack}>
            <div
              className="layer l-bg"
              data-z="-320"
              data-depth="6"
              data-comp="1"
            >
              <div className="in">
                <img src={fondo} alt="" draggable="false" />
              </div>
            </div>

            {/* ESCENA 1: INICIO */}
            <div className="frame frame--home">
              <div className="layer l-paper" data-z="-140" data-depth="12">
                <div className="in">
                  <img src={hoja} alt="" draggable="false" />
                </div>
              </div>

              <div className="layer l-vinyl" data-z="130" data-depth="22">
                <div className="in">
                  <button
                    className={'vinyl' + (started ? '' : ' is-idle')}
                    type="button"
                    aria-label={playing ? 'Pausar el disco' : 'Reproducir el disco'}
                    onClick={toggleVinyl}
                    onPointerEnter={vinylEnter}
                    onPointerLeave={vinylLeave}
                  >
                    <img
                      src={disco}
                      alt="Disco de vinilo con ilustración de Luis"
                      draggable="false"
                    />
                  </button>
                </div>
              </div>

              <div className="layer l-star l-star--a" data-z="120" data-depth="30">
                <div className="in">
                  <img src={estrella} alt="" draggable="false" />
                </div>
              </div>

              <div className="layer l-star l-star--b" data-z="90" data-depth="26">
                <div className="in">
                  <img src={estrella} alt="" draggable="false" />
                </div>
              </div>

              <div
                className="layer l-char"
                data-z="110"
                data-depth="28"
                onClick={poke}
              >
                <div className="in">
                  <img
                    src={personaje}
                    alt="Luis Miguel, ilustración"
                    draggable="false"
                  />
                </div>
              </div>

              <div className="layer l-title" data-z="150" data-depth="34">
                <div className="in">
                  <img src={titulo} alt="Portafolio 2026" draggable="false" />
                </div>
              </div>

              <div className="layer l-speech" data-z="190" data-depth="20">
                <div className="in" ref={speechIn}>
                  <div className="speech" aria-live="polite">
                    <p>
                      Hola, soy Luis. Me encanta la música y adoro trabajar
                      escuchando música. Mi cantante favorita es Mon Laferte.
                    </p>
                  </div>
                </div>
              </div>

              <div className="layer l-info" data-z="80" data-depth="18">
                <div className="in">
                  <Player
                    name="Luis Miguel Moreno Santos"
                    playing={playing}
                    onToggle={toggleVinyl}
                  />
                  <p className="role">Productor Multimedia</p>
                </div>
              </div>
            </div>

            {/* ESCENA 2: SOBRE MÍ (ver components/SobreMi.jsx y stylesheets/Sobremi.css) */}
            <div className="frame frame--about">
              <SobreMi />
            </div>

            {/* ESCENA 3: PROYECTOS */}
            <div className="frame frame--projects">
              <div className="scene-content scene-content--projects">
                <span>02 / PROYECTOS</span>
                <h2>Ideas que toman forma.</h2>
                <p>
                  Diseño gráfico, experiencias digitales y exploración 3D.
                </p>
              </div>
              <div className="scene-orbit scene-orbit--projects" />
            </div>
          </div>
        </div>
      </div>

     
      <button
        className="hero-scroll"
        type="button"
        onClick={bajar}
        aria-label="Continuar el recorrido"
      >
        <span>SCROLL PARA EXPLORAR</span>
        <span className="hero-scroll__arrow">↓</span>
      </button>
    </header>
  );
}