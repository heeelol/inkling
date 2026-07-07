"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "thinking" | "illustrating";

// A gentle, generative storybook soundscape built entirely with the Web Audio
// API — no audio files to license or ship. A soft chord pad drifts underneath,
// and the low-pass filter opens up while the story is thinking/painting, so the
// music quietly reacts to what's happening. chime()/sparkle() are UI cues.
export function useSoundscape(phase: Phase) {
  const [soundOn, setSoundOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const padGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const padOscs = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const userDecided = useRef(false);

  const ensureCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (!masterRef.current && ctxRef.current) {
      const m = ctxRef.current.createGain();
      m.gain.value = 0.14;
      m.connect(ctxRef.current.destination);
      masterRef.current = m;
    }
    return ctxRef.current;
  }, []);

  const startSound = useCallback(async () => {
    const ctx = ensureCtx();
    const master = masterRef.current;
    if (!ctx || !master) return;
    await ctx.resume();
    if (padOscs.current.length === 0) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 480;
      filterRef.current = filter;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.0001;
      padGainRef.current = padGain;
      filter.connect(padGain).connect(master);

      // Low A-minor drone (A1 A2 C3 E3) — somber, torchlit-hall mood.
      [55, 110, 130.81, 164.81].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(filter);
        o.start();
        padOscs.current.push(o);
      });

      // Slow breathing swell.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain).connect(padGain.gain);
      lfo.start();
      lfoRef.current = lfo;

      padGain.gain.setTargetAtTime(0.06, ctx.currentTime, 2.5); // fade in
    }
    setSoundOn(true);
  }, [ensureCtx]);

  const stopSound = useCallback(() => {
    const ctx = ctxRef.current;
    const padGain = padGainRef.current;
    if (ctx && padGain) padGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6);
    setSoundOn(false);
  }, []);

  const toggleSound = useCallback(() => {
    userDecided.current = true;
    if (soundOn) stopSound();
    else void startSound();
  }, [soundOn, startSound, stopSound]);

  // Music reacts to the story phase: brighter while thinking/painting.
  useEffect(() => {
    const ctx = ctxRef.current;
    const filter = filterRef.current;
    if (!ctx || !filter || !soundOn) return;
    filter.frequency.setTargetAtTime(phase === "idle" ? 480 : 900, ctx.currentTime, 0.7);
  }, [phase, soundOn]);

  // Offer to start on the very first interaction, unless the user opted out.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFirst = () => { if (!userDecided.current && !soundOn) void startSound(); };
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, [startSound, soundOn]);

  useEffect(() => () => { void ctxRef.current?.close(); }, []);

  // ---- one-shot sound effects ----
  const blip = useCallback((freq: number, delay: number, dur: number, peak = 0.18, type: OscillatorType = "sine") => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }, []);

  const chime = useCallback(() => {
    if (!soundOn) return;
    blip(660, 0, 0.5);
    blip(990, 0.06, 0.55);
  }, [soundOn, blip]);

  const sparkle = useCallback(() => {
    if (!soundOn) return;
    [784, 988, 1319, 1568].forEach((f, i) => blip(f, i * 0.07, 0.28, 0.14, "triangle"));
  }, [soundOn, blip]);

  return { soundOn, toggleSound, chime, sparkle };
}
