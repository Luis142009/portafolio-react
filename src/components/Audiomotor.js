// ---------------------------------------------------------
// MOTOR DE AUDIO COMPARTIDO
//
// Un solo AudioContext para toda la escena (bafles, canción,
// título y cuerdas de la telaraña). Lo usan:
//   · Proyectos.jsx
//   · Proyectoscuerdasbloque.js
//
// VOLUMEN general → master.gain.value
// ---------------------------------------------------------

export const midiAHz = (m) => 440 * 2 ** ((m - 69) / 12);

let audio = null;

export function motorAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  if (!audio) {
    const ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 0.9; // VOLUMEN

    // limitador suave para que nunca sature ni suene feo
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 8;

    master.connect(comp);
    comp.connect(ctx.destination);

    // bus de la canción (se mezcla con el golpe de cada click)
    const bus = ctx.createGain();
    bus.gain.value = 0.7;
    bus.connect(master);

    // ruido blanco corto (para el chasquido del ataque)
    const largo = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buf.getChannelData(0);
    for (let i = 0; i < largo; i += 1) datos[i] = Math.random() * 2 - 1;

    // curva de saturación
    const curva = new Float32Array(256);
    for (let i = 0; i < 256; i += 1) {
      curva[i] = Math.tanh((i / 128 - 1) * 2.5);
    }

    audio = { ctx, master, bus, buf, curva };
  }

  // los navegadores bloquean el audio hasta el primer click: aquí se activa
  if (audio.ctx.state === 'suspended') audio.ctx.resume();

  return audio;
}