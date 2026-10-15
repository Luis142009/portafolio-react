import { useEffect, useState } from 'react';
import './canciones.css';

// ─────────────────────────────────────────────────────────────
// Edita aquí tus canciones.
//  · id:         único, sin espacios
//  · portada:    opcional → import portada from '../assets/portada.png'
//  · significado: lo que significa la canción para ti
//  · pista:      se muestra mientras la canción está bloqueada
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
  },
  {
    id: 'cancion-2',
    titulo: 'Segunda canción',
    artista: 'Artista aquí',
    anio: '2025',
    etiqueta: 'Para trabajar',
    portada: null,
    significado: 'Cuéntales por qué esta canción te acompaña cuando trabajas.',
    pista: 'Aún no la has encontrado…',
  },
  {
    id: 'cancion-3',
    titulo: 'Tercera canción',
    artista: 'Artista aquí',
    anio: '2023',
    etiqueta: 'Nostalgia',
    portada: null,
    significado: 'Un recuerdo, una época, una persona. Lo que quieras contar.',
    pista: 'Aún no la has encontrado…',
  },
];

// Canciones que se desbloquean solas con eventos de la página
const EVENTOS = {
  'musica-fondo': 'danse', // el piano la libera al llegar a 30 aciertos
};

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

export default function Canciones() {
  // La lista empieza vacía en cada carga: al recargar la página se limpia
  const [abiertas, setAbiertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState(CANCIONES[0].id);
  const [sonando, setSonando] = useState(false);

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
      setAbiertas((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setSeleccion(id);
    };

    const manejadores = Object.entries(EVENTOS).map(([evento, id]) => {
      const fn = () => abrir(id);
      window.addEventListener(evento, fn);
      return [evento, fn];
    });

    // Para desbloquear cualquiera desde otro lugar:
    // window.dispatchEvent(new CustomEvent('cancion-desbloqueada', { detail: { id: 'cancion-2' } }))
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

  return (
    <>
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

        <button
          type="button"
          className="cn-close"
          aria-label="Cerrar"
          onClick={() => setAbierto(false)}
        >
          ✕
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