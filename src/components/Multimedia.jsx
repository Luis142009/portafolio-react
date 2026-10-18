import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

import hojamultimedia from '../assets/seccion3.png';
import globo from '../assets/nota3.png';
import nota from '../assets/musica.png';
import multimedia from '../assets/multimedia.png';
import estrellaazul from '../assets/starblue.png';
import marco from '../assets/hoja5.png';
import web from '../assets/web.png';
import video from '../assets/video.png';
import herramientasweb from '../assets/herrraweb.png';
import herramientasvideo from '../assets/herravideo.png';
import radio from '../assets/bafle.png';
import clave from '../assets/partitura.png';
import luisestrella from '../assets/personaje5.png';

import Violin from './Violin.jsx';
import '../stylesheets/Multimedia.css';

// ---------------------------------------------------------
// PROFUNDIDAD
// Todo Multimedia va DEBAJO de Sobre mí. En Sobremi.jsx las capas
// frontales (papel rasgado inferior, hoja de software y título) están en
// z = 25, 28 y 35, así que aquí ninguna capa pasa de 14.
// ---------------------------------------------------------
// El globo va por DEBAJO de todo Sobre mí, incluido su fondo de papel (z = -30
// en Sobremi.jsx). Sigue por encima del papel de Multimedia (z = -60).
const GLOBO_Z = -40;
const LUIS_Z = 10;
const ARRIBA_Z = 14;

const TEXTO_WEB = 'Conocimientos que complementan mi trabajo creativo';
const TEXTO_VIDEO =
  'Programas para la edición y creacion de videos y contenido multimedia';

const WEB = [
  { nombre: 'Visual Studio Code', nivel: 55, fila: 13 },
  { nombre: 'React', nivel: 55, fila: 49 },
  { nombre: 'WordPress', nivel: 50, fila: 85 },
];

const VIDEO = [
  { nombre: 'Adobe Premiere Pro', nivel: 55, fila: 22 },
  { nombre: 'CapCut', nivel: 70, fila: 80 },
];

function Capa({ clase, z, depth, children }) {
  return (
    <div className={`layer ${clase}`} data-z={z} data-depth={depth}>
      <div className="in">{children}</div>
    </div>
  );
}

// Texto dividido en palabras para el mismo revelado de "Sobre mí"
function Escribir({ texto }) {
  const palabras = texto.trim().split(/\s+/);

  return (
    <p aria-label={texto} data-texto={texto}>
      {palabras
        .map((palabra, i) => (
          <span className="mm-word" key={`${palabra}-${i}`} aria-hidden="true">
            <span className="mm-word__inner">{palabra}</span>
          </span>
        ))
        .reduce((lista, palabra, i) => {
          if (i > 0) lista.push(' ');
          lista.push(palabra);
          return lista;
        }, [])}
    </p>
  );
}

function Barras({ items }) {
  return (
    <div className="mm-bars">
      {items.map(({ nombre, nivel, fila }) => (
        <div
          key={nombre}
          className="mm-bar"
          style={{ top: `${fila - 8}%`, '--lvl': nivel }}
          data-lvl={nivel}
          role="img"
          aria-label={`${nombre}: nivel ${nivel}%`}
        >
          <div className="mm-bar__fill" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------
// HELPERS DE ANIMACIÓN
// ---------------------------------------------------------

// Revelado tipográfico: igual que el texto de la tarjeta en Sobre mí
const revelar = (p) =>
  gsap.fromTo(
    p.querySelectorAll('.mm-word__inner'),
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
      stagger: { each: 0.045, from: 'start' },
      ease: 'power4.out',
    }
  );

const gelatina = (el) =>
  gsap
    .timeline()
    .to(el, {
      scaleX: 1.25,
      scaleY: 0.75,
      duration: 0.12,
    })
    .to(el, {
      scaleX: 0.85,
      scaleY: 1.15,
      duration: 0.12,
    })
    .to(el, {
      scale: 1,
      duration: 0.7,
      ease: 'elastic.out(1,.35)',
    });

const bambolear = (el, origen = '50% 50%', fuerza = 1) =>
  gsap
    .timeline()
    .set(el, { transformOrigin: origen })
    .to(el, {
      rotation: -18 * fuerza,
      duration: 0.1,
    })
    .to(el, {
      rotation: 14 * fuerza,
      duration: 0.12,
    })
    .to(el, {
      rotation: 0,
      duration: 0.8,
      ease: 'elastic.out(1,.3)',
    });

// Hoja colgante: cae desde arriba y se balancea como papel pegado
// por la parte de arriba hasta quedarse quieta.
const caerHoja = (el, lado) =>
  gsap
    .timeline()
    .to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'bounce.out',
    })
    .to(
      el,
      {
        rotation: 0,
        duration: 1.8,
        ease: 'elastic.out(1,.28)',
      },
      0.15
    )
    .to(
      el,
      {
        scaleY: 1,
        duration: 0.5,
        ease: 'elastic.out(1,.4)',
      },
      0.55
    );

// ---------------------------------------------------------
// ESCENA 3 · MULTIMEDIA
// ---------------------------------------------------------

export default function Multimedia() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const q = gsap.utils.selector(root);
    const textos = q('.mm-desc p');

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let listo = false;
    const off = [];

    const ctx = gsap.context((self) => {
      const globoIn = q('.mm-globo .in');
      const tituloIn = q('.mm-titulo .in');
      const notaIn = q('.mm-nota .in');
      const estrellaIn = q('.mm-estrella .in');
      const marcos = q('.mm-marco .in');
      const tits = q('.mm-tit .in');
      const iconos = q('.mm-tools__icons');
      const barras = q('.mm-bar');
      const fills = q('.mm-bar__fill');
      const radioIn = q('.mm-radio .in');
      const claveIn = q('.mm-clave .in');
      const luisIn = q('.mm-luis .in')[0];
      const palabras = q('.mm-desc .mm-word__inner');

      // ---------------------------------------------------
      // ESTADO INICIAL
      // ---------------------------------------------------

      // Las palabras empiezan escondidas (con movimiento reducido se ven ya)
      gsap.set(palabras, reduce
        ? { autoAlpha: 1, yPercent: 0, rotationX: 0 }
        : { autoAlpha: 0, yPercent: 115, rotationX: -35, transformOrigin: '50% 100%' });

      gsap.set(globoIn, {
        autoAlpha: 0,
        scale: 0,
        transformOrigin: '50% 85%',
      });

      gsap.set(tituloIn, {
        autoAlpha: 0,
        y: -40,
        scale: 0.6,
      });

      gsap.set([notaIn, estrellaIn], {
        autoAlpha: 0,
        scale: 0,
        rotation: -120,
      });

      // Las hojas cuelgan de su borde superior: empiezan arriba y torcidas
      gsap.set(marcos, {
        autoAlpha: 0,
        y: -260,
        rotation: (i) => (i ? 16 : -16),
        transformOrigin: '50% 0%',
      });

      gsap.set(tits, {
        autoAlpha: 0,
        scale: 0.4,
      });

      gsap.set(iconos, {
        autoAlpha: 0,
        x: (i) => (i ? 60 : -60),
      });

      gsap.set(barras, { autoAlpha: 0 });
      gsap.set(fills, { width: '0%' });

      gsap.set([radioIn, claveIn], {
        autoAlpha: 0,
        y: 80,
        scale: 0.6,
      });

      gsap.set(luisIn, {
        autoAlpha: 0,
        yPercent: 140,
        transformOrigin: '50% 70%',
      });

      // Con movimiento reducido se muestra la escena completa
      // sin ejecutar la animación de entrada.
      if (reduce) {
        gsap.set(globoIn, {
          autoAlpha: 1,
          scale: 1,
        });

        gsap.set(tituloIn, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
        });

        gsap.set([notaIn, estrellaIn], {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
        });

        gsap.set(marcos, {
          autoAlpha: 1,
          y: 0,
          rotation: 0,
        });

        gsap.set(tits, {
          autoAlpha: 1,
          scale: 1,
        });

        gsap.set(iconos, {
          autoAlpha: 1,
          x: 0,
        });

        gsap.set(barras, { autoAlpha: 1 });

        gsap.set(fills, {
          width: (i, f) => `${f.parentNode.dataset.lvl}%`,
        });

        gsap.set([radioIn, claveIn], {
          autoAlpha: 1,
          y: 0,
          scale: 1,
        });

        gsap.set(luisIn, {
          autoAlpha: 1,
          yPercent: 0,
        });

        listo = true;
      }

      const libre = (el) => listo && !gsap.isTweening(el);

      const llenar = (lista) =>
        gsap.fromTo(
          lista,
          { width: '0%' },
          {
            width: (i, f) => `${f.parentNode.dataset.lvl}%`,
            duration: 1.8,
            ease: 'power2.inOut',
            stagger: 0.25,
          }
        );

      // ---------------------------------------------------
      // MOVIMIENTO SUAVE DE REPOSO
      // ---------------------------------------------------

      self.add('reposo', () => {
        if (reduce) return;

        const suave = {
          duration: 1.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        };

        gsap.to(q('.mm-nota img'), {
          yPercent: -7,
          ...suave,
        });

        gsap.to(q('.mm-estrella img'), {
          rotation: 8,
          scale: 1.06,
          ...suave,
          duration: 1.8,
        });

        gsap.set(q('.mm-clave img'), {
          transformOrigin: '50% 0%',
        });

        gsap.fromTo(
          q('.mm-clave img'),
          { rotation: -7 },
          {
            rotation: 7,
            ...suave,
            duration: 1.6,
          }
        );

        gsap.set(q('.mm-radio img'), {
          transformOrigin: '50% 100%',
        });

        gsap.to(q('.mm-radio img'), {
          scaleY: 1.025,
          ...suave,
          duration: 0.9,
        });

        gsap.to(q('.mm-luis img'), {
          yPercent: -3,
          ...suave,
          duration: 2,
        });

        // Las hojas se mecen muy poco, colgadas de arriba
        gsap.to(q('.mm-marco img'), {
          rotation: (i) => (i ? -0.9 : 0.9),
          transformOrigin: '50% 0%',
          ...suave,
          duration: 2.6,
        });
      });

      // ---------------------------------------------------
      // INTRODUCCIÓN
      // ---------------------------------------------------

      self.add('intro', () => {
        if (reduce) {
          listo = true;
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },

          onComplete: () => {
            listo = true;
            ctx.reposo();
          },
        });

        tl.to(globoIn, {
          autoAlpha: 1,
          scale: 1,
          duration: 1,
          ease: 'back.out(1.7)',
        })
          .to(
            tituloIn,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: 'back.out(2)',
            },
            '-=0.35'
          )
          .to(
            [notaIn, estrellaIn],
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 0,
              duration: 0.7,
              ease: 'back.out(2.2)',
              stagger: 0.12,
            },
            '-=0.4'
          )
          // Hojas: caen una tras otra y se balancean
          .add('hojas', '-=0.2')
          .add(caerHoja(marcos[0], -1), 'hojas')
          .add(caerHoja(marcos[1], 1), 'hojas+=0.22')
          .to(
            tits,
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.6,
              ease: 'back.out(2.4)',
              stagger: 0.1,
            },
            'hojas+=0.7'
          )
          // Texto: revelado palabra por palabra
          .add('tipeo', 'hojas+=0.9')
          .add(revelar(textos[0]), 'tipeo')
          .add(revelar(textos[1]), 'tipeo+=0.15')
          .to(
            iconos,
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.6,
              stagger: 0.15,
            },
            'tipeo+=0.4'
          )
          .add('cargar', 'tipeo+=0.9')
          .to(
            barras,
            {
              autoAlpha: 1,
              duration: 0.3,
              stagger: 0.1,
            },
            'cargar'
          )
          .add(llenar(fills), 'cargar+=0.2')
          .to(
            [radioIn, claveIn],
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: 'back.out(2)',
              stagger: 0.15,
            },
            'cargar+=0.4'
          )
          .to(
            luisIn,
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 1.1,
              ease: 'back.out(1.4)',
            },
            'cargar+=1'
          );
      });

      // ---------------------------------------------------
      // SISTEMA DE CLICS Y TECLADO
      // ---------------------------------------------------

      const onClick = (sel, label, fn) => {
        q(sel).forEach((el) => {
          const accion = () => {
            if (listo) ctx.run(() => fn(el));
          };

          const tecla = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              accion();
            }
          };

          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', label);
          el.tabIndex = 0;

          el.addEventListener('click', accion);
          el.addEventListener('keydown', tecla);

          off.push(() => {
            el.removeEventListener('click', accion);
            el.removeEventListener('keydown', tecla);
          });
        });
      };

      self.add('run', (fn) => fn());

      // ---------------------------------------------------
      // NOTA MUSICAL
      // ---------------------------------------------------

      onClick('.mm-nota .in', 'Nota musical', (el) => {
        if (!libre(el)) return;
        bambolear(el, '50% 80%', 1.2);
      });

      // ---------------------------------------------------
      // ESTRELLA
      // ---------------------------------------------------

      onClick('.mm-estrella .in', 'Estrella', (el) => {
        if (!libre(el)) return;

        gsap
          .timeline()
          .to(el, {
            rotation: '+=360',
            scale: 1.35,
            duration: 0.7,
            ease: 'back.inOut(2)',
          })
          .to(el, {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1,.4)',
          });
      });

      // ---------------------------------------------------
      // BAFLE: REPRODUCIR / PAUSAR CYBERPUNK
      // Canciones.jsx escucha este evento: desbloquea la
      // canción 07, la reproduce o pausa, y sincroniza el
      // vinilo del Hero.
      // ---------------------------------------------------

      onClick('.mm-radio .in', 'Reproducir o pausar Cyberpunk', (el) => {
        if (gsap.isTweening(el)) return;

        window.dispatchEvent(new CustomEvent('cyberpunk-bafle-toggle'));

        gsap
          .timeline()
          .to(el, {
            scaleX: 1.07,
            scaleY: 0.9,
            duration: 0.14,
            ease: 'power2.out',
          })
          .to(el, {
            scale: 1,
            duration: 0.3,
            ease: 'elastic.out(1, .4)',
          });
      });

      // ---------------------------------------------------
      // TÍTULOS
      // ---------------------------------------------------

      onClick('.mm-titulo .in', 'Título Multimedia', (el) => {
        if (libre(el)) gelatina(el);
      });

      onClick('.mm-tit--web .in', 'Web', (el) => {
        if (libre(el)) gelatina(el);
      });

      onClick('.mm-tit--video .in', 'Video', (el) => {
        if (libre(el)) gelatina(el);
      });

      // ---------------------------------------------------
      // HERRAMIENTAS: RECARGAR BARRAS
      // ---------------------------------------------------

      onClick('.mm-tools .in', 'Volver a cargar las barras', (el) => {
        const f = el.querySelectorAll('.mm-bar__fill');

        if ([...f].some((x) => gsap.isTweening(x))) return;

        llenar(f);

        gsap.fromTo(
          el.querySelector('.mm-tools__icons'),
          { y: 0 },
          {
            y: -10,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power1.out',
          }
        );
      });

      // ---------------------------------------------------
      // DESCRIPCIONES: VOLVER A REVELAR EL TEXTO
      // ---------------------------------------------------

      onClick('.mm-desc .in', 'Volver a escribir el texto', (el) => {
        const p = el.querySelector('p');
        const ws = p.querySelectorAll('.mm-word__inner');

        if ([...ws].some((w) => gsap.isTweening(w))) return;

        revelar(p);
      });

      // ---------------------------------------------------
      // HOJAS: SE BALANCEAN AL TOCARLAS
      // ---------------------------------------------------

      onClick('.mm-marco .in', 'Hoja', (el) => {
        if (!libre(el)) return;

        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 0%' })
          .to(el, { rotation: -4, duration: 0.14, ease: 'power2.out' })
          .to(el, { rotation: 3, duration: 0.16 })
          .to(el, { rotation: 0, duration: 1.1, ease: 'elastic.out(1,.25)' });
      });

      // ---------------------------------------------------
      // LUIS: VOLTERETA
      // ---------------------------------------------------

      onClick('.mm-luis .in', 'Luis', (el) => {
        if (!libre(el)) return;

        gsap.set(el, {
          transformOrigin: '50% 70%',
        });

        gsap
          .timeline()
          .to(el, {
            scaleX: 1.1,
            scaleY: 0.86,
            duration: 0.14,
            ease: 'power2.out',
          })
          .to(el, {
            yPercent: -28,
            scaleX: 0.94,
            scaleY: 1.1,
            rotation: 360,
            duration: 0.55,
            ease: 'power2.out',
          })
          .set(el, { rotation: 0 })
          .to(el, {
            yPercent: 0,
            scaleX: 1.12,
            scaleY: 0.88,
            duration: 0.3,
            ease: 'bounce.out',
          })
          .to(el, {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1,.4)',
          });
      });
    }, root);

    // -----------------------------------------------------
    // INICIAR ESCENA CUANDO ENTRE EN PANTALLA
    // -----------------------------------------------------

    let io;

    if (reduce) {
      listo = true;
    } else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            io.disconnect();
            ctx.intro();
          }
        },
        { threshold: 0.2 }
      );

      io.observe(root);
    }

    // -----------------------------------------------------
    // LIMPIEZA
    // -----------------------------------------------------

    return () => {
      io?.disconnect();

      off.forEach((fn) => fn());

      ctx.revert();
    };
  }, []);

  return (
    <div className="mm" ref={rootRef}>
      <Capa clase="mm-papel" z={-60} depth={8}>
        <img src={hojamultimedia} alt="" draggable="false" />
      </Capa>

      {/* Globo */}
      <Capa clase="mm-globo" z={GLOBO_Z} depth={10}>
        <img src={globo} alt="" draggable="false" />
      </Capa>

      {/* Nota musical */}
      <Capa clase="mm-nota clicky" z={ARRIBA_Z} depth={24}>
        <img src={nota} alt="" draggable="false" />
      </Capa>

      {/* Título Multimedia */}
      <Capa clase="mm-titulo clicky" z={ARRIBA_Z} depth={26}>
        <img src={multimedia} alt="Multimedia" draggable="false" />
      </Capa>

      {/* Estrella */}
      <Capa clase="mm-estrella clicky" z={ARRIBA_Z} depth={22}>
        <img src={estrellaazul} alt="" draggable="false" />
      </Capa>

      {/* Panel WEB */}
      <Capa clase="mm-marco mm-marco--web clicky" z={-10} depth={12}>
        <img src={marco} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-tit mm-tit--web clicky" z={4} depth={18}>
        <img src={web} alt="Web" draggable="false" />
      </Capa>

      <Capa clase="mm-desc mm-desc--web clicky" z={2} depth={16}>
        <Escribir texto={TEXTO_WEB} />
      </Capa>

      <Capa clase="mm-tools mm-tools--web clicky" z={6} depth={20}>
        <img
          className="mm-tools__icons"
          src={herramientasweb}
          alt="Visual Studio Code, React y WordPress"
          draggable="false"
        />
        <Barras items={WEB} />
      </Capa>

      {/* Bafle musical */}
      <Capa clase="mm-radio clicky" z={8} depth={24}>
        <img src={radio} alt="Bafle: reproducir o pausar Cyberpunk" draggable="false" />
      </Capa>

      {/* Panel VIDEO */}
      <Capa clase="mm-marco mm-marco--video clicky" z={-10} depth={12}>
        <img src={marco} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-tit mm-tit--video clicky" z={4} depth={18}>
        <img src={video} alt="Video" draggable="false" />
      </Capa>

      <Capa clase="mm-desc mm-desc--video clicky" z={2} depth={16}>
        <Escribir texto={TEXTO_VIDEO} />
      </Capa>

      <Capa clase="mm-tools mm-tools--video clicky" z={6} depth={20}>
        <img
          className="mm-tools__icons"
          src={herramientasvideo}
          alt="Adobe Premiere Pro y CapCut"
          draggable="false"
        />
        <Barras items={VIDEO} />
      </Capa>

      {/* Partitura: abre el minijuego del violín */}
      <Capa clase="mm-clave clicky" z={8} depth={24}>
        <Violin>
          <img src={clave} alt="Abrir juego del violín" draggable="false" />
        </Violin>
      </Capa>

      {/* Luis sentado sobre la estrella */}
      <Capa clase="mm-luis clicky" z={LUIS_Z} depth={30}>
        <img
          src={luisestrella}
          alt="Luis sentado sobre una estrella"
          draggable="false"
        />
      </Capa>
    </div>
  );
}