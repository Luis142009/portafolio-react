import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import globo from '../assets/globo.png';
import personaje3 from '../assets/personaje3.png';

import '../stylesheets/Footer.css';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Lienzo de referencia (igual que Proyectos: --pj = --fw / 597)
const FOOTER_DESIGN_WIDTH = 597;

// Datos de contacto: cámbialos aquí
const TELEFONO = '3127914881';
const TELEFONO_HREF = 'tel:+573127914881';
const CORREO = 'morenoluismiguel986@gmail.com';

// Texto del globo. Si tu globo.png YA trae el texto escrito,
// pon TEXTO_EN_GLOBO en false.
const TEXTO_EN_GLOBO = true;
const FRASE = 'gracias por ver';

// Cada cuántos segundos Luis da un saltito solo (mín, máx)
const SALTITO_CADA = [3.5, 6.5];

// px reales por 1 px de referencia (para que los saltos escalen en cualquier pantalla)
const escala = (el) => {
  const frame = el?.closest('.frame');
  return (frame ? frame.offsetWidth : FOOTER_DESIGN_WIDTH) / FOOTER_DESIGN_WIDTH;
};

export default function Footer() {
  const root = useRef(null);
  const busy = useRef(false);
  const shyEnviada = useRef(false);
  const api = useRef({});

  // ---------------------------------------------------------
  // Animaciones. Hero.jsx anima ".in" de cada capa con el scroll;
  // aquí solo se tocan elementos INTERNOS para no chocar con eso.
  //
  //  · Cuando el globo está a la vista: secuencia de entrada
  //    (globo elástico, Luis rebota y saluda, letras una a una,
  //    líneas de contacto deslizan).
  //  · Después: flotación, respiración, ola en el texto y saltitos
  //    ocasionales de Luis.
  //  · Al salir de pantalla todo se pausa y se reinicia
  //    (ahorra batería y la entrada se repite al volver).
  // ---------------------------------------------------------
  useEffect(() => {
    if (reduce) return;

    const el = root.current;
    const q = (s) => el.querySelector(s);

    const chars = gsap.utils.toArray(el.querySelectorAll('.ft-char'));
    const lineas = gsap.utils.toArray(el.querySelectorAll('.ft-contacto p'));
    const btn = q('.ft-personaje__btn');
    const img = btn.querySelector('img');
    const cuerpo = q('.ft-globo__cuerpo');
    const objetivo = q('.ft-globo');

    let visible = false;
    let introDone = false;
    let introTl = null;
    let hopCall = null;
    let loopTweens = [];

    // Ola de escala que recorre las letras desde el centro
    const ripple = (k = 1) => {
      if (!chars.length) return;

      gsap
        .timeline()
        .to(chars, {
          scale: 1 + 0.35 * k,
          duration: 0.14,
          ease: 'power2.out',
          stagger: { each: 0.035, from: 'center' },
        })
        .to(
          chars,
          {
            scale: 1,
            duration: 0.6,
            ease: 'elastic.out(1,.35)',
            stagger: { each: 0.035, from: 'center' },
          },
          '<0.14'
        );
    };

    const setLoops = (on) =>
      loopTweens.forEach((t) => (on ? t.restart() : t.pause(0)));

    // Saltito espontáneo de Luis
    const scheduleHop = () => {
      if (hopCall) hopCall.kill();

      hopCall = gsap.delayedCall(gsap.utils.random(...SALTITO_CADA), () => {
        if (visible && introDone && !busy.current) {
          const s = escala(el);

          gsap
            .timeline()
            .to(btn, { scaleX: 1.06, scaleY: 0.92, duration: 0.12, ease: 'power2.out' })
            .to(btn, {
              y: -18 * s,
              scaleX: 0.97,
              scaleY: 1.05,
              duration: 0.25,
              ease: 'power2.out',
            })
            .to(btn, {
              y: 0,
              scaleX: 1.04,
              scaleY: 0.96,
              duration: 0.28,
              ease: 'bounce.out',
            })
            .to(btn, { scale: 1, duration: 0.4, ease: 'elastic.out(1,.4)' });

          ripple(0.5);
        }

        scheduleHop();
      });
    };

    const ctx = gsap.context((self) => {
      // Bucles (pausados hasta que termine la entrada)
      loopTweens = [
        // Luis: flota y "respira"
        gsap.to(img, {
          y: -7,
          rotation: 1.5,
          scaleY: 1.025,
          scaleX: 0.99,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          paused: true,
        }),
        // Globo: flota y se mece desde la cola
        gsap.to(cuerpo, {
          y: -5,
          rotation: 1.2,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          paused: true,
        }),
        // Texto: ola continua de letra en letra
        gsap.to(chars, {
          yPercent: -9,
          duration: 0.9,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: { each: 0.07 },
          paused: true,
        }),
      ];

      // Estado inicial (antes de la entrada)
      const reset = () => {
        if (hopCall) {
          hopCall.kill();
          hopCall = null;
        }

        if (introTl) {
          introTl.kill();
          introTl = null;
        }

        introDone = false;
        setLoops(false);

        const s = escala(el);

        gsap.killTweensOf([btn, cuerpo, ...chars, ...lineas]);

        gsap.set(chars, { autoAlpha: 0, scale: 0.3, rotation: -18, yPercent: 0 });
        gsap.set(lineas, { autoAlpha: 0, x: -28 * s });
        gsap.set(cuerpo, { scale: 0.4, rotation: 0, y: 0, transformOrigin: '80% 100%' });
        gsap.set(btn, {
          y: 70 * s,
          scale: 0.7,
          rotation: -10,
          transformOrigin: '50% 100%',
        });
        gsap.set(img, { y: 0, rotation: 0, scaleX: 1, scaleY: 1, transformOrigin: '50% 100%' });
      };

      const playIntro = () => {
        reset();

        introTl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            introDone = true;
            setLoops(true);
            scheduleHop();
          },
        });

        introTl
          // El globo se infla con rebote elástico
          .to(cuerpo, { scale: 1, duration: 1.1, ease: 'elastic.out(1,.5)' }, 0)
          // Luis sube rebotando
          .to(btn, { y: 0, scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.6)' }, 0.25)
          // Las letras aparecen una a una
          .to(
            chars,
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 0.5,
              ease: 'back.out(2.4)',
              stagger: 0.05,
            },
            0.5
          )
          // Contacto: cada línea desliza desde la izquierda
          .to(lineas, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.15 }, 0.9)
          // Luis saluda
          .addLabel('saludo', 1.3)
          .to(btn, { rotation: -6, duration: 0.1 }, 'saludo')
          .to(btn, { rotation: 6, duration: 0.1 })
          .to(btn, { rotation: -4, duration: 0.1 })
          .to(btn, { rotation: 0, duration: 0.4, ease: 'elastic.out(1,.4)' });
      };

      // Métodos del contexto: así lo creado después queda registrado
      self.add('entrar', playIntro);
      self.add('limpiar', reset);

      reset();
    }, root);

    // Se activa cuando el globo está bien a la vista
    // (IntersectionObserver funciona aunque la cámara use transforms).
    let io = null;

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.intersectionRatio >= 0.6 && !visible) {
            visible = true;
            ctx.entrar();
          } else if (e.intersectionRatio < 0.15 && visible) {
            visible = false;
            ctx.limpiar();
          }
        },
        { threshold: [0, 0.15, 0.6, 1] }
      );

      io.observe(objetivo);
    } else {
      visible = true;
      ctx.entrar();
    }

    api.current = { ripple, ready: () => introDone };

    return () => {
      if (io) io.disconnect();
      if (hopCall) hopCall.kill();
      gsap.killTweensOf([btn, cuerpo, ...chars, ...lineas]);
      ctx.revert();
      api.current = {};
    };
  }, []);

  // ---------------------------------------------------------
  // Clic en Luis: salto con squash & stretch, el globo hace
  // gelatina y una ola recorre el texto.
  // ---------------------------------------------------------
  const saltar = () => {
    const a = api.current;

    // Primer clic en Luis: desbloquea la última canción (shy).
    // Usa el mismo evento que Hero.jsx con Laferte y Danse Macabre;
    // Canciones.jsx se encarga del aviso y de guardarla.
    if (!shyEnviada.current) {
      shyEnviada.current = true;

      window.dispatchEvent(
        new CustomEvent('cancion-desbloqueada', {
          detail: { id: 'shy' },
        })
      );
    }


    if (reduce || busy.current || !a.ready?.() || !root.current) return;

    const s = escala(root.current);
    const btn = root.current.querySelector('.ft-personaje__btn');
    const globoEl = root.current.querySelector('.ft-globo__cuerpo');

    busy.current = true;

    // Interrumpe cualquier saltito o hover en curso
    gsap.killTweensOf(btn);
    gsap.set(btn, { y: 0, scale: 1, rotation: 0, transformOrigin: '50% 100%' });

    gsap
      .timeline({
        onComplete: () => {
          busy.current = false;
        },
      })
      .to(btn, { scaleX: 1.08, scaleY: 0.9, duration: 0.12, ease: 'power2.out' })
      .to(btn, {
        y: -40 * s,
        scaleX: 0.95,
        scaleY: 1.07,
        rotation: -4,
        duration: 0.3,
        ease: 'power2.out',
      })
      .add(() => a.ripple?.(1))
      .to(btn, {
        y: 0,
        scaleX: 1.06,
        scaleY: 0.94,
        rotation: 0,
        duration: 0.32,
        ease: 'bounce.out',
      })
      .to(btn, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' })
      .fromTo(
        globoEl,
        { scaleX: 1.12, scaleY: 0.9 },
        { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' },
        0.3
      );
  };

  // Hover de Luis (solo con ratón): se inclina y crece un poco
  const lunaEnter = (e) => {
    if (reduce || !hoverFine || busy.current || !api.current.ready?.()) return;

    gsap.to(e.currentTarget, {
      rotation: 3,
      scale: 1.05,
      duration: 0.3,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
  };

  const lunaLeave = (e) => {
    if (reduce || !hoverFine || busy.current) return;

    gsap.to(e.currentTarget, {
      rotation: 0,
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1,.5)',
      overwrite: 'auto',
    });
  };

  // Enlaces de contacto: se corren un poco al pasar el ratón
  const linkEnter = (e) => {
    if (reduce || !hoverFine) return;

    gsap.to(e.currentTarget, {
      x: 5 * escala(root.current),
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const linkLeave = (e) => {
    if (reduce || !hoverFine) return;

    gsap.to(e.currentTarget, {
      x: 0,
      duration: 0.4,
      ease: 'elastic.out(1,.6)',
      overwrite: 'auto',
    });
  };

  return (
    <div className="ft-root" ref={root}>
      {/* Fondo azul (se estira a los lados en pantallas anchas) */}
      <div className="layer ft ft-fondo" data-z="0" data-depth="0">
        <div className="in" />
      </div>

      {/* Contacto */}
      <div
        className="layer ft ft-contacto"
        data-z="80"
        data-depth="12"
        data-no-sonar="true"
      >
        <div className="in">
          <p>
            Contacto:{' '}
            <a href={TELEFONO_HREF} onPointerEnter={linkEnter} onPointerLeave={linkLeave}>
              {TELEFONO}
            </a>
          </p>
          <p>
            <a
              href={`mailto:${CORREO}`}
              onPointerEnter={linkEnter}
              onPointerLeave={linkLeave}
            >
              {CORREO}
            </a>
          </p>
        </div>
      </div>

      {/* Globo "gracias por ver" */}
      <div className="layer ft ft-globo" data-z="110" data-depth="18">
        <div className="in">
          <div className="ft-globo__cuerpo">
            <img src={globo} alt="" draggable="false" />
            {TEXTO_EN_GLOBO && (
              <span className="ft-globo__texto" role="img" aria-label={FRASE}>
                {[...FRASE].map((c, i) => (
                  <span className="ft-char" aria-hidden="true" key={i}>
                    {c === ' ' ? '\u00A0' : c}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Luis */}
      <div className="layer ft ft-personaje" data-z="130" data-depth="26">
        <div className="in">
          <button
            className="ft-personaje__btn"
            type="button"
            aria-label="Luis dice: gracias por ver"
            onClick={saltar}
            onPointerEnter={lunaEnter}
            onPointerLeave={lunaLeave}
          >
            <img src={personaje3} alt="" draggable="false" />
          </button>
        </div>
      </div>
    </div>
  );
}