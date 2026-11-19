import { useCallback, useEffect, useRef, useState } from 'react';

const effects = {
  open: [261.63, 392, 523.25, 659.25, 783.99],
  page: [466.16, 349.23],
  sparkle: [659.25, 880, 1046.5, 1318.5],
  click: [523.25],
  final: [392, 523.25, 659.25, 783.99, 1046.5],
};

const muteKey = 'magical-book-muted';

function rememberMute(muted: boolean) {
  try { sessionStorage.setItem(muteKey, muted ? '1' : '0'); } catch {}
}

export function useSound() {
  const [enabled, setEnabled] = useState(false);
  const audio = useRef<{ context: AudioContext; bus: GainNode } | null>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [musicError, setMusicError] = useState<string | null>(null);
  const isEnabled = useRef(false);
  const playAttempt = useRef(0);
  const playback = useRef<'idle' | 'starting' | 'playing' | 'blocked' | 'failed' | 'muted'>('idle');

  const onMusicError = useCallback(() => {
    if (playback.current === 'muted' || playback.current === 'failed') return;
    playback.current = 'failed';
    playAttempt.current++;
    isEnabled.current = false;
    musicRef.current?.pause();
    if (audio.current) {
      audio.current.bus.gain.setTargetAtTime(0, audio.current.context.currentTime, .045);
    }
    setEnabled(false);
    setMusicError('Chưa phát được nhạc. Bạn thử bật lại nhé.');
  }, []);

  const tone = useCallback((frequency: number, start: number, length: number, level: number, type: OscillatorType = 'sine') => {
    if (!audio.current) return;
    const { context, bus } = audio.current;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(level, start + .025);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + length + .01);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }, []);

  const play = useCallback((name: keyof typeof effects) => {
    if (!isEnabled.current || audio.current?.context.state !== 'running') return;
    const start = audio.current.context.currentTime + .02;
    const step = name === 'page' ? .046 : .1;
    effects[name].forEach((pitch, index) => tone(pitch, start + index * step, name === 'page' ? .12 : .66, .048, name === 'page' ? 'triangle' : 'sine'));
  }, [tone]);

  const enableEffects = useCallback(() => {
    try {
      if (!audio.current) {
        const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Audio) return;
        const context = new Audio();
        const bus = context.createGain();
        bus.gain.value = 0;
        bus.connect(context.destination);
        audio.current = { context, bus };
      }
      const { context, bus } = audio.current;
      void context.resume().catch(() => {});
      bus.gain.setTargetAtTime(.66, context.currentTime, .045);
    } catch {
      // The music can still play when Web Audio is unavailable.
    }
  }, []);

  const startMusic = useCallback((gesture: boolean, manual = false) => {
    const music = musicRef.current;
    if (!music || (!manual && (playback.current === 'muted' || playback.current === 'failed'))) return;
    if (gesture) enableEffects();
    if (playback.current === 'playing' && !music.paused) return;

    const attempt = ++playAttempt.current;
    playback.current = 'starting';
    isEnabled.current = true;
    setEnabled(true);
    setMusicError(null);
    music.volume = .35;
    if (manual && music.error) music.load();

    const onReject = (error: unknown) => {
      if (attempt !== playAttempt.current) return;
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
        playback.current = 'blocked';
        isEnabled.current = false;
        setEnabled(false);
      } else {
        onMusicError();
      }
    };
    try {
      void music.play().then(() => {
        if (attempt === playAttempt.current) playback.current = 'playing';
      }).catch(onReject);
    } catch (error) {
      onReject(error);
    }
  }, [enableEffects, onMusicError]);

  const toggle = useCallback(() => {
    if (!isEnabled.current) {
      rememberMute(false);
      startMusic(true, true);
      return;
    }
    const music = musicRef.current;
    if (!music) return;
    ++playAttempt.current;
    playback.current = 'muted';
    rememberMute(true);
    isEnabled.current = false;
    setEnabled(false);
    setMusicError(null);
    music.pause();
    if (audio.current) {
      audio.current.bus.gain.setTargetAtTime(0, audio.current.context.currentTime, .045);
    }
  }, [startMusic]);

  useEffect(() => {
    const music = musicRef.current;
    try { if (sessionStorage.getItem(muteKey) === '1') playback.current = 'muted'; } catch {}
    startMusic(false);

    const onInteraction = (event: Event) => {
      if (!event.isTrusted || (event.target instanceof Element && event.target.closest('.sound-button'))) return;
      if (event instanceof KeyboardEvent && (event.repeat || !['Enter', ' ', 'ArrowRight', 'ArrowLeft'].includes(event.key))) return;
      // Call play inside the trusted event, before awaiting any work.
      startMusic(true);
    };
    window.addEventListener('click', onInteraction, true);
    window.addEventListener('touchend', onInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', onInteraction, true);
    return () => {
      window.removeEventListener('click', onInteraction, true);
      window.removeEventListener('touchend', onInteraction, true);
      window.removeEventListener('keydown', onInteraction, true);
      playAttempt.current++;
      isEnabled.current = false;
      playback.current = 'idle';
      music?.pause();
      if (audio.current && audio.current.context.state !== 'closed') {
        void audio.current.context.close().catch(() => {});
      }
      audio.current = null;
    };
  }, [startMusic]);

  return { enabled, toggle, play, musicRef, musicError, onMusicError };
}
