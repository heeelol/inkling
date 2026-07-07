"use client";
import { useCallback, useRef, useState } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 through the current line
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  // Guards against spam-clicking: each speak() bumps the generation; stale
  // in-flight fetches see a newer generation and never play.
  const genRef = useRef(0);
  const speakingTextRef = useRef<string | null>(null);

  const cleanupUrl = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cleanupUrl();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setProgress(0);
    setSpokenText(null);
    speakingTextRef.current = null;
  }, []);

  const fallback = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    // Real word boundaries when the browser provides them.
    u.onboundary = (e) => { if (text.length) setProgress(Math.min(1, e.charIndex / text.length)); };
    u.onend = () => { setSpeaking(false); setProgress(1); speakingTextRef.current = null; };
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      // Clicking the button for the line already playing = toggle it off.
      if (speakingTextRef.current === text) {
        genRef.current++;
        stop();
        return;
      }
      const gen = ++genRef.current;
      stop();
      setSpeaking(true);
      setSpokenText(text);
      speakingTextRef.current = text;
      setProgress(0);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (gen !== genRef.current) return; // superseded while fetching
        if (!res.ok) throw new Error("tts failed");
        const blob = await res.blob();
        if (gen !== genRef.current) return;
        if (!blob.size || !blob.type.startsWith("audio")) throw new Error("no audio");
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.ontimeupdate = () => {
          if (audio.duration && isFinite(audio.duration)) setProgress(Math.min(1, audio.currentTime / audio.duration));
        };
        audio.onended = () => {
          setSpeaking(false);
          setProgress(1);
          speakingTextRef.current = null; // finished naturally → next click replays
          cleanupUrl();
        };
        audio.onerror = () => { if (gen === genRef.current) fallback(text); };
        await audio.play();
      } catch {
        if (gen === genRef.current) fallback(text);
      }
    },
    [stop, fallback]
  );

  return { speak, stop, speaking, progress, spokenText };
}
