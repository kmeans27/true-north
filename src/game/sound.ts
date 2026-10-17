/* ------------------------------------------------------------------
   Sound (spec M9: "sound (opt-in)")

   Nothing is loaded and nothing plays unless the player turns it on in
   About. Every cue is synthesised from an oscillator or a short noise
   burst, so the audio costs no payload and cannot be mistaken for a
   jingle: it is ink, paper and wax, played quietly.
   ------------------------------------------------------------------ */

import { getStore } from "../ui/session";

let ctx: AudioContext | null = null;

type Ctor = typeof AudioContext;

function enabled(): boolean {
  try {
    return getStore().prefs.sound === true;
  } catch {
    return false;
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType = "sine", when = 0): void {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.04);
}

function noise(dur: number, freq: number, gain: number, q = 1.1): void {
  const c = audio();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(band).connect(g).connect(c.destination);
  src.start();
}

/** A quill crossing paper: the SIGN gesture. */
export function quillSound(): void {
  if (!enabled()) return;
  noise(0.16, 2400, 0.05, 0.9);
  noise(0.1, 1500, 0.035, 1.4);
}

/** A dry click for the wager toggle. */
export function clickSound(): void {
  if (!enabled()) return;
  noise(0.05, 1800, 0.035, 2);
}

/** A soft chime as a truth draws, rising a little with each task. */
export function chimeSound(step = 0): void {
  if (!enabled()) return;
  const base = 523.25 * Math.pow(1.09, Math.min(step, 5));
  tone(base, 0.5, 0.05);
  tone(base * 1.5, 0.34, 0.02, "sine", 0.02);
}

/** Wax pressed onto paper: a paid survey. */
export function stampSound(): void {
  if (!enabled()) return;
  tone(96, 0.2, 0.09, "sine");
  noise(0.09, 420, 0.05, 0.8);
}
