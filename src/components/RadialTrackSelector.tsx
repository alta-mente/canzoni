import React, { useState, useEffect, useCallback } from 'react';
import { Track } from '../data/albumData';
import { Play, Pause, X, Disc, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface RadialTrackSelectorProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onClose: () => void;
  isLightMode: boolean;
  albumCover?: string;
  artistName?: string;
}

export const RadialTrackSelector: React.FC<RadialTrackSelectorProps> = ({
  tracks,
  currentIndex,
  isPlaying,
  onSelectTrack,
  onClose,
  isLightMode,
  albumCover,
  artistName = 'Alessandro Rocchi',
}) => {
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(currentIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Track window resizing
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = tracks.length;
  const isMobile = windowDimensions.width < 768;
  const activeFocusIndex = hoveredIndex !== null ? hoveredIndex : selectedPreviewIndex;
  const focusTrack = tracks[activeFocusIndex] || tracks[0];

  // Navigate tracks
  const handlePrev = useCallback(() => {
    setSelectedPreviewIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setSelectedPreviewIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const handleConfirmTrack = useCallback(
    (indexToPlay: number) => {
      onSelectTrack(indexToPlay);
      onClose();
    },
    [onSelectTrack, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleConfirmTrack(activeFocusIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFocusIndex, handleConfirmTrack, handleNext, handlePrev, onClose]);

  // Touch Swipe for mobile navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (diffX > 45) {
      handlePrev();
    } else if (diffX < -45) {
      handleNext();
    }
    setTouchStartX(null);
  };

  // ─────────────────────────────────────────────────────────────
  // FULL-SCREEN CELESTIAL ARC GEOMETRY
  // ─────────────────────────────────────────────────────────────
  const { width, height } = windowDimensions;

  // On desktop: arc spans across the screen with ample room for large vinyl discs
  // On mobile: arc scales to mobile viewport
  const rx = isMobile
    ? Math.min(width * 0.44, 210)
    : Math.min(width * 0.44, 640);

  const ry = isMobile
    ? Math.min(height * 0.28, 240)
    : Math.min(height * 0.35, 360);

  // Origin (focal center) of the semicircle
  const cx = width / 2;
  const cy = isMobile ? height * 0.48 : height * 0.58;

  // Sweep from left to right: 170 deg down to 10 deg
  const startDeg = isMobile ? 172 : 168;
  const endDeg = isMobile ? 8 : 12;

  // SVG guide path for the celestial orbit
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const svgStartX = cx + rx * Math.cos(startRad);
  const svgStartY = cy - ry * Math.sin(startRad);
  const svgEndX = cx + rx * Math.cos(endRad);
  const svgEndY = cy - ry * Math.sin(endRad);

  const svgArcPath = `M ${svgStartX} ${svgStartY} A ${rx} ${ry} 0 0 1 ${svgEndX} ${svgEndY}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selezione traccia a schermo intero"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300 ${
        isLightMode
          ? 'bg-slate-950/95 text-white'
          : 'bg-[#05060b]/95 text-white'
      } backdrop-blur-3xl`}
    >
      {/* Dynamic Cosmic Gradient Background Mesh */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: `radial-gradient(circle at 50% ${
            isMobile ? '45%' : '55%'
          }, ${focusTrack.colorDark || '#f59e0b'}30 0%, rgba(12, 14, 24, 0.75) 45%, rgba(5, 6, 11, 0.98) 85%)`,
        }}
      />

      {/* Atmospheric Vinyl Grooves Watermark in the background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] overflow-hidden">
        <div className="w-[1200px] h-[1200px] rounded-full border-[12px] border-white/30 flex items-center justify-center animate-spin-slow">
          <div className="w-[1000px] h-[1000px] rounded-full border border-white/20" />
          <div className="w-[800px] h-[800px] rounded-full border border-white/20" />
          <div className="w-[600px] h-[600px] rounded-full border border-white/20" />
          <div className="w-[400px] h-[400px] rounded-full border border-white/20" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP CINEMATIC HEADER BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Orbita Discografica</span>
          </div>

          <div className="hidden sm:block text-xs font-mono opacity-50 tracking-wider">
            {artistName.toUpperCase()} • 10 TRACCE
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md"
          title="Chiudi orbita brani (ESC)"
          aria-label="Chiudi orbita brani"
        >
          <span>CHIUDI</span>
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
            <X className="w-3.5 h-3.5" />
          </div>
          <span className="hidden md:inline text-[10px] opacity-50 font-normal">ESC</span>
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN STAGE: THE CELESTIAL SEMICIRCLE ARC & VINYL DISCS
          ───────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* SVG Orbit Path Line with Glow */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="orbitLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
            <filter id="orbitGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Halo Glow Underneath */}
          <path
            d={svgArcPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={isMobile ? '4' : '8'}
            className="opacity-25 blur-sm"
          />

          {/* Primary Dashed Celestial Arc */}
          <path
            d={svgArcPath}
            fill="none"
            stroke="url(#orbitLineGrad)"
            strokeWidth={isMobile ? '1.5' : '2'}
            strokeDasharray={isMobile ? '4 4' : '6 6'}
            filter="url(#orbitGlowFilter)"
            className="opacity-80"
          />
        </svg>

        {/* ─────────────────────────────────────────────────────────────
            VINYL COVER DISCS (Distributed along the full-screen semicircle)
            ───────────────────────────────────────────────────────────── */}
        {tracks.map((track, idx) => {
          const isSelected = idx === currentIndex;
          const isFocused = idx === activeFocusIndex;
          const isHovered = idx === hoveredIndex;

          const tFrac = idx / Math.max(1, total - 1);
          const angleDeg = startDeg - tFrac * (startDeg - endDeg);
          const angleRad = (angleDeg * Math.PI) / 180;

          const posX = cx + rx * Math.cos(angleRad);
          const posY = cy - ry * Math.sin(angleRad);

          const discArtwork = track.artworkUrl || albumCover;

          return (
            <div
              key={track.id}
              style={{
                position: 'absolute',
                left: `${posX}px`,
                top: `${posY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="z-30 select-none"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPreviewIndex(idx);
                  handleConfirmTrack(idx);
                }}
                onMouseEnter={() => {
                  setHoveredIndex(idx);
                  setSelectedPreviewIndex(idx);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-label={`Traccia ${track.number}: ${track.title}`}
                className={`group relative flex flex-col items-center focus:outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isFocused
                    ? 'scale-115 sm:scale-125 z-40'
                    : 'scale-90 sm:scale-100 opacity-80 hover:opacity-100 z-20'
                }`}
              >
                {/* Floating Track Title Tooltip (on hover or focus) */}
                <div
                  className={`absolute -top-9 sm:-top-11 px-2.5 py-1 rounded-lg backdrop-blur-xl border border-white/20 bg-black/85 text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap pointer-events-none transition-all duration-200 shadow-xl ${
                    isFocused
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-2 scale-95'
                  } ${isFocused ? 'text-amber-400 border-amber-400/40' : 'text-white'}`}
                >
                  {track.number}. {track.title}
                </div>

                {/* The Vinyl Record Disc */}
                <div
                  className={`relative rounded-full aspect-square overflow-hidden cursor-pointer transition-all duration-300 ${
                    isMobile
                      ? 'w-[52px] h-[52px]'
                      : 'w-24 h-24 lg:w-28 lg:h-28'
                  } ${
                    isFocused
                      ? 'border-2 sm:border-3 border-amber-400 ring-4 sm:ring-8 ring-amber-400/35 shadow-[0_0_35px_rgba(245,158,11,0.7)]'
                      : isSelected
                      ? 'border-2 border-white ring-4 ring-white/30 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'border border-white/30 hover:border-white/70 shadow-lg'
                  }`}
                  style={{
                    backgroundColor: '#0a0b10',
                  }}
                >
                  {/* Outer Vinyl Grooves Sheen */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />
                  <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none z-10" />
                  <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/10 pointer-events-none z-10" />
                  <div className="absolute inset-3 sm:inset-5 rounded-full border border-white/10 pointer-events-none z-10" />

                  {/* High-Resolution Artwork in Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={discArtwork}
                      alt={track.title}
                      className={`w-full h-full object-cover transition-transform duration-700 pointer-events-none ${
                        isSelected && isPlaying
                          ? 'animate-spin-slow'
                          : isHovered
                          ? 'scale-110'
                          : 'scale-100'
                      }`}
                    />
                  </div>

                  {/* Center Vinyl Spindle Hole with Brass Ring */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-[#05060a] border-2 border-amber-400/80 shadow-md pointer-events-none z-20 flex items-center justify-center">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Conic Specular Sheen (Vinyl Reflection) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-20 opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{
                      background:
                        'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.3) 0deg, transparent 60deg, rgba(255,255,255,0.2) 180deg, transparent 240deg, rgba(255,255,255,0.3) 360deg)',
                    }}
                  />
                </div>

                {/* Track Number Badge at bottom of disc */}
                <div
                  className={`mt-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] sm:text-[11px] font-bold tracking-wider shadow-md transition-all pointer-events-none whitespace-nowrap ${
                    isFocused
                      ? 'bg-amber-400 text-black font-black scale-110 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : isSelected
                      ? 'bg-white text-black font-bold'
                      : 'bg-black/80 text-white/80 border border-white/20'
                  }`}
                >
                  {String(track.number).padStart(2, '0')}
                </div>
              </button>
            </div>
          );
        })}

        {/* ─────────────────────────────────────────────────────────────
            THE SPOTLIGHT HERO CARD: FOCAL CENTER OF THE ENTIRE EXPERIENCE
            ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: `${cx}px`,
            top: isMobile ? `${cy + 60}px` : `${cy + 10}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="z-40 w-[92vw] max-w-xl transition-all duration-300"
        >
          <div
            className={`p-4 sm:p-6 rounded-3xl backdrop-blur-3xl border shadow-2xl transition-all duration-300 ${
              isLightMode
                ? 'bg-slate-900/90 border-white/20 text-white shadow-black/80'
                : 'bg-[#0f111d]/90 border-white/15 text-white shadow-black/90'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Artwork & Mini Vinyl Peek */}
              <div className="relative shrink-0 group">
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-10">
                  <img
                    src={focusTrack.artworkUrl || albumCover}
                    alt={focusTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Subtle Vinyl Disc Peeking out behind the jacket */}
                <div
                  className={`absolute -right-3 -top-2 w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-white/20 bg-black/90 shadow-xl pointer-events-none transition-transform duration-500 ${
                    focusTrack.number === activeFocusIndex + 1 ? 'translate-x-3 rotate-45' : ''
                  }`}
                >
                  <div className="absolute inset-1.5 rounded-full border border-white/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400/80" />
                </div>
              </div>

              {/* Information & Lyric Quote */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 font-mono text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-widest">
                  <span>TRACCIA {String(focusTrack.number).padStart(2, '0')} / {total}</span>
                  <span>•</span>
                  <span>{focusTrack.duration}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white mt-1 truncate">
                  {focusTrack.title}
                </h3>

                {/* Poetic quote or mood */}
                <p className="text-xs sm:text-sm font-serif italic text-white/70 mt-1 line-clamp-2 leading-relaxed">
                  {focusTrack.storyQuote ? `"${focusTrack.storyQuote}"` : focusTrack.mood || artistName}
                </p>

                {/* Control Action Buttons */}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  {/* Prev Track in Spotlight */}
                  <button
                    onClick={handlePrev}
                    type="button"
                    title="Traccia precedente (Freccia Sinistra)"
                    className="p-2 sm:p-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Play CTA Button */}
                  <button
                    onClick={() => handleConfirmTrack(activeFocusIndex)}
                    type="button"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold font-sans text-xs sm:text-sm tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                  >
                    {activeFocusIndex === currentIndex && isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>IN RIPRODUZIONE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                        <span>ASCOLTA QUESTO BRANO</span>
                      </>
                    )}
                  </button>

                  {/* Next Track in Spotlight */}
                  <button
                    onClick={handleNext}
                    type="button"
                    title="Traccia successiva (Freccia Destra)"
                    className="p-2 sm:p-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM FOOTER: SHORTCUTS & HINTS
          ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-30 w-full px-4 py-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-xs font-mono text-white/50 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-amber-400" />
            <span>Tocca un vinile per ascoltarlo</span>
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Usa le frecce della tastiera ← →</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden xs:inline">INVIO per riprodurre</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 font-bold">ESC per uscire</span>
        </div>
      </footer>
    </div>
  );
};
