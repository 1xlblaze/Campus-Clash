const KEY = "cc-ludo-sound";

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  localStorage.setItem(KEY, on ? "on" : "off");
}

let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, ms: number, gain = 0.08) {
  if (!isSoundEnabled()) return;
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000);
  o.stop(c.currentTime + ms / 1000);
}

export const ludoSounds = {
  roll: () => {
    beep(220, 60, 0.06);
    window.setTimeout(() => beep(280, 50, 0.05), 70);
  },
  six: () => {
    beep(520, 80);
    window.setTimeout(() => beep(660, 100), 90);
  },
  move: () => beep(380, 40, 0.05),
  capture: () => {
    beep(180, 120, 0.1);
    window.setTimeout(() => beep(140, 150, 0.08), 100);
  },
  win: () => {
    [523, 659, 784].forEach((f, i) => window.setTimeout(() => beep(f, 180, 0.07), i * 140));
  },
};
