import { useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import '../stylesheets/Proyectos.css';

import fondo from '../assets/seccion4.png';
import circulo from '../assets/circulo.png';
import titulo from '../assets/proyectos.png';
import personaje from '../assets/personaje7.png';
import bafleAzul from '../assets/bafleblue.png';
import bafleRojo from '../assets/baflered.png';
import fuegoIzq from '../assets/fuego.png';
import fuegoDer from '../assets/fuegode.png';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------
// ESCENA 4: PROYECTOS
//
// Se renderiza DENTRO de <div className="frame frame--projects">
// del Hero. No lleva contenedor propio: cada pieza es una
// ".layer" con su ".in", igual que Multimedia, así comparte
// el tilt 3D, la cámara y la entrada con el scroll.
//
// Capas (de atrás hacia adelante, según data-z):
//   fondo → círculo → FUEGO (decorativo, quieto) → BAFLES →
//   RED DE ARAÑA (hilos) → RAYOS con los proyectos → DJ
//
// Los proyectos NACEN del cuerpo del DJ: cada barra ("rayo") parte
// del mismo punto (ORIGEN) y se abre en abanico hacia afuera, en
// perspectiva 3D. Entre los rayos hay hilos que forman una red
// de araña. El DJ queda por delante, así que los rayos parecen
// salir de detrás de su cuerpo.
// ---------------------------------------------------------

// Para cambiar los proyectos edita estas dos listas
// (texto, href y, si quieres, azul: true para el rayo azul).
const IZQUIERDA = [{ texto: 'Reproductor', href: '#' }];

const DERECHA = [
  { texto: 'Inlec', href: '#' },
  { texto: 'starbuck', href: '#', azul: true },
  { texto: 'onikuma', href: '#' },
];

// ---------------------------------------------------------
// GEOMETRÍA (px de referencia; el lienzo mide 597 de ancho)
//
// ORIGEN  = punto del cuerpo del DJ de donde nacen todos los rayos.
//           Muévelo si el DJ cambia de lugar.
// ang     = dirección del rayo en grados. Derecha: negativo = sube.
//           Izquierda: positivo = sube.
// largo   = longitud del rayo (se ve ~25% más largo por la perspectiva)
// alto    = grosor del rayo en su extremo exterior
// z       = qué tanto flota el texto delante del rayo
//
// Los rayos se asignan en orden: el 1.º de cada lista de arriba
// usa la 1.ª configuración de abajo, y así.
// ---------------------------------------------------------
const ORIGEN = { x: 300, y: 462 };

const RAYOS_IZQ = [{ ang: 13, largo: 305, alto: 62, z: 30 }];

const RAYOS_DER = [
  { ang: -40, largo: 305, alto: 76, z: 34 },
  { ang: -24, largo: 300, alto: 58, z: 22 },
  { ang: -9, largo: 290, alto: 58, z: 38 },
];

// Red de araña: hilos extra (sin texto), en grados de pantalla
// (0 = derecha, -90 = arriba, 180 = izquierda)
const HILOS_EXTRA = [-148, -125, -102, -80, -60, 14];

// Distancias (desde el origen) donde van los hilos que unen los rayos
const RADIOS_RED = [70, 120, 175, 235, 300, 365];

const CIELO = 170;   // los hilos no suben más de este punto
const SUELO = 640;   // ni bajan más de este
const HILO_MAX = 340;

// ---------- cálculo de la red (se hace una sola vez) ----------

const aRad = (g) => (g * Math.PI) / 180;

// Dirección de pantalla de cada rayo con texto
const angulosRayos = [
  ...RAYOS_IZQ.map((r) => {
    let g = 180 + r.ang;
    if (g > 180) g -= 360;
    return g;
  }),
  ...RAYOS_DER.map((r) => r.ang),
];

const angulosRed = [...angulosRayos, ...HILOS_EXTRA].sort((a, b) => a - b);

function largoHilo(g) {
  const dx = Math.cos(aRad(g));
  const dy = Math.sin(aRad(g));
  let t = HILO_MAX;

  if (dx > 1e-6) t = Math.min(t, (597 - ORIGEN.x) / dx);
  if (dx < -1e-6) t = Math.min(t, (0 - ORIGEN.x) / dx);
  if (dy < -1e-6) t = Math.min(t, (CIELO - ORIGEN.y) / dy);
  if (dy > 1e-6) t = Math.min(t, (SUELO - ORIGEN.y) / dy);

  return t;
}

const HILOS = angulosRed.map((g) => {
  const len = largoHilo(g);
  return {
    g,
    len,
    x: ORIGEN.x + len * Math.cos(aRad(g)),
    y: ORIGEN.y + len * Math.sin(aRad(g)),
  };
});

// Hilos "de captura": curvas que se hunden hacia el centro y unen
// cada par de hilos vecinos, como los de una telaraña de verdad.
const ARCOS = [];

for (let i = 0; i < HILOS.length - 1; i += 1) {
  const a = HILOS[i];
  const b = HILOS[i + 1];
  const delta = aRad(b.g - a.g);
  const medio = aRad((a.g + b.g) / 2);

  RADIOS_RED.forEach((r) => {
    if (r > Math.min(a.len, b.len) * 0.97) return;

    const p1 = [
      ORIGEN.x + r * Math.cos(aRad(a.g)),
      ORIGEN.y + r * Math.sin(aRad(a.g)),
    ];
    const p2 = [
      ORIGEN.x + r * Math.cos(aRad(b.g)),
      ORIGEN.y + r * Math.sin(aRad(b.g)),
    ];

    // punto de control: más cerca del centro que la cuerda (se "cuelga")
    const rc = r * Math.cos(delta / 2) * 0.86;
    const c = [ORIGEN.x + rc * Math.cos(medio), ORIGEN.y + rc * Math.sin(medio)];

    ARCOS.push(
      `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    );
  });
}

// ---------------------------------------------------------

function Enlace({ texto, href = '#', ...resto }) {
  return (
    <a
      className="pj-enlace"
      href={href}
      data-no-sonar="true"
      onClick={(e) => {
        // con href="#" no saltes al inicio de la página
        if (href === '#') e.preventDefault();
      }}
      {...resto}
    >
      {texto}
    </a>
  );
}

// Un rayo = forma negra (con grosor) + enlace flotando delante
function Rayo({ lado, proyecto, config }) {
  const { texto, href, azul } = proyecto;

  return (
    <div
      className={
        'pj-rayo pj-rayo--' + lado + (azul ? ' pj-rayo--azul' : '')
      }
      style={{
        '--ox': ORIGEN.x,
        '--oy': ORIGEN.y,
        '--largo': config.largo,
        '--h': config.alto,
        '--ang': `${config.ang}deg`,
      }}
    >
      <span className="pj-rayo__forma" aria-hidden="true" />
      <Enlace texto={texto} href={href} style={{ '--z': config.z }} />
    </div>
  );
}

const configDe = (lista, i) => lista[Math.min(i, lista.length - 1)];

export default function Proyectos({ izquierda = IZQUIERDA, derecha = DERECHA }) {
  // ---------------------------------------------------------
  // APARICIÓN TIPO VIDEOJUEGO: la telaraña sale del DJ
  //
  // Cuando la escena entra en pantalla:
  //   1. Los hilos radiales se disparan desde el cuerpo del DJ
  //      hacia afuera (como lanzar telaraña).
  //   2. Los rayos se estiran desde el DJ hasta su largo completo,
  //      con un pequeño rebote.
  //   3. Los hilos que los unen se tejen, de adentro hacia afuera.
  //   4. Los bafles rebotan y cada proyecto aparece con barrido
  //      "pixelado" (pasos, como un menú de arcade).
  // El FUEGO no se anima: es decoración y se queda quieto.
  // Al salir de pantalla se reinicia, así se repite al volver.
  //
  // Solo anima hilos, formas, enlaces y bafles (no el ".in" de cada
  // capa, que ya lo anima el Hero con el scroll).
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (reduce) return undefined;

    const ctx = gsap.context(() => {
      const q = (sel) => gsap.utils.toArray(`.frame--projects ${sel}`);

      const hilos = q('.pj-red__hilos path');
      const arcos = q('.pj-red__arcos path');
      const formas = q('.pj-rayo__forma');
      const linksIzq = q('.pj-rayo--izq .pj-enlace');
      const linksDer = q('.pj-rayo--der .pj-enlace');
      const bafles = q('.pj-bafle .in img');

      if (!formas.length) return;

      const tl = gsap.timeline({ paused: true });

      // 1) Hilos radiales: salen del cuerpo del DJ hacia afuera
      tl.fromTo(
        hilos,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.03,
          clearProps: 'strokeDasharray,strokeDashoffset',
        },
        0
      )

        // 2) Los rayos se estiran desde el DJ (cada uno desde su raíz)
        .fromTo(
          formas,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.55,
            ease: 'back.out(1.7)',
            stagger: 0.09,
            clearProps: 'transform',
          },
          0.12
        )

        // 3) Hilos de captura: se tejen de adentro hacia afuera
        .fromTo(
          arcos,
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 0.35,
            ease: 'power1.out',
            stagger: 0.025,
            clearProps: 'strokeDasharray,strokeDashoffset',
          },
          0.35
        )

        // 4a) Los bafles rebotan con el golpe
        .fromTo(
          bafles,
          { y: 16 },
          { y: 0, duration: 0.6, ease: 'bounce.out', stagger: 0.12 },
          0.5
        )

        // 4b) Los proyectos aparecen con barrido pixelado, uno por uno
        //     (solo opacidad + barrido: el transform del enlace lleva
        //     su profundidad 3D y no se toca)
        .fromTo(
          linksIzq,
          { clipPath: 'inset(-20% 100% -20% -10%)', opacity: 0 },
          {
            clipPath: 'inset(-20% -10% -20% -10%)',
            opacity: 1,
            duration: 0.42,
            ease: 'steps(6)',
            stagger: 0.16,
            clearProps: 'clipPath,opacity',
          },
          0.6
        )
        .fromTo(
          linksDer,
          { clipPath: 'inset(-20% 100% -20% -10%)', opacity: 0 },
          {
            clipPath: 'inset(-20% -10% -20% -10%)',
            opacity: 1,
            duration: 0.42,
            ease: 'steps(6)',
            stagger: 0.18,
            clearProps: 'clipPath,opacity',
          },
          0.78
        );

      // Se dispara cuando un rayo entra bien en pantalla
      // (mide la posición real, así funciona con la cámara 3D del Hero)
      const objetivo = document.querySelector('.frame--projects .pj-rayo--der');
      if (!objetivo || typeof IntersectionObserver === 'undefined') {
        tl.progress(1);
        return;
      }

      let jugado = false;

      const io = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((e) => {
            if (e.intersectionRatio >= 0.6 && !jugado) {
              jugado = true;
              tl.restart();
            } else if (!e.isIntersecting && jugado) {
              jugado = false;
              tl.pause(0);
            }
          });
        },
        { threshold: [0, 0.6] }
      );

      io.observe(objetivo);

      return () => io.disconnect();
    });

    return () => ctx.revert();
  }, []);

  // Movimiento continuo (solo las imágenes internas, no toca el .in
  // que anima el Hero al hacer scroll). El fuego NO se mueve.
  useEffect(() => {
    if (reduce) return undefined;

    const ctx = gsap.context(() => {
      gsap.to('.frame--projects .pj-bafle--azul .in img', {
        scale: 1.05,
        transformOrigin: '50% 100%',
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.frame--projects .pj-bafle--rojo .in img', {
        scale: 1.05,
        transformOrigin: '50% 100%',
        duration: 0.5,
        delay: 0.25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.frame--projects .pj-personaje .in img', {
        y: -8,
        rotation: 1,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.frame--projects .pj-circulo .in img', {
        scale: 1.03,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="layer pj pj-fondo" data-z="0" data-depth="4">
        <div className="in">
          <img src={fondo} alt="" draggable="false" />
        </div>
      </div>

      <div className="layer pj pj-titulo" data-z="32" data-depth="16">
        <div className="in">
          <img src={titulo} alt="Proyectos" draggable="false" />
        </div>
      </div>

      <div className="layer pj pj-circulo" data-z="6" data-depth="8">
        <div className="in">
          <img src={circulo} alt="" draggable="false" />
        </div>
      </div>

      {/* FUEGO: solo decoración, quieto, detrás de los bafles */}
      <div className="layer pj pj-fuego pj-fuego--izq" data-z="8" data-depth="10">
        <div className="in">
          <img src={fuegoIzq} alt="" draggable="false" />
        </div>
      </div>

      <div className="layer pj pj-fuego pj-fuego--der" data-z="8" data-depth="10">
        <div className="in">
          <img src={fuegoDer} alt="" draggable="false" />
        </div>
      </div>

      {/* Bafles (detrás del DJ) */}
      <div className="layer pj pj-bafle pj-bafle--azul" data-z="16" data-depth="30">
        <div className="in">
          <img src={bafleAzul} alt="" draggable="false" />
        </div>
      </div>

      <div className="layer pj pj-bafle pj-bafle--rojo" data-z="16" data-depth="30">
        <div className="in">
          <img src={bafleRojo} alt="" draggable="false" />
        </div>
      </div>

      {/* RED DE ARAÑA: hilos que parten del cuerpo del DJ */}
      <div className="layer pj pj-red" data-z="17" data-depth="14" aria-hidden="true">
        <div className="in">
          <svg className="pj-red__svg" viewBox="0 0 597 881" focusable="false">
            <g className="pj-red__hilos">
              {HILOS.map((h) => (
                <path
                  key={h.g}
                  d={`M${ORIGEN.x} ${ORIGEN.y}L${h.x.toFixed(1)} ${h.y.toFixed(1)}`}
                  pathLength="1"
                />
              ))}
            </g>
            <g className="pj-red__arcos">
              {ARCOS.map((d) => (
                <path key={d} d={d} pathLength="1" />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* RAYOS con los proyectos: nacen del cuerpo del DJ */}
      <div className="layer pj pj-rayos" data-z="18" data-depth="12">
        <div className="in">
          <nav className="pj-rayos__nav" aria-label="Proyectos">
            {izquierda.map((p, i) => (
              <Rayo key={p.texto} lado="izq" proyecto={p} config={configDe(RAYOS_IZQ, i)} />
            ))}
            {derecha.map((p, i) => (
              <Rayo key={p.texto} lado="der" proyecto={p} config={configDe(RAYOS_DER, i)} />
            ))}
          </nav>
        </div>
      </div>

      <div className="layer pj pj-personaje" data-z="20" data-depth="24">
        <div className="in">
          <img
            src={personaje}
            alt="Luis como DJ, con la mesa de mezclas Speak / Die"
            draggable="false"
          />
        </div>
      </div>
    </>
  );
}