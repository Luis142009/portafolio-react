import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ProgressBar from './ProgressBar.jsx';

export default function Loader({ revealed, onFinish, onGone }) {
  const ref = useRef(null);
  const [pct, setPct] = useState(0);

  // progreso: 0 → 90 → (al cargar la página) 100
  useEffect(() => {
    const state = { p: 0 };
    const render = () => setPct(state.p);
    const toNinety = gsap.to(state, { p: 90, duration: 1.8, ease: 'power1.out', onUpdate: render });
    let timer;
    let toHundred;

    const finish = () => {
      toNinety.kill();
      toHundred = gsap.to(state, { p: 100, duration: 0.5, ease: 'power2.out', onUpdate: render, onComplete: onFinish });
    };
    const onLoad = () => { timer = setTimeout(finish, 400); };

    if (document.readyState === 'complete') {
      timer = setTimeout(finish, 1200);
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', onLoad);
      toNinety.kill();
      toHundred && toHundred.kill();
    };
  }, [onFinish]);

  // salida: el loader sube y desaparece
  useEffect(() => {
    if (!revealed) return;
    const tween = gsap.to(ref.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', onComplete: onGone });
    return () => tween.kill();
  }, [revealed, onGone]);

  return (
    <div id="loader" ref={ref} aria-live="polite">
      <div className="loader__inner">
        <p className="loader__tag">Cargando portafolio</p>
        <ProgressBar variant="loader" name="Luis Miguel Moreno Santos" value={pct} label="Cargando portafolio" />
        <p className="loader__role">Productor Multimedia</p>
      </div>
    </div>
  );
}
