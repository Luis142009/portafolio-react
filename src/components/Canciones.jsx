import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './canciones.css';

import personaje from '../assets/personaje3.png';
import globo from '../assets/globo.png';
import stared from '../assets/starblue.png';

import monLaferteAudio from '../assets/laferte.mp3';
import boyDontCryAudio from '../assets/cry.mp3';
import expectationsAudio from '../assets/expectations.mp3';
import cancion06Audio from '../assets/quien.mp3';
import cyberpunkAudio from '../assets/Cyberpunk.mp3';

// ============================================================
// LISTA DE CANCIONES
// ============================================================

const CANCIONES = [
  {
    id: 'danse',
    titulo: 'Danse',
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'La primera',
    reproducible: true,
    tipoReproduccion: 'fondo',
    audioSrc: null,
    portada: null,
    significado: 'Escribe aquí qué significa esta canción para ti.',
    pista: 'Se desbloquea al conseguir 30 aciertos en el piano.',
    nota: '¡Eso! 30 aciertos en el piano y ya suena Danse. Esta es la primera canción de mi lista.',
  },
  {
    id: 'laferte',
    titulo: 'Mon Laferte',
    artista: 'Mon Laferte',
    anio: '2024',
    etiqueta: 'Para trabajar',
    reproducible: true,
    tipoReproduccion: 'archivo',
    audioSrc: monLaferteAudio,
    portada: null,
    significado: 'Cuéntales por qué esta canción te acompaña cuando trabajas.',
    pista: 'Haz clic en el vinilo para descubrirla…',
    nota: 'Encontraste el vinilo. Esta es la que me acompaña cuando trabajo.',
  },
  {
    id: 'cry',
    titulo: 'Boy dont Cry',
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'Reto de ritmo',
    reproducible: true,
    tipoReproduccion: 'archivo',
    audioSrc: boyDontCryAudio,
    portada: null,
    significado: 'Cuéntales qué significa esta canción para ti.',
    pista: 'Toca la nota musical en Sobre mí y consigue 50 aciertos.',
    nota: 'Reto de ritmo superado, 50 aciertos. Esta canción tiene su historia.',
  },
  {
    id: 'expectations',
    titulo: 'Expectations',
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'Reto del violín',
    reproducible: true,
    tipoReproduccion: 'archivo',
    audioSrc: expectationsAudio,
    portada: null,
    significado: 'Escribe aquí qué significa esta canción para ti.',
    pista: 'Toca la partitura en Multimedia y consigue 40 aciertos en el violín.',
    nota: '¡40 notas en el violín! Expectations desbloqueada.',
  },
  {
    id: 'cyberpunk',
    titulo: 'Cyberpunk',
    artista: 'Cyberpunk',
    anio: '2026',
    etiqueta: 'Modo nocturno',
    reproducible: true,
    tipoReproduccion: 'archivo',
    audioSrc: cyberpunkAudio,
    portada: null,
    significado: 'Una canción para entrar en otro mundo y disfrutar de su energía.',
    pista: 'Haz clic en el bafle de Multimedia para descubrirla.',
    nota: '¡Cyberpunk desbloqueado! Entra en el modo nocturno y disfruta de esta canción.',
  },
  {
    id: 'song6',
    titulo: 'Canción 06',
    artista: 'Artista aquí',
    anio: '2024',
    etiqueta: 'La última',
    reproducible: true,
    tipoReproduccion: 'archivo',
    audioSrc: cancion06Audio,
    portada: null,
    significado: 'Escribe aquí qué significa esta canción para ti.',
    pista: 'Esta canción todavía está bloqueada.',
    nota: '¡Llegaste a la última canción!',
  },
];

const NOTAS_FONDO = Array.from({ length: 16 }, (_, i) => ({
  simbolo: i % 3 === 0 ? '♫' : '♪',
  left: (i * 37) % 100,
  size: 22 + ((i * 13) % 34),
}));

// ============================================================
// EVENTOS
// ============================================================

function emitirEstadoVinilo(sonando, id) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('vinilo-estado', {
      detail: { sonando: Boolean(sonando), id },
    }),
  );
}

function emitirControlDanse(sonando) {
  window.dispatchEvent(
    new CustomEvent('musica-control', {
      detail: { sonando: Boolean(sonando) },
    }),
  );
}

// ============================================================
// CANDADO
// ============================================================

function Candado() {
  return (
    <svg className="cn-lock" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" />
    </svg>
  );
}

// ============================================================
// DISCO
// ============================================================

function Disco({ portada, bloqueada, titulo, onClick, sonando }) {
  const estado = bloqueada
    ? 'is-locked'
    : sonando
      ? 'is-spinning'
      : 'is-paused';

  const contenido =
    portada && !bloqueada ? (
      <img src={portada} alt={`Portada de ${titulo}`} />
    ) : (
      <span className="cn-disc__label">{bloqueada ? '?' : '♪'}</span>
    );

  if (onClick && !bloqueada) {
    return (
      <button
        type="button"
        className={`cn-disc ${estado} cn-disc--btn`}
        onClick={onClick}
        aria-label={`${sonando ? 'Pausar' : 'Reproducir'} ${titulo}`}
        aria-pressed={sonando}
        title={sonando ? 'Pausar canción' : 'Reproducir canción'}
      >
        {contenido}
      </button>
    );
  }

  return (
    <div className={`cn-disc ${estado}`} aria-label={bloqueada ? 'Canción bloqueada' : titulo}>
      {contenido}
    </div>
  );
}

// ============================================================
// PANTALLA ANIMADA DE CANCIÓN DESBLOQUEADA
// ============================================================

function MundoCancion({ cancion, numero, onCerrar }) {
  const raiz = useRef(null);
  const botonRef = useRef(null);
  const cerrando = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline()
        .fromTo(
          '.cn-world__bg',
          { clipPath: 'circle(0% at 50% 55%)' },
          {
            clipPath: 'circle(150% at 50% 55%)',
            duration: 0.95,
            ease: 'power3.inOut',
          },
        )
        .from(
          '.cn-world__banner',
          {
            y: -90,
            rotation: -6,
            opacity: 0,
            duration: 0.6,
            ease: 'back.out(2)',
          },
          '-=0.35',
        )
        .from(
          '.cn-world__hero',
          {
            yPercent: 110,
            rotation: 12,
            duration: 1,
            ease: 'elastic.out(1, 0.6)',
          },
          '-=0.2',
        )
        .fromTo(
          '.cn-world__bubble',
          { scale: 0, rotation: -5, opacity: 0 },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(1.8)',
          },
          '-=0.35',
        )
        .from('.cn-w', {
          y: 14,
          opacity: 0,
          stagger: 0.07,
          duration: 0.25,
          ease: 'power2.out',
        })
        .from(
          '.cn-world__go',
          {
            scale: 0,
            rotation: 8,
            duration: 0.45,
            ease: 'back.out(2.2)',
          },
          '-=0.1',
        );

      gsap.to('.cn-world__hero-inner', {
        y: -8,
        rotation: 1.6,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.utils.toArray('.cn-world__note').forEach((el, i) => {
        gsap.fromTo(
          el,
          {
            y: '8vh',
            opacity: 0,
            rotation: gsap.utils.random(-25, 25),
          },
          {
            y: '-115vh',
            opacity: 0.55,
            rotation: gsap.utils.random(-40, 40),
            duration: gsap.utils.random(6, 11),
            delay: 0.6 + i * 0.35,
            repeat: -1,
            ease: 'none',
          },
        );
      });

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
    const timer = setTimeout(() => botonRef.current?.focus(), 1800);
    return () => clearTimeout(timer);
  }, []);

  const cerrar = (e) => {
    e?.stopPropagation();

    if (cerrando.current) return;
    cerrando.current = true;

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
        <span aria-hidden="true">♪ </span>
        ¡Canción desbloqueada!
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

      <button
        ref={botonRef}
        type="button"
        className="cn-world__go"
        onClick={cerrar}
      >
        Continuar
      </button>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Canciones() {
  const [abiertas, setAbiertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState('danse');
  const [sonando, setSonando] = useState(false);
  const [reproduciendoId, setReproduciendoId] = useState(null);
  const [errorAudio, setErrorAudio] = useState('');
  const [avisos, setAvisos] = useState([]);

  const abiertasRef = useRef(new Set());
  const avisoN = useRef(0);

  // ÚNICA instancia de audio para todas las canciones locales.
  const audioRef = useRef(null);
  const audioCancionRef = useRef(null);

  const seleccionRef = useRef(seleccion);
  const sonandoRef = useRef(sonando);
  const alternarRef = useRef(null);
  const alternarPorIdRef = useRef(null);
  const manejarViniloRef = useRef(null);
  const solicitudRef = useRef(0);

  seleccionRef.current = seleccion;
  sonandoRef.current = sonando;

  const aviso = avisos[0] || null;
  const actual = CANCIONES.find((c) => c.id === seleccion) || CANCIONES[0];
  const bloqueada = !abiertas.includes(actual.id);
  const puedeSonar = !bloqueada && Boolean(actual.reproducible);

  const actualSonando =
    actual.tipoReproduccion === 'fondo'
      ? sonando
      : reproduciendoId === actual.id;

  // ----------------------------------------------------------
  // DESBLOQUEAR Y SELECCIONAR
  // ----------------------------------------------------------

  const abrirCancion = useCallback((id, seleccionar = true) => {
    if (!CANCIONES.some((c) => c.id === id)) return false;

    if (!abiertasRef.current.has(id)) {
      abiertasRef.current.add(id);

      setAbiertas((prev) => (prev.includes(id) ? prev : [...prev, id]));

      avisoN.current += 1;
      setAvisos((prev) => [...prev, { id, n: avisoN.current }]);
    }

    if (seleccionar) {
      seleccionRef.current = id;
      setSeleccion(id);
    }

    return true;
  }, []);

  // ----------------------------------------------------------
  // SINCRONIZAR DANSE Y DESBLOQUEOS
  // ----------------------------------------------------------

  useEffect(() => {
    const onDesbloqueada = (e) => {
      const id = e.detail?.id;
      if (id) abrirCancion(id);
    };

    const onMusicaFondo = (e) => {
      abrirCancion('danse');

      const estado =
        typeof e.detail?.sonando === 'boolean' ? e.detail.sonando : true;

      sonandoRef.current = estado;
      setSonando(estado);
      emitirEstadoVinilo(estado, 'danse');
    };

    const onMusicaControl = (e) => {
      if (typeof e.detail?.sonando !== 'boolean') return;

      const estado = e.detail.sonando;
      sonandoRef.current = estado;
      setSonando(estado);

      if (seleccionRef.current === 'danse') {
        emitirEstadoVinilo(estado, 'danse');
      }
    };

    window.addEventListener('cancion-desbloqueada', onDesbloqueada);
    window.addEventListener('musica-fondo', onMusicaFondo);
    window.addEventListener('musica-control', onMusicaControl);

    return () => {
      window.removeEventListener('cancion-desbloqueada', onDesbloqueada);
      window.removeEventListener('musica-fondo', onMusicaFondo);
      window.removeEventListener('musica-control', onMusicaControl);
    };
  }, [abrirCancion]);

  // ----------------------------------------------------------
  // DETENER EL AUDIO LOCAL SIN DEJAR REPRODUCCIONES ACTIVAS
  // ----------------------------------------------------------

  const detenerAudioArchivo = useCallback(() => {
    // Invalida cualquier play() que siga pendiente.
    solicitudRef.current += 1;

    const audio = audioRef.current;
    const idAnterior = audioCancionRef.current;

    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    }

    audioRef.current = null;
    audioCancionRef.current = null;

    setReproduciendoId(null);

    if (idAnterior) {
      emitirEstadoVinilo(false, idAnterior);
    }
  }, []);

  // ----------------------------------------------------------
  // SELECCIONAR CANCIÓN
  // ----------------------------------------------------------

  const seleccionarCancion = (id) => {
    if (!CANCIONES.some((c) => c.id === id)) return;

    if (audioCancionRef.current && audioCancionRef.current !== id) {
      detenerAudioArchivo();
    }

    if (id !== 'danse') {
      // Avisar al reproductor de Danse para que se detenga.
      emitirControlDanse(false);

      sonandoRef.current = false;
      setSonando(false);
      emitirEstadoVinilo(false, 'danse');
    }

    setErrorAudio('');
    seleccionRef.current = id;
    setSeleccion(id);
  };

  // ----------------------------------------------------------
  // REPRODUCIR UNA CANCIÓN LOCAL
  // ----------------------------------------------------------

  const iniciarAudioArchivo = async (cancion) => {
    if (!cancion?.audioSrc) {
      setErrorAudio(`Falta configurar el audio de ${cancion?.titulo || 'esta canción'}.`);
      return;
    }

    // La nueva pista sustituye por completo a la anterior.
    detenerAudioArchivo();

    const solicitud = ++solicitudRef.current;

    sonandoRef.current = false;
    setSonando(false);

    emitirControlDanse(false);
    emitirEstadoVinilo(false, 'danse');

    const audio = new Audio(cancion.audioSrc);
    audio.preload = 'auto';

    // Todas las pistas locales comparten esta misma referencia.
    audioRef.current = audio;
    audioCancionRef.current = cancion.id;

    audio.onended = () => {
      if (audioRef.current !== audio) return;

      audioRef.current = null;
      audioCancionRef.current = null;

      setReproduciendoId(null);
      emitirEstadoVinilo(false, cancion.id);
    };

    audio.onerror = () => {
      if (audioRef.current !== audio) return;

      audioRef.current = null;
      audioCancionRef.current = null;

      setReproduciendoId(null);
      emitirEstadoVinilo(false, cancion.id);
      setErrorAudio(`No se pudo cargar ${cancion.titulo}. Revisa la ruta de su MP3.`);
    };

    try {
      await audio.play();

      // Si el usuario cambió de canción mientras play() esperaba,
      // no actualizar el estado con una pista que ya no es la actual.
      if (
        audioRef.current !== audio ||
        solicitudRef.current !== solicitud
      ) {
        audio.pause();
        return;
      }

      setReproduciendoId(cancion.id);
      emitirEstadoVinilo(true, cancion.id);
    } catch (error) {
      if (audioRef.current !== audio) return;

      audio.pause();
      audioRef.current = null;
      audioCancionRef.current = null;

      setReproduciendoId(null);
      emitirEstadoVinilo(false, cancion.id);
      setErrorAudio(`No se pudo reproducir ${cancion.titulo}. Revisa su archivo MP3.`);

      console.error(`Error al reproducir ${cancion.titulo}:`, error);
    }
  };

  // ----------------------------------------------------------
  // REPRODUCIR / PAUSAR / REANUDAR UNA CANCIÓN POR ID
  // ----------------------------------------------------------

  const alternarPorId = async (id) => {
    const cancion = CANCIONES.find((c) => c.id === id);
    if (!cancion || !cancion.reproducible) return;

    abrirCancion(id);

    seleccionRef.current = id;
    setSeleccion(id);
    setErrorAudio('');

    // Danse utiliza el reproductor de fondo externo.
    if (cancion.tipoReproduccion === 'fondo') {
      detenerAudioArchivo();

      const siguiente = !sonandoRef.current;
      sonandoRef.current = siguiente;
      setSonando(siguiente);

      emitirControlDanse(siguiente);
      emitirEstadoVinilo(siguiente, id);
      return;
    }

    const audioActual = audioRef.current;
    const mismoAudio = audioCancionRef.current === id;

    if (audioActual && mismoAudio) {
      if (!audioActual.paused && !audioActual.ended) {
        audioActual.pause();
        setReproduciendoId(null);
        emitirEstadoVinilo(false, id);
        return;
      }

      const solicitud = ++solicitudRef.current;

      try {
        await audioActual.play();

        if (
          audioRef.current === audioActual &&
          solicitudRef.current === solicitud
        ) {
          setReproduciendoId(id);
          emitirEstadoVinilo(true, id);
        } else {
          audioActual.pause();
        }
      } catch (error) {
        if (audioRef.current !== audioActual) return;

        setReproduciendoId(null);
        emitirEstadoVinilo(false, id);
        setErrorAudio(`No se pudo reanudar ${cancion.titulo}.`);

        console.error(`Error al reanudar ${cancion.titulo}:`, error);
      }

      return;
    }

    await iniciarAudioArchivo(cancion);
  };

  alternarPorIdRef.current = alternarPorId;

  const alternar = async () => {
    if (bloqueada || !actual.reproducible) return;
    await alternarPorIdRef.current?.(actual.id);
  };

  alternarRef.current = alternar;

  // ----------------------------------------------------------
  // EVENTO DEL BAFLE: CYBERPUNK (canción 05)
  // ----------------------------------------------------------

  useEffect(() => {
    const onBafle = () => {
      alternarPorIdRef.current?.('cyberpunk');
    };

    window.addEventListener('cyberpunk-bafle-toggle', onBafle);

    return () => {
      window.removeEventListener('cyberpunk-bafle-toggle', onBafle);
    };
  }, []);

  // ----------------------------------------------------------
  // EVENTO DEL VIOLÍN: AL EMPEZAR LA PARTIDA SE CALLA TODO
  // ----------------------------------------------------------

  useEffect(() => {
    const onViolin = () => {
      detenerAudioArchivo();

      if (sonandoRef.current) {
        emitirControlDanse(false);
        sonandoRef.current = false;
        setSonando(false);
        emitirEstadoVinilo(false, 'danse');
      }
    };

    window.addEventListener('violin-juego', onViolin);

    return () => {
      window.removeEventListener('violin-juego', onViolin);
    };
  }, [detenerAudioArchivo]);

  // ----------------------------------------------------------
  // VINILO GRANDE DE HERO
  // Pausa lo que esté sonando (sea cual sea la canción) y,
  // si no suena nada, reproduce la seleccionada.
  // ----------------------------------------------------------

  manejarViniloRef.current = () => {
    // 1) Si suena un MP3 local, el vinilo lo pausa (sea cual sea).
    if (audioRef.current && !audioRef.current.paused) {
      alternarPorIdRef.current?.(audioCancionRef.current);
      return;
    }

    // 2) Si suena Danse, el vinilo la pausa.
    if (sonandoRef.current) {
      alternarPorIdRef.current?.('danse');
      return;
    }

    // 3) Si no suena nada, reproduce la seleccionada (si está desbloqueada).
    const id = seleccionRef.current;

    if (abiertasRef.current.has(id)) {
      alternarPorIdRef.current?.(id);
      return;
    }

    // 4) Si la selección sigue bloqueada, el vinilo descubre Mon Laferte.
    abrirCancion('laferte');

    seleccionRef.current = 'laferte';
    setSeleccion('laferte');
    setErrorAudio('');

    void iniciarAudioArchivo(CANCIONES.find((c) => c.id === 'laferte'));
  };

  useEffect(() => {
    const api = {
      owner: audioRef,
      toggle: () => manejarViniloRef.current?.(),
      playId: (id) => alternarPorIdRef.current?.(id),
    };

    window.__portafolioCancionesVinilo = api;

    return () => {
      if (window.__portafolioCancionesVinilo === api) {
        delete window.__portafolioCancionesVinilo;
      }
    };
  }, []);

  // ----------------------------------------------------------
  // LIMPIEZA AL DESMONTAR
  // ----------------------------------------------------------

  useEffect(() => {
    return () => {
      solicitudRef.current += 1;

      const audio = audioRef.current;

      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.currentTime = 0;
      }

      const id = audioCancionRef.current;

      audioRef.current = null;
      audioCancionRef.current = null;

      if (id) emitirEstadoVinilo(false, id);

      if (
        typeof window !== 'undefined' &&
        window.__portafolioCancionesVinilo?.owner === audioRef
      ) {
        delete window.__portafolioCancionesVinilo;
      }
    };
  }, []);

  // ----------------------------------------------------------
  // CERRAR MODAL CON ESCAPE
  // ----------------------------------------------------------

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [abierto]);

  // ----------------------------------------------------------
  // DATOS PARA LA INTERFAZ
  // ----------------------------------------------------------

  const total = CANCIONES.length;
  const cuantas = CANCIONES.filter((c) => abiertas.includes(c.id)).length;

  const cancionAviso = aviso
    ? CANCIONES.find((c) => c.id === aviso.id)
    : null;

  // ----------------------------------------------------------
  // INTERFAZ
  // ----------------------------------------------------------

  return (
    <>
      <style>{`
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
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          pointer-events: auto;
          font-family: var(--o-texto);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .cn-world *, .cn-world *::before, .cn-world *::after {
          -webkit-tap-highlight-color: transparent;
        }

        .cn-world__bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background:
            radial-gradient(circle, rgba(255,255,255,.12) 2px, transparent 2.5px) 0 0 / 22px 22px,
            linear-gradient(160deg, #0a3fd6, #1273ea 60%, #14a0ec);
        }

        .cn-world__dots {
          position: absolute;
          left: 50%;
          top: 58%;
          width: 62vmin;
          aspect-ratio: 1;
          margin: -31vmin 0 0 -31vmin;
          border: 5px solid rgba(255,255,255,.5);
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(11,42,122,.35);
          animation: cn-pulso 2.2s ease-out infinite;
        }

        @keyframes cn-pulso {
          0% { transform: scale(.55); opacity: .9; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .cn-world__paper {
          position: absolute;
          inset: 0;
          opacity: .35;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.15 0 0 0 0 0.2 0 0 0 0 0.4 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }

        .cn-world__vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 45%, rgba(5,20,70,.55) 100%);
        }

        .cn-world__note {
          position: absolute;
          bottom: -60px;
          color: rgba(255,255,255,.5);
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
          box-shadow: 0 6px 0 rgba(43,26,26,.55), 0 14px 30px rgba(0,0,0,.25);
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

        .cn-world__hero-inner img, .cn-world__bubble-img {
          display: block;
          width: 100%;
          height: auto;
          user-select: none;
        }

        .cn-world__hero-inner img {
          filter: drop-shadow(0 8px 10px rgba(5,20,70,.45));
        }

        .cn-world__bubble {
          position: absolute;
          left: 24%;
          top: 15%;
          width: 64%;
          transform-origin: 30% 100%;
        }

        .cn-world__bubble-img {
          filter: drop-shadow(4px 6px 0 rgba(5,20,70,.35));
        }

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

        .cn-w { display: inline-block; white-space: pre; }

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
          transition: transform .15s, box-shadow .15s;
        }

        .cn-world__go:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 var(--o-tinta);
        }

        .cn-world__go:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 var(--o-tinta);
        }

        .cn-world__go:focus-visible {
          outline: 3px solid #fff;
          outline-offset: 3px;
        }

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
          transition: transform .25s cubic-bezier(.34,1.56,.64,1), filter .25s;
        }

        .cn-star-close img {
          display: block;
          width: 100%;
          height: auto;
          pointer-events: none;
          user-select: none;
        }

        .cn-star-close:hover, .cn-star-close:focus-visible {
          transform: scale(1.15) rotate(20deg);
          outline: none;
        }

        .cn-star-close:active {
          transform: scale(.9) rotate(-10deg);
        }
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
        <span className="cn-fab__count">{cuantas}/{total}</span>
      </button>

      {abierto && (
        <div
          className="cn-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <section
            className="cn"
            role="dialog"
            aria-modal="true"
            aria-label="Mis canciones"
            data-piano="true"
          >
            <header className="cn-head">
              <h2 className="cn-title">Mis canciones</h2>

              <div
                className="cn-meter"
                role="img"
                aria-label={`${cuantas} de ${total} canciones`}
              >
                <span className="cn-meter__count">{cuantas}/{total}</span>
                <span className="cn-meter__track">
                  <span
                    className="cn-meter__fill"
                    style={{ width: `${(cuantas / total) * 100}%` }}
                  />
                </span>
              </div>

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
                        onClick={() => seleccionarCancion(c.id)}
                      >
                        <span className="cn-item__num">
                          {String(i + 1).padStart(2, '0')}
                        </span>

                        <span className="cn-item__text">
                          <span className="cn-item__name">
                            {cerrada ? '???' : c.titulo}
                          </span>
                          <span className="cn-item__artist">
                            {cerrada ? 'Canción bloqueada' : c.artista}
                          </span>
                        </span>

                        {cerrada && <Candado />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <article className="cn-detail" aria-live="polite">
                <div className="cn-detail__top">
                  <Disco
                    portada={actual.portada}
                    bloqueada={bloqueada}
                    titulo={actual.titulo}
                    sonando={actualSonando}
                    onClick={puedeSonar ? alternar : undefined}
                  />

                  <div className="cn-detail__info">
                    <h3 className="cn-detail__name">
                      {bloqueada ? '???' : actual.titulo}
                    </h3>

                    <p className="cn-detail__artist">
                      {bloqueada ? 'Artista desconocido' : actual.artista}
                    </p>

                    {!bloqueada && (
                      <div className="cn-tags">
                        <span className="cn-tag">{actual.anio}</span>
                        <span className="cn-tag cn-tag--gold">{actual.etiqueta}</span>
                      </div>
                    )}

                    {puedeSonar && (
                      <button
                        type="button"
                        className="cn-play"
                        aria-pressed={actualSonando}
                        onClick={alternar}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {actualSonando ? (
                            <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>

                        {actualSonando
                          ? 'Pausar'
                          : actual.tipoReproduccion !== 'fondo' &&
                              audioRef.current &&
                              audioCancionRef.current === actual.id
                            ? 'Reanudar'
                            : 'Escuchar'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="cn-note">
                  <span className="cn-note__label">
                    {bloqueada ? 'Pista' : '¿Qué significa para mí?'}
                  </span>

                  <p>{bloqueada ? actual.pista : actual.significado}</p>

                  {errorAudio && !bloqueada && (
                    <p
                      role="alert"
                      style={{
                        marginTop: '0.65rem',
                        color: '#b42318',
                        fontSize: '0.9rem',
                      }}
                    >
                      {errorAudio}
                    </p>
                  )}
                </div>
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
}