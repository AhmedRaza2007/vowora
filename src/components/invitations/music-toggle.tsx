'use client';

import { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play } from 'lucide-react';

/**
 * Background music control. Audio is created lazily and only ever plays after an explicit
 * user gesture (never autoplay). Cleans up on unmount.
 */
export function MusicToggle({ src, accent }: { src: string; accent: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function toggle() {
    if (!audioRef.current) {
      const audio = new Audio(src);
      audio.loop = true;
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Pause music' : 'Play music'}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur transition-colors"
      style={{ borderColor: `${accent}66`, color: accent }}
    >
      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      <Music className="h-3.5 w-3.5" />
      {playing ? 'Pause music' : 'Play music'}
    </button>
  );
}