
import { useEffect, useState } from 'react';
import '../stylesheets/Player.css';
import carga from '../assets/carga.png';

export default function Player({
  name = 'Luis Miguel Moreno Santos',
  duration = 10,
  onComplete,
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;

    setProgress(0);

    const duracionMs = Math.max(0.1, Number(duration) || 5) * 1000;

    function animar(timestamp) {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const transcurrido = timestamp - startTime;
      const porcentaje = Math.min(
        (transcurrido / duracionMs) * 100,
        100
      );

      setProgress(porcentaje);

      if (porcentaje < 100) {
        frameId = requestAnimationFrame(animar);
      } else if (onComplete) {
        onComplete();
      }
    }

    frameId = requestAnimationFrame(animar);

    return () => cancelAnimationFrame(frameId);
  }, [duration]);

  return (
    <div
      className="carga-portafolio"
      role="progressbar"
      aria-label="Carga del portafolio"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.floor(progress)}
    >
      {/* Fondo azul completo */}
      <div className="carga-portafolio__fondo" />

      {/* El ancho revela el nombre progresivamente */}
      <div
        className="carga-portafolio__relleno"
        style={{ width: `${progress}%` }}
      >
        <span>{name}</span>
      </div>

      {/* El personaje sigue el progreso y desaparece al terminar */}
      {progress < 100 && (
        <img
          className="carga-portafolio__personaje"
          src={carga}
          alt=""
          aria-hidden="true"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}
