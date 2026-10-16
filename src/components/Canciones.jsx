import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './canciones.css';

// ─────────────────────────────────────────────────────────────
// ⚠️ Ajusta estas 2 rutas a donde tengas tus imágenes (PNG con fondo transparente)
// ─────────────────────────────────────────────────────────────
import personaje from '../assets/personaje3.png'; // el muñeco (imagen 2)
import globo from '../assets/globo.png'; // el globo de diálogo vacío (imagen 3)
import stared from '../assets/starblue.png'; // estrella roja del botón de cerrar

// ─────────────────────────────────────────────────────────────
// Edita aquí tus canciones. El orden de esta lista es FIJO:
// Laferte siempre es la 02, aunque se desbloquee antes que Danse.
//  · id:         único, sin espacios
//  · portada:    opcional → import portada from '../assets/portada.png'
//  · significado: lo que significa la canción para ti
//  · pista:      se muestra mientras la canción está bloqueada
//  · nota:       lo que dice el personaje en la pantalla de "canción desbloqueada"
// ─────────────────────────────────────────────────────────────
const CANCIONES = [
  {
    id: 'danse',
    titulo: 'Danse',
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'La primera',
    reproducible: true, // suena con la música de fondo del portafolio
    portada: null,
    significado:
      'Escribe aquí qué significa esta canción para ti: cuándo la escuchaste por primera vez, qué te hace sentir, con quién la relacionas.',
    pista: 'Se desbloquea al conseguir 30 aciertos en el piano.',
    nota: '¡Eso! 30 aciertos en el piano y ya suena Danse. Esta es la primera canción de mi lista, escríbela aquí como quieras que la cuente el personaje.',
  },
  {
    id: 'laferte',
    titulo: 'Mon Laferte', // pon aquí el título real de la canción
    artista: 'Mon Laferte',
    anio: '2024',
    etiqueta: 'Para trabajar',
    portada: null,
    significado: 'Cuéntales por qué esta canción te acompaña cuando trabajas.',
    pista: 'Haz clic en el vinilo para descubrirla…',
    nota: 'Encontraste el vinilo. Esta es la que me acompaña cuando trabajo, cambia este texto por lo que quieras decir.',
  },
  {
    id: 'cry',
    titulo: 'Boy dont Cry', // pon aquí el título real
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'Reto de ritmo',
    portada: null,
    significado: 'Cuéntales qué significa esta canción para ti.',
    pista: 'Toca la nota musical en Sobre mí y consigue 50 aciertos.',
    nota: 'Reto de ritmo superado, 50 aciertos. Esta canción tiene su historia, cuéntala aquí con tus palabras.',
  },
];

// Canciones que se desbloquean solas con eventos de la página
const EVENTOS = {
  'musica-fondo': 'danse', // el piano la libera al llegar a 30 aciertos
};

// Notas flotando de fondo en la pantalla de desbloqueo
const NOTAS_FONDO = Array.from({ length: 16 }, (_, i) => ({
  simbolo: i % 3 === 0 ? '♫' : '♪',
  left: (i * 37) % 100,
  size: 22 + ((i * 13) % 34),
}));

function Candado() {
  return (
    <svg className="cn-lock" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" />
    </svg>
  );
}

function Disco({ portada, bloqueada, titulo, onClick, sonando }) {
  const clase = `cn-disc${bloqueada ? ' is-locked' : ' is-spinning'}`;

  const contenido =
    portada && !bloqueada ? (
      <img src={portada} alt={`Portada de ${titulo}`} />
    ) : (
      <span className="cn-disc__label">{bloqueada ? '?' : '♪'}</span>
    );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${clase} cn-disc--btn`}
        onClick={onClick}
        aria-label={sonando ? 'Pausar canción' : 'Reproducir canción'}
      >
        {contenido}
      </button>
    );
  }

  return <div className={clase}>{contenido}</div>;
}

// ─────────────────────────────────────────────────────────────
// Pantalla "mundo nuevo" que aparece al desbloquear una canción
// ─────────────────────────────────────────────────────────────
function MundoCancion({ cancion, numero, onCerrar }) {
  const raiz = useRef(null);
  const linea = useRef(null);
  const botonRef = useRef(null);
  const cerrando = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      linea.current = tl;

      // 1 · el mundo se abre como un círculo desde el centro
      tl.fromTo(
        '.cn-world__bg',
        { clipPath: 'circle(0% at 50% 55%)' },
        { clipPath: 'circle(150% at 50% 55%)', duration: 0.95, ease: 'power3.inOut' },
      )
        // 2 · cartel de canción desbloqueada
        .from(
          '.cn-world__banner',
          { y: -90, rotation: -6, opacity: 0, duration: 0.6, ease: 'back.out(2)' },
          '-=0.35',
        )
        // 3 · el personaje entra rebotando
        .from(
          '.cn-world__hero',
          { yPercent: 110, rotation: 12, duration: 1, ease: 'elastic.out(1, 0.6)' },
          '-=0.2',
        )
        // 4 · el globo sale desde la boca del personaje
        .fromTo(
          '.cn-world__bubble',
          { scale: 0, rotation: -5, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)' },
          '-=0.35',
        )
        // 5 · el texto aparece palabra por palabra
        .from('.cn-w', { y: 14, opacity: 0, stagger: 0.07, duration: 0.25, ease: 'power2.out' })
        // 6 · botón para continuar
        .from('.cn-world__go', { scale: 0, rotation: 8, duration: 0.45, ease: 'back.out(2.2)' }, '-=0.1');

      // El personaje "respira" todo el rato
      gsap.to('.cn-world__hero-inner', {
        y: -8,
        rotation: 1.6,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Notas musicales subiendo por el fondo
      gsap.utils.toArray('.cn-world__note').forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: '8vh', opacity: 0, rotation: gsap.utils.random(-25, 25) },
          {
            y: '-115vh',
            opacity: 0.55,
            rotation: gsap.utils.random(-40, 40),
            duration: gsap.utils.random(6, 11),
            delay: 0.6 + i * 0.35,
            repeat: -1,
            ease: 'none',
            keyframes: undefined,
          },
        );
      });

      // Pequeño temblor de "papel" en el globo
      gsap.to('.cn-world__bubble-img', {
        rotation: 0.6,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, raiz);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => botonRef.current?.focus(), 1800);
    return () => clearTimeout(t);
  }, []);

  // Clic en cualquier parte de la pantalla: se desvanece y se quita
  const cerrar = (e) => {
    e?.stopPropagation();
    if (cerrando.current) return;
    cerrando.current = true;
    linea.current?.pause();
    gsap.to(raiz.current, {
      opacity: 0,
      scale: 1.04,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: onCerrar,
    });
  };

  const palabras = cancion.nota.split(' ');

  return (
    <div
      ref={raiz}
      className="cn-world"
      role="alertdialog"
      aria-modal="true"
      aria-label={`Canción desbloqueada: ${cancion.titulo}`}
      onClick={cerrar}
    >
      {/* Fondo: azul + papel + puntos de cómic */}
      <div className="cn-world__bg" aria-hidden="true">
        <div className="cn-world__dots" />
        <div className="cn-world__paper" />
        <div className="cn-world__vignette" />
        {NOTAS_FONDO.map((n, i) => (
          <span
            key={i}
            className="cn-world__note"
            style={{ left: `${n.left}%`, fontSize: n.size }}
          >
            {n.simbolo}
          </span>
        ))}
      </div>

      <div className="cn-world__banner">
        <span aria-hidden="true">♪ </span>¡Canción desbloqueada!
        <strong>
          {String(numero).padStart(2, '0')} · {cancion.titulo}
        </strong>
      </div>

      <div className="cn-world__stage">
        <div className="cn-world__hero">
          <div className="cn-world__hero-inner">
            <img src={personaje} alt="" draggable="false" />
          </div>
        </div>

        <div className="cn-world__bubble">
          <img className="cn-world__bubble-img" src={globo} alt="" draggable="false" />
          <p className="cn-world__text">
            {palabras.map((p, i) => (
              <span key={i} className="cn-w">
                {p}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>

      <button ref={botonRef} type="button" className="cn-world__go" onClick={cerrar}>
        Continuar
      </button>
    </div>
  );
}

export default function Canciones() {
  // La lista empieza vacía en cada carga: al recargar la página se limpia
  const [abiertas, setAbiertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState(CANCIONES[0].id);
  const [sonando, setSonando] = useState(false);
  const [avisos, setAvisos] = useState([]); // cola de { id, n } → pantallas "canción desbloqueada"
  const abiertasRef = useRef(new Set());
  const avisoN = useRef(0);

  const aviso = avisos[0] || null; // el que se está mostrando ahora

  // Desbloquea una canción (solo dura esta visita)
  useEffect(() => {
    // Borra lo que versiones anteriores guardaron en el navegador
    try {
      localStorage.removeItem('portafolio-canciones');
      localStorage.removeItem('portafolio-musica-desbloqueada');
    } catch {
      /* sin almacenamiento */
    }

    const abrir = (id) => {
      if (!CANCIONES.some((c) => c.id === id)) return;

      // Solo avisa la primera vez que se desbloquea cada canción
      if (!abiertasRef.current.has(id)) {
        abiertasRef.current.add(id);
        setAbiertas((prev) => (prev.includes(id) ? prev : [...prev, id]));
        avisoN.current += 1;
        const n = avisoN.current;
        setAvisos((prev) => [...prev, { id, n }]);
      }

      setSeleccion(id);
    };

    const manejadores = Object.entries(EVENTOS).map(([evento, id]) => {
      const fn = () => abrir(id);
      window.addEventListener(evento, fn);
      return [evento, fn];
    });

    // Para desbloquear cualquiera desde otro lugar:
    // window.dispatchEvent(new CustomEvent('cancion-desbloqueada', { detail: { id: 'laferte' } }))
    const porId = (e) => abrir(e.detail?.id);
    window.addEventListener('cancion-desbloqueada', porId);

    return () => {
      manejadores.forEach(([evento, fn]) => window.removeEventListener(evento, fn));
      window.removeEventListener('cancion-desbloqueada', porId);
    };
  }, []);

  // Se entera de si la música de fondo suena (también cuando la pausa el reproductor de la página)
  useEffect(() => {
    const sincronizar = (e) => setSonando(Boolean(e.detail?.sonando));
    window.addEventListener('musica-fondo', sincronizar);
    window.addEventListener('musica-control', sincronizar);
    return () => {
      window.removeEventListener('musica-fondo', sincronizar);
      window.removeEventListener('musica-control', sincronizar);
    };
  }, []);

  // Reproduce / pausa la canción (la maneja el Cursor, que es quien tiene el audio)
  const alternar = () => {
    const siguiente = !sonando;
    setSonando(siguiente);
    window.dispatchEvent(new CustomEvent('musica-control', { detail: { sonando: siguiente } }));
  };

  // Escape cierra la ventana
  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [abierto]);

  const total = CANCIONES.length;
  const cuantas = CANCIONES.filter((c) => abiertas.includes(c.id)).length;
  const actual = CANCIONES.find((c) => c.id === seleccion) || CANCIONES[0];
  const bloqueada = !abiertas.includes(actual.id);
  const puedeSonar = !bloqueada && Boolean(actual.reproducible);

  const cancionAviso = aviso ? CANCIONES.find((c) => c.id === aviso.id) : null;

  return (
    <>
      <style>{`
        /* ───────── Pantalla "mundo nuevo" de canción desbloqueada ───────── */
        .cn-world {
          --o-azul: #1b6fe0;
          --o-oscuro: #0b2a7a;
          --o-fondo: #07226e;
          --o-cian: #2fd4ff;
          --o-oro: #ffd23f;
          --o-tinta: #2b1a1a;
          --o-titulo: "Titan", var(--font-title, "Arial Black"), sans-serif;
          --o-texto: "Smile", var(--font-body, system-ui), sans-serif;
          position: fixed;
          inset: 0;
          z-index: 10000; /* por debajo de la estrella del cursor (10001) */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          pointer-events: auto; /* la página tiene capas con pointer-events: none */
          font-family: var(--o-texto);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .cn-world *,
        .cn-world *::before,
        .cn-world *::after {
          -webkit-tap-highlight-color: transparent;
        }
        .cn-world__bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background:
            radial-gradient(circle, rgba(255, 255, 255, .12) 2px, transparent 2.5px) 0 0 / 22px 22px,
            linear-gradient(160deg, #0a3fd6, #1273ea 60%, #14a0ec);
        }
        /* aro que late detrás del personaje */
        .cn-world__dots {
          position: absolute;
          left: 50%;
          top: 58%;
          width: 62vmin;
          aspect-ratio: 1;
          margin: -31vmin 0 0 -31vmin;
          border: 5px solid rgba(255, 255, 255, .5);
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(11, 42, 122, .35);
          animation: cn-pulso 2.2s ease-out infinite;
        }
        @keyframes cn-pulso {
          0%   { transform: scale(.55); opacity: .9; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        /* textura de papel (ruido SVG) */
        .cn-world__paper {
          position: absolute;
          inset: 0;
          opacity: 0.35;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.15  0 0 0 0 0.2  0 0 0 0 0.4  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }
        .cn-world__vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 45%, rgba(5, 20, 70, 0.55) 100%);
        }
        .cn-world__note {
          position: absolute;
          bottom: -60px;
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--o-titulo);
          pointer-events: none;
          will-change: transform;
        }

        .cn-world__banner {
          position: absolute;
          top: clamp(14px, 4vh, 36px);
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          z-index: 3;
          padding: .55em 1.3em;
          background: var(--o-oro);
          color: var(--o-tinta);
          border: 3px solid var(--o-tinta);
          border-radius: 14px;
          box-shadow: 0 6px 0 rgba(43, 26, 26, .55), 0 14px 30px rgba(0, 0, 0, .25);
          font-family: var(--o-titulo);
          font-size: clamp(.9rem, 2.4vw, 1.4rem);
          line-height: 1.1;
          text-transform: uppercase;
          text-align: center;
          white-space: nowrap;
          pointer-events: none;
        }
        .cn-world__banner strong {
          display: block;
          width: fit-content;
          margin: .45em auto 0;
          padding: .25em .7em;
          border: 2px solid var(--o-tinta);
          border-radius: 999px;
          background: #fff;
          font-weight: 400;
          font-size: .62em;
        }

        /* escenario con la proporción de la referencia (732 × 575) */
        .cn-world__stage {
          position: relative;
          z-index: 2;
          width: min(94vw, 900px, calc(80vh * 732 / 575));
          aspect-ratio: 732 / 575;
          container-type: inline-size;
          pointer-events: none;
        }
        .cn-world__hero {
          position: absolute;
          left: 32%;
          top: 39%;
          width: 36%;
        }
        .cn-world__hero-inner img,
        .cn-world__bubble-img {
          display: block;
          width: 100%;
          height: auto;
          user-select: none;
        }
        .cn-world__hero-inner img {
          filter: drop-shadow(0 8px 10px rgba(5, 20, 70, 0.45));
        }
        .cn-world__bubble {
          position: absolute;
          left: 24%;
          top: 15%;
          width: 64%;
          transform-origin: 30% 100%; /* nace cerca de la boca del personaje */
        }
        .cn-world__bubble-img {
          filter: drop-shadow(4px 6px 0 rgba(5, 20, 70, 0.35));
        }
       /* el texto vive en la parte alta del globo, lejos de la cola */
.cn-world__text {
  position: absolute;
  left: 7%;
  top: 1%;
  width: 90%;
  height: 52%;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  font-family: var(--o-texto);
  font-weight: 400;
  font-size: 2.7cqw;
  line-height: 1.12;
  color: #1a1a1a;
  transform: rotate(3deg);
}
        .cn-w {
          display: inline-block;
          white-space: pre;
        }

        .cn-world__go {
          position: absolute;
          bottom: clamp(16px, 5vh, 44px);
          left: 50%;
          margin-left: -70px;
          width: 140px;
          z-index: 3;
          padding: .5em 0;
          background: var(--o-oro);
          color: var(--o-tinta);
          border: 3px solid var(--o-tinta);
          border-radius: 12px;
          box-shadow: 0 4px 0 var(--o-tinta);
          font-family: var(--o-titulo);
          font-size: clamp(1rem, 2.6vw, 1.35rem);
          text-transform: uppercase;
          cursor: pointer;
          pointer-events: auto;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cn-world__go:hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--o-tinta); }
        .cn-world__go:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--o-tinta); }
        .cn-world__go:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

        /* ───────── Botón de cerrar: solo la estrella roja ───────── */
        .cn-star-close {
          flex: none;
          display: block;
          width: clamp(44px, 6vw, 64px);
          padding: 0;
          border: 0;
          border-radius: 0;
          background: none;
          box-shadow: none;
          cursor: pointer;
          pointer-events: auto;
          transition: transform .25s cubic-bezier(.34, 1.56, .64, 1), filter .25s;
        }
        .cn-star-close img {
          display: block;
          width: 100%;
          height: auto;
          pointer-events: none;
          user-select: none;
        }
        .cn-star-close:hover,
        .cn-star-close:focus-visible {
          transform: scale(1.15) rotate(20deg);
          outline: none;
        }
        .cn-star-close:active { transform: scale(.9) rotate(-10deg); }
      `}</style>

      {cancionAviso && (
        <MundoCancion
          key={aviso.n}
          cancion={cancionAviso}
          numero={CANCIONES.indexOf(cancionAviso) + 1}
          onCerrar={() => setAvisos((prev) => prev.slice(1))}
        />
      )}

      <button
        type="button"
        className="cn-fab"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
      >
        <span aria-hidden="true">♪</span>
        Mis canciones
        <span className="cn-fab__count">
          {cuantas}/{total}
        </span>
      </button>

      {abierto && (
        <div
          className="cn-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <section className="cn" role="dialog" aria-modal="true" aria-label="Mis canciones" data-piano="true">
            <header className="cn-head">
              <h2 className="cn-title">Mis canciones</h2>

              <div className="cn-meter" role="img" aria-label={`${cuantas} de ${total} canciones`}>
                <span className="cn-meter__count">
                  {cuantas}/{total}
                </span>
                <span className="cn-meter__track">
                  <span className="cn-meter__fill" style={{ width: `${(cuantas / total) * 100}%` }} />
                </span>
              </div>

              {/* La estrella roja ES el botón: sin fondo, borde ni sombra */}
              <button
                type="button"
                className="cn-star-close"
                aria-label="Cerrar"
                onClick={() => setAbierto(false)}
              >
                <img src={stared} alt="" aria-hidden="true" draggable="false" />
              </button>
            </header>

            <div className="cn-body">
              {/* Lista de canciones */}
              <ul className="cn-list">
                {CANCIONES.map((c, i) => {
                  const cerrada = !abiertas.includes(c.id);
                  const activa = c.id === actual.id;

                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`cn-item${activa ? ' is-active' : ''}${cerrada ? ' is-locked' : ''}`}
                        aria-current={activa ? 'true' : undefined}
                        onClick={() => setSeleccion(c.id)}
                      >
                        <span className="cn-item__num">{String(i + 1).padStart(2, '0')}</span>

                        <span className="cn-item__text">
                          <span className="cn-item__name">{cerrada ? '???' : c.titulo}</span>
                          <span className="cn-item__artist">{cerrada ? 'Canción bloqueada' : c.artista}</span>
                        </span>

                        {cerrada && <Candado />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Detalle */}
              <article className="cn-detail" aria-live="polite">
                <div className="cn-detail__top">
                  <Disco
                    portada={actual.portada}
                    bloqueada={bloqueada}
                    titulo={actual.titulo}
                    sonando={sonando}
                    onClick={puedeSonar ? alternar : undefined}
                  />

                  <div className="cn-detail__info">
                    <h3 className="cn-detail__name">{bloqueada ? '???' : actual.titulo}</h3>
                    <p className="cn-detail__artist">{bloqueada ? 'Artista desconocido' : actual.artista}</p>

                    {!bloqueada && (
                      <div className="cn-tags">
                        <span className="cn-tag">{actual.anio}</span>
                        <span className="cn-tag cn-tag--gold">{actual.etiqueta}</span>
                      </div>
                    )}

                    {puedeSonar && (
                      <button type="button" className="cn-play" aria-pressed={sonando} onClick={alternar}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {sonando ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
                        </svg>
                        {sonando ? 'Pausar' : 'Escuchar'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="cn-note">
                  <span className="cn-note__label">
                    {bloqueada ? 'Pista' : '¿Qué significa para mí?'}
                  </span>
                  <p>{bloqueada ? actual.pista : actual.significado}</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
}