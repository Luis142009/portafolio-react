import { useEffect, useRef, useState } from 'react';

import laferte from '../assets/laferte.mp3';
import quien from '../assets/quien.mp3';

const canciones = [
  { nombre: 'Laferte', archivo: laferte },
  { nombre: 'Quien', archivo: quien },
];

const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Player({ name, playing, onToggle, duration = 180 }) {
  const audio = useRef(null);
  const track = useRef(null);
  const fill = useRef(null);
  const knob = useRef(null);
  const time = useRef(null);

  const [cancionActual, setCancionActual] = useState(0);

  // Cuando el cursor desbloquea la canción (100 clics), ella es la música de fondo
  // y las canciones de este reproductor dejan de sonar.
  const fondoRef = useRef(false);
  const [fondo, setFondo] = useState(false);

  useEffect(() => {
    const alActivarFondo = () => {
      fondoRef.current = true;
      setFondo(true);

      const sonido = audio.current;
      if (sonido) {
        sonido.pause();
        sonido.currentTime = 0;
      }
      if (fill.current) fill.current.style.width = '0%';
      if (knob.current) knob.current.style.left = '0%';
      if (time.current) time.current.textContent = '0:00';
    };

    window.addEventListener('musica-fondo', alActivarFondo);
    return () => window.removeEventListener('musica-fondo', alActivarFondo);
  }, []);

  useEffect(() => {
    const sonido = audio.current;

    if (playing && !fondoRef.current) {
      const reproduccion = sonido.play();
      if (reproduccion) reproduccion.catch(() => {});
    } else {
      sonido.pause();
    }
  }, [playing, cancionActual, fondo]);

  useEffect(() => {
    const sonido = audio.current;

    function actualizarProgreso() {
      if (fondoRef.current) return;

      const actual = sonido.currentTime;
      const total = sonido.duration || duration;
      const progreso = total > 0 ? (actual / total) * 100 : 0;

      fill.current.style.width = progreso + '%';
      knob.current.style.left = progreso + '%';
      time.current.textContent = fmt(actual);

      track.current.setAttribute('aria-valuemax', Math.round(total));
      track.current.setAttribute('aria-valuenow', Math.round(actual));
    }

    function terminarCancion() {
      onToggle();
    }

    sonido.addEventListener('timeupdate', actualizarProgreso);
    sonido.addEventListener('loadedmetadata', actualizarProgreso);
    sonido.addEventListener('ended', terminarCancion);

    return () => {
      sonido.removeEventListener('timeupdate', actualizarProgreso);
      sonido.removeEventListener('loadedmetadata', actualizarProgreso);
      sonido.removeEventListener('ended', terminarCancion);
    };
  }, [duration, onToggle]);

  function cambiarCancion() {
    if (fondoRef.current) return; // con la música de fondo no se cambia de canción

    audio.current.pause();
    audio.current.currentTime = 0;

    fill.current.style.width = '0%';
    knob.current.style.left = '0%';
    time.current.textContent = '0:00';

    setCancionActual((actual) => (actual + 1) % canciones.length);
  }

  return (
    <div className="player" role="group" aria-label="Reproductor del portafolio">
      <audio
        ref={audio}
        src={canciones[cancionActual].archivo}
        preload="metadata"
      />

      <button
        className="player__btn"
        type="button"
        onClick={onToggle}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
        aria-pressed={playing}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4l13 8-13 8z" />
          </svg>
        )}
      </button>

      <div className="player__body">
        <span className="player__name">
          {name || canciones[cancionActual].nombre}
        </span>

        <div
          className="player__track"
          ref={track}
          role="progressbar"
          aria-label="Progreso de la canción"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={0}
        >
          <span className="player__fill" ref={fill} />
          <span className="player__knob" ref={knob} />
        </div>
      </div>

      <span className="player__time" ref={time}>0:00</span>

      <button
        className="player__btn"
        type="button"
        onClick={cambiarCancion}
        aria-label="Cambiar canción"
        title="Cambiar canción"
        disabled={fondo}
        style={fondo ? { opacity: 0.4, cursor: 'default' } : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 3l4 4-4 4M4 7h16M8 21l-4-4 4-4M20 17H4" />
        </svg>
      </button>
    </div>
  );
}