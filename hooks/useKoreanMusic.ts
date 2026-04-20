"use client";
import { useRef, useCallback } from "react";

/**
 * useKoreanMusic — Síntesis de música coreana tradicional con Web Audio API
 * Imita gayageum (cuerda pulsada) y haegeum (cuerda frotada)
 * Escala pentatónica coreana: Do Re Mi Sol La (궁상각치우)
 * Melodía inspirada en "Arirang" y música de anime coreano
 */

// Escala pentatónica menor coreana (Do menor pentatónica)
const PENTATONIC = [
  261.63, // Do4
  311.13, // Eb4
  349.23, // Fa4
  392.00, // Sol4
  466.16, // Sib4
  523.25, // Do5
  622.25, // Eb5
  698.46, // Fa5
  783.99, // Sol5
];

// Melodía tipo Arirang / anime coreano
const MELODY_PATTERN = [5, 4, 3, 4, 5, 5, 5, 4, 3, 2, 1, 2, 3, 3, 3, 4, 5, 6, 5, 4, 3, 2, 0, 1, 2, 3, 4, 5];
const BASS_PATTERN   = [0, 0, 2, 0, 2, 0, 0, 2];
const RHYTHM_PATTERN = [1, 0, 1, 1, 0, 1, 0, 1]; // jangdan simplificado

export function useKoreanMusic() {
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const reverbRef  = useRef<ConvolverNode | null>(null);
  const playingRef = useRef(false);
  const rafRef     = useRef<number>(0);
  const nextBeat   = useRef(0);
  const beatIdx    = useRef(0);
  const melodyIdx  = useRef(0);

  // Crear reverb sintético (sala de madera)
  const createReverb = useCallback((ctx: AudioContext): ConvolverNode => {
    const conv = ctx.createConvolver();
    const len  = ctx.sampleRate * 2.2;
    const buf  = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    conv.buffer = buf;
    return conv;
  }, []);

  // Gayageum — cuerda pulsada con decaimiento rápido
  const playGayageum = useCallback((freq: number, when: number, vol = 0.12) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;

    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = freq * 2;
    filt.Q.value = 8;

    // Dos osciladores ligeramente desafinados para cuerda
    for (let d = 0; d < 2; d++) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq * (1 + d * 0.003);
      osc.connect(filt);
      osc.start(when);
      osc.stop(when + 1.8);
    }

    // Envolvente tipo cuerda pulsada: ataque rápido, decaimiento largo
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, when + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);

    filt.connect(gain);
    if (reverbRef.current) {
      const dryGain = ctx.createGain(); dryGain.gain.value = 0.7;
      const wetGain = ctx.createGain(); wetGain.gain.value = 0.3;
      gain.connect(dryGain); gain.connect(reverbRef.current);
      reverbRef.current.connect(wetGain);
      dryGain.connect(masterRef.current);
      wetGain.connect(masterRef.current);
    } else {
      gain.connect(masterRef.current);
    }
  }, []);

  // Haegeum — cuerda frotada, sostenida y expresiva
  const playHaegeum = useCallback((freq: number, when: number, dur: number, vol = 0.07) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    const vib  = ctx.createOscillator(); // vibrato
    const vibG = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.value = freq;
    filt.type = "lowpass";
    filt.frequency.value = freq * 3.5;
    filt.Q.value = 2;

    // Vibrato suave
    vib.frequency.value = 5.5;
    vibG.gain.value = freq * 0.012;
    vib.connect(vibG);
    vibG.connect(osc.frequency);

    // Envolvente sostenida
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.12);
    gain.gain.setValueAtTime(vol, when + dur - 0.15);
    gain.gain.linearRampToValueAtTime(0, when + dur);

    osc.connect(filt); filt.connect(gain);
    if (reverbRef.current) {
      const wetG = ctx.createGain(); wetG.gain.value = 0.4;
      gain.connect(masterRef.current);
      gain.connect(reverbRef.current);
      reverbRef.current.connect(wetG);
      wetG.connect(masterRef.current);
    } else {
      gain.connect(masterRef.current);
    }

    vib.start(when); vib.stop(when + dur);
    osc.start(when); osc.stop(when + dur);
  }, []);

  // Jangdan — percusión suave (buk/janggu simplificado)
  const playPercussion = useCallback((when: number, isStrong: boolean) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;

    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }

    const src  = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = isStrong ? 280 : 180;

    src.buffer = buf;
    gain.gain.value = isStrong ? 0.18 : 0.08;

    src.connect(filt); filt.connect(gain); gain.connect(masterRef.current);
    src.start(when);
  }, []);

  const schedule = useCallback(() => {
    if (!ctxRef.current || !playingRef.current) return;
    const ctx = ctxRef.current;
    const BPM = 72;
    const BEAT = 60 / BPM;

    while (nextBeat.current < ctx.currentTime + 0.2) {
      const beat = beatIdx.current % RHYTHM_PATTERN.length;
      const when = nextBeat.current;

      // Percusión
      if (RHYTHM_PATTERN[beat]) {
        playPercussion(when, beat === 0);
      }

      // Melodía gayageum (cada 2 beats)
      if (beat % 2 === 0) {
        const mIdx = melodyIdx.current % MELODY_PATTERN.length;
        const note = PENTATONIC[MELODY_PATTERN[mIdx] % PENTATONIC.length];
        playGayageum(note, when, 0.1);
        melodyIdx.current++;
      }

      // Bajo haegeum (cada 4 beats)
      if (beat % 4 === 0) {
        const bIdx = Math.floor(beatIdx.current / 4) % BASS_PATTERN.length;
        const note = PENTATONIC[BASS_PATTERN[bIdx]] * 0.5;
        playHaegeum(note, when, BEAT * 3.5, 0.06);
      }

      // Melodía haegeum alta (cada 8 beats, contrapunto)
      if (beat === 0 && beatIdx.current % 8 === 0) {
        const mIdx = (melodyIdx.current + 4) % MELODY_PATTERN.length;
        const note = PENTATONIC[MELODY_PATTERN[mIdx] % PENTATONIC.length] * 1.5;
        playHaegeum(note, when + BEAT * 0.5, BEAT * 1.8, 0.05);
      }

      nextBeat.current += BEAT;
      beatIdx.current++;
    }

    rafRef.current = requestAnimationFrame(schedule);
  }, [playGayageum, playHaegeum, playPercussion]);

  const start = useCallback(() => {
    if (playingRef.current) return;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const master = ctxRef.current.createGain();
      master.gain.value = 0.6;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
      reverbRef.current = createReverb(ctxRef.current);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    playingRef.current = true;
    nextBeat.current = ctxRef.current.currentTime + 0.1;
    schedule();
  }, [schedule, createReverb]);

  const stop = useCallback(() => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (masterRef.current) {
      masterRef.current.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 0.8);
      setTimeout(() => { if (masterRef.current) masterRef.current.gain.value = 0.6; }, 900);
    }
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) { stop(); return false; }
    else { start(); return true; }
  }, [start, stop]);

  return { toggle };
}
