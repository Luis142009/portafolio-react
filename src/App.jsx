import { useCallback, useEffect, useState } from 'react';
import Loader from './components/Loader.jsx';
import Hero from './components/Hero.jsx';
import Cursor from './components/Cursor.jsx';
import Canciones from './components/Canciones.jsx';

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  const onFinish = useCallback(() => {
    setRevealed(true);
  }, []);

  const onGone = useCallback(() => {
    setLoaderGone(true);
  }, []);

  // Durante la carga se bloquea el scroll con la clase is-loading (ver CSS).
  // No se toca overflow de <html> ni de <body> desde JS: eso rompía el
  // position: sticky del escenario.
  useEffect(() => {
    document.body.classList.toggle('is-loading', !revealed);

    return () => {
      document.body.classList.remove('is-loading');
    };
  }, [revealed]);

  return (
    <>
      {!loaderGone && (
        <Loader
          revealed={revealed}
          onFinish={onFinish}
          onGone={onGone}
        />
      )}

      <Cursor />

      {loaderGone && <Canciones />}

      <main>
        <Hero revealed={revealed} />
      </main>
    </>
  );
}