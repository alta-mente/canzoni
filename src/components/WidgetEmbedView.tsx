import React, { useState, useEffect, useRef } from 'react';
import { AlbumData, Track, DISCOGRAPHY, resolveAssetUrl } from '../data/albumData';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Sparkles,
  Music2
} from 'lucide-react';

interface WidgetEmbedViewProps {
  albums?: AlbumData[];
}

export const WidgetEmbedView: React.FC<WidgetEmbedViewProps> = ({ albums = DISCOGRAPHY }) => {
  // Parse parameters from window.location.hash or search
  const getParams = () => {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    const queryString = queryIndex !== -1 ? hash.slice(queryIndex + 1) : window.location.search.slice(1);
    const searchParams = new URLSearchParams(queryString);

    return {
      albumId: searchParams.get('album') || searchParams.get('albumId') || albums[0]?.id || 'non-ce-vita-su-marte',
      trackParam: searchParams.get('track') || searchParams.get('trackId') || '1',
      style: (searchParams.get('style') || 'floating') as 'floating' | 'pill' | 'card' | 'compact' | 'playlist',
      theme: (searchParams.get('theme') || 'dark') as 'dark' | 'light',
      autoplay: searchParams.get('autoplay') === 'true' || searchParams.get('autoplay') === '1'
    };
  };

  const [params, setParams] = useState(getParams);

  useEffect(() => {
    const handleHash = () => setParams(getParams());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const currentAlbum = albums.find((a) => a.id === params.albumId) || albums[0] || DISCOGRAPHY[0];

  const getInitialTrackIndex = (): number => {
    if (!currentAlbum || !currentAlbum.tracks.length) return 0;
    const t = params.trackParam;
    const num = parseInt(t, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= currentAlbum.tracks.length) return num - 1;
      if (num === 0) return 0;
    }
    const foundIdx = currentAlbum.tracks.findIndex((tr) => tr.id === t || tr.number === num);
    return foundIdx !== -1 ? foundIdx : 0;
  };

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(getInitialTrackIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const currentTrack: Track | undefined = currentAlbum.tracks[currentTrackIndex] || currentAlbum.tracks[0];

  // Helper to get bulletproof absolute URL for audio
  const getAudioUrl = (rawSrc?: string): string => {
    if (!rawSrc) return '';
    const resolved = resolveAssetUrl(rawSrc);
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
    try {
      // Resolve against current origin (e.g. https://alta-mente.github.io/canzoni/ or localhost:5173/)
      return new URL(resolved, window.location.origin).href;
    } catch {
      return resolved;
    }
  };

  // Sync audio src when track or album changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioSrc) return;
    const audio = audioRef.current;
    const targetSrc = getAudioUrl(currentTrack.audioSrc);

    if (audio.src !== targetSrc) {
      audio.src = targetSrc;
      audio.load();
      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn('Playback error on track change:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentAlbum]);

  // Handle Autoplay on mount if explicitly allowed
  useEffect(() => {
    if (params.autoplay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        if (!audio.src || audio.src === window.location.href) {
          audio.src = getAudioUrl(currentTrack.audioSrc);
          audio.load();
        }
        await audio.play();
      } catch (err) {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleNext = () => {
    if (!currentAlbum.tracks.length) return;
    setCurrentTrackIndex((prev) => (prev + 1) % currentAlbum.tracks.length);
  };

  const handlePrev = () => {
    if (!currentAlbum.tracks.length) return;
    setCurrentTrackIndex((prev) => (prev - 1 + currentAlbum.tracks.length) % currentAlbum.tracks.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = fraction * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLight = params.theme === 'light';
  const fullPlayerUrl = `https://alta-mente.github.io/canzoni/`;

  return (
    <div className="w-full h-full select-none font-sans overflow-hidden bg-transparent flex items-center justify-center p-1.5 sm:p-2">
      {/* Persistent Audio Engine */}
      <audio
        ref={audioRef}
        src={getAudioUrl(currentTrack?.audioSrc)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
        preload="metadata"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING MINI CARD (Ideal for bottom-right corner ~320x130)
          ───────────────────────────────────────────────────────────── */}
      {params.style === 'floating' && (
        <div
          className={`w-full h-full max-w-[340px] rounded-2xl p-3 shadow-2xl border transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10 shadow-black/20'
              : 'bg-[#0c0d15]/95 text-white border-white/15 shadow-black/80'
          }`}
        >
          {/* Top row: Artwork with peeking vinyl + Track info + Play button */}
          <div className="flex items-center gap-3">
            {/* Cover with rotating vinyl */}
            <div className="relative shrink-0 w-11 h-11">
              <div 
                className={`absolute top-0 right-0 w-11 h-11 rounded-full shadow pointer-events-none transition-transform duration-500 ${
                  isPlaying ? 'translate-x-3 rotate-90' : 'translate-x-0'
                }`}
              >
                <div 
                  className={`w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1c1c1f] to-[#111] p-1 border border-white/20 shadow-inner ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '3s' }}
                >
                  <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black/40" />
                  </div>
                </div>
              </div>

              <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow border border-white/20 z-10 bg-black">
                <img 
                  src={resolveAssetUrl(currentTrack.artworkUrl || currentAlbum.coverUrl)} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 pl-1">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                  {currentAlbum.artist}
                </span>
                <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${isLight ? 'bg-black/10 text-gray-700' : 'bg-white/10 text-white/60'}`}>
                  {String(currentTrack.number).padStart(2, '0')}
                </span>
              </div>
              <h4 className={`font-mono text-xs font-bold truncate leading-tight mt-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {currentTrack.title}
              </h4>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${
                isLight
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
              }`}
              title={isPlaying ? 'Pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          {/* Bottom row: Interactive Scrubber + Controls */}
          <div className="mt-2 space-y-1">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className={`w-full h-1.5 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
            >
              <div 
                className={`h-full rounded-full transition-all duration-100 ${isLight ? 'bg-black' : 'bg-white'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className={`flex items-center justify-between text-[9px] font-mono pt-0.5 ${isLight ? 'text-gray-600' : 'text-white/50'}`}>
              <span>{formatTime(currentTime)}</span>

              <div className="flex items-center gap-2">
                <button onClick={handlePrev} className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Precedente">
                  <SkipBack className="w-3 h-3" />
                </button>
                <button onClick={handleNext} className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Successivo">
                  <SkipForward className="w-3 h-3" />
                </button>
                <button onClick={toggleMute} className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Volume">
                  {isMuted ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <a
                  href={fullPlayerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`}
                  title="Apri il giradischi 3D completo"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING PILL BAR (Ultra-compact ~250x52)
          ───────────────────────────────────────────────────────────── */}
      {params.style === 'pill' && (
        <div
          className={`w-full h-full max-w-[280px] rounded-full px-3 py-1.5 shadow-2xl border flex items-center justify-between gap-2.5 backdrop-blur-2xl transition-all ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10 shadow-black/15'
              : 'bg-[#0c0d15]/95 text-white border-white/15 shadow-black/80'
          }`}
        >
          {/* Mini spinning vinyl avatar */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow shrink-0">
            <div 
              className={`w-full h-full rounded-full ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3.5s' }}
            >
              <img 
                src={resolveAssetUrl(currentTrack.artworkUrl || currentAlbum.coverUrl)} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute inset-0 rounded-full border border-black/40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-400 border border-black" />
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className={`font-mono text-[11px] font-bold truncate leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {currentTrack.title}
            </h4>
            <p className={`text-[9px] font-mono truncate ${isLight ? 'text-gray-500 font-medium' : 'text-white/50'}`}>
              {currentAlbum.artist}
            </p>
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-all active:scale-95 shrink-0 cursor-pointer ${
              isLight
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
            }`}
            title={isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. COMPACT BANNER STYLE (Horizontal bar for in-page ~80px)
          ───────────────────────────────────────────────────────────── */}
      {params.style === 'compact' && (
        <div
          className={`w-full max-w-xl rounded-2xl px-4 py-2.5 shadow-xl border flex items-center justify-between gap-3 backdrop-blur-xl ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10'
              : 'bg-[#0c0d15]/95 text-white border-white/15'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow shrink-0 border border-white/15">
              <img 
                src={resolveAssetUrl(currentTrack.artworkUrl || currentAlbum.coverUrl)} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className={`font-mono text-xs font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {currentTrack.title}
                </h4>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${isLight ? 'bg-black/5 text-gray-700' : 'bg-white/10 text-white/70'}`}>
                  {String(currentTrack.number).padStart(2, '0')}
                </span>
              </div>
              <p className={`text-[10px] font-mono truncate ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                {currentAlbum.artist} • {currentAlbum.title}
              </p>
            </div>
          </div>

          {/* Central Progress Bar */}
          <div className="hidden sm:flex flex-col flex-1 max-w-[200px] space-y-1">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className={`w-full h-1.5 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
            >
              <div className={`h-full rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} style={{ width: `${progressPercent}%` }} />
            </div>
            <div className={`flex justify-between text-[8px] font-mono ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handlePrev} className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-gray-600 hover:text-black' : 'text-white/60 hover:text-white'}`}>
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={togglePlay}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow cursor-pointer active:scale-95 ${
                isLight ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={handleNext} className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-gray-600 hover:text-black' : 'text-white/60 hover:text-white'}`}>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <a
              href={fullPlayerUrl}
              target="_blank"
              rel="noreferrer"
              className={`p-1.5 transition-colors ml-1 cursor-pointer ${isLight ? 'text-gray-500 hover:text-black' : 'text-white/40 hover:text-white'}`}
              title="Apri nel player completo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. VINYL CARD STYLE (Standalone In-Article Player ~220px)
          ───────────────────────────────────────────────────────────── */}
      {params.style === 'card' && (
        <div
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border transition-all duration-300 backdrop-blur-2xl ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10'
              : 'bg-[#0c0d15]/95 text-white border-white/15'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 mb-3 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {currentAlbum.artist}
              </span>
            </div>
            <a
              href={fullPlayerUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${isLight ? 'text-gray-600 hover:text-black' : 'text-white/70 hover:text-white'}`}
            >
              <span>Esperienza 3D</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Center Stage: Cover with Vinyl Disc Peeking */}
          <div className="flex items-center gap-4 py-1">
            <div className="relative shrink-0">
              <div 
                className={`absolute top-0 right-0 w-20 h-20 rounded-full shadow-xl pointer-events-none transition-transform duration-700 ${
                  isPlaying ? 'translate-x-6 rotate-90' : 'translate-x-2'
                }`}
              >
                <div 
                  className={`w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1c1c1f] to-[#111] p-1.5 border border-white/20 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '4s' }}
                >
                  <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-zinc-600 border border-white/30 flex items-center justify-center text-[7px] font-bold font-mono text-white">
                      {currentTrack.number}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-10 bg-black">
                <img 
                  src={resolveAssetUrl(currentTrack.artworkUrl || currentAlbum.coverUrl)} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 pl-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest block ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                Traccia {String(currentTrack.number).padStart(2, '0')}
              </span>
              <h3 className={`font-mono text-base font-bold truncate mt-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {currentTrack.title}
              </h3>
              <p className={`text-xs font-mono truncate mt-0.5 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                Album: {currentAlbum.title} ({currentAlbum.year})
              </p>
            </div>
          </div>

          {/* Scrubber & Controls */}
          <div className="mt-4 space-y-2">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className={`w-full h-2 rounded-full cursor-pointer relative overflow-hidden transition-all ${isLight ? 'bg-black/10 hover:h-2.5' : 'bg-white/10 hover:h-2.5'}`}
            >
              <div 
                className={`h-full rounded-full ${isLight ? 'bg-black' : 'bg-white'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className={`flex items-center justify-between text-xs font-mono pt-1 ${isLight ? 'text-gray-600' : 'text-white/50'}`}>
              <span>{formatTime(currentTime)}</span>

              <div className="flex items-center gap-3">
                <button onClick={handlePrev} className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Precedente">
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
                    isLight ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button onClick={handleNext} className={`transition-colors cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Successivo">
                  <SkipForward className="w-4 h-4" />
                </button>

                <button onClick={toggleMute} className={`transition-colors ml-1 cursor-pointer ${isLight ? 'hover:text-black text-gray-700' : 'hover:text-white text-white/60'}`} title="Audio">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. PLAYLIST JUKEBOX STYLE (~380px)
          ───────────────────────────────────────────────────────────── */}
      {params.style === 'playlist' && (
        <div
          className={`w-full max-w-xl rounded-3xl p-5 shadow-2xl border transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10'
              : 'bg-[#0c0d15]/95 text-white border-white/15'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center gap-2.5">
              <img src={resolveAssetUrl(currentAlbum.coverUrl)} className="w-8 h-8 rounded-lg object-cover border border-white/20" />
              <div>
                <h3 className={`font-mono text-xs font-bold truncate leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {currentAlbum.title}
                </h3>
                <p className={`text-[10px] font-mono ${isLight ? 'text-gray-500' : 'text-white/50'}`}>{currentAlbum.artist} • {currentAlbum.year}</p>
              </div>
            </div>

            <a
              href={fullPlayerUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border ${
                isLight
                  ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-800'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              <span>Apri Vinile 3D</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Current Track Playbar */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className={`text-[9px] font-mono uppercase ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>In riproduzione</span>
              <div className={`font-mono text-sm font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {String(currentTrack.number).padStart(2, '0')}. {currentTrack.title}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handlePrev} className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-gray-600 hover:text-black' : 'text-white/60 hover:text-white'}`}>
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow cursor-pointer active:scale-95 ${
                  isLight ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200 shadow-white/10'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={handleNext} className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-gray-600 hover:text-black' : 'text-white/60 hover:text-white'}`}>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div className="space-y-1 pb-3">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className={`w-full h-1.5 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
            >
              <div className={`h-full rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} style={{ width: `${progressPercent}%` }} />
            </div>
            <div className={`flex justify-between text-[9px] font-mono ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Tracklist Table */}
          <div className={`max-h-44 overflow-y-auto space-y-1 pr-1 border-t pt-2 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            {currentAlbum.tracks.map((track, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <div
                  key={track.id || idx}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? (isLight ? 'bg-black/10 text-black font-bold border border-black/20' : 'bg-white/15 text-white font-bold border border-white/20')
                      : (isLight ? 'hover:bg-black/5 text-gray-700 hover:text-black' : 'hover:bg-white/5 text-white/70 hover:text-white')
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 text-[10px] opacity-50">{track.number}</span>
                    <span className="truncate">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && isPlaying && <Music2 className={`w-3 h-3 animate-pulse ${isLight ? 'text-black' : 'text-white'}`} />}
                    <span className="text-[10px] opacity-50">{track.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
