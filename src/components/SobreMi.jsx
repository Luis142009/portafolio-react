import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import sobremi from '../assets/sobremi.png';
import tarjeta from '../assets/tarjeta-cafe.png';
import luis from '../assets/luis-saludo.png';
import nota from '../assets/nota.png';
import hojaLista from '../assets/sss.png';
import disenoTitulo from '../assets/diseno-titulo.png';
import software from '../assets/software.png';
import papelTop from '../assets/papel-top.png';
import papelMid from '../assets/papel-mid.png';
import papelBottom from '../assets/papel-bottom.png';

import '../stylesheets/Sobremi.css';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const ABOUT_TRIGGER = 'top 85%';

/* x / y en % relativos a la IMAGEN DE PROGRAMAS (software.png).
   Son valores de partida: muévelos hasta alinear cada barra con su logo. */
const SKILLS = [
  { id: 'ai', name: 'Adobe Illustrator', level: 88, x: 33, y: 7 },
  { id: 'ae', name: 'Adobe After Effects', level: 78, x: 33, y: 37 },
  { id: 'ps', name: 'Adobe Photoshop', level: 82, x: 33, y: 58 },
  { id: 'canva', name: 'Canva', level: 72, x: 33, y: 84 },
];

export default function SobreMi() {
  const anchor = useRef(null);

  useLayoutEffect(() => {
    const section = anchor.current?.closest('.frame--about');

    if (!section) return;

    const ctx = gsap.context(() => {
      /* Fondo siempre visible */
      gsap.set('.l-sm-bg', {
        autoAlpha: 1,
        x: 0,
        y: 0,
      });

      gsap.set('.l-sm-bg .in', {
        autoAlpha: 1,
        x: 0,
        y: 0,
      });

      /* Título y papel rasgado visibles desde el inicio */
      gsap.set('.l-sm-title--front, .sm-bg__bottom--front', {
        autoAlpha: 1,
      });

      /* Estado inicial de las barras */
      gsap.set('.sm-bar__fill', {
        width: (i, element) => {
          return reduce ? `${element.dataset.level}%` : '0%';
        },
      });

      if (reduce) {
        gsap.set(
          '.l-sm-title .in, .l-sm-card .in, .l-sm-char .in, .l-sm-nota .in, .l-sm-list .in, .sm-text, .sm-diseno, .sm-sub, .sm-software, .sm-bar__track',
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
          }
        );

        return;
      }

      /* Animaciones continuas */
      const loops = gsap.timeline({ paused: true });

      loops
        .to(
          '.l-sm-nota img',
          {
            y: -12,
            rotation: 8,
            duration: 1.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          '.l-sm-char img',
          {
            y: -8,
            rotation: 1,
            duration: 2.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          '.sm-diseno',
          {
            rotation: 1.8,
            duration: 2.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          '.sm-software',
          {
            y: 6,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          0
        );

      /* Animación de entrada del contenido */
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.out' },
        onComplete: () => loops.play(),
        onReverseComplete: () => loops.pause(),
      });

      tl.fromTo(
        '.l-sm-card .in',
        { autoAlpha: 0, x: -220, rotation: -8 },
        { autoAlpha: 1, x: 0, rotation: 0, duration: 1 },
        0.25
      )
        .fromTo(
          '.sm-text',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.8 },
          0.9
        )
        .fromTo(
          '.l-sm-title--front .in',
          {
            autoAlpha: 0,
            scale: 0.2,
            rotation: -12,
            transformOrigin: '50% 50%',
          },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 1.1,
            ease: 'back.out(1.9)',
          },
          0.5
        )
        .fromTo(
          '.l-sm-char .in',
          {
            autoAlpha: 0,
            y: 240,
            rotation: 8,
            scale: 0.7,
          },
          {
            autoAlpha: 1,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.2,
            ease: 'back.out(1.5)',
          },
          0.6
        )
        .fromTo(
          '.l-sm-nota .in',
          {
            autoAlpha: 0,
            scale: 0,
            rotation: -120,
          },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 1,
            ease: 'elastic.out(1, .55)',
          },
          1.1
        )
        /* Anima las dos capas de la hoja (papel + contenido) a la vez */
        .fromTo(
          '.l-sm-list .in',
          {
            autoAlpha: 0,
            x: 260,
            rotation: 10,
          },
          {
            autoAlpha: 1,
            x: 0,
            rotation: 0,
            duration: 1.1,
          },
          0.7
        )
        .fromTo(
          '.sm-diseno',
          {
            autoAlpha: 0,
            scale: 0.3,
            rotation: -10,
            transformOrigin: '50% 50%',
          },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
            ease: 'back.out(1.8)',
          },
          1.3
        )
        .fromTo(
          '.sm-sub',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6 },
          1.55
        )
        .fromTo(
          '.sm-software',
          {
            autoAlpha: 0,
            scale: 0.6,
            y: 40,
            transformOrigin: '50% 50%',
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.6)',
          },
          1.5
        )
        .fromTo(
          '.sm-bar__track',
          {
            autoAlpha: 0,
            x: -30,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.12,
          },
          1.75
        )
        .to(
          '.sm-bar__fill',
          {
            width: (i, element) => `${element.dataset.level}%`,
            duration: 1.4,
            ease: 'power3.out',
            stagger: 0.12,
          },
          1.95
        );

      /* Activar animación al llegar a la escena */
      ScrollTrigger.create({
        trigger: section,
        start: ABOUT_TRIGGER,
        onEnter: () => tl.play(),
        onEnterBack: () => tl.play(),
        onLeaveBack: () => {
          loops.pause();
          tl.reverse();
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Fondo de papel */}
      <div className="l-sm l-sm-bg" ref={anchor}>
        <div className="in">
          <div className="sm-bg">
            <div
              className="sm-bg__mid"
              style={{ backgroundImage: `url(${papelMid})` }}
            />

            <img
              className="sm-bg__top"
              src={papelTop}
              alt=""
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="about__stage">
        {/* Tarjeta de presentación */}
        <div className="l-sm l-sm-card">
          <div className="in">
            <div className="sm-card">
              <img src={tarjeta} alt="" draggable="false" />

              <div className="sm-text">
                <p>
                  Diseño porque me gusta pensar, música porque la
                  necesito y duermo porque debería. Me gusta dibujar,
                  crear personajes, jugar videojuegos y convertir
                  ideas random en cosas que realmente existen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hoja de software: solo el papel (queda debajo del papel rasgado) */}
        <div className="l-sm l-sm-list">
          <div className="in">
            <div className="sm-list">
              <img
                className="sm-list__paper"
                src={hojaLista}
                alt=""
                draggable="false"
              />
            </div>
          </div>
        </div>

        {/* Luis saludando */}
        <div className="l-sm l-sm-char">
          <div className="in">
            <img src={luis} alt="Luis saludando" draggable="false" />
          </div>
        </div>

        {/* Nota musical */}
        <div className="l-sm l-sm-nota">
          <div className="in">
            <img src={nota} alt="" draggable="false" />
          </div>
        </div>
      </div>

      {/* Título Sobre mí: capa independiente superior */}
      <div className="l-sm l-sm-title l-sm-title--front">
        <div className="in">
          <img src={sobremi} alt="Sobre mí" draggable="false" />
        </div>
      </div>

      {/* Papel rasgado inferior: capa independiente superior */}
      <img
        className="sm-bg__bottom sm-bg__bottom--front"
        src={papelBottom}
        alt=""
        draggable="false"
      />

      {/* Contenido de la hoja: capa por encima del papel rasgado */}
      <div className="l-sm l-sm-list l-sm-list--front">
        <div className="in">
          <div className="sm-list">
            <img
              className="sm-diseno"
              src={disenoTitulo}
              alt="Diseño"
              draggable="false"
            />

            <p className="sm-sub">
              Estos son los software que manejo para diseño y
              creación de recursos y diseño de personajes.
            </p>

            {/* Programas + barras: un solo bloque que se mueve junto */}
            <div className="sm-software">
              <img
                className="sm-software__img"
                src={software}
                alt="Illustrator, After Effects, Photoshop y Canva"
                draggable="false"
              />

              {SKILLS.map((skill) => (
                <div
                  key={skill.id}
                  className="sm-bar"
                  style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                  role="progressbar"
                  aria-label={skill.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={skill.level}
                >
                  <div className="sm-bar__track">
                    <span className="sm-bar__fill" data-level={skill.level} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}