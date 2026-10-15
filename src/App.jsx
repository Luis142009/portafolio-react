import { useCallback, useEffect, useState } from 'react';
import Loader from './components/Loader.jsx';
import Hero from './components/Hero.jsx';
import Cursor from './components/Cursor.jsx';
import Canciones from './components/Canciones.jsx';

export default function App() {
  const [revealed, setRevealed] = useState(false); // la barra llegó al 100%
  const [loaderGone, setLoaderGone] = useState(false); // el loader ya salió de pantalla

  const onFinish = useCallback(() => setRevealed(true), []);
  const onGone = useCallback(() => setLoaderGone(true), []);

  useEffect(() => {
    document.body.classList.toggle('is-loading', !revealed);
    return () => document.body.classList.remove('is-loading');
  }, [revealed]);

  return (
    <>
      {!loaderGone && (
        <Loader revealed={revealed} onFinish={onFinish} onGone={onGone} />
      )}
      <Cursor />
      {loaderGone && <Canciones />}
      <main>
        <Hero revealed={revealed} />
      </main>
    </>
  );
}