import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

import tituloInlec from '../assets/inlec.png';
import globo from '../assets/globo5.png';
import personaje from '../assets/personaje3.png';
import zorro from '../assets/srfox.png';
import manzana from '../assets/manzana.png';
import huella from '../assets/huella.png';
import cinta from '../assets/cinta1.png';
import barra from '../assets/barra.png';
import stared from '../assets/stared.png';

// El CSS de esta escena (ya incluye el visor de fotos)
import '../stylesheets/Inlec.css';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------------------------------------------------------
// INLEC · ventana del proyecto "Súper Zorro"
//
// CÓMO SE ABRE
//   1) Al hacer clic en el enlace INLEC de Proyectos (se detecta
//      por su texto dentro de ".pj-enlace"), o
//   2) desde cualquier parte con:
//        window.dispatchEvent(new CustomEvent('abrir-inlec'))
//
// FOTOS: pon las 14 publicaciones dentro de  src/assets/inlec/
// (cualquier nombre; se ordenan por número: 1.png ... 14.png).
// Si falta alguna, se ve un recuadro numerado en su lugar.
//
// ASSETS NUEVOS en src/assets/: manzana.png, huella.png,
// cinta.png y barra.png (además de los que ya tenías).
//
// SEG_POR_FOTO = segundos que tarda cada pieza en pasar por la columna.
// ---------------------------------------------------------
const MINIMO = 14;           // lugares mínimos (si faltan fotos se ven recuadros numerados)
const SEG_POR_FOTO = 3.6;

const TEXTO =
  'Proyecto sobre el libro Súper Zorro. En este proyecto me dediqué a ' +
  'trabajar muchas de las piezas graficas y demás contenido interactivo y ' +
  'dinámico dentro de este proyecto. Hice muchos posts y animaciones y ' +
  'generé un reproductor de todas ellas y una interfaz.';

// Cómo se "pega" cada pieza: sobre papel (barra.png) o en marco de madera.
// Cada columna tiene 7 piezas; el patrón se repite sin saltos feos.
const TIPOS_IZQ = ['papel', 'marco', 'papel', 'marco', 'papel', 'marco', 'marco'];
const TIPOS_DER = ['papel', 'marco', 'marco', 'papel', 'marco', 'papel', 'marco'];

// Lee las fotos de src/assets/inlec/  y también las sueltas en src/assets/:
//   · "publi 3.png", "publi 4.png"...  -> van en el lugar de su número
//   · "post 2", "post 4s", "pos 1s", "postD", "nuevo"... -> se agregan
//     (llenan los lugares libres y, si no caben, se suman al carrusel)
// (Vite exige que los patrones sean texto literal, sin variables.)
const enCarpeta = import.meta.glob('../assets/inlec/*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  import: 'default',
});

const enPubli = import.meta.glob('../assets/[Pp]ubli*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  import: 'default',
});

const extras = import.meta.glob(
  [
    '../assets/[Pp]os*.{png,jpg,jpeg,webp,gif,avif}',
    '../assets/[Nn]uevo*.{png,jpg,jpeg,webp,gif,avif}',
    '../assets/[Ii]nformativa*.{png,jpg,jpeg,webp,gif,avif}',
  ],
  { eager: true, import: 'default' }
);

const porNombre = (obj) =>
  Object.entries(obj).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

const lugares = Array(MINIMO).fill(null);
const sueltas = [];

// numeradas: "publi N" (prioridad) y las de la carpeta inlec
[...porNombre(enPubli), ...porNombre(enCarpeta)].forEach(([ruta, src]) => {
  const m = ruta.split('/').pop().match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;

  if (n >= 1 && n <= MINIMO && !lugares[n - 1]) lugares[n - 1] = src;
  else sueltas.push(src);
});

// las demás (post..., nuevo...) detrás de las que quedaron desplazadas
// "post final" siempre queda de último
const esFinal = ([ruta]) => /final/i.test(ruta.split('/').pop());
const listaExtras = porNombre(extras);

[...listaExtras.filter((e) => !esFinal(e)), ...listaExtras.filter(esFinal)].forEach(([, src]) =>
  sueltas.push(src)
);

sueltas.forEach((src) => {
  const i = lugares.indexOf(null);
  if (i >= 0) lugares[i] = src;
  else lugares.push(src);
});

const PUBLICACIONES = lugares.map((src, i) => ({ n: i + 1, src }));
const TOTAL = PUBLICACIONES.length;
const POR_COLUMNA = Math.ceil(TOTAL / 2);

// ---------------------------------------------------------
// Columna carrusel: dos copias de sus piezas para que el bucle no tenga salto
// ---------------------------------------------------------
function Columna({ lado, items, tipos, onAbrir }) {
  return (
    <div className={`layer ic ic-col ic-col--${lado}`} data-z="40" data-depth="12">
      <div className="in">
        {/* La barra de papel es fija; las publicaciones suben y bajan sobre ella */}
        <img className="ic-col__barra" src={barra} alt="" draggable="false" />

        <div className="ic-col__vista">
          <div className="ic-col__pista">
            {[0, 1].flatMap((copia) =>
              items.map((it, i) => {
                const tipo = tipos[i % tipos.length];

                return (
                  <button
                    key={`${copia}-${it.n}`}
                    className={`ic-pieza ic-pieza--${tipo}`}
                    type="button"
                    tabIndex={copia ? -1 : 0}
                    aria-hidden={copia ? 'true' : undefined}
                    aria-label={`Ver la publicación ${it.n} de ${TOTAL}`}
                    onClick={() => onAbrir(it.n - 1)}
                  >
                    <span className="ic-pieza__soporte">
                      {it.src ? (
                        <img
                          className="ic-pieza__img"
                          src={it.src}
                          alt={`Publicación ${it.n} del proyecto INLEC`}
                          draggable="false"
                        />
                      ) : (
                        <span className="ic-pieza__vacio">{it.n}</span>
                      )}

                      <img className="ic-tape ic-tape--a" src={cinta} alt="" draggable="false" />
                      <img className="ic-tape ic-tape--b" src={cinta} alt="" draggable="false" />
                      {tipo === 'marco' && (
                        <img className="ic-tape ic-tape--c" src={cinta} alt="" draggable="false" />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Visor de una publicación
// ---------------------------------------------------------
function Visor({ indice, onCerrar, onIr }) {
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onCerrar();
      }
      if (e.key === 'ArrowLeft') onIr(-1);
      if (e.key === 'ArrowRight') onIr(1);
    };

    // en captura: el Esc del visor cierra solo el visor, no la ventana
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  }, [onCerrar, onIr]);

  const pub = PUBLICACIONES[indice];

  return createPortal(
    <div
      className="ic-visor"
      role="dialog"
      aria-modal="true"
      aria-label={`Publicación ${pub.n} de ${TOTAL}`}
      onClick={onCerrar}
    >
      <button className="ic-visor__x" type="button" aria-label="Cerrar" onClick={onCerrar}>
        <img src={stared} alt="" draggable="false" />
      </button>

      <button
        className="ic-visor__nav ic-visor__nav--prev"
        type="button"
        aria-label="Publicación anterior"
        onClick={(e) => {
          e.stopPropagation();
          onIr(-1);
        }}
      >
        ‹
      </button>

      <figure className="ic-visor__fig" onClick={(e) => e.stopPropagation()}>
        {pub.src ? (
          <img src={pub.src} alt={`Publicación ${pub.n} del proyecto INLEC`} draggable="false" />
        ) : (
          <div className="ic-visor__vacio">{pub.n}</div>
        )}
        <figcaption>
          INLEC · publicación {pub.n} de {TOTAL}
        </figcaption>
      </figure>

      <button
        className="ic-visor__nav ic-visor__nav--next"
        type="button"
        aria-label="Publicación siguiente"
        onClick={(e) => {
          e.stopPropagation();
          onIr(1);
        }}
      >
        ›
      </button>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------
// La escena (solo existe mientras la ventana está abierta)
// ---------------------------------------------------------
function Escena({ onCerrar }) {
  const modal = useRef(null);
  const escena = useRef(null);
  const cerrando = useRef(false);
  const visorRef = useRef(null);

  const [abierta, setAbierta] = useState(null);
  visorRef.current = abierta;

  const izq = PUBLICACIONES.slice(0, POR_COLUMNA);
  const der = PUBLICACIONES.slice(POR_COLUMNA);

  const ir = (d) => setAbierta((i) => (i === null ? i : (i + d + TOTAL) % TOTAL));
  const cerrarVisor = () => setAbierta(null);

  const cerrar = () => {
    if (cerrando.current) return;
    cerrando.current = true;

    if (reduce || !modal.current) {
      onCerrar();
      return;
    }

    gsap.to(modal.current, {
      autoAlpha: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: onCerrar,
    });
  };

  // Bloquea el scroll de la página mientras está abierta + tecla Esc
  useEffect(() => {
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape' && visorRef.current === null) cerrar();
    };

    window.addEventListener('keydown', onKey);
    modal.current?.querySelector('.ic-modal__x')?.focus();

    return () => {
      html.style.overflow = antes;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------
  // Entrada, carrusel, flotes, inclinación 3D y clics
  // ---------------------------------------------------------
  useEffect(() => {
    const frame = escena.current;
    if (!frame || reduce) return;

    // el lienzo mide --W px de referencia (764, igual que la imagen modelo)
    const W = parseFloat(getComputedStyle(frame).getPropertyValue('--W')) || 764;
    const u = frame.offsetWidth / W;
    const cleanups = [];

    const ctx = gsap.context(() => {
      // Profundidad de las capas (igual que el Hero, escalada al ancho)
      gsap.utils.toArray('.layer').forEach((layer) => {
        gsap.set(layer, { z: (parseFloat(layer.dataset.z) || 0) * u });
      });

      // ----- Entrada -----
      gsap.set('.layer .in', { autoAlpha: 0 });

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(
          '.ic-col--izq .in',
          { autoAlpha: 0, y: -260 * u },
          { autoAlpha: 1, y: 0, duration: 0.95 },
          0.1
        )
        .fromTo(
          '.ic-col--der .in',
          { autoAlpha: 0, y: 260 * u },
          { autoAlpha: 1, y: 0, duration: 0.95 },
          0.22
        )
        .fromTo(
          '.ic-tab .in',
          { autoAlpha: 0, y: -60 * u, scale: 0.8 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.12 },
          0.4
        )
        .fromTo(
          '.ic-titulo .in',
          { autoAlpha: 0, scale: 0.2, rotation: -10 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.9)' },
          0.5
        )
        .fromTo(
          '.ic-manzana .in',
          { autoAlpha: 0, scale: 0, rotation: -80 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2)' },
          0.7
        )
        .fromTo(
          '.ic-zorro .in',
          { autoAlpha: 0, y: 160 * u, scale: 0.8 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.4)' },
          0.55
        )
        .fromTo(
          '.ic-personaje .in',
          { autoAlpha: 0, y: -70 * u, rotation: 12 },
          { autoAlpha: 1, y: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.7)' },
          0.85
        )
        .fromTo(
          '.ic-globo .in',
          { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 0%' },
          { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)' },
          1.05
        )
        .fromTo(
          '.ic-huella .in',
          { autoAlpha: 0, scale: 0, rotation: -40 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' },
          1.2
        );

      // ----- Carrusel: una columna baja y la otra sube -----
      const pistas = gsap.utils.toArray('.ic-col__pista');
      const estado = pistas.map(() => ({ encima: false }));

      const tweens = pistas.map((pista, i) => {
        const sube = i % 2 === 1;

        return gsap.fromTo(
          pista,
          { yPercent: sube ? 0 : -50 },
          {
            yPercent: sube ? -50 : 0,
            duration: POR_COLUMNA * SEG_POR_FOTO,
            ease: 'none',
            repeat: -1,
          }
        );
      });

      const aplicar = (i) =>
        gsap.to(tweens[i], {
          timeScale: estado[i].encima ? 0 : 1,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
        });

      // Con el puntero encima la columna se detiene para poder elegir
      pistas.forEach((pista, i) => {
        const vista = pista.closest('.ic-col__vista');
        if (!vista) return;

        const entra = () => {
          estado[i].encima = true;
          aplicar(i);
        };

        const sale = () => {
          estado[i].encima = false;
          aplicar(i);
        };

        vista.addEventListener('pointerenter', entra);
        vista.addEventListener('pointerleave', sale);

        cleanups.push(() => {
          vista.removeEventListener('pointerenter', entra);
          vista.removeEventListener('pointerleave', sale);
        });
      });

      // ----- Flotes suaves -----
      gsap.to('.ic-zorro img', {
        y: -6,
        rotation: 0.6,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ic-personaje img', {
        y: -6,
        rotation: -3,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ic-titulo img', {
        y: 4,
        rotation: -0.6,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ic-manzana img', {
        rotation: 8,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Personaje: la pose sale de --giro y --esc del CSS; GSAP le da vida
      const capaPj = frame.querySelector('.ic-personaje');
      const giroPj = frame.querySelector('.ic-personaje__giro');

      if (capaPj && giroPj) {
        const css = getComputedStyle(capaPj);
        const giro = parseFloat(css.getPropertyValue('--giro')) || 0;
        const esc = parseFloat(css.getPropertyValue('--esc')) || 1;

        gsap.set(giroPj, { rotation: giro, scale: esc, transformOrigin: '50% 80%' });

        // se mece alrededor de su ángulo
        gsap.to(giroPj, {
          rotation: giro + 5,
          duration: 1.7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // respira
        gsap.to(giroPj, {
          scale: esc * 1.04,
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      gsap.to('.ic-globo img', {
        scale: 1.02,
        transformOrigin: '50% 0%',
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // ----- Inclinación 3D con el mouse (mismo sistema del Hero) -----
      if (fine) {
        const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.9, ease: 'power3' });
        const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.9, ease: 'power3' });

        const movers = gsap.utils.toArray('.layer').map((layer) => ({
          d: (parseFloat(layer.dataset.depth) || 0) * u,
          x: gsap.quickTo(layer, 'x', { duration: 1, ease: 'power3' }),
          y: gsap.quickTo(layer, 'y', { duration: 1, ease: 'power3' }),
        }));

        const onMove = (e) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;

          ry(nx * 4);
          rx(-ny * 4);

          movers.forEach((m) => {
            m.x(nx * m.d * -1);
            m.y(ny * m.d * -1);
          });
        };

        window.addEventListener('pointermove', onMove);
        cleanups.push(() => window.removeEventListener('pointermove', onMove));
      }

      // ----- Clics (mismo patrón del Hero): efecto GSAP sobre .ic-mover -----
      gsap.delayedCall(1.6, () => {
        gsap.set(
          '.ic-zorro .in, .ic-personaje .in, .ic-titulo .in, .ic-manzana .in, .ic-huella .in',
          { pointerEvents: 'auto' }
        );
      });

      const onClick = (el, label, effect) => {
        if (!el) return;

        const run = () => {
          if (el._busy) return;

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

      const q = (sel) => frame.querySelector(sel);

      // Título: gelatina
      onClick(q('.ic-titulo .ic-mover'), 'INLEC', (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 50%' })
          .to(el, { scaleX: 1.12, scaleY: 0.88, duration: 0.12 })
          .to(el, { scaleX: 0.92, scaleY: 1.08, duration: 0.12 })
          .to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' })
      );

      // Manzana: giro completo
      onClick(q('.ic-manzana .ic-mover'), 'Manzana', (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 50%' })
          .to(el, { rotation: 360, scale: 1.25, duration: 0.5, ease: 'power2.out' })
          .to(el, { rotation: 360, scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' })
          .set(el, { rotation: 0 })
      );

      // Huella: pisotón
      onClick(q('.ic-huella .ic-mover'), 'Huella', (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 50%' })
          .to(el, { scale: 0.75, rotation: -12, duration: 0.12 })
          .to(el, { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1,.35)' })
      );

      // Súper Zorro: salto con squash & stretch
      onClick(q('.ic-zorro .ic-mover'), 'Súper Zorro', (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 100%' })
          .to(el, { scaleX: 1.06, scaleY: 0.92, duration: 0.12, ease: 'power2.out' })
          .to(el, {
            y: -30 * u,
            scaleX: 0.96,
            scaleY: 1.05,
            rotation: -3,
            duration: 0.3,
            ease: 'power2.out',
          })
          .to(el, {
            y: 0,
            scaleX: 1.04,
            scaleY: 0.96,
            rotation: 0,
            duration: 0.35,
            ease: 'bounce.out',
          })
          .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' })
      );

      // Personaje: giro con rebote
      onClick(q('.ic-personaje .ic-mover'), 'Personaje', (el) =>
        gsap
          .timeline()
          .set(el, { transformOrigin: '50% 80%' })
          .to(el, { rotation: -18, scale: 1.12, duration: 0.18, ease: 'power2.out' })
          .to(el, { rotation: 14, duration: 0.2 })
          .to(el, { rotation: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' })
      );
    }, frame);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return createPortal(
    <div
      className="ic-modal"
      ref={modal}
      role="dialog"
      aria-modal="true"
      aria-label="Proyecto INLEC"
    >
      <button className="ic-modal__x" type="button" aria-label="Cerrar INLEC" onClick={cerrar}>
        <img src={stared} alt="" draggable="false" />
      </button>

      <div className="ic-escena" ref={escena}>
        {/* Columnas carrusel (7 publicaciones en cada una) */}
        <Columna lado="izq" items={izq} tipos={TIPOS_IZQ} onAbrir={setAbierta} />
        <Columna lado="der" items={der} tipos={TIPOS_DER} onAbrir={setAbierta} />

        {/* Pestañas "Piezas" */}
        <div className="layer ic ic-tab ic-tab--izq" data-z="90" data-depth="10">
          <div className="in">
            <span>PieZas</span>
          </div>
        </div>

        <div className="layer ic ic-tab ic-tab--der" data-z="90" data-depth="10">
          <div className="in">
            <span>PieZas</span>
          </div>
        </div>

        {/* Manzana + título */}
        <div className="layer ic ic-manzana" data-z="95" data-depth="24">
          <div className="in">
            <div className="ic-mover">
              <img src={manzana} alt="" draggable="false" />
            </div>
          </div>
        </div>

        <div className="layer ic ic-titulo" data-z="90" data-depth="26">
          <div className="in">
            <div className="ic-mover">
              <img src={tituloInlec} alt="INLEC" draggable="false" />
            </div>
          </div>
        </div>

        <div className="layer ic ic-zorro" data-z="70" data-depth="22">
          <div className="in">
            <div className="ic-mover">
              <img src={zorro} alt="Súper Zorro, ilustración" draggable="false" />
            </div>
          </div>
        </div>

        <div className="layer ic ic-globo" data-z="110" data-depth="24">
          <div className="in">
            <img src={globo} alt="" draggable="false" />
            <p className="ic-globo__texto">{TEXTO}</p>
          </div>
        </div>

        <div className="layer ic ic-personaje" data-z="120" data-depth="30">
          <div className="in">
            <div className="ic-mover">
              <div className="ic-personaje__giro">
                <img src={personaje} alt="" draggable="false" />
              </div>
            </div>
          </div>
        </div>

        <div className="layer ic ic-huella" data-z="60" data-depth="16">
          <div className="in">
            <div className="ic-mover">
              <img src={huella} alt="" draggable="false" />
            </div>
          </div>
        </div>
      </div>

      {abierta !== null && <Visor indice={abierta} onCerrar={cerrarVisor} onIr={ir} />}
    </div>,
    document.body
  );
}

// ---------------------------------------------------------
// Punto de entrada: escucha el clic en INLEC de Proyectos
// ---------------------------------------------------------
export default function Inlec() {
  const [abierto, setAbierto] = useState(false);
  const opener = useRef(null);

  useEffect(() => {
    const abrir = () => setAbierto(true);

    // Delegado en captura: cualquier ".pj-enlace" cuyo texto sea INLEC
    const clic = (e) => {
      const enlace = e.target.closest?.('.pj-enlace');
      if (!enlace) return;

      const texto = `${enlace.textContent || ''} ${enlace.getAttribute('aria-label') || ''}`;
      if (!/inlec/i.test(texto)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      opener.current = enlace;
      setAbierto(true);
    };

    window.addEventListener('abrir-inlec', abrir);
    document.addEventListener('click', clic, true);

    return () => {
      window.removeEventListener('abrir-inlec', abrir);
      document.removeEventListener('click', clic, true);
    };
  }, []);

  if (!abierto) return null;

  return (
    <Escena
      onCerrar={() => {
        setAbierto(false);
        opener.current?.focus?.();
      }}
    />
  );
}