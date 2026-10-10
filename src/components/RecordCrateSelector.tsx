import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../data/albumData';
import { Play, Pause, X, ChevronLeft, ChevronRight, Disc, Sparkles } from 'lucide-react';

interface RecordCrateSelectorProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onClose: () => void;
  isLightMode: boolean;
  albumCover?: string;
  artistName?: string;
  albumTitle?: string;
}

export const RecordCrateSelector: React.FC<RecordCrateSelectorProps> = ({
  tracks,
  currentIndex,
  isPlaying,
  onSelectTrack,
  onClose,
  isLightMode,
  albumCover,
  artistName = 'Alessandro Rocchi',
  albumTitle = "Non C'è Vita su Marte",
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(currentIndex);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const total = tracks.length;
  const activeTrack = tracks[activeIndex] || tracks[0];

  // Touch Swipe Gesture State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Wheel debounce
  const wheelLockRef = useRef<boolean>(false);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const handleConfirmTrack = useCallback(
    (indexToPlay: number) => {
      setIsExtracting(true);
      setTimeout(() => {
        onSelectTrack(indexToPlay);
        onClose();
      }, 400);
    },
    [onSelectTrack, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleConfirmTrack(activeIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleConfirmTrack, handleNext, handlePrev, onClose]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe takes precedence
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mouse wheel flipping
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLockRef.current) return;
    if (Math.abs(e.deltaY) > 25 || Math.abs(e.deltaX) > 25) {
      wheelLockRef.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 220);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cofanetto dei vinili"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300"
    >
      {/* Dynamic ambient backlight matching the active record's artwork tone */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${
            activeTrack.colorDark || '#f59e0b'
          }45 0%, rgba(10,12,18,0.85) 60%, rgba(2,3,6,0.98) 100%)`,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          TOP BAR: TITLE & CLOSE BUTTON
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 w-full max-w-4xl mx-auto flex items-center justify-between pt-1 sm:pt-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Record Crate • Cassa Vinili</span>
          </div>
          <span className="hidden sm:inline font-mono text-xs opacity-50 tracking-wider">
            {total} DISCHI DA SFOGLIARE
          </span>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md"
          title="Chiudi cassa vinili (ESC)"
        >
          <span>CHIUDI</span>
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
            <X className="w-3.5 h-3.5" />
          </div>
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          CENTER 3D CRATE STAGE
          3D Perspective viewport where records are stacked and flipped
          ───────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full flex items-center justify-center my-auto overflow-visible">
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          type="button"
          aria-label="Disco precedente"
          className="absolute left-1 sm:left-4 md:left-8 z-40 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white/70 hover:text-white transition-all duration-200 hover:scale-115 active:scale-90 shadow-2xl backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* 3D Crate Perspective Wrapper */}
        <div
          className="relative w-[280px] sm:w-[360px] md:w-[420px] h-[280px] sm:h-[350px] md:h-[400px] flex items-end justify-center"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '50% 30%',
          }}
        >
          {/* Crate Physical Box Structure (Wooden / Matte Audiophile Crate) */}
          <div
            className="absolute inset-x-0 bottom-0 h-[190px] sm:h-[240px] md:h-[270px] rounded-2xl border-2 border-[#2b241e] bg-gradient-to-b from-[#181310] via-[#120e0b] to-[#0a0806] shadow-[0_40px_100px_rgba(0,0,0,0.95)] overflow-hidden pointer-events-none z-0"
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
          >
            {/* Interior Depth Shadow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

            {/* Brass Corner Brackets */}
            <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-amber-500/40 rounded-tl-sm" />
            <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-amber-500/40 rounded-tr-sm" />
            <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-amber-500/40 rounded-bl-sm" />
            <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-amber-500/40 rounded-br-sm" />

            {/* Front Metallic Plaque */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded bg-[#0d0a08] border border-amber-500/30 text-amber-400/90 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em] shadow-inner text-center whitespace-nowrap">
              {artistName} • CRATE NO. {String(activeIndex + 1).padStart(2, '0')}/{total}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              THE 10 VINYL SLEEVES IN 3D PERSPECTIVE (Flipping Stack)
              ───────────────────────────────────────────────────────── */}
          <div
            className="relative w-[230px] sm:w-[290px] md:w-[330px] h-[230px] sm:h-[290px] md:h-[330px] mb-6 sm:mb-8"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {tracks.map((track, idx) => {
              const diff = idx - activeIndex;
              const isSelected = diff === 0;
              const discArt = track.artworkUrl || albumCover;

              // Calculate 3D transformation for flip physics
              let transformStyle = '';
              let zIndex = 20;
              let opacity = 1;

              if (diff === 0) {
                // Active sleeve: upright in the spotlight
                transformStyle = `translate3d(0, ${isExtracting ? '-60px' : '-16px'}, 60px) rotateX(0deg) scale(${isExtracting ? 1.08 : 1.04})`;
                zIndex = 40;
                opacity = 1;
              } else if (diff < 0) {
                // Sleeves before active (flipped forward towards viewer)
                const step = activeIndex - idx; // 1, 2, 3...
                const forwardAngle = Math.min(-24 - step * 2, -45);
                const offsetY = 12 + step * 4;
                const offsetZ = -step * 18;
                transformStyle = `translate3d(0, ${offsetY}px, ${offsetZ}px) rotateX(${forwardAngle}deg) scale(${Math.max(0.92, 1 - step * 0.02)})`;
                zIndex = 30 - step;
                opacity = Math.max(0.35, 1 - step * 0.12);
              } else {
                // Sleeves after active (leaning backward in stack)
                const step = idx - activeIndex; // 1, 2, 3...
                const backwardAngle = Math.min(16 + step * 2, 36);
                const offsetY = -step * 6;
                const offsetZ = -step * 24;
                transformStyle = `translate3d(0, ${offsetY}px, ${offsetZ}px) rotateX(${backwardAngle}deg) scale(${Math.max(0.9, 1 - step * 0.025)})`;
                zIndex = 20 - step;
                opacity = Math.max(0.3, 1 - step * 0.12);
              }

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (isSelected) {
                      handleConfirmTrack(idx);
                    } else {
                      setActiveIndex(idx);
                    }
                  }}
                  style={{
                    transform: transformStyle,
                    zIndex,
                    opacity,
                    transition:
                      'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, z-index 0.45s step-end',
                    transformOrigin: 'bottom center',
                  }}
                  className={`absolute inset-0 cursor-pointer select-none group focus:outline-none`}
                >
                  {/* Cardboard Jacket Container */}
                  <div
                    className={`relative w-full h-full rounded-[4px] overflow-hidden shadow-2xl transition-all duration-300 border ${
                      isSelected
                        ? 'border-amber-400/80 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30'
                        : 'border-white/20 hover:border-white/50 shadow-black/80'
                    }`}
                    style={{
                      backgroundColor: '#121216',
                    }}
                  >
                    {/* Artwork on the Jacket */}
                    <img
                      src={discArt}
                      alt={track.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Cardboard Texture & Ring Wear Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/[0.12] pointer-events-none" />
                    <div className="absolute inset-5 rounded-full border border-white/[0.08] pointer-events-none" />
                    <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/35 pointer-events-none" />

                    {/* Left Spine with printed text */}
                    <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/70 via-black/30 to-transparent border-r border-white/10 pointer-events-none flex items-center justify-center overflow-hidden">
                      <span className="text-[6px] font-mono tracking-widest uppercase -rotate-90 text-white/50 whitespace-nowrap">
                        TRK {String(track.number).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Top Index Divider Tab (Always visible in stack!) */}
                    <div
                      className={`absolute top-0 inset-x-0 h-6 px-2.5 flex items-center justify-between text-[9px] font-mono font-bold tracking-wider uppercase border-b transition-colors ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'bg-black/75 text-white/90 border-white/20 backdrop-blur-md'
                      }`}
                    >
                      <span className="truncate">
                        {String(track.number).padStart(2, '0')}. {track.title}
                      </span>
                      <span className="opacity-70 text-[8px] shrink-0 ml-1">
                        {track.duration}
                      </span>
                    </div>

                    {/* Active Play Overlay Indicator on Hover */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-14 h-14 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vinyl Disc Sliding Out of the Jacket (Tactile Peek) */}
                  <div
                    style={{
                      transform: isSelected
                        ? isExtracting
                          ? 'translateY(-110px) rotate(45deg)'
                          : 'translateY(-36px) rotate(15deg)'
                        : 'translateY(0px) rotate(0deg)',
                      opacity: isSelected ? 1 : 0,
                      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                    }}
                    className="absolute -top-3 inset-x-4 h-[210px] sm:h-[260px] md:h-[300px] rounded-full border-2 border-white/20 bg-[#08090d] shadow-2xl -z-10 pointer-events-none overflow-hidden flex items-center justify-center"
                  >
                    {/* Vinyl Grooves */}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-3 rounded-full border border-white/10" />
                    <div className="absolute inset-6 rounded-full border border-white/10" />
                    <div className="absolute inset-9 rounded-full border border-white/10" />

                    {/* Center Vinyl Label with Artwork */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-400/70 overflow-hidden relative shadow-md">
                      <img
                        src={discArt}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#05060a] border border-white/80" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          type="button"
          aria-label="Disco successivo"
          className="absolute right-1 sm:right-4 md:right-8 z-40 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white/70 hover:text-white transition-all duration-200 hover:scale-115 active:scale-90 shadow-2xl backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SPOTLIGHT HERO CONTROLLER: ACTIVE TRACK INFO & CTA
          ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-30 w-full max-w-xl mx-auto flex flex-col items-center text-center pb-2 shrink-0">
        {/* Track Badge & Duration */}
        <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest">
          <span>TRACCIA {String(activeTrack.number).padStart(2, '0')} DI {total}</span>
          <span>•</span>
          <span>DURATA {activeTrack.duration}</span>
        </div>

        {/* Big Song Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-sans tracking-tight text-white mt-1 drop-shadow-md truncate max-w-full">
          {activeTrack.title}
        </h2>

        {/* Poetic Quote from lyrics */}
        {activeTrack.storyQuote && (
          <p className="text-xs sm:text-sm font-serif italic text-white/75 mt-1 line-clamp-1 max-w-md drop-shadow">
            «{activeTrack.storyQuote}»
          </p>
        )}

        {/* Big Tactile CTA Button: Extract & Play */}
        <div className="flex items-center gap-3 mt-3 w-full sm:w-auto justify-center">
          <button
            onClick={() => handleConfirmTrack(activeIndex)}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold font-sans text-xs sm:text-sm tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
          >
            {activeIndex === currentIndex && isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>IN RIPRODUZIONE • CHIUDI CASSA</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>ESTRAI VINILE E ASCOLTA</span>
              </>
            )}
          </button>
        </div>

        {/* Keyboard and interaction hint */}
        <div className="mt-2.5 flex items-center gap-3 text-[9px] sm:text-[10px] font-mono text-white/40">
          <span className="hidden sm:inline">← → o rotellina per sfogliare</span>
          <span className="hidden sm:inline">•</span>
          <span>Clicca un disco o INVIO per suonare</span>
          <span>•</span>
          <span>ESC per uscire</span>
        </div>
      </footer>
    </div>
  );
};
