import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Player from './Player.jsx';
import SobreMi from './SobreMi.jsx';
import Multimedia from './Multimedia.jsx';

import fondo from '../assets/fondo.png';
import hoja from '../assets/hoja.png';
import disco from '../assets/disco.png';
import estrella from '../assets/estrella.png';
import personaje from '../assets/personaje.png';
import titulo from '../assets/titulo.png';
import laferte from '../assets/laferte.mp3';

// Sobremi.css ya incluye todo lo de la escena Multimedia
import '../stylesheets/Sobremi.css';

gsap.registerPlugin(ScrollTrigger);

const PERSP = 1200;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const ABOUT_EXTRA = 0.6;

const CRUMPLE_START = 0.55;
const CRUMPLE_END = 1.55;
const CRUMPLE_DEBUG = false;

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
  const musicaFondo = useRef(false); // Danse desbloqueada y sonando de fondo
  const juegoActivo = useRef(false); // el minijuego está en curso
  const laferteAudio = useRef(null);
  const laferteDesbloqueada = useRef(false); // ya salió el aviso / entrada en la lista

  const crumpleRef = useRef(null);
  const sheetRef = useRef(null);
  const dispRef = useRef(null);

  // Recorrido de la cámara (se calcula en measureCamera)
  const camEnd = useRef(0); // px que baja la cámara en total
  const camRatio = useRef(1); // px de scroll por cada px que baja la cámara

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // ---------------------------------------------------------
  // Mide hasta dónde debe bajar la cámara para llegar al final de
  // la escena Multimedia, y alarga el scroll del hero en esa
  // proporción (así la velocidad de Inicio y Sobre mí no cambia).
  // ---------------------------------------------------------
  const measureCamera = () => {
    const el = root.current;
    if (!el) return;

    const vh = window.innerHeight;
    const t0 = vh * (2 + ABOUT_EXTRA); // recorrido original (hasta Sobre mí)
    const frame = el.querySelector('.frame--multimedia');
    const proyectos = el.querySelector('.frame--projects');

    // Posición y alto de la escena Multimedia, calculados aquí para que
    // no dependan del orden / especificidad del CSS (misma lógica que
    // --fw y --scene-unit del .hero).
    if (frame) {
      const vertical = window.matchMedia('(max-aspect-ratio: 6/5)').matches;
      const fw = Math.min(window.innerWidth, vh * (vertical ? 0.5 : 2));
      const unit = vertical ? fw / 2 : vh;
      const top = 2 * vh + 2 * unit;
      const h = fw * 1.048;

      frame.style.top = `${top}px`;
      frame.style.height = `${h}px`;
      if (proyectos) proyectos.style.top = `${top + h * 0.92}px`;
    }

    // Scroll original (Inicio → Sobre mí), calculado con las mismas
    // fórmulas del CSS para no depender de la altura que tenga el hero.
    const esVertical = window.matchMedia('(max-aspect-ratio: 6/5)').matches;
    const fwBase = Math.min(window.innerWidth, vh * (esVertical ? 0.5 : 2));
    const unitBase = esVertical ? fwBase / 2 : vh;
    const s0 = esVertical ? (2 + ABOUT_EXTRA) * unitBase : 2 * vh;
    camRatio.current = s0 / t0;

    const t1 = frame
      ? Math.max(t0, frame.offsetTop + frame.offsetHeight - vh)
      : t0;

    camEnd.current = t1;

    const extra = (t1 - t0) * camRatio.current;
    el.style.setProperty('--mm-scroll', `${extra}px`);
    // La altura se fija aquí también: así el scroll siempre alcanza
    // hasta el final de Multimedia, sin importar el CSS.
    el.style.height = `${vh + s0 + extra}px`;
  };

  // ---------------------------------------------------------
  // Utilidades de audio / vinilo (solo usan refs y setters estables)
  // ---------------------------------------------------------
  const detenerLaferte = () => {
    const audio = laferteAudio.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  // Desbloquea a Laferte en la lista (Canciones ignora los repetidos)
  const desbloquearLaferte = () => {
    laferteDesbloqueada.current = true;
    window.dispatchEvent(
      new CustomEvent('cancion-desbloqueada', { detail: { id: 'laferte' } })
    );
  };

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

    if (speechIn.current) {
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
    }
  };

  // ---------------------------------------------------------
  // AUDIO: Laferte antes de desbloquear Danse Macabre
  // Un solo efecto maneja todos los eventos de música.
  // ---------------------------------------------------------
  useEffect(() => {
    const audio = new Audio(laferte);
    audio.loop = true;
    audio.volume = 0.8;
    laferteAudio.current = audio;

    // Empieza el minijuego: Laferte se calla y suena Danse.
    const onMusicaJuego = () => {
      juegoActivo.current = true;
      detenerLaferte();

      isPlaying.current = false;
      setPlaying(false);

      if (spin.current) {
        gsap.to(spin.current, {
          timeScale: 0,
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    };

    // El minijuego terminó sin ganar: el vinilo vuelve a estar libre.
    const onJuegoFin = () => {
      juegoActivo.current = false;
    };

    // El usuario toca el piano o hace clic fuera del vinilo:
    // Laferte se pausa (sin reiniciar) y el vinilo deja de girar.
    const onMusicaLibre = () => {
      if (musicaFondo.current || juegoActivo.current) return;

      const a = laferteAudio.current;
      if (!a || a.paused) return;

      a.pause();
      isPlaying.current = false;
      setPlaying(false);

      if (spin.current) {
        gsap.to(spin.current, {
          timeScale: 0,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    };

    // Danse desbloqueada: pasa a ser la música de fondo y Laferte no vuelve a sonar.
    const onMusicaFondo = () => {
      musicaFondo.current = true;
      juegoActivo.current = false;
      detenerLaferte();

      window.dispatchEvent(
        new CustomEvent('cancion-desbloqueada', { detail: { id: 'danse' } })
      );

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

    window.addEventListener('musica-juego', onMusicaJuego);
    window.addEventListener('musica-juego-fin', onJuegoFin);
    window.addEventListener('musica-libre', onMusicaLibre);
    window.addEventListener('musica-fondo', onMusicaFondo);

    return () => {
      window.removeEventListener('musica-juego', onMusicaJuego);
      window.removeEventListener('musica-juego-fin', onJuegoFin);
      window.removeEventListener('musica-libre', onMusicaLibre);
      window.removeEventListener('musica-fondo', onMusicaFondo);

      audio.pause();
      audio.currentTime = 0;
      laferteAudio.current = null;
    };
  }, []);

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

  // La cámara baja mientras el escenario conserva su transformación 3D
  useLayoutEffect(() => {
    if (!revealed || reduce) return;

    // Calcula el recorrido (Inicio → Sobre mí → Multimedia) y lo
    // recalcula en cada refresh de ScrollTrigger (resize, rotación...)
    measureCamera();
    ScrollTrigger.addEventListener('refreshInit', measureCamera);

    const ctx = gsap.context(() => {
      gsap.set(cameraTrack.current, { y: 0 });

      gsap.to(cameraTrack.current, {
        y: () => -camEnd.current,
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

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', measureCamera);
      ctx.revert();
    };
  }, [revealed]);

  // Transición de papel arrugado entre Inicio y Sobre mí
  useLayoutEffect(() => {
    if (!revealed || reduce) return;

    const ctx = gsap.context(() => {
      const wrap = crumpleRef.current;
      const sheet = sheetRef.current;
      const disp = dispRef.current;

      if (!wrap || !sheet || !disp) return;

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

      tl.fromTo(
        p,
        { tear: 0 },
        { tear: 1, duration: 0.28, ease: 'power1.in' },
        0
      )
        .fromTo(
          disp,
          { attr: { scale: 0 } },
          { attr: { scale: 30 }, duration: 0.2 },
          0
        )
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
        .fromTo(
          sheet,
          { rotation: -14 },
          { rotation: -9, duration: 0.1, ease: 'sine.inOut' },
          0.5
        )
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
        .fromTo(
          p,
          { hole: -10 },
          { hole: 130, duration: 0.33, ease: 'power2.in' },
          0.65
        )
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

  // Escena 3 · Multimedia: las capas aparecen de arriba hacia abajo
  // a medida que la cámara baja (la barra de cada habilidad se llena).
  // Va después del efecto de la cámara porque usa camRatio.
  useLayoutEffect(() => {
    if (!revealed) return;

    const frame = root.current?.querySelector('.frame--multimedia');
    if (!frame) return;

    if (reduce) {
      gsap.set(frame.querySelectorAll('.layer .in'), { autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const H = frame.offsetHeight || 1;
      const vh = window.innerHeight;
      const clamp = gsap.utils.clamp(0, 0.93);

      // Ventana de scroll: desde que el borde superior de la hoja asoma
      // (85% de la pantalla) hasta que su centro llega al centro.
      const len = 0.5 * H + 0.35 * vh;

      const tl = gsap.timeline({
        defaults: { immediateRender: false },
        scrollTrigger: {
          trigger: root.current,
          start: () =>
            `top+=${camRatio.current * (frame.offsetTop - window.innerHeight * 0.85)} top`,
          end: () =>
            `top+=${camRatio.current *
            (frame.offsetTop + frame.offsetHeight * 0.5 - window.innerHeight * 0.5)
            } top`,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.utils.toArray(frame.querySelectorAll('.layer')).forEach((capa) => {
        const inner = capa.querySelector('.in');
        if (!inner) return;

        const w = clamp((capa.offsetTop - vh * 0.1) / len);

        tl.fromTo(
          inner,
          { autoAlpha: 0, y: 70, scale: 0.85 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.07,
            ease: 'back.out(1.4)',
          },
          w
        );

        inner.querySelectorAll('.mm-bar__fill').forEach((fill, i) => {
          tl.fromTo(
            fill,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.06, ease: 'power2.out' },
            w + 0.05 + i * 0.015
          );
        });
      });
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // Escena 3 · pequeños movimientos de las piezas
  useEffect(() => {
    if (!revealed || reduce) return;

    const ctx = gsap.context(() => {
      gsap.to('.mm-luis .in img', {
        y: -12,
        rotation: 1.4,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.mm-estrella .in img', {
        rotation: 360,
        duration: 22,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.mm-nota .in img', {
        rotation: -6,
        y: -6,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.mm-clave .in img', {
        rotation: 4,
        y: -8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.mm-radio .in img', {
        scale: 1.04,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
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
        ry(nx * 7);
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
              .catch(() => { });
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
            if (!touch) return;

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

  const reproducirLaferte = async () => {
    try {
      await laferteAudio.current?.play();
    } catch (error) {
      console.error('No se pudo reproducir Laferte:', error);
    }
  };

  // El vinilo controla la canción activa
  const toggleVinyl = async () => {
    // Primer clic: gira el disco y suena Laferte (si el juego no ha empezado
    // ni se ha desbloqueado Danse Macabre).
    if (!startedRef.current) {
      encenderDisco();

      if (!juegoActivo.current && !musicaFondo.current) {
        desbloquearLaferte();
        await reproducirLaferte();
      }

      return;
    }

    // Mientras el minijuego está activo, el vinilo no inicia otra canción.
    if (juegoActivo.current && !musicaFondo.current) return;

    // Danse ya es la música de fondo y Laferte aún no estaba desbloqueada:
    // este clic solo la desbloquea (no suena, no pausa Danse).
    if (musicaFondo.current && !laferteDesbloqueada.current) {
      desbloquearLaferte();
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
      // Danse ya es la música de fondo: el vinilo la pausa / reanuda.
      window.dispatchEvent(
        new CustomEvent('musica-control', {
          detail: { sonando: next },
        })
      );
    } else if (laferteAudio.current) {
      // Antes del desbloqueo, el vinilo controla Laferte.
      if (next) {
        desbloquearLaferte();
        await reproducirLaferte();
      } else {
        laferteAudio.current.pause();
      }
    }
  };

  const vinylEnter = () => {
    if (spin.current && isPlaying.current && !reduce) {
      gsap.to(spin.current, { timeScale: 3, duration: 0.5 });
    }
  };

  const vinylLeave = () => {
    if (spin.current && isPlaying.current && !reduce) {
      gsap.to(spin.current, { timeScale: 1, duration: 0.8 });
    }
  };

  const poke = () => {
    if (reduce) return;

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
          <div
            className="camera-track"
            ref={cameraTrack}
          >
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
                    data-no-sonar="true"
                    aria-label={playing ? 'Pausar el disco' : 'Reproducir el disco'}
                    aria-pressed={playing}
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

              <div
                className="layer l-info"
                data-z="80"
                data-depth="18"
                data-no-sonar="true"
              >
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

            {/* ESCENA 2: SOBRE MÍ */}
            <div className="frame frame--about">
              <SobreMi />
            </div>

            {/* ESCENA 3: MULTIMEDIA */}
            <div className="frame frame--multimedia" id="multimedia">
              <Multimedia />
            </div>

            {/* ESCENA 4: PROYECTOS */}
            <div className="frame frame--projects">
              <div className="scene-content scene-content--projects">
                <span>03 / PROYECTOS</span>
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