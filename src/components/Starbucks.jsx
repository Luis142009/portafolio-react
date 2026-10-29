import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../stylesheets/Starbucks.css';

// ⚠️ Ajusta la extensión (.png / .jpg / .webp) a la de tus archivos.
import nostalgia from '../assets/nostalgia.png';
import felicidad from '../assets/felicidad.png';
import tristeza from '../assets/tristeza.png';
import alegria from '../assets/alegria.png';
import amor from '../assets/amor.png';

// Texto que explica el proyecto. Edítalo a tu gusto.
const TEXTO_RETO =
  'Esta campaña fue solo un reto de clase: un ejercicio para practicar diseño de posts. No es un trabajo real para Starbucks.';

// Para agregar o quitar posts solo toca esta lista.
const POSTS = [
  { id: 'nostalgia', titulo: 'Superación', src: nostalgia },
  { id: 'felicidad', titulo: 'Felicidad', src: felicidad },
  { id: 'tristeza', titulo: 'Nostalgia', src: tristeza },
  { id: 'alegria', titulo: 'Orgullo', src: alegria },
  { id: 'amor', titulo: 'Pertenencia', src: amor },
];

const N = POSTS.length;
const DRAG_UMBRAL = 40; // px mínimos para contar como swipe

// Distancia circular más corta entre dos índices (el carrusel da la vuelta)
const offsetDe = (i, activo) => {
  let d = i - activo;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
};

// ---------------------------------------------------------
// RECORTE AUTOMÁTICO
//
// Si la imagen del post trae margen (blanco o transparente) alrededor, el
// cuadro se vería más grande que el post. Aquí se detecta el contenido real
// y se recorta, así el cuadro le queda justo al post.
// Devuelve la URL de la imagen recortada, o null si no hizo falta / falló.
// ---------------------------------------------------------
function recortar(src) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;

        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const d = ctx.getImageData(0, 0, w, h).data;

        // Un píxel es "margen" si es transparente o blanco puro
        const margen = (i) =>
          d[i + 3] < 24 || (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250);

        const col = new Uint32Array(w);
        const fila = new Uint32Array(h);

        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            if (!margen((y * w + x) * 4)) {
              col[x] += 1;
              fila[y] += 1;
            }
          }
        }

        // Cuenta como contenido una columna/fila con al menos 4% de píxeles
        // reales (ignora motas sueltas)
        const minCol = h * 0.04;
        const minFila = w * 0.04;

        let x0 = 0;
        let x1 = w - 1;
        let y0 = 0;
        let y1 = h - 1;

        while (x0 < x1 && col[x0] < minCol) x0 += 1;
        while (x1 > x0 && col[x1] < minCol) x1 -= 1;
        while (y0 < y1 && fila[y0] < minFila) y0 += 1;
        while (y1 > y0 && fila[y1] < minFila) y1 -= 1;

        const cw = x1 - x0 + 1;
        const ch = y1 - y0 + 1;

        // Sin margen que quitar, o recorte absurdo: se deja la imagen tal cual
        const sinCambio = cw >= w - 2 && ch >= h - 2;
        const absurdo = cw < w * 0.2 || ch < h * 0.2;

        if (sinCambio || absurdo) {
          resolve(null);
          return;
        }

        const out = document.createElement('canvas');
        out.width = cw;
        out.height = ch;
        out.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);

        out.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
      } catch (error) {
        resolve(null);
      }
    };

    img.src = src;
  });
}

// ---------------------------------------------------------
// ESPACIO DE STARBUCKS
//
// Igual que Inlec: al hacer clic en "starbuck" (Proyectos) se abre un
// espacio propio a pantalla completa, sin salir de la página.
//
//   · Clic en un post de los lados → pasa al centro.
//   · Clic en el post del centro   → se abre grande para verlo bien.
//
// Se cierra con "Volver" o con Esc (si hay un post grande, Esc cierra
// primero el post). Va en un portal (document.body) para no heredar el 3D
// del Hero.
// ---------------------------------------------------------
export default function Starbucks({ abierto, onCerrar }) {
  const [activo, setActivo] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [dx, setDx] = useState(0);
  const [ampliado, setAmpliado] = useState(false);
  const [recortes, setRecortes] = useState({}); // id → url recortada
  const [listo, setListo] = useState(false);

  const raiz = useRef(null);
  const ampRef = useRef(false);
  const recortado = useRef(false);
  const urls = useRef([]);
  const drag = useRef({ x0: 0, dx: 0, activo: false, movio: false, id: null });

  const ampliar = useCallback((v) => {
    ampRef.current = v;
    setAmpliado(v);
  }, []);

  const ir = useCallback((i) => setActivo(((i % N) + N) % N), []);
  const sig = useCallback(() => setActivo((a) => (a + 1) % N), []);
  const ant = useCallback(() => setActivo((a) => (a - 1 + N) % N), []);

  // Recorta los márgenes de los posts (una sola vez, la primera vez que se abre)
  useEffect(() => {
    if (!abierto || recortado.current) return;
    recortado.current = true;

    let vivo = true;

    Promise.all(POSTS.map((p) => recortar(p.src))).then((res) => {
      if (!vivo) return;

      const mapa = {};
      res.forEach((url, i) => {
        if (url) {
          mapa[POSTS[i].id] = url;
          urls.current.push(url);
        }
      });

      setRecortes(mapa);
      setListo(true);
    });

    return () => {
      vivo = false;
    };
  }, [abierto]);

  // Libera las imágenes recortadas al desmontar
  useEffect(
    () => () => {
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    },
    []
  );

  // Al abrir: empieza en el primer post, enfoca el espacio y devuelve el foco al cerrar
  useEffect(() => {
    if (!abierto) return undefined;

    const previo = document.activeElement;
    setActivo(0);
    ampliar(false);
    raiz.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (ampRef.current) ampliar(false);
        else onCerrar();
      } else if (e.key === 'ArrowRight') sig();
      else if (e.key === 'ArrowLeft') ant();
    };

    // La rueda del ratón no debe mover la página que está detrás
    const bloquear = (e) => e.preventDefault();
    const el = raiz.current;

    window.addEventListener('keydown', onKey);
    el?.addEventListener('wheel', bloquear, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKey);
      el?.removeEventListener('wheel', bloquear);
      previo?.focus?.();
    };
  }, [abierto, onCerrar, sig, ant, ampliar]);

  // --- Arrastrar / swipe (ratón y dedo) ---
  // El "pointer capture" se activa solo cuando de verdad se arrastra: si se
  // activara al presionar, el clic sobre un post dejaría de llegarle.
  const onDown = (e) => {
    drag.current = { x0: e.clientX, dx: 0, activo: true, movio: false, id: e.pointerId };
    setArrastrando(true);
  };

  const onMove = (e) => {
    if (!drag.current.activo) return;

    const d = e.clientX - drag.current.x0;
    drag.current.dx = d;

    if (!drag.current.movio && Math.abs(d) > 6) {
      drag.current.movio = true;
      e.currentTarget.setPointerCapture?.(drag.current.id);
    }

    setDx(d);
  };

  const onUp = () => {
    if (!drag.current.activo) return;

    const d = drag.current.dx;
    drag.current.activo = false;
    setArrastrando(false);
    setDx(0);

    if (d <= -DRAG_UMBRAL) sig();
    else if (d >= DRAG_UMBRAL) ant();
  };

  // Lado → al centro. Centro → grande.
  const onCardClick = (i, off) => {
    if (drag.current.movio) return;
    if (off !== 0) ir(i);
    else ampliar(true);
  };

  if (!abierto) return null;

  const srcDe = (p) => recortes[p.id] || p.src;
  const actual = POSTS[activo];

  return createPortal(
    <div
      className="stx"
      ref={raiz}
      role="dialog"
      aria-modal="true"
      aria-label="Starbucks"
      tabIndex={-1}
      data-no-sonar="true"
    >
      <button type="button" className="stx__volver" onClick={onCerrar}>
        <span aria-hidden="true">×</span> Volver
      </button>

      <header className="stx__cabecera">
        <h2 className="stx__titulo">Starbucks</h2>
        <p className="stx__reto">{TEXTO_RETO}</p>
        <p className="stx__sub">Toca un post para verlo grande</p>
      </header>

      <div
        className={'stx__stage' + (arrastrando ? ' is-drag' : '') + (listo ? ' is-listo' : '')}
        style={{ '--drag': `${arrastrando ? dx * 0.35 : 0}px` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-roledescription="carrusel"
      >
        {POSTS.map((p, i) => {
          const off = offsetDe(i, activo);
          const abs = Math.abs(off);

          return (
            <figure
              key={p.id}
              className={'stx__card' + (off === 0 ? ' is-active' : '')}
              aria-hidden={off !== 0}
              aria-label={`${p.titulo}, post ${i + 1} de ${N}`}
              onClick={() => onCardClick(i, off)}
              style={{
                '--off': off,
                '--abs': abs,
                zIndex: 10 - abs,
                opacity: abs <= 2 ? 1 - abs * 0.3 : 0,
                pointerEvents: abs <= 2 ? 'auto' : 'none',
              }}
            >
              <img src={srcDe(p)} alt={`Post de Starbucks: ${p.titulo}`} draggable="false" />
            </figure>
          );
        })}
      </div>

      <div className="stx__controls">
        <button type="button" className="stx__btn" onClick={ant} aria-label="Post anterior">
          ‹
        </button>

        <div className="stx__info" aria-live="polite">
          <span className="stx__nombre">{actual.titulo}</span>
          <div className="stx__dots" role="tablist" aria-label="Elegir post">
            {POSTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === activo}
                aria-label={p.titulo}
                className={'stx__dot' + (i === activo ? ' is-on' : '')}
                onClick={() => ir(i)}
              />
            ))}
          </div>
        </div>

        <button type="button" className="stx__btn" onClick={sig} aria-label="Post siguiente">
          ›
        </button>
      </div>

      {/* Post en grande */}
      {ampliado && (
        <div
          className="stx__zoom"
          role="dialog"
          aria-modal="true"
          aria-label={`${actual.titulo}, ampliado`}
          onClick={() => ampliar(false)}
        >
          <button
            type="button"
            className="stx__zoom-cerrar"
            onClick={() => ampliar(false)}
            aria-label="Cerrar vista ampliada"
          >
            ×
          </button>

          <button
            type="button"
            className="stx__btn stx__zoom-flecha stx__zoom-flecha--izq"
            onClick={(e) => {
              e.stopPropagation();
              ant();
            }}
            aria-label="Post anterior"
          >
            ‹
          </button>

          <img
            className="stx__zoom-img"
            src={srcDe(actual)}
            alt={`Post de Starbucks: ${actual.titulo}`}
            draggable="false"
          />

          <button
            type="button"
            className="stx__btn stx__zoom-flecha stx__zoom-flecha--der"
            onClick={(e) => {
              e.stopPropagation();
              sig();
            }}
            aria-label="Post siguiente"
          >
            ›
          </button>

          <span className="stx__zoom-nombre">{actual.titulo}</span>
        </div>
      )}
    </div>,
    document.body
  );
}