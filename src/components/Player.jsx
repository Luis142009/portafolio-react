import { useEffect, useRef, useState } from 'react';
import '../stylesheets/Player.css';
import carga from '../assets/carga.png';

export default function Player({
  name = 'Luis Miguel Moreno Santos',
  duration = 10,
  activo = true, // pásale false mientras el loader siga en pantalla: empieza cuando pase a true
  onComplete,
}) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  // así cambiar onComplete no reinicia la animación
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // El App pone la clase is-loading en <body> mientras el loader no ha terminado.
  // Así el Player espera solo, sin que tengas que pasarle nada.
  const [loaderListo, setLoaderListo] = useState(false);

  useEffect(() => {
    const body = document.body;
    const revisar = () => setLoaderListo(!body.classList.contains('is-loading'));

    // un frame después, para que App ya haya puesto la clase
    const id = requestAnimationFrame(revisar);
    const obs = new MutationObserver(revisar);
    obs.observe(body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, []);

  const puedeCorrer = activo && loaderListo;

  useEffect(() => {
    setProgress(0);

    // Mientras el loader no haya terminado, se queda quieto en 0
    if (!puedeCorrer) return undefined;

    let frameId;
    let startTime;

    const duracionMs = Math.max(0.1, Number(duration) || 5) * 1000;

    function animar(timestamp) {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const transcurrido = timestamp - startTime;
      const porcentaje = Math.min((transcurrido / duracionMs) * 100, 100);

      setProgress(porcentaje);

      if (porcentaje < 100) {
        frameId = requestAnimationFrame(animar);
      } else if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }

    frameId = requestAnimationFrame(animar);

    return () => cancelAnimationFrame(frameId);
  }, [duration, puedeCorrer]);

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