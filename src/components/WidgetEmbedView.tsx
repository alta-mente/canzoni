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
  Disc, 
  ChevronUp, 
  ChevronDown, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Music2
} from 'lucide-react';

interface WidgetEmbedViewProps {
  albums?: AlbumData[];
}

export const WidgetEmbedView: React.FC<WidgetEmbedViewProps> = ({ albums = DISCOGRAPHY }) => {
  // Parse parameters from window.location.hash or search
  // e.g. #widget?album=non-ce-vita-su-marte&track=1&style=floating&theme=dark
  const getParams = () => {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    const queryString = queryIndex !== -1 ? hash.slice(queryIndex + 1) : window.location.search.slice(1);
    const searchParams = new URLSearchParams(queryString);

    return {
      albumId: searchParams.get('album') || searchParams.get('albumId') || albums[0]?.id || 'non-ce-vita-su-marte',
      trackParam: searchParams.get('track') || searchParams.get('trackId') || '1',
      style: (searchParams.get('style') || 'floating') as 'floating' | 'card' | 'compact' | 'playlist',
      theme: (searchParams.get('theme') || 'dark') as 'dark' | 'light',
      autoplay: searchParams.get('autoplay') === 'true' || searchParams.get('autoplay') === '1',
      position: searchParams.get('position') || 'bottom-right'
    };
  };

  const [params, setParams] = useState(getParams);

  useEffect(() => {
    const handleHash = () => setParams(getParams());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Selected Album
  const currentAlbum = albums.find((a) => a.id === params.albumId) || albums[0] || DISCOGRAPHY[0];

  // Resolve initial track index
  const getInitialTrackIndex = (): number => {
    if (!currentAlbum || !currentAlbum.tracks.length) return 0;
    const t = params.trackParam;
    // Check if numeric (1-indexed or 0-indexed)
    const num = parseInt(t, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= currentAlbum.tracks.length) return num - 1;
      if (num === 0) return 0;
    }
    // Check by track ID
    const foundIdx = currentAlbum.tracks.findIndex((tr) => tr.id === t || tr.number === num);
    return foundIdx !== -1 ? foundIdx : 0;
  };

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(getInitialTrackIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const currentTrack: Track | undefined = currentAlbum.tracks[currentTrackIndex] || currentAlbum.tracks[0];

  // Setup Audio Source
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioSrc) return;
    const audio = audioRef.current;
    audio.src = resolveAssetUrl(currentTrack.audioSrc);
    audio.load();
    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Autoplay prevented by browser:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, currentAlbum]);

  // Handle Autoplay on mount if requested
  useEffect(() => {
    if (params.autoplay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  // Inform parent window (if in iframe) when minimized/expanded so parent can adjust iframe size
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'WIDGET_RESIZE',
          isMinimized,
          style: params.style
        }, '*');
      } catch {}
    }
  }, [isMinimized, params.style]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Play error:', e);
      });
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
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
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

  // Direct site link to open player
  const fullPlayerUrl = `https://alta-mente.github.io/canzoni/`;

  // ─────────────────────────────────────────────────────────────
  // 1. FLOATING STYLE (with Minimize / Expand bubble toggle)
  // ─────────────────────────────────────────────────────────────
  if (params.style === 'floating') {
    if (isMinimized) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-end select-none font-sans">
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
          />
          <div 
            onClick={() => setIsMinimized(false)}
            className={`cursor-pointer group flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border ${
              isLight 
                ? 'bg-white/95 text-gray-900 border-black/10 shadow-black/20' 
                : 'bg-[#0f1017]/95 text-white border-amber-500/30 shadow-black/60'
            }`}
          >
            {/* Spinning mini vinyl */}
            <div className={`relative w-8 h-8 rounded-full overflow-hidden shadow shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
              <img src={currentAlbum.coverUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 rounded-full border border-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 border border-black" />
            </div>

            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[11px] font-mono font-bold truncate max-w-[130px]">
                {currentTrack.title}
              </span>
              <span className="text-[9px] font-mono opacity-60 truncate">
                {currentAlbum.artist}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-1.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition-colors shrink-0 shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <Maximize2 className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity ml-0.5" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full p-2.5 select-none font-sans flex items-center justify-center">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
        />
        <div
          className={`w-full max-w-[340px] rounded-3xl p-3.5 shadow-2xl border transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10 shadow-black/20'
              : 'bg-[#0e0f17]/95 text-white border-amber-500/25 shadow-black/70'
          }`}
        >
          {/* Header Row: Artist tag + Minimize & Full Player link */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider text-amber-400 uppercase">
              <Sparkles className="w-3 h-3" />
              <span>{currentAlbum.artist}</span>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={fullPlayerUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Apri l'esperienza giradischi 3D completa"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Riduci a icona"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Main Track Row: Cover + Vinyl Animation + Details */}
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              {/* Spinning vinyl disc sliding out slightly */}
              <div 
                className={`absolute top-0 -right-3 w-12 h-12 rounded-full shadow-lg pointer-events-none transition-transform duration-500 ${
                  isPlaying ? 'translate-x-1.5 rotate-45' : 'translate-x-0'
                }`}
              >
                <div className={`w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1c1c1f] to-[#111] p-1 border border-white/20 shadow-inner ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                  <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90 border border-black/40" />
                  </div>
                </div>
              </div>

              {/* Cover Art */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-white/20 z-10 bg-black">
                <img 
                  src={currentTrack.artworkUrl || currentAlbum.coverUrl} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            {/* Title & Album */}
            <div className="min-w-0 flex-1 pl-1">
              <h4 className="font-mono text-xs font-bold truncate leading-tight">
                {currentTrack.title}
              </h4>
              <p className="text-[10px] font-mono text-white/50 truncate mt-0.5">
                {currentAlbum.title} • {String(currentTrack.number).padStart(2, '0')}
              </p>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0"
              title={isPlaying ? 'Pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          {/* Scrubber & Controls Footer */}
          <div className="mt-3 space-y-1.5">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="w-full h-1.5 bg-white/10 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all"
            >
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
              <span>{formatTime(currentTime)}</span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev} 
                  className="hover:text-white transition-colors"
                  title="Brano precedente"
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <button 
                  onClick={handleNext} 
                  className="hover:text-white transition-colors"
                  title="Brano successivo"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
                <button 
                  onClick={toggleMute} 
                  className="hover:text-white transition-colors ml-1"
                  title={isMuted ? 'Riattiva audio' : 'Muto'}
                >
                  {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
                </button>
              </div>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. COMPACT PILL BAR STYLE (Inline banner ~80px)
  // ─────────────────────────────────────────────────────────────
  if (params.style === 'compact') {
    return (
      <div className="w-full h-full p-2 select-none font-sans flex items-center justify-center">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
        />
        <div
          className={`w-full max-w-xl rounded-2xl px-3.5 py-2.5 shadow-xl border flex items-center justify-between gap-3 backdrop-blur-xl ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10'
              : 'bg-[#0f1017]/95 text-white border-amber-500/20'
          }`}
        >
          {/* Cover & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow shrink-0 border border-white/15">
              <img src={currentTrack.artworkUrl || currentAlbum.coverUrl} className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-mono text-xs font-bold truncate">
                  {currentTrack.title}
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 shrink-0">
                  {String(currentTrack.number).padStart(2, '0')}
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/50 truncate">
                {currentAlbum.artist} • {currentAlbum.title}
              </p>
            </div>
          </div>

          {/* Central Progress Bar */}
          <div className="hidden sm:flex flex-col flex-1 max-w-[200px] space-y-1">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="w-full h-1.5 bg-white/10 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all"
            >
              <div 
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-white/40">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Precedente"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition-all shadow"
              title={isPlaying ? 'Pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Successivo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <a
              href={fullPlayerUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors ml-1"
              title="Apri nel player completo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. VINYL CARD STYLE (Standalone In-Article Player ~220px)
  // ─────────────────────────────────────────────────────────────
  if (params.style === 'card') {
    return (
      <div className="w-full h-full p-3 select-none font-sans flex items-center justify-center">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
        />
        <div
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border transition-all duration-300 backdrop-blur-2xl ${
            isLight
              ? 'bg-white/95 text-gray-900 border-black/10'
              : 'bg-[#0f1018]/95 text-white border-amber-500/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
                {currentAlbum.artist}
              </span>
            </div>
            <a
              href={fullPlayerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
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
                <div className={`w-full h-full rounded-full bg-gradient-to-tr from-black via-[#1c1c1f] to-[#111] p-1.5 border border-white/20 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                  <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-amber-400 border border-black/40 flex items-center justify-center text-[7px] font-bold font-mono text-black">
                      {currentTrack.number}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-10 bg-black">
                <img src={currentTrack.artworkUrl || currentAlbum.coverUrl} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="min-w-0 flex-1 pl-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                Traccia {String(currentTrack.number).padStart(2, '0')}
              </span>
              <h3 className="font-mono text-base font-bold text-white truncate mt-0.5">
                {currentTrack.title}
              </h3>
              <p className="text-xs font-mono text-white/50 truncate mt-0.5">
                Album: {currentAlbum.title} ({currentAlbum.year})
              </p>
            </div>
          </div>

          {/* Scrubber & Controls */}
          <div className="mt-4 space-y-2">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="w-full h-2 bg-white/10 hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
            >
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-1">
              <span>{formatTime(currentTime)}</span>

              <div className="flex items-center gap-3">
                <button onClick={handlePrev} className="hover:text-white transition-colors" title="Precedente">
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button onClick={handleNext} className="hover:text-white transition-colors" title="Successivo">
                  <SkipForward className="w-4 h-4" />
                </button>

                <button onClick={toggleMute} className="hover:text-white transition-colors ml-1" title="Audio">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. PLAYLIST / ALBUM JUKEBOX STYLE (~380px)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full p-3 select-none font-sans flex items-center justify-center">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />
      <div
        className={`w-full max-w-xl rounded-3xl p-5 shadow-2xl border transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between ${
          isLight
            ? 'bg-white/95 text-gray-900 border-black/10'
            : 'bg-[#0f1018]/95 text-white border-amber-500/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img src={currentAlbum.coverUrl} className="w-8 h-8 rounded-lg object-cover border border-white/20" />
            <div>
              <h3 className="font-mono text-xs font-bold text-white truncate leading-tight">
                {currentAlbum.title}
              </h3>
              <p className="text-[10px] font-mono text-white/50">{currentAlbum.artist} • {currentAlbum.year}</p>
            </div>
          </div>

          <a
            href={fullPlayerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[10px] font-mono font-bold transition-all"
          >
            <span>Apri Vinile 3D</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Current Track Playbar */}
        <div className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-amber-400">In riproduzione</span>
            <div className="font-mono text-sm font-bold text-white truncate">
              {String(currentTrack.number).padStart(2, '0')}. {currentTrack.title}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handlePrev} className="p-1 text-white/60 hover:text-white transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition-all shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={handleNext} className="p-1 text-white/60 hover:text-white transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrubber */}
        <div className="space-y-1 pb-3">
          <div 
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/10 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all"
          >
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border-t border-white/10 pt-2">
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
                    ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 text-[10px] opacity-50">{track.number}</span>
                  <span className="truncate">{track.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && isPlaying && <Music2 className="w-3 h-3 text-amber-400 animate-pulse" />}
                  <span className="text-[10px] opacity-50">{track.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
