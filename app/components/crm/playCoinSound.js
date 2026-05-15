/** Short coin "ding" via Web Audio (no external file). */
let audioCtx = null;

export function playCoinSound() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.05);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.connect(g2);
    g2.connect(audioCtx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, t + 0.04);
    g2.gain.setValueAtTime(0.0001, t + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.06, t + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc2.start(t + 0.04);
    osc2.stop(t + 0.16);
  } catch {
    /* ignore */
  }
}
