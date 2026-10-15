import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Player from './Player.jsx';

import fondo from '../assets/fondo.png';
import hoja from '../assets/hoja.png';
import disco from '../assets/disco.png';
import estrella from '../assets/estrella.png';
import personaje from '../assets/personaje.png';
import titulo from '../assets/titulo.png';

const PERSP = 1200;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function Hero({ revealed }) {
  const root = useRef(null);
  const stage = useRef(null);
  const spin = useRef(null);
  const speechIn = useRef(null);
  const isPlaying = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // ya se hizo el primer click en el vinilo
  const startedRef = useRef(false);
  const musicaFondo = useRef(false); // la canción del cursor ya es música de fondo

  /* ---------- Configuración 3D de capas (antes del primer pintado) ---------- */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.layer').forEach((l) => {
        const z = parseFloat(l.dataset.z) || 0;
        // las capas de fondo se compensan para cubrir la pantalla
        const scale = l.dataset.comp ? (PERSP / (PERSP - z)) * 1.20 : 1;
        gsap.set(l, { z, scale });
      });
      gsap.set('.layer .in', { autoAlpha: 0 });
    }, root);
    return () => ctx.revert();
  }, []);

  /* ---------- Entrada (cuando el loader termina) + movimiento continuo ---------- */
  useEffect(() => {
    if (!revealed) return;

    const ctx = gsap.context(() => {
      const startLoops = () => {
        if (reduce) return;

        // estrellas girando y flotando
        gsap.utils.toArray('.l-star img').forEach((img, i) => {
          gsap.to(img, { rotation: i % 2 ? -360 : 360, duration: 18 + i * 6, repeat: -1, ease: 'none' });
          gsap.to(img, { y: i % 2 ? 14 : -14, duration: 2.4 + i * 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        });
        // personaje respirando
        gsap.to('.l-char img', { y: -10, rotation: 1.2, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        // título flotando suave
        gsap.to('.l-title img', { y: 8, rotation: -0.8, duration: 3.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        // disco: gira solo cuando está "sonando"
        spin.current = gsap.to('.vinyl img', {
          rotation: 360,
          duration: 8,
          repeat: -1,
          ease: 'none',
          paused: !isPlaying.current,
        });
      };

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl
        // fondo
        .fromTo('.l-bg .in', { autoAlpha: 0, scale: 1.35 }, { autoAlpha: 1, scale: 1, duration: 1.6 }, 0.35)
        // hoja de cuaderno: cae girando en 3D
        .fromTo(
          '.l-paper .in',
          { autoAlpha: 0, rotationY: 70, x: -260, transformPerspective: 900, transformOrigin: 'left center' },
          { autoAlpha: 1, rotationY: 0, x: 0, duration: 1.3 },
          0.6
        )
        // título: salta con rebote
        .fromTo(
          '.l-title .in',
          { autoAlpha: 0, scale: 0.2, rotation: -12, transformOrigin: '50% 50%' },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: 'back.out(1.9)' },
          0.95
        )
        // personaje: sube desde abajo
        .fromTo(
          '.l-char .in',
          { autoAlpha: 0, y: 220, rotation: 10, scale: 0.7 },
          { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: 1.2, ease: 'back.out(1.5)' },
          1.1
        )
        // disco: rueda desde la izquierda
        .fromTo(
          '.l-vinyl .in',
          { autoAlpha: 0, x: -300, rotation: -240 },
          { autoAlpha: 1, x: 0, rotation: 0, duration: 1.4, ease: 'power4.out' },
          1.2
        )
        // estrellas: pop elástico
        .fromTo(
          '.l-star .in',
          { autoAlpha: 0, scale: 0, rotation: -180 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 1, ease: 'elastic.out(1, .55)', stagger: 0.15 },
          1.5
        )
        // info (reproductor)
        .fromTo('.l-info .in', { autoAlpha: 0, x: 140 }, { autoAlpha: 1, x: 0, duration: 0.9 }, 1.55)
        .add(startLoops, 2.2);
    }, root);

    return () => ctx.revert();
  }, [revealed]);

  /* ---------- Tilt 3D: mouse + giroscopio ---------- */
  useEffect(() => {
    if (reduce) return;
    const cleanups = [];

    const ctx = gsap.context(() => {
      const rx = gsap.quickTo(stage.current, 'rotationX', { duration: 0.9, ease: 'power3' });
      const ry = gsap.quickTo(stage.current, 'rotationY', { duration: 0.9, ease: 'power3' });

      const movers = gsap.utils.toArray('.layer').map((l) => ({
        d: parseFloat(l.dataset.depth) || 0,
        x: gsap.quickTo(l, 'x', { duration: 1, ease: 'power3' }),
        y: gsap.quickTo(l, 'y', { duration: 1, ease: 'power3' }),
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
        listen(window, 'pointermove', (e) =>
          tilt((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
        );
      } else if ('DeviceOrientationEvent' in window) {
        const onGyro = (e) => {
          if (e.gamma == null) return;
          tilt(gsap.utils.clamp(-1, 1, e.gamma / 30), gsap.utils.clamp(-1, 1, (e.beta - 45) / 30));
        };
        const enable = () => {
          if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then((s) => {
                if (s === 'granted') listen(window, 'deviceorientation', onGyro);
              })
              .catch(() => {});
          } else {
            listen(window, 'deviceorientation', onGyro);
          }
        };
        listen(window, 'touchend', enable, { once: true });
        // en móvil también reacciona al dedo
        listen(
          window,
          'touchmove',
          (e) => {
            const t = e.touches[0];
            tilt((t.clientX / innerWidth) * 2 - 1, (t.clientY / innerHeight) * 2 - 1);
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

  /* ---------- Interacciones ---------- */
  // 1.er click: el disco empieza a girar y sale el globo de texto.
  // Después: pausa / reanuda (el reproductor y el disco van juntos).
  const encenderDisco = () => {
    startedRef.current = true;
    setStarted(true);
    isPlaying.current = true;
    setPlaying(true);
    if (spin.current) {
      spin.current.timeScale(0).play();
      gsap.to(spin.current, { timeScale: 1, duration: 0.8, ease: 'power2.out' });
    }
    gsap.fromTo(
      speechIn.current,
      { autoAlpha: 0, scale: 0.2, rotation: -6, transformOrigin: '0% 60%' },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.6)' }
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
      gsap.to(spin.current, { timeScale: next ? 1 : 0, duration: 0.8, ease: 'power2.out' });
    }
    // Si la canción del cursor ya es la música de fondo, pausa / reanuda con el disco
    if (musicaFondo.current) {
      window.dispatchEvent(new CustomEvent('musica-control', { detail: { sonando: next } }));
    }
  };

  // Al llegar a 100 clics, el cursor avisa que la canción pasó a ser la música de fondo
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
          gsap.to(spin.current, { timeScale: 1, duration: 0.8, ease: 'power2.out' });
        }
      }
    };
    window.addEventListener('musica-fondo', onMusicaFondo);
    return () => window.removeEventListener('musica-fondo', onMusicaFondo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vinylEnter = () => {
    if (spin.current && isPlaying.current) gsap.to(spin.current, { timeScale: 3, duration: 0.5 });
  };
  const vinylLeave = () => {
    if (spin.current && isPlaying.current) gsap.to(spin.current, { timeScale: 1, duration: 0.8 });
  };
  const poke = () => {
    gsap.fromTo(
      '.l-char .in',
      { scale: 1 },
      { scale: 1.08, rotation: 4, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }
    );
  };

  return (
    <header className="hero" id="inicio" ref={root}>
      <div className="stage-wrap">
        <div className="stage" ref={stage}>
          {/* fondo azul: a pantalla completa, fuera del marco */}
          <div className="layer l-bg" data-z="-320" data-depth="6" data-comp="1">
            <div className="in"><img src={fondo} alt="" draggable="false" /></div>
          </div>

          {/* marco de composición: todo lo demás se mide en % de este marco */}
          <div className="frame">
            {/* hoja de cuaderno */}
            <div className="layer l-paper" data-z="-140" data-depth="12">
              <div className="in"><img src={hoja} alt="" draggable="false" /></div>
            </div>

            {/* vinilo */}
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
                  <img src={disco} alt="Disco de vinilo con ilustración de Luis" draggable="false" />
                </button>
              </div>
            </div>

            {/* estrellas */}
            <div className="layer l-star l-star--a" data-z="120" data-depth="30">
              <div className="in"><img src={estrella} alt="" draggable="false" /></div>
            </div>
            <div className="layer l-star l-star--b" data-z="90" data-depth="26">
              <div className="in"><img src={estrella} alt="" draggable="false" /></div>
            </div>

            {/* personaje */}
            <div className="layer l-char" data-z="110" data-depth="28" style={{ pointerEvents: 'auto' }} onClick={poke}>
              <div className="in"><img src={personaje} alt="Luis Miguel, ilustración" draggable="false" /></div>
            </div>

            {/* título */}
            <div className="layer l-title" data-z="150" data-depth="34">
              <div className="in"><img src={titulo} alt="Portafolio 2026" draggable="false" /></div>
            </div>

            {/* globo de texto (aparece al darle click al vinilo) */}
            <div className="layer l-speech" data-z="120" data-depth="20">
              <div className="in" ref={speechIn}>
                <div className="speech" aria-live="polite">
                  <p>
                    Hola, soy Luis. Me encanta la música y adoro trabajar escuchando música. Mi cantante favorita es
                    Mon Laferte.
                  </p>
                </div>
              </div>
            </div>

            {/* reproductor + rol */}
            <div className="layer l-info" data-z="80" data-depth="18">
              <div className="in">
                <Player name="Luis Miguel Moreno Santos" playing={playing} onToggle={toggleVinyl} />
                <p className="role">Productor Multimedia</p>
              </div>
            </div>


            
          </div>
        </div>
      </div>
    </header>
  );
}