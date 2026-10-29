import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Player from './Player.jsx';
import SobreMi from './SobreMi.jsx';
import Multimedia from './Multimedia.jsx';
import Proyectos from './Proyectos.jsx';
import Inlec from './Inlec.jsx';
import Footer from './Footer.jsx';

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

// La barra de direcciones del celular cambia la altura al hacer scroll:
// no queremos que eso dispare un refresh (hace saltar la página).
ScrollTrigger.config({ ignoreMobileResize: true });

const PERSP = 1200;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const ABOUT_EXTRA = 0.6;

const CRUMPLE_START = 0.55;
const CRUMPLE_END = 1.55;
const CRUMPLE_DEBUG = false;

// Ancho del marco del Hero con el que calibraste todo (igual que --hdw en el CSS)
const HERO_DESIGN_WIDTH = 1818;

// Segundos que tarda en terminar la animación de entrada del Hero.
// Hasta entonces los clics en las piezas no hacen nada.
const ENTRADA_HERO = 2.8;

// ---------------------------------------------------------
// CELULAR (pantalla vertical)
//
//   MOBILE_CAM_SPEED = cuánto avanza la cámara por cada pixel de scroll.
//                      Antes en celular era ~4 (todo pasaba volando).
//                      1 = el contenido sigue al dedo; 1.5 = un poco más rápido
//                      que el dedo. Más bajo = más scroll para recorrer todo
//                      (se siente más lento/controlado); más alto = más rápido.
//
//   MOBILE_GAP       = aire (en múltiplos del ancho) entre lo último
//                      que se ve del Hero y el inicio de "Sobre mí".
//   MOBILE_MIN_ABOUT = "Sobre mí" nunca empieza antes de esta fracción
//                      de la altura de pantalla.
// En escritorio no se usa nada de esto: queda exactamente igual.
// ---------------------------------------------------------
const MOBILE_CAM_SPEED = 1.5;
const MOBILE_GAP = 0.1;
const MOBILE_MIN_ABOUT = 0;

// Suavizado del scroll (scrub). En celular un valor alto se siente
// "pesado" porque la escena llega tarde al dedo.
const SCRUB_CAM = fine ? 1 : 0.25;
const SCRUB_ESC = fine ? 0.8 : 0.25;

const isVertical = () =>
  window.matchMedia('(max-aspect-ratio: 6/5)').matches;

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
  const juegoActivo = useRef(false);
  const laferteAudio = useRef(null);
  const laferteDesbloqueada = useRef(false);

  const crumpleRef = useRef(null);
  const sheetRef = useRef(null);
  const dispRef = useRef(null);

  // Recorrido de la cámara
  const camEnd = useRef(0);
  const camRatio = useRef(1);
  const aboutTopRef = useRef(0);
  const tuckRef = useRef(0); // px que el footer se mete debajo de Proyectos

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // ---------------------------------------------------------
  // Mide el recorrido de la cámara hasta la última escena (Footer)
  // ---------------------------------------------------------
  const measureCamera = () => {
    const el = root.current;
    if (!el) return;

    const vh = window.innerHeight;
    const vertical = isVertical();

    const fw = Math.min(window.innerWidth, vh * (vertical ? 0.5 : 2));

    const unit = vertical ? fw / 2 : vh;

    const about = el.querySelector('.frame--about');
    const frame = el.querySelector('.frame--multimedia');
    const proyectos = el.querySelector('.frame--projects');
    const footer = el.querySelector('.frame--footer');

    // Dónde empieza "Sobre mí".
    // Escritorio: 2 pantallas (igual que antes).
    // Celular: justo después de lo último que se ve del Hero.
    let aboutTop = 2 * vh;

    if (vertical && about) {
      let bottom = 0;

      el.querySelectorAll('.frame--home > .layer').forEach((layer) => {
        bottom = Math.max(bottom, layer.offsetTop + layer.offsetHeight);
      });

      aboutTop = Math.max(bottom + fw * MOBILE_GAP, vh * MOBILE_MIN_ABOUT);
      about.style.top = `${aboutTop}px`;
    } else if (about) {
      about.style.top = '';
    }

    aboutTopRef.current = aboutTop;

    if (frame) {
      const top = aboutTop + 2 * unit;
      const h = fw * 1.048;

      frame.style.top = `${top}px`;
      frame.style.height = `${h}px`;

      // Proyectos empieza al 92% de Multimedia (su alto lo da el CSS)
      if (proyectos) {
        proyectos.style.top = `${top + h * 0.92}px`;
      }

      // Footer: capa DEBAJO de Proyectos. Se mete --tuck (Footer.css) por
      // detrás del borde inferior de Proyectos. Su alto lo da el CSS.
      if (proyectos && footer) {
        const cs = getComputedStyle(footer);
        const pj = footer.offsetWidth / 597;

        const tuck = (parseFloat(cs.getPropertyValue('--tuck')) || 0) * pj;
        const sube = (parseFloat(cs.getPropertyValue('--sube')) || 0) * pj;

        // --tuck solo estira el fondo azul por debajo de Proyectos (las piezas
        // ya compensan ese valor en el CSS). --sube sí mueve TODO hacia arriba.
        tuckRef.current = tuck;

        footer.style.top = `${proyectos.offsetTop + proyectos.offsetHeight - tuck - sube}px`;
      }
    }

    // Relación scroll/cámara.
    // Escritorio: igual que antes.
    // Celular: 1 / MOBILE_CAM_SPEED (la cámara avanza CAM_SPEED px por cada
    // px de scroll; antes avanzaba ~4, por eso se sentía tan rápido).
    const ratio = vertical ? 1 / MOBILE_CAM_SPEED : 2 / (2 + ABOUT_EXTRA);
    const t0 = aboutTop + ABOUT_EXTRA * vh;
    const s0 = ratio * t0;

    camRatio.current = ratio;

    // Fin del recorrido de Multimedia (--mm-scroll sigue midiendo solo esto)
    const tMm = frame
      ? Math.max(t0, frame.offsetTop + frame.offsetHeight - vh)
      : t0;

    // Fin del recorrido total: hasta el final del Footer
    const last = footer || proyectos || frame;

    const t1 = last
      ? Math.max(tMm, last.offsetTop + last.offsetHeight - vh)
      : tMm;

    camEnd.current = t1;

    el.style.setProperty('--mm-scroll', `${(tMm - t0) * camRatio.current}px`);
    el.style.height = `${vh + s0 + (t1 - t0) * camRatio.current}px`;
  };

  // Rango de scroll de la transición "hoja que se rompe".
  // Escritorio: igual que antes. Celular: sigue a la cámara, para que
  // termine justo cuando "Sobre mí" llega arriba.
  const crumpleRange = () => {
    const vh = window.innerHeight;

    if (!isVertical()) {
      return [vh * CRUMPLE_START, vh * CRUMPLE_END];
    }

    const d = aboutTopRef.current;

    return [camRatio.current * d * 0.357, camRatio.current * d];
  };

  // ---------------------------------------------------------
  // Utilidades de audio y vinilo
  // ---------------------------------------------------------
  const detenerLaferte = () => {
    const audio = laferteAudio.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  };

  // Desbloquea Laferte en la lista de canciones
  const desbloquearLaferte = () => {
    laferteDesbloqueada.current = true;

    window.dispatchEvent(
      new CustomEvent('cancion-desbloqueada', {
        detail: { id: 'laferte' },
      })
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

    // El minijuego terminó sin ganar.
    const onJuegoFin = () => {
      juegoActivo.current = false;
    };

    // El piano pausa Laferte y detiene el vinilo.
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

    // Danse desbloqueada: pasa a ser la música de fondo.
    const onMusicaFondo = () => {
      musicaFondo.current = true;
      juegoActivo.current = false;

      detenerLaferte();

      window.dispatchEvent(
        new CustomEvent('cancion-desbloqueada', {
          detail: { id: 'danse' },
        })
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

  // ---------------------------------------------------------
  // CAMBIO 1: sincroniza el vinilo con Canciones.jsx
  // ---------------------------------------------------------
  useEffect(() => {
    const sincronizarVinilo = (e) => {
      const activo = Boolean(e.detail?.sonando);
      const id = e.detail?.id;

      // Canciones.jsx reproduce los MP3 locales.
      // Detenemos el audio antiguo de Hero para evitar mezclas.
      if (id && id !== 'danse') detenerLaferte();

      isPlaying.current = activo;
      setPlaying(activo);

      if (activo) {
        startedRef.current = true;
        setStarted(true);
      }

      if (spin.current) {
        if (activo) spin.current.play();

        gsap.to(spin.current, {
          timeScale: activo ? 1 : 0,
          duration: activo ? 0.45 : 0.25,
          ease: 'power2.out',
        });
      }
    };

    window.addEventListener('vinilo-estado', sincronizarVinilo);

    return () => {
      window.removeEventListener('vinilo-estado', sincronizarVinilo);
    };
  }, []);

  // ---------------------------------------------------------
  // Preparar la profundidad de las capas 3D
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Animación de entrada y movimiento de los elementos del inicio
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // La cámara baja conservando la transformación 3D
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (!revealed || reduce) return;

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
          scrub: SCRUB_CAM,
          invalidateOnRefresh: true,
        },
      });
    }, root);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', measureCamera);
      ctx.revert();
    };
  }, [revealed]);

  // ---------------------------------------------------------
  // Transición de papel arrugado entre Inicio y Sobre mí
  // ---------------------------------------------------------
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
          start: () => `top+=${crumpleRange()[0]} top`,
          end: () => `top+=${crumpleRange()[1]} top`,
          scrub: SCRUB_ESC,
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

  // ---------------------------------------------------------
  // Escenas 3 y 4: Multimedia y Proyectos
  // (las piezas entran con el scroll)
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (!revealed) return;

    const frames = ['.frame--multimedia', '.frame--projects']
      .map((sel) => root.current?.querySelector(sel))
      .filter(Boolean);

    if (!frames.length) return;

    if (reduce) {
      frames.forEach((f) =>
        gsap.set(f.querySelectorAll('.layer .in'), { autoAlpha: 1 })
      );
      return;
    }

    const ctx = gsap.context(() => {
      frames.forEach((frame) => {
        const H = frame.offsetHeight || 1;
        const vh = window.innerHeight;
        const clamp = gsap.utils.clamp(0, 0.93);

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
            scrub: SCRUB_ESC,
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
      });
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // ---------------------------------------------------------
  // Escena 5: Footer
  // Tiene su propio trigger (no usa el de Multimedia/Proyectos) porque es
  // una escena baja: así su entrada termina justo al llegar al final del
  // scroll, también en celular.
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (!revealed) return;

    const frame = root.current?.querySelector('.frame--footer');
    if (!frame) return;

    if (reduce) {
      gsap.set(frame.querySelectorAll('.layer .in'), { autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // El fondo azul no se anima: si entrara deslizándose dejaría un hueco
      gsap.set(frame.querySelector('.ft-fondo .in'), { autoAlpha: 1 });

      const tl = gsap.timeline({
        defaults: { immediateRender: false },
        scrollTrigger: {
          trigger: root.current,
          start: () =>
            `top+=${camRatio.current * (frame.offsetTop + tuckRef.current - window.innerHeight * 0.98)} top`,
          // termina exactamente al final del scroll
          end: () => `top+=${camRatio.current * (camEnd.current - 2)} top`,
          scrub: SCRUB_ESC,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        frame.querySelector('.ft-globo .in'),
        { autoAlpha: 0, y: 60, scale: 0.6, transformOrigin: '80% 100%' },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)' },
        0
      )
        .fromTo(
          frame.querySelector('.ft-personaje .in'),
          { autoAlpha: 0, y: 80, scale: 0.7 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' },
          0.2
        )
        .fromTo(
          frame.querySelector('.ft-contacto .in'),
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          0.45
        );
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  // ---------------------------------------------------------
  // Escena 3: movimientos de las piezas
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Movimiento 3D con ratón o giroscopio.
  // Se quitó el movimiento con el dedo (touchmove): se disparaba en
  // CADA gesto de scroll y movía todas las capas a la vez, que era lo
  // que hacía el scroll tan pesado en celular.
  // ---------------------------------------------------------
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
              .catch(() => {});
          } else {
            listen(window, 'deviceorientation', onGyro);
          }
        };

        listen(window, 'touchend', enable, { once: true });
      }
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  // ---------------------------------------------------------
  // Interactividad del Hero (mismo patrón que SobreMi):
  // clic en las piezas → efecto GSAP, sin partículas.
  // Solo funciona cuando terminó la animación de entrada.
  // ---------------------------------------------------------
  useEffect(() => {
    if (!revealed || reduce) return;

    const cleanups = [];
    let ready = false;

    // Espera a que termine la animación de entrada
    const arm = gsap.delayedCall(ENTRADA_HERO, () => {
      ready = true;
    });

    const ctx = gsap.context(() => {
      const q = (sel) => root.current.querySelector(sel);

      // Las capas tienen pointer-events: none; solo estas piezas reciben clic
      gsap.set('.l-star .in, .l-title .in, .l-char .in', { pointerEvents: 'auto' });

      const gelatina = (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 50%' })
          .to(el, { scaleX: 1.2, scaleY: 0.8, duration: 0.12 })
          .to(el, { scaleX: 0.88, scaleY: 1.12, duration: 0.12 })
          .to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' });

      const onClick = (el, label, effect) => {
        if (!el) return;

        const run = () => {
          if (!ready || el._busy) return;

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
          gsap.killTweensOf(el);
          el._busy = false;
        });
      };

      // Título "Portafolio 2026": gelatina
      onClick(q('.l-title .in'), 'Portafolio 2026', gelatina);

      // Luis: salto con squash & stretch
      onClick(q('.l-char .in'), 'Luis', (el) => {
        const su = q('.frame--home').offsetWidth / HERO_DESIGN_WIDTH;

        return gsap
          .timeline()
          .set(el, { transformOrigin: '50% 100%' })
          .to(el, { scaleX: 1.08, scaleY: 0.9, duration: 0.12, ease: 'power2.out' })
          .to(el, {
            y: -90 * su,
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

      // Estrellas: giro completo + pop
      gsap.utils.toArray('.l-star .in').forEach((star) => {
        onClick(star, 'Estrella', (el) =>
          gsap
            .timeline()
            .to(el, { rotation: '+=360', scale: 1.3, duration: 0.7, ease: 'back.inOut(2)' })
            .set(el, { rotation: 0 })
            .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' })
        );
      });

      // Vinilo: se hunde y rebota (el audio lo sigue manejando toggleVinyl)
      const vinilo = q('.vinyl');

      if (vinilo) {
        const hundir = () => {
          if (!ready) return;

          gsap.fromTo(
            vinilo,
            { scale: 0.9 },
            { scale: 1, duration: 0.6, ease: 'elastic.out(1,.4)', overwrite: 'auto' }
          );
        };

        vinilo.addEventListener('pointerdown', hundir);

        cleanups.push(() => {
          vinilo.removeEventListener('pointerdown', hundir);
          gsap.killTweensOf(vinilo);
        });
      }
    }, root);

    return () => {
      arm.kill();
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [revealed]);

  // ---------------------------------------------------------
  // FINAL: al conseguir las 6 canciones (evento que manda Canciones.jsx)
  // TODO el Hero (inicio, sobre mí, multimedia, proyectos y contacto) se
  // chamusca, se parte en pedazos que caen y se destruye en fuego azul.
  //   - Lo que se ve en pantalla se parte y cae (de abajo hacia arriba).
  //   - Lo que está fuera de pantalla desaparece al instante.
  //   - Al terminar, las secciones quedan ocultas; el fuego azul sigue
  //     ardiendo en la pantalla.
  // ---------------------------------------------------------
  useEffect(() => {
    if (!revealed) return undefined;

    const rand = gsap.utils.random;
    const extras = []; // todo lo que se crea, para limpiarlo al desmontar
    let ctx = null;
    let estilo = null;
    let quemado = false;

    const crear = (padre, estilos, texto) => {
      const d = document.createElement('div');
      if (texto) d.textContent = texto;
      d.setAttribute('aria-hidden', 'true');
      Object.assign(d.style, { position: 'absolute', pointerEvents: 'none', ...estilos });
      padre.appendChild(d);
      extras.push(d);
      return d;
    };

    // Los tres pedazos en que se parte cada pieza
    const TROZOS = [
      'polygon(0 0, 56% 0, 38% 46%, 0 64%)',
      'polygon(56% 0, 100% 0, 100% 56%, 62% 38%, 38% 46%)',
      'polygon(0 64%, 38% 46%, 62% 38%, 100% 56%, 100% 100%, 0 100%)',
    ];

    const romper = (pieza, H) => {
      const padre = pieza.parentElement;
      if (!padre) return;

      TROZOS.forEach((poly, k) => {
        const trozo = pieza.cloneNode(true);

        trozo.classList.add('hero-trozo');
        trozo.removeAttribute('data-quemada');
        trozo.removeAttribute('role');
        trozo.removeAttribute('aria-label');
        trozo.tabIndex = -1;
        trozo.setAttribute('aria-hidden', 'true');
        trozo.querySelectorAll('[role], [aria-label]').forEach((n) => {
          n.removeAttribute('role');
          n.removeAttribute('aria-label');
        });
        trozo.querySelectorAll('button, a').forEach((n) => {
          n.tabIndex = -1;
        });

        // Se coloca justo encima de la pieza sin mover el resto del diseño
        Object.assign(trozo.style, {
          position: 'absolute',
          margin: '0',
          right: 'auto',
          bottom: 'auto',
          left: `${pieza.offsetLeft}px`,
          top: `${pieza.offsetTop}px`,
          width: `${pieza.offsetWidth}px`,
          height: `${pieza.offsetHeight}px`,
          clipPath: poly,
          pointerEvents: 'none',
        });

        padre.appendChild(trozo);
        extras.push(trozo);

        const lado = k === 0 ? -1 : k === 1 ? 1 : 0;

        gsap.to(trozo, {
          x: `+=${lado * rand(60, 170) + rand(-30, 30)}`,
          y: `+=${H * rand(0.55, 0.95)}`,
          rotation: `+=${lado * rand(25, 80) + rand(-15, 15)}`,
          duration: rand(1.1, 1.8),
          ease: 'power2.in',
        });
        gsap.to(trozo, {
          autoAlpha: 0,
          duration: 0.5,
          delay: rand(0.9, 1.3),
          ease: 'power1.in',
        });
      });

      // La pieza original desaparece para siempre (aunque el scroll quiera mostrarla)
      pieza.dataset.quemada = '1';
    };

    const quemar = () => {
      const el = root.current;
      if (!el) return;

      // Reglas que mantienen todo destruido aunque el scroll siga animando las piezas
      estilo = document.createElement('style');
      estilo.textContent = `
        [data-quemada="1"] { visibility: hidden !important; opacity: 0 !important; }
        .hero--quemandose, .hero--quemandose * { pointer-events: none !important; }
        .hero--quemado .frame, .hero--quemado .hero-scroll { visibility: hidden !important; }
      `;
      document.head.appendChild(estilo);
      el.classList.add('hero--quemandose');

      ctx = gsap.context(() => {
        const Wv = window.innerWidth;
        const Hv = window.innerHeight;

        // Todas las piezas de todas las escenas (menos el fondo), solo las más externas
        let piezas = gsap.utils.toArray(
          el.querySelectorAll('.layer:not(.l-bg) .in, .scene-content--about')
        );
        piezas = piezas.filter((a) => !piezas.some((b) => b !== a && b.contains(a)));

        // Se detienen los movimientos de antes
        spin.current?.kill();
        piezas.forEach((p) => {
          gsap.killTweensOf(p);
          p.querySelectorAll('img').forEach((img) => gsap.killTweensOf(img));
        });

        // Las que se ven en pantalla se rompen; las demás desaparecen ya
        const visibles = [];

        piezas.forEach((p) => {
          const r = p.getBoundingClientRect();
          const cs = getComputedStyle(p);

          const dentro =
            r.width > 4 &&
            r.height > 4 &&
            r.bottom > 0 &&
            r.top < Hv &&
            r.right > 0 &&
            r.left < Wv &&
            cs.visibility !== 'hidden' &&
            parseFloat(cs.opacity) > 0.05;

          if (dentro) visibles.push({ p, r });
          else p.dataset.quemada = '1';
        });

        // Se quema de abajo hacia arriba
        visibles.sort((a, b) => b.r.bottom - a.r.bottom);

        // Capa fija con todo el fuego (cubre la pantalla, esté donde esté el scroll)
        const fuego = crear(document.body, {
          position: 'fixed',
          inset: 0,
          zIndex: 9500,
          overflow: 'hidden',
        });

        // Fondo: se oscurece y se enfría
        const fondoEl = el.querySelector('.l-bg .in');
        if (fondoEl) {
          gsap.to(fondoEl, {
            filter: 'brightness(0.45) saturate(1.3) hue-rotate(15deg)',
            duration: 3.5,
            delay: 0.8,
            ease: 'power1.inOut',
          });
        }

        // Resplandor azul desde abajo + borde oscuro
        const brillo = crear(fuego, {
          left: '-10%',
          right: '-10%',
          bottom: '-5%',
          height: '75%',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(40,130,255,.9) 0%, rgba(20,70,255,.45) 38%, rgba(10,30,255,0) 72%)',
          mixBlendMode: 'screen',
          opacity: 0,
        });
        gsap.to(brillo, { opacity: 1, duration: 2.2, delay: 0.6, ease: 'power2.out' });
        gsap.to(brillo, {
          opacity: 0.72,
          duration: 0.22,
          delay: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        const quemadura = crear(fuego, {
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0) 35%, rgba(0,4,24,.6) 100%)',
          opacity: 0,
        });
        gsap.to(quemadura, { opacity: 1, duration: 3, delay: 1, ease: 'power1.inOut' });

        // Llamas azules a lo ancho de la pantalla
        const N = 26;
        for (let i = 0; i < N; i += 1) {
          const w = rand(8, 16);
          const llama = crear(fuego, {
            left: `${(i / (N - 1)) * 100 - w / 2 + rand(-2, 2)}%`,
            bottom: '-6%',
            width: `${w}%`,
            height: `${rand(28, 58)}%`,
            background:
              'linear-gradient(to top, #0a14ff 0%, #1e6bff 35%, #36d6ff 65%, rgba(200,250,255,0) 100%)',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            filter: 'blur(7px)',
            mixBlendMode: 'screen',
            transformOrigin: '50% 100%',
            opacity: 0.92,
          });

          gsap.set(llama, { scaleY: 0, scaleX: 0.6 });

          const pico = rand(0.85, 1.25);

          gsap.to(llama, {
            scaleY: pico,
            scaleX: 1,
            duration: rand(1.4, 2.2),
            delay: 0.5 + rand(0, 1.6),
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(llama, {
                scaleY: pico * rand(0.7, 0.9),
                scaleX: rand(0.85, 1.1),
                skewX: rand(-8, 8),
                duration: rand(0.18, 0.4),
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
              });
            },
          });
        }

        // Brasas azules que suben
        for (let i = 0; i < 40; i += 1) {
          const tam = rand(3, 8);
          const brasa = crear(fuego, {
            left: `${rand(0, 100)}%`,
            bottom: '0%',
            width: `${tam}px`,
            height: `${tam}px`,
            borderRadius: '50%',
            background: '#6fd0ff',
            boxShadow: '0 0 8px 2px rgba(40,140,255,.95)',
            opacity: 0,
          });

          gsap.fromTo(
            brasa,
            { y: 0, x: 0, opacity: 1 },
            {
              y: -rand(0.35, 1) * Hv,
              x: rand(-70, 70),
              opacity: 0,
              duration: rand(1.6, 3.2),
              delay: rand(0.8, 3.5),
              ease: 'power1.out',
              repeat: -1,
            }
          );
        }

        // Humo oscuro azulado
        for (let i = 0; i < 9; i += 1) {
          const humo = crear(fuego, {
            left: `${rand(0, 85)}%`,
            bottom: '15%',
            width: `${rand(14, 26)}%`,
            aspectRatio: '1',
            background:
              'radial-gradient(circle, rgba(20,28,60,.6), rgba(10,15,40,0) 70%)',
            filter: 'blur(10px)',
            opacity: 0,
          });

          const durHumo = rand(3.5, 6);
          const retraso = rand(1.5, 5);

          gsap.fromTo(
            humo,
            { y: 0, scale: 1 },
            {
              y: -rand(0.5, 1) * Hv,
              scale: 2.2,
              duration: durHumo,
              delay: retraso,
              ease: 'none',
              repeat: -1,
            }
          );
          // Aparece y se disipa en cada subida
          gsap.fromTo(
            humo,
            { opacity: 0 },
            {
              opacity: 0.5,
              duration: durHumo / 2,
              delay: retraso,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            }
          );
        }

        // Cada pieza: se prende, se chamusca, tiembla, se parte y cae
        let destello = false;

        visibles.forEach(({ p, r }, i) => {
          const t = 0.4 + Math.min(i * 0.1, 3.2);

          // Llamitas azules encima de la pieza mientras se quema
          const cuantas = r.height > 220 ? 2 : 1;

          for (let k = 0; k < cuantas; k += 1) {
            const tam = Math.max(28, Math.min(90, r.height * rand(0.45, 0.7)));
            const emoji = crear(
              fuego,
              {
                left: `${r.left + r.width / 2 + rand(-r.width * 0.15, r.width * 0.15)}px`,
                top: `${r.top + r.height / 2 + rand(-r.height * 0.2, r.height * 0.1)}px`,
                fontSize: `${tam}px`,
                lineHeight: 1,
                transformOrigin: '50% 100%',
                filter:
                  'hue-rotate(190deg) saturate(1.8) brightness(1.1) drop-shadow(0 0 10px rgba(60,160,255,.9))',
              },
              '🔥'
            );

            gsap.set(emoji, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
            gsap
              .timeline({ delay: t + 0.1 + k * 0.15 })
              .to(emoji, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' })
              .to(emoji, {
                scale: 1.18,
                rotation: rand(-8, 8),
                duration: 0.18,
                repeat: 5,
                yoyo: true,
                ease: 'sine.inOut',
              })
              .to(emoji, { opacity: 0, scale: 0.4, y: -30, duration: 0.5, ease: 'power1.in' });
          }

          // Se chamusca (tono azulado quemado)
          gsap.to(p, {
            filter: 'brightness(0.4) sepia(1) saturate(3) hue-rotate(170deg)',
            duration: 1.1,
            delay: t,
            ease: 'power1.in',
          });

          // Tiembla
          gsap.to(p, {
            x: '+=5',
            y: '+=3',
            rotation: '+=1.5',
            duration: 0.05,
            delay: t,
            repeat: 22,
            yoyo: true,
            ease: 'none',
          });

          // Se parte y cae
          gsap.delayedCall(t + 1.3, () => {
            gsap.killTweensOf(p);

            if (!destello) {
              destello = true;
              const flash = crear(fuego, { inset: 0, background: '#bfe6ff', opacity: 0 });
              gsap.fromTo(
                flash,
                { opacity: 0.8 },
                { opacity: 0, duration: 0.6, ease: 'power2.out' }
              );
            }

            romper(p, Hv);
          });
        });

        // Cuando todo terminó de caer: las escenas quedan ocultas y se limpian los pedazos
        const ultimo = visibles.length ? 0.4 + Math.min((visibles.length - 1) * 0.1, 3.2) : 0;

        gsap.delayedCall(ultimo + 1.3 + 2.8, () => {
          el.classList.add('hero--quemado');
          el.querySelectorAll('.hero-trozo').forEach((n) => n.remove());
        });
      }, root);
    };

    const onTodas = () => {
      if (quemado) return;
      quemado = true;
      quemar();
    };

    window.addEventListener('todas-las-canciones', onTodas);

    return () => {
      window.removeEventListener('todas-las-canciones', onTodas);
      ctx?.revert();
      estilo?.remove();
      root.current?.classList.remove('hero--quemandose', 'hero--quemado');
      extras.forEach((n) => {
        gsap.killTweensOf(n);
        n.remove();
      });
      extras.length = 0;
    };
  }, [revealed]);

  // ---------------------------------------------------------
  // Reproducción de Laferte como respaldo
  // ---------------------------------------------------------
  const reproducirLaferte = async () => {
    try {
      await laferteAudio.current?.play();
    } catch (error) {
      console.error('No se pudo reproducir Laferte:', error);
    }
  };

  // ---------------------------------------------------------
  // CAMBIO 2: el vinilo delega en Canciones.jsx cuando está montado
  // ---------------------------------------------------------
  const toggleVinyl = async () => {
    // Canciones.jsx controla el audio seleccionado.
    // El vinilo grande puede controlar cualquiera de las seis pistas.
    const controlCanciones = window.__portafolioCancionesVinilo;

    if (controlCanciones?.toggle) {
      if (!startedRef.current) encenderDisco();

      controlCanciones.toggle();
      return;
    }

    // Respaldo si Hero se utiliza sin el componente Canciones.
    if (!startedRef.current) {
      encenderDisco();

      if (!juegoActivo.current && !musicaFondo.current) {
        desbloquearLaferte();
        await reproducirLaferte();
      }

      return;
    }

    if (juegoActivo.current && !musicaFondo.current) return;

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
      window.dispatchEvent(
        new CustomEvent('musica-control', {
          detail: { sonando: next },
        })
      );
    } else if (laferteAudio.current) {
      if (next) {
        desbloquearLaferte();
        await reproducirLaferte();
      } else {
        laferteAudio.current.pause();
      }
    }
  };

  // ---------------------------------------------------------
  // Efectos del puntero sobre el vinilo
  // ---------------------------------------------------------
  const vinylEnter = () => {
    if (spin.current && isPlaying.current && !reduce) {
      gsap.to(spin.current, {
        timeScale: 3,
        duration: 0.5,
      });
    }
  };

  const vinylLeave = () => {
    if (spin.current && isPlaying.current && !reduce) {
      gsap.to(spin.current, {
        timeScale: 1,
        duration: 0.8,
      });
    }
  };

  const bajar = () => {
    window.scrollTo({
      top: root.current.offsetTop + window.innerHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
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

              <div className="layer l-char" data-z="110" data-depth="28">
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

            {/* ESCENA 5: FOOTER
                Va ANTES de Proyectos en el DOM a propósito: así queda
                como capa de abajo y Proyectos lo tapa en la zona de solape. */}
            <div className="frame frame--footer" id="contacto">
              <Footer />
            </div>

            {/* ESCENA 4: PROYECTOS */}
            <div className="frame frame--projects" id="proyectos">
              <Proyectos />
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

      {/* Ventana INLEC: se abre con el clic en INLEC de Proyectos */}
      <Inlec />
    </header>
  );
}