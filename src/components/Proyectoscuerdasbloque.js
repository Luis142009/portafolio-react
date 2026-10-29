import { motorAudio, midiAHz } from './Audiomotor.js';

// PIANO + GUITARRA ELÉCTRICA: cada hilo de la telaraña es una cuerda
// con su nota. Escala pentatónica menor de La (La, Do, Re, Mi, Sol y
// las mismas una octava arriba, de grave a aguda): encaja con los
// acordes de la canción (Am – F – C – G) sin importar el orden en que
// toques los hilos.
//
// Cada hilo suena con DOS instrumentos a la vez:
//   · PIANO     → la nota, con sus armónicos (cada uno se apaga a su
//                 ritmo), un golpe de martillo y un leve coro.
//   · GUITARRA  → una octava más grave, con "power chord" (nota + quinta),
//                 distorsión, filtro de amplificador, vibrato que llega
//                 tarde y un pequeño "scoop" al atacar la nota.
//
// AJUSTES:
//   VOL_PIANO / VOL_GUITARRA → mezcla (0 apaga ese instrumento)
//   DRIVE_GUITARRA           → cuánta distorsión (3 = suave · 10 = muy sucia)
//   DUR_PIANO                → cuánto dura la nota del piano (segundos)
//   DUR_GUITARRA             → cuánto dura la nota de la guitarra
const ESCALA_CUERDAS = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];

const VOL_PIANO = 1;
const VOL_GUITARRA = 1;
const DRIVE_GUITARRA = 6;
const DUR_PIANO = 1.8;
const DUR_GUITARRA = 1.5;

// Distorsión de la guitarra (ligeramente asimétrica, como una válvula)
const CURVA_OVERDRIVE = (() => {
  const c = new Float32Array(512);
  const sesgo = 0.2;
  for (let i = 0; i < 512; i += 1) {
    const x = i / 256 - 1;
    c[i] = Math.tanh(x * DRIVE_GUITARRA + sesgo) - Math.tanh(sesgo);
  }
  return c;
})();

export function sonidoCuerda(idx, retardo = 0, vol = 1) {
  const a = motorAudio();
  if (!a) return;

  const { ctx, master, buf } = a;
  const t = ctx.currentTime + retardo;
  const nota = ESCALA_CUERDAS[idx % ESCALA_CUERDAS.length];

  // salida con paneo según el hilo (de izquierda a derecha)
  const salida = ctx.createGain();
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = ((idx % 10) / 9) * 1.2 - 0.6;
    salida.connect(pan);
    pan.connect(master);
  } else {
    salida.connect(master);
  }

  // =======================================================
  // PIANO
  // =======================================================
  if (VOL_PIANO > 0) {
    const hz = midiAHz(nota);

    const piano = ctx.createGain();
    piano.gain.value = 0.2 * vol * VOL_PIANO;
    piano.connect(salida);

    // armónicos: [múltiplo, volumen]. Los agudos se apagan antes.
    const PARCIALES = [
      [1, 1],
      [2, 0.5],
      [3, 0.3],
      [4, 0.17],
      [5, 0.09],
    ];

    PARCIALES.forEach(([h, amp], i) => {
      // leve inarmonicidad: así suena a cuerda de piano y no a órgano
      const f = hz * h * Math.sqrt(1 + 0.0005 * h * h);
      const dec = DUR_PIANO / (1 + i * 0.9);

      // el primer armónico va duplicado y desafinado (efecto coro)
      const copias = i === 0 ? [-3, 3] : [0];

      copias.forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.detune.value = det;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp / copias.length, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dec);

        o.connect(g);
        g.connect(piano);
        o.start(t);
        o.stop(t + dec + 0.05);
      });
    });

    // golpe del martillo: ruido muy corto
    const mart = ctx.createBufferSource();
    mart.buffer = buf;

    const bpm = ctx.createBiquadFilter();
    bpm.type = 'bandpass';
    bpm.frequency.value = 2600;
    bpm.Q.value = 1;

    const gm = ctx.createGain();
    gm.gain.setValueAtTime(0.18 * vol * VOL_PIANO, t);
    gm.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    mart.connect(bpm);
    bpm.connect(gm);
    gm.connect(salida);
    mart.start(t);
    mart.stop(t + 0.05);
  }

  // =======================================================
  // GUITARRA ELÉCTRICA (una octava más grave, con quinta)
  // =======================================================
  if (VOL_GUITARRA > 0) {
    const hzG = midiAHz(nota - 12);

    // el ataque entra ANTES de la distorsión: al apagarse la nota,
    // la distorsión también baja (así suena a amplificador real)
    const entrada = ctx.createGain();
    entrada.gain.setValueAtTime(0.0001, t);
    entrada.gain.exponentialRampToValueAtTime(1, t + 0.004);
    entrada.gain.exponentialRampToValueAtTime(0.45, t + 0.18);
    entrada.gain.exponentialRampToValueAtTime(0.0001, t + DUR_GUITARRA);

    const drive = ctx.createWaveShaper();
    drive.curve = CURVA_OVERDRIVE;
    drive.oversample = '4x';

    // amplificador: realce en medios + recorte de agudos
    const medios = ctx.createBiquadFilter();
    medios.type = 'peaking';
    medios.frequency.value = 900;
    medios.Q.value = 0.9;
    medios.gain.value = 5;

    const cabina = ctx.createBiquadFilter();
    cabina.type = 'lowpass';
    cabina.frequency.value = 3200;
    cabina.Q.value = 0.9;

    const guit = ctx.createGain();
    guit.gain.value = 0.16 * vol * VOL_GUITARRA;

    entrada.connect(drive);
    drive.connect(medios);
    medios.connect(cabina);
    cabina.connect(guit);
    guit.connect(salida);

    // vibrato: llega tarde, como un guitarrista que sostiene la nota
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5.5;

    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0, t);
    lfoG.gain.setValueAtTime(0, t + 0.3);
    lfoG.gain.linearRampToValueAtTime(14, t + 0.8); // en cents

    lfo.connect(lfoG);
    lfo.start(t);
    lfo.stop(t + DUR_GUITARRA + 0.1);

    // nota + quinta (power chord), cada una con dos cuerdas desafinadas
    [1, 1.5].forEach((mult) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = det;

        // "scoop": la nota arranca un poco baja y sube a su sitio
        o.frequency.setValueAtTime(hzG * mult * 0.985, t);
        o.frequency.linearRampToValueAtTime(hzG * mult, t + 0.05);

        lfoG.connect(o.detune);

        o.connect(entrada);
        o.start(t);
        o.stop(t + DUR_GUITARRA + 0.1);
      });
    });

    // púa: chasquido de la cuerda al atacar
    const pua = ctx.createBufferSource();
    pua.buffer = buf;

    const bpp = ctx.createBiquadFilter();
    bpp.type = 'bandpass';
    bpp.frequency.value = 4000;
    bpp.Q.value = 1.2;

    const gp = ctx.createGain();
    gp.gain.setValueAtTime(0.12 * vol * VOL_GUITARRA, t);
    gp.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    pua.connect(bpp);
    bpp.connect(gp);
    gp.connect(salida);
    pua.start(t);
    pua.stop(t + 0.04);
  }
}