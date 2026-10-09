import React, { useState, useEffect, useRef } from 'react';
import { Track, AlbumData, ALBUM_DATA } from '../data/albumData';
import { useAudio } from '../context/NativeAudioContext';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface VinylCarouselProps {
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
  displayMode: 'carousel' | 'sleeve';
  album?: AlbumData;
}

export const VinylCarousel: React.FC<VinylCarouselProps> = ({
  currentIndex,
  onSelectTrack,
  onPrevTrack,
  onNextTrack,
  displayMode,
  album = ALBUM_DATA,
}) => {
  const { isPlaying, togglePlay } = useAudio();

  const total = album.tracks.length;
  const activeTrack = album.tracks[currentIndex] || album.tracks[0];
  const prevTrack = album.tracks[(currentIndex - 1 + total) % total];
  const nextTrack = album.tracks[(currentIndex + 1) % total];

  // Sleeve Mode Physical Transition State (Retract -> Swap -> Extract)
  const [displayedTrack, setDisplayedTrack] = useState<Track>(activeTrack);
  const [sleevePhase, setSleevePhase] = useState<'idle' | 'retracting' | 'extracting'>('idle');
  const prevTrackIdRef = useRef<string>(activeTrack.id);

  // Touch & Swipe Gesture Navigation State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const wasSwipeRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setIsDragging(true);
    setDragOffset(0);
    wasSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // If gesture is predominantly vertical, don't hijack vertical scrolling
    if (Math.abs(diffY) > Math.abs(diffX) * 1.3 && Math.abs(diffX) < 15) {
      return;
    }

    // Dampen drag resistance
    const damped = Math.sign(diffX) * Math.min(Math.abs(diffX), 140);
    setDragOffset(damped);

    if (Math.abs(diffX) > 12) {
      wasSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - (touchStartY.current ?? 0);
    const elapsed = Date.now() - touchStartTime.current;

    setIsDragging(false);
    setDragOffset(0);

    const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 0.9;
    const isFlick = elapsed < 350 && Math.abs(diffX) > 30;
    const isLongSwipe = Math.abs(diffX) > 50;

    if (isHorizontal && (isFlick || isLongSwipe)) {
      wasSwipeRef.current = true;
      if (diffX < 0) {
        // Swiped Left -> Next Track
        handleNext();
      } else {
        // Swiped Right -> Previous Track
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;

    setTimeout(() => {
      wasSwipeRef.current = false;
    }, 150);
  };

  const handleTouchCancel = () => {
    setIsDragging(false);
    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => {
      wasSwipeRef.current = false;
    }, 150);
  };

  useEffect(() => {
    // If not in sleeve mode, keep track immediately in sync
    if (displayMode !== 'sleeve') {
      setDisplayedTrack(activeTrack);
      setSleevePhase('idle');
      prevTrackIdRef.current = activeTrack.id;
      return;
    }

    // If track didn't change (e.g. initial mount or mode switch), sync directly
    if (prevTrackIdRef.current === activeTrack.id) {
      setDisplayedTrack(activeTrack);
      return;
    }

    prevTrackIdRef.current = activeTrack.id;

    // STEP 1: Retract old vinyl record completely into the jacket pocket
    setSleevePhase('retracting');

    // STEP 2: Swap the record while hidden inside the pocket, then extract
    const swapTimer = setTimeout(() => {
      setDisplayedTrack(activeTrack);
      setSleevePhase('extracting');
    }, 320);

    // STEP 3: Return to idle state after smooth slide-out
    const idleTimer = setTimeout(() => {
      setSleevePhase('idle');
    }, 850);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(idleTimer);
    };
  }, [displayMode, activeTrack]);

  const handlePrev = () => {
    if (onPrevTrack) {
      onPrevTrack();
    } else {
      onSelectTrack((currentIndex - 1 + total) % total);
    }
  };

  const handleNext = () => {
    if (onNextTrack) {
      onNextTrack();
    } else {
      onSelectTrack((currentIndex + 1) % total);
    }
  };

  // Render vinyl disc
  const renderDisc = (track: Track, isCenter: boolean) => {
    const isThisPlaying = isCenter && isPlaying;

    return (
      <div
        className="relative w-full h-full rounded-full bg-[#0c0c11] border-4 border-[#22222c] overflow-hidden select-none"
        style={{
          boxShadow: isCenter
            ? '0 35px 100px rgba(0, 0, 0, 0.75), 0 0 60px rgba(0, 0, 0, 0.4)'
            : '0 20px 50px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Grooves & Artwork Container (spins when playing) */}
        <div className={`absolute inset-0 rounded-full overflow-hidden ${isThisPlaying ? 'animate-spin-slow' : ''}`}>
          {/* Track Unique Artwork printed on the Vinyl */}
          <img
            src={track.artworkUrl || album.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover scale-105 pointer-events-none transition-transform duration-700"
          />

          {/* Subtle Vinyl Sound Grooves Overprinted on the Artwork */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <div className="absolute inset-4 sm:inset-6 rounded-full border border-white/[0.08] pointer-events-none" />
          <div className="absolute inset-8 sm:inset-12 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute inset-12 sm:inset-18 rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute inset-16 sm:inset-24 rounded-full border border-white/[0.05] pointer-events-none" />
          <div className="absolute inset-20 sm:inset-30 rounded-full border border-white/[0.04] pointer-events-none" />

          {/* Vinyl Specular Light Sheen (conic glint reflection) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.22) 0deg, transparent 60deg, rgba(255,255,255,0.18) 180deg, transparent 240deg, rgba(255,255,255,0.22) 360deg)',
            }}
          />

          {/* Center Spindle Label (Solid Black Circle) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-36 md:w-44 h-24 sm:h-36 md:h-44 rounded-full bg-[#0a0a0f] border-2 border-white/25 shadow-[0_0_30px_rgba(0,0,0,0.85)] z-10 overflow-hidden select-none">
            {/* Top Section: Artist & Title (above center hole) */}
            <div className="absolute top-0 inset-x-0 bottom-1/2 flex flex-col items-center justify-end pb-2 sm:pb-2.5 px-2 text-center pointer-events-none">
              <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono tracking-widest text-white/50 uppercase leading-tight">
                {album.artist}
              </span>
              <span className="text-[9px] sm:text-[11px] md:text-[12px] font-bold tracking-tight uppercase line-clamp-1 px-1 text-white leading-tight mt-0.5">
                {track.title}
              </span>
            </div>

            {/* DEAD-CENTER Spindle Hole (Mathematically Centered at 50% / 50%) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#05060a] border border-white/70 shadow-sm pointer-events-none z-20 flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Bottom Section: Year & Track Info (below center hole) */}
            <div className="absolute top-1/2 inset-x-0 bottom-0 flex flex-col items-center justify-start pt-2 sm:pt-2.5 px-2 text-center pointer-events-none">
              <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-white/50 tracking-wider uppercase leading-tight">
                {album.year} • TRK {String(track.number).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Center Play Overlay on hover */}
        {isCenter && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl border border-white/25">
              {isPlaying ? (
                <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-current" />
              ) : (
                <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current translate-x-0.5" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // MODE 2: Realistic Paper Cardboard Sleeve + Vinyl Slide-Out
  if (displayMode === 'sleeve') {
    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="relative w-full max-w-6xl mx-auto flex items-center justify-center py-4 select-none px-4 sm:px-8 md:px-12 touch-pan-y"
      >
        {/* Previous Track Arrow */}
        <button
          onClick={handlePrev}
          title={`Traccia precedente: ${prevTrack.title}`}
          aria-label="Traccia precedente"
          className="absolute left-1 sm:left-3 md:left-6 lg:left-8 z-30 p-2 sm:p-3 text-white/35 hover:text-white transition-all duration-300 hover:scale-125 active:scale-95 group focus:outline-none"
        >
          <ChevronLeft
            strokeWidth={1.2}
            className="w-8 h-8 sm:w-11 md:w-12 sm:h-11 md:h-12 transition-transform duration-300 group-hover:-translate-x-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          />
        </button>

        {/* Center Sleeve + Vinyl Stage */}
        <div
          className={`relative flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isPlaying ? '-translate-x-10 sm:-translate-x-16 md:-translate-x-20' : ''
          }`}
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
            transition: isDragging ? 'none' : undefined,
          }}
        >
          {/* Realistic Cardboard Album Sleeve (Left) */}
          <div
            onClick={() => {
              if (wasSwipeRef.current) return;
              togglePlay();
            }}
            className={`relative w-64 sm:w-80 md:w-[400px] aspect-square rounded-[3px] overflow-hidden shadow-[0_35px_80px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(0,0,0,0.35)] z-20 border border-white/20 cursor-pointer group transition-transform duration-500 ${
              sleevePhase === 'retracting'
                ? 'scale-[0.985] -rotate-[0.5deg]'
                : sleevePhase === 'extracting'
                ? 'scale-[1.01] rotate-[0.5deg]'
                : 'hover:scale-[1.01]'
            }`}
          >
            {/* Official Album Cover (Constant for the entire album) */}
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Vintage Ring Wear (circular imprint on the cardboard cover) */}
            <div className="absolute inset-5 sm:inset-7 rounded-full border border-white/[0.09] pointer-events-none" />
            <div className="absolute inset-7 sm:inset-10 rounded-full border border-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/35 pointer-events-none" />

            {/* Realistic Paper / Cardboard Matte Lighting & Surface Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/[0.12] pointer-events-none" />

            {/* Left Cardboard Spine (fold seam with printed vertical spine text) */}
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-black/60 via-black/30 to-transparent border-r border-white/10 pointer-events-none flex items-center justify-center overflow-hidden">
              <span className="text-[6px] sm:text-[7px] font-mono tracking-[0.28em] uppercase -rotate-90 whitespace-nowrap text-white/50 select-none">
                {album.artist} • {album.title} • LP-{album.year}
              </span>
            </div>

            {/* Right Opening Slit (dark inner sleeve shadow where vinyl slides out) */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black/70 via-black/25 to-transparent pointer-events-none" />
            {/* Subtle thumb notch on the right edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-16 rounded-l-full bg-black/60 border-l border-y border-white/15 pointer-events-none" />

            {/* Corner Badge */}
            <div className="absolute bottom-4 left-8 text-left font-mono text-xs text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] pointer-events-none">
              <span className="block font-bold tracking-wider text-[11px] sm:text-xs">{album.artist}</span>
              <span className="text-[9px] sm:text-[10px] text-white/70 block uppercase">
                {album.title}
              </span>
            </div>
          </div>

          {/* Vinyl Sliding Out (Right) with physical retract & roll-out transition */}
          <div
            onClick={() => {
              if (wasSwipeRef.current) return;
              togglePlay();
            }}
            className={`w-[250px] sm:w-[340px] md:w-[390px] aspect-square cursor-pointer transition-all -ml-28 sm:-ml-40 md:-ml-48 z-10 ${
              sleevePhase === 'retracting'
                ? '-translate-x-32 sm:-translate-x-44 md:-translate-x-52 -rotate-45 scale-95 opacity-60 duration-300 ease-in'
                : sleevePhase === 'extracting'
                ? `${isPlaying ? 'translate-x-20 sm:translate-x-32 md:translate-x-36 rotate-[45deg]' : 'translate-x-0 rotate-0'} scale-100 opacity-100 duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]`
                : `${isPlaying ? 'translate-x-20 sm:translate-x-32 md:translate-x-36 rotate-[45deg]' : 'translate-x-0 hover:translate-x-12 rotate-0'} scale-100 opacity-100 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`
            }`}
          >
            {renderDisc(displayedTrack, true)}
          </div>
        </div>

        {/* Next Track Arrow */}
        <button
          onClick={handleNext}
          title={`Traccia successiva: ${nextTrack.title}`}
          aria-label="Traccia successiva"
          className="absolute right-1 sm:right-3 md:right-6 lg:right-8 z-30 p-2 sm:p-3 text-white/35 hover:text-white transition-all duration-300 hover:scale-125 active:scale-95 group focus:outline-none"
        >
          <ChevronRight
            strokeWidth={1.2}
            className="w-8 h-8 sm:w-11 md:w-12 sm:h-11 md:h-12 transition-transform duration-300 group-hover:translate-x-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          />
        </button>
      </div>
    );
  }

  // MODE 1: 5 Discs 3D Carousel with Touch & Swipe Gestures
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="relative w-full h-[210px] sm:h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center overflow-visible select-none touch-pan-y"
    >
      {/* Previous Track Arrow */}
      <button
        onClick={handlePrev}
        title={`Traccia precedente: ${prevTrack.title}`}
        aria-label="Traccia precedente"
        className="absolute left-1 sm:left-3 md:left-6 z-40 p-2 sm:p-3 text-white/40 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
      >
        <ChevronLeft
          strokeWidth={1.4}
          className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 transition-transform duration-300 group-hover:-translate-x-1"
        />
      </button>

      {/* Discs Render */}
      {album.tracks.map((track, idx) => {
        let offset = idx - currentIndex;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        // Render offsets -2, -1, 0, 1, 2 for smooth slide from edges
        if (Math.abs(offset) > 2) return null;

        const isCenter = offset === 0;
        const currentDrag = isDragging ? dragOffset : 0;

        let transformStr = `translateX(${currentDrag}px) scale(1)`;
        let opacityVal = 1;
        let zIndexVal = 30;

        if (offset === 0) {
          transformStr = `translateX(${currentDrag}px) scale(1)`;
          opacityVal = 1;
          zIndexVal = 30;
        } else if (offset === -1) {
          transformStr = `translateX(calc(clamp(-380px, -42vw, -120px) + ${currentDrag * 0.75}px)) scale(0.68)`;
          opacityVal = 0.65;
          zIndexVal = 15;
        } else if (offset === 1) {
          transformStr = `translateX(calc(clamp(120px, 42vw, 380px) + ${currentDrag * 0.75}px)) scale(0.68)`;
          opacityVal = 0.65;
          zIndexVal = 15;
        } else if (offset === -2) {
          transformStr = `translateX(calc(clamp(-700px, -78vw, -300px) + ${currentDrag * 0.4}px)) scale(0.45)`;
          opacityVal = 0;
          zIndexVal = 5;
        } else if (offset === 2) {
          transformStr = `translateX(calc(clamp(300px, 78vw, 700px) + ${currentDrag * 0.4}px)) scale(0.45)`;
          opacityVal = 0;
          zIndexVal = 5;
        }

        return (
          <div
            key={track.id}
            onClick={() => {
              if (wasSwipeRef.current) return;
              if (isCenter) {
                togglePlay();
              } else {
                onSelectTrack(idx);
              }
            }}
            className={`absolute cursor-pointer ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isDragging ? 'transition-none' : 'transition-all duration-700'
            } ${Math.abs(offset) > 1 ? 'pointer-events-none' : ''}`}
            style={{
              transform: transformStr,
              opacity: opacityVal,
              zIndex: zIndexVal,
              width: 'clamp(150px, min(50vw, 24vh), 400px)',
              height: 'clamp(150px, min(50vw, 24vh), 400px)',
            }}
          >
            {renderDisc(track, isCenter)}
          </div>
        );
      })}

      {/* Next Track Arrow */}
      <button
        onClick={handleNext}
        title={`Traccia successiva: ${nextTrack.title}`}
        aria-label="Traccia successiva"
        className="absolute right-1 sm:right-3 md:right-6 z-40 p-2 sm:p-3 text-white/40 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
      >
        <ChevronRight
          strokeWidth={1.4}
          className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 transition-transform duration-300 group-hover:translate-x-1"
        />
      </button>
    </div>
  );
};
