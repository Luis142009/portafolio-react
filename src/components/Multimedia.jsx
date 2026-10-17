// =========================================================
// ESCENA 3 · MULTIMEDIA  (con animaciones GSAP)
// Se renderiza dentro de <div className="frame frame--multimedia">
// en Hero.jsx, así comparte el contenedor 3D (capas .layer con
// data-z / data-depth) y el tilt con el mouse.
//
// NOTA: GSAP anima el div interno ".in" y la <img>, NUNCA el
// ".layer", porque Hero.jsx ya usa el transform del .layer para
// la profundidad y el tilt del mouse.
//
// IMPORTANTE: nombres de los archivos de ../assets.
// Si alguno no coincide con el tuyo, cámbialo SOLO en este bloque.
// =========================================================
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import hojamultimedia from '../assets/seccion3.png'; // hoja azul rasgada con estrellas
import globo from '../assets/nota3.png'; // forma blanca con la cola hacia abajo
import nota from '../assets/musica.png'; // nota musical rosa
import multimedia from '../assets/multimedia.png'; // título "Multimedia"
import estrellaazul from '../assets/starblue.png'; // estrella azul
import marco from '../assets/hoja5.png'; // marco blanco (Web / Video)
import web from '../assets/web.png'; // título "Web"
import video from '../assets/video.png'; // título "Video"
import herramientasweb from '../assets/herrraweb.png'; // VS Code, React, WordPress
import herramientasvideo from '../assets/herravideo.png'; // Premiere, CapCut
import radio from '../assets/bafle.png'; // boombox
import clave from '../assets/partitura.png'; // clave de sol
import luisestrella from '../assets/personaje5.png'; // Luis sentado en la estrella
import Violin from './Violin.jsx';
import '../stylesheets/Multimedia.css';

// Profundidad (data-z). El globo va POR ENCIMA de Luis.
// Si el globo tapa más de lo que quieres, baja GLOBO_Z (y el z-index en el CSS).
const GLOBO_Z = 70;
const LUIS_Z = 60;
// Nota, título y estrella van por ENCIMA del globo
const ARRIBA_Z = 80;

const TEXTO_WEB = 'Conocimientos que complementan mi trabajo creativo';
const TEXTO_VIDEO = 'Programas para la edición y creacion de videos y contenido multimedia';

// Nivel de cada barra (0–100) y centro vertical de cada ícono
// dentro de su imagen apilada (en %), para alinear la barra con su ícono.
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

// Párrafo que GSAP "escribe". Los spans arrancan vacíos y los llena el efecto.
function Escribir({ texto }) {
  return (
    <p aria-label={texto} data-texto={texto}>
      <span className="tw-v" aria-hidden="true" />
      <span className="tw-caret" aria-hidden="true" />
      <span className="tw-h" aria-hidden="true" />
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

// ---------- Helpers de animación ----------

// Escribe el texto de un <p> (data-texto) letra por letra. Devuelve el tween.
function escribir(p, vel = 0.032) {
  const v = p.querySelector('.tw-v');
  const h = p.querySelector('.tw-h');
  const caret = p.querySelector('.tw-caret');
  const texto = p.dataset.texto || '';
  const o = { i: 0 };
  v.textContent = '';
  h.textContent = texto; // el texto restante queda invisible: el layout no salta
  const tween = gsap.to(o, {
    i: texto.length,
    duration: Math.max(0.4, texto.length * vel),
    ease: 'none',
    onStart: () => gsap.set(caret, { autoAlpha: 1 }),
    onUpdate: () => {
      const n = Math.round(o.i);
      v.textContent = texto.slice(0, n);
      h.textContent = texto.slice(n);
    },
    onComplete: () => gsap.to(caret, { autoAlpha: 0, duration: 0.3, delay: 1.2 }),
  });
  p._tw = tween;
  return tween;
}

const gelatina = (el) =>
  gsap
    .timeline()
    .to(el, { scaleX: 1.25, scaleY: 0.75, duration: 0.12 })
    .to(el, { scaleX: 0.85, scaleY: 1.15, duration: 0.12 })
    .to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' });

const bambolear = (el, origen = '50% 50%', fuerza = 1) =>
  gsap
    .timeline()
    .set(el, { transformOrigin: origen })
    .to(el, { rotation: -18 * fuerza, duration: 0.1 })
    .to(el, { rotation: 14 * fuerza, duration: 0.12 })
    .to(el, { rotation: 0, duration: 0.8, ease: 'elastic.out(1,.3)' });

export default function Multimedia() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const q = gsap.utils.selector(root);
    const textos = q('.mm-desc p');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Movimiento reducido: texto completo, sin animaciones
    if (reduce) {
      textos.forEach((p) => {
        p.querySelector('.tw-v').textContent = p.dataset.texto;
        p.querySelector('.tw-h').textContent = '';
      });
      return undefined;
    }

    let listo = false; // la intro terminó -> ya se puede hacer click
    const off = [];

    const ctx = gsap.context((self) => {
      const globoIn = q('.mm-globo .in');
      const tituloIn = q('.mm-titulo .in');
      const notaIn = q('.mm-nota .in');
      const estrellaIn = q('.mm-estrella .in');
      const marcos = q('.mm-marco .in'); // [web, video]
      const tits = q('.mm-tit .in'); // [web, video]
      const iconos = q('.mm-tools__icons'); // [web, video]
      const barras = q('.mm-bar');
      const fills = q('.mm-bar__fill');
      const radioIn = q('.mm-radio .in');
      const claveIn = q('.mm-clave .in');
      const luisIn = q('.mm-luis .in')[0];

      // ---------- Estado inicial (todo oculto, antes de pintar) ----------
      textos.forEach((p) => {
        p.querySelector('.tw-v').textContent = '';
        p.querySelector('.tw-h').textContent = p.dataset.texto;
      });
      gsap.set(globoIn, { autoAlpha: 0, scale: 0, transformOrigin: '50% 85%' });
      gsap.set(tituloIn, { autoAlpha: 0, y: -40, scale: 0.6 });
      gsap.set([notaIn, estrellaIn], { autoAlpha: 0, scale: 0, rotation: -120 });
      gsap.set(marcos, { autoAlpha: 0, x: (i) => (i ? 160 : -160) });
      gsap.set(tits, { autoAlpha: 0, scale: 0.4 });
      gsap.set(iconos, { autoAlpha: 0, x: (i) => (i ? 60 : -60) });
      gsap.set(barras, { autoAlpha: 0 });
      gsap.set(fills, { width: '0%' });
      gsap.set([radioIn, claveIn], { autoAlpha: 0, y: 80, scale: 0.6 });
      gsap.set(luisIn, { autoAlpha: 0, yPercent: 140, transformOrigin: '50% 70%' });

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

      // ---------- Movimiento suave de reposo ----------
      self.add('reposo', () => {
        const suave = { duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 };
        gsap.to(q('.mm-nota img'), { yPercent: -7, ...suave });
        gsap.to(q('.mm-estrella img'), { rotation: 8, scale: 1.06, ...suave, duration: 1.8 });
        gsap.set(q('.mm-clave img'), { transformOrigin: '50% 0%' });
        gsap.fromTo(q('.mm-clave img'), { rotation: -7 }, { rotation: 7, ...suave, duration: 1.6 });
        gsap.set(q('.mm-radio img'), { transformOrigin: '50% 100%' });
        gsap.to(q('.mm-radio img'), { scaleY: 1.025, ...suave, duration: 0.9 });
        gsap.to(q('.mm-luis img'), { yPercent: -3, ...suave, duration: 2 });
      });

      // ---------- Intro: el globo entra primero ----------
      self.add('intro', () => {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            listo = true;
            ctx.reposo();
          },
        });

        tl.to(globoIn, { autoAlpha: 1, scale: 1, duration: 1, ease: 'back.out(1.7)' })
          .to(tituloIn, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' }, '-=0.35')
          .to(
            [notaIn, estrellaIn],
            { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.12 },
            '-=0.4'
          )
          .to(marcos, { autoAlpha: 1, x: 0, duration: 0.8 }, '-=0.2')
          .to(tits, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.1 }, '-=0.4')
          .add('tipeo', '-=0.1')
          .add(escribir(textos[0]), 'tipeo')
          .add(escribir(textos[1]), 'tipeo')
          .to(iconos, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.15 }, 'tipeo+=0.4')
          .add('cargar', 'tipeo+=0.9')
          .to(barras, { autoAlpha: 1, duration: 0.3, stagger: 0.1 }, 'cargar')
          .add(llenar(fills), 'cargar+=0.2')
          .to(
            [radioIn, claveIn],
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.15 },
            'cargar+=0.4'
          )
          // Luis sube desde abajo
          .to(luisIn, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'back.out(1.4)' }, 'cargar+=1');
      });

      // ---------- Clicks ----------
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

      // Nota musical: se bambolea y salen notas
      onClick('.mm-nota .in', 'Nota musical', (el) => {
        if (!libre(el)) return;
        bambolear(el, '50% 80%', 1.2);
      });

      // Estrella: giro completo + chispas
      onClick('.mm-estrella .in', 'Estrella', (el) => {
        if (!libre(el)) return;
        gsap
          .timeline()
          .to(el, { rotation: '+=360', scale: 1.35, duration: 0.7, ease: 'back.inOut(2)' })
          .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' });
      });

      // Clave de sol (partitura): su click abre el juego del violín (<Violin>)

      // Radio: late al ritmo y suelta notas
      onClick('.mm-radio .in', 'Radio', (el) => {
        if (!libre(el)) return;
        gsap.set(el, { transformOrigin: '50% 100%' });
        gsap
          .timeline({ repeat: 5 })
          .to(el, { scaleX: 1.07, scaleY: 0.9, duration: 0.14, ease: 'power2.out' })
          .to(el, { scale: 1, duration: 0.2, ease: 'power2.in' });
      });

      // Títulos: gelatina
      onClick('.mm-titulo .in', 'Título Multimedia', (el) => {
        if (libre(el)) gelatina(el);
      });
      onClick('.mm-tit--web .in', 'Web', (el) => {
        if (libre(el)) gelatina(el);
      });
      onClick('.mm-tit--video .in', 'Video', (el) => {
        if (libre(el)) gelatina(el);
      });

      // Herramientas: las barras se vuelven a cargar
      onClick('.mm-tools .in', 'Volver a cargar las barras', (el) => {
        const f = el.querySelectorAll('.mm-bar__fill');
        if ([...f].some((x) => gsap.isTweening(x))) return;
        llenar(f);
        gsap.fromTo(
          el.querySelector('.mm-tools__icons'),
          { y: 0 },
          { y: -10, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.out' }
        );
      });

      // Descripciones: se vuelven a escribir
      onClick('.mm-desc .in', 'Volver a escribir el texto', (el) => {
        const p = el.querySelector('p');
        if (p._tw && p._tw.isActive()) return;
        escribir(p);
      });

      // Luis: voltereta
      onClick('.mm-luis .in', 'Luis', (el) => {
        if (!libre(el)) return;
        gsap.set(el, { transformOrigin: '50% 70%' });
        gsap
          .timeline()
          .to(el, { scaleX: 1.1, scaleY: 0.86, duration: 0.14, ease: 'power2.out' })
          .to(el, { yPercent: -28, scaleX: 0.94, scaleY: 1.1, rotation: 360, duration: 0.55, ease: 'power2.out' })
          .set(el, { rotation: 0 })
          .to(el, { yPercent: 0, scaleX: 1.12, scaleY: 0.88, duration: 0.3, ease: 'bounce.out' })
          .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' });
      });
    }, root);

    // La intro arranca cuando la escena entra en pantalla
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          ctx.intro();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      off.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <div className="mm" ref={rootRef}>
      <Capa clase="mm-papel" z={-60} depth={8}>
        <img src={hojamultimedia} alt="" draggable="false" />
      </Capa>

      {/* El globo: entra primero y va POR ENCIMA de Luis */}
      <Capa clase="mm-globo" z={GLOBO_Z} depth={10}>
        <img src={globo} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-nota clicky" z={ARRIBA_Z} depth={24}>
        <img src={nota} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-titulo clicky" z={ARRIBA_Z} depth={26}>
        <img src={multimedia} alt="Multimedia" draggable="false" />
      </Capa>

      <Capa clase="mm-estrella clicky" z={ARRIBA_Z} depth={22}>
        <img src={estrellaazul} alt="" draggable="false" />
      </Capa>

      {/* Panel izquierdo: WEB */}
      <Capa clase="mm-marco mm-marco--web" z={-10} depth={12}>
        <img src={marco} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-tit mm-tit--web clicky" z={20} depth={18}>
        <img src={web} alt="Web" draggable="false" />
      </Capa>

      <Capa clase="mm-desc mm-desc--web clicky" z={18} depth={16}>
        <Escribir texto={TEXTO_WEB} />
      </Capa>

      <Capa clase="mm-tools mm-tools--web clicky" z={24} depth={20}>
        <img
          className="mm-tools__icons"
          src={herramientasweb}
          alt="Visual Studio Code, React y WordPress"
          draggable="false"
        />
        <Barras items={WEB} />
      </Capa>

      <Capa clase="mm-radio clicky" z={28} depth={24}>
        <img src={radio} alt="" draggable="false" />
      </Capa>

      {/* Panel derecho: VIDEO */}
      <Capa clase="mm-marco mm-marco--video" z={-10} depth={12}>
        <img src={marco} alt="" draggable="false" />
      </Capa>

      <Capa clase="mm-tit mm-tit--video clicky" z={20} depth={18}>
        <img src={video} alt="Video" draggable="false" />
      </Capa>

      <Capa clase="mm-desc mm-desc--video clicky" z={18} depth={16}>
        <Escribir texto={TEXTO_VIDEO} />
      </Capa>

      <Capa clase="mm-tools mm-tools--video clicky" z={24} depth={20}>
        <img
          className="mm-tools__icons"
          src={herramientasvideo}
          alt="Adobe Premiere Pro y CapCut"
          draggable="false"
        />
        <Barras items={VIDEO} />
      </Capa>

      {/* Partitura: al darle click se abre el juego del violín */}
      <Capa clase="mm-clave clicky" z={28} depth={24}>
        <Violin>
          <img src={clave} alt="" draggable="false" />
        </Violin>
      </Capa>

      {/* Luis sentado en la estrella */}
      <Capa clase="mm-luis clicky" z={LUIS_Z} depth={30}>
        <img src={luisestrella} alt="Luis sentado sobre una estrella" draggable="false" />
      </Capa>
    </div>
  );
}