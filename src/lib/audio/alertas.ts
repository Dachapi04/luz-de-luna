'use client';

import type { Destino } from '@/domain/types';

/**
 * Avisos sonoros de comandas, sintetizados con Web Audio — sin archivos de
 * audio que cargar. Cada estación tiene un sonido distinto para que cocina y
 * bar no se confundan si están cerca:
 *   - cocina:    "ding-dong" de campana, dos veces.
 *   - bartender: tres pitidos rápidos ascendentes, dos veces.
 *
 * Los navegadores no dejan sonar nada hasta que el usuario interactúa con la
 * página, así que el AudioContext arranca suspendido y se reanuda con el
 * primer toque/tecla (ver `escucharDesbloqueo`).
 */

let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function sonidoBloqueado(): boolean {
  const c = audioContext();
  return !!c && c.state !== 'running';
}

export async function desbloquearSonido(): Promise<void> {
  const c = audioContext();
  if (c && c.state !== 'running') await c.resume().catch(() => {});
}

/** Reanuda el audio con la primera interacción del usuario y avisa cada vez que cambia el estado. */
export function escucharDesbloqueo(onChange: () => void): () => void {
  const c = audioContext();
  if (!c) return () => {};
  const unlock = () => void desbloquearSonido();
  const eventos = ['pointerdown', 'touchstart', 'keydown'] as const;
  eventos.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
  c.addEventListener('statechange', onChange);
  return () => {
    eventos.forEach((e) => window.removeEventListener(e, unlock));
    c.removeEventListener('statechange', onChange);
  };
}

function tono(c: AudioContext, freq: number, inicio: number, duracion: number, tipo: OscillatorType, volumen: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, inicio);
  gain.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(gain).connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}

/** Campana: fundamental + un armónico suave le da timbre de "ding". */
function campana(c: AudioContext, freq: number, inicio: number) {
  tono(c, freq, inicio, 0.9, 'sine', 0.5);
  tono(c, freq * 2.01, inicio, 0.5, 'sine', 0.12);
}

export function sonarComanda(estacion: Destino): void {
  const c = audioContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + 0.02;
  if (estacion === 'cocina') {
    for (const offset of [0, 1.0]) {
      campana(c, 988, t + offset);
      campana(c, 784, t + offset + 0.4);
    }
  } else {
    for (const offset of [0, 0.6]) {
      [880, 1175, 1568].forEach((f, i) => tono(c, f, t + offset + i * 0.12, 0.11, 'square', 0.18));
    }
  }
}
