import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../data/albumData';
import { Play, Pause, ChevronDown, Sparkles } from 'lucide-react';

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: 240,
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Measure container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setDims({
            width: rect.width,
            height: Math.max(rect.height, 180),
          });
        }
      }
    };

    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateDims);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDims);
    };
  }, []);

  const total = tracks.length;
  const isMobile = dims.width < 640;
  const activeFocusIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;
  const focusTrack = tracks[activeFocusIndex] || tracks[0];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = (currentIndex > 0 ? currentIndex - 1 : total - 1);
        onSelectTrack(prevIdx);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (currentIndex < total - 1 ? currentIndex + 1 : 0);
        onSelectTrack(nextIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, onSelectTrack, onClose]);

  // ─────────────────────────────────────────────────────────────
  // RESPONSIVE SEMICIRCLE GEOMETRY
  // ─────────────────────────────────────────────────────────────
  const { width, height } = dims;

  // Origin at center bottom of the emerging container
  const cx = width / 2;
  const cy = height - (isMobile ? 18 : 24);

  // Radii tailored to container size
  const rx = isMobile
    ? Math.min(width * 0.44, 175)
    : Math.min(width * 0.43, 440);

  const ry = isMobile
    ? Math.min(height * 0.52, 95)
    : Math.min(height * 0.60, 145);

  const startDeg = isMobile ? 170 : 166;
  const endDeg = isMobile ? 10 : 14;

  // SVG guide path for the celestial orbit arc
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const svgStartX = cx + rx * Math.cos(startRad);
  const svgStartY = cy - ry * Math.sin(startRad);
  const svgEndX = cx + rx * Math.cos(endRad);
  const svgEndY = cy - ry * Math.sin(endRad);

  const svgArcPath = `M ${svgStartX} ${svgStartY} A ${rx} ${ry} 0 0 1 ${svgEndX} ${svgEndY}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-end select-none overflow-visible animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      {/* Top Subtle Close Pill */}
      <button
        onClick={onClose}
        type="button"
        title="Nascondi orbita tracce (ESC)"
        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-all duration-200 backdrop-blur-md shadow-md hover:scale-105 active:scale-95 ${
          isLightMode
            ? 'bg-black/10 hover:bg-black/20 text-gray-800 border border-black/10'
            : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/15'
        }`}
      >
        <ChevronDown className="w-3 h-3 text-amber-400 animate-bounce" />
        <span>Nascondi orbita</span>
      </button>

      {/* Ambient Radial Underglow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: `radial-gradient(ellipse at 50% 90%, ${
            focusTrack.colorDark || '#f59e0b'
          }40 0%, transparent 70%)`,
        }}
      />

      {/* SVG Celestial Orbit Arc Line */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="inlineOrbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.05" />
            <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Ambient Blur Arc */}
        <path
          d={svgArcPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={isMobile ? '4' : '6'}
          className="opacity-20 blur-[2px]"
        />

        {/* Primary Dashed Arc */}
        <path
          d={svgArcPath}
          fill="none"
          stroke="url(#inlineOrbitGrad)"
          strokeWidth={isMobile ? '1.5' : '2'}
          strokeDasharray={isMobile ? '4 4' : '6 6'}
          className="opacity-75"
        />
      </svg>

      {/* ─────────────────────────────────────────────────────────────
          THE 10 VINYL RECORD COVERS ALONG THE SEMICIRCLE
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
              onClick={() => onSelectTrack(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label={`Traccia ${track.number}: ${track.title}`}
              className={`group relative flex flex-col items-center focus:outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSelected
                  ? 'scale-115 sm:scale-125 z-40'
                  : isFocused
                  ? 'scale-110 sm:scale-115 z-35'
                  : 'scale-90 sm:scale-100 opacity-80 hover:opacity-100 z-20'
              }`}
            >
              {/* Floating Tooltip with Song Title */}
              <div
                className={`absolute -top-7 sm:-top-8 px-2 py-0.5 rounded-md backdrop-blur-xl border border-white/20 bg-black/90 text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap pointer-events-none transition-all duration-200 shadow-xl ${
                  isHovered || (isSelected && !hoveredIndex)
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-1.5 scale-95'
                } ${isSelected ? 'text-amber-400 border-amber-400/40' : 'text-white'}`}
              >
                {track.number}. {track.title}
              </div>

              {/* The Vinyl Disc */}
              <div
                className={`relative rounded-full aspect-square overflow-hidden cursor-pointer transition-all duration-300 ${
                  isMobile
                    ? 'w-10 h-10'
                    : 'w-14 h-14 lg:w-16 lg:h-16'
                } ${
                  isSelected
                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/35 shadow-[0_0_25px_rgba(245,158,11,0.65)]'
                    : isFocused
                    ? 'border-2 border-white ring-2 ring-white/40 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    : 'border border-white/30 hover:border-white/70 shadow-lg'
                }`}
                style={{ backgroundColor: '#090a10' }}
              >
                {/* Grooves Sheen */}
                <div className="absolute inset-0 bg-black/35 pointer-events-none z-10" />
                <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none z-10" />
                <div className="absolute inset-2 sm:inset-2.5 rounded-full border border-white/10 pointer-events-none z-10" />

                {/* Center Label Artwork */}
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

                {/* Center Spindle Hole */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#05060a] border border-amber-400/80 shadow-md pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-white" />
                </div>

                {/* Conic Specular Highlight */}
                <div
                  className="absolute inset-0 pointer-events-none z-20 opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{
                    background:
                      'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.25) 0deg, transparent 60deg, rgba(255,255,255,0.15) 180deg, transparent 240deg, rgba(255,255,255,0.25) 360deg)',
                  }}
                />
              </div>

              {/* Number Badge at bottom of disc */}
              <div
                className={`mt-1 px-1.5 py-0.2 rounded-full font-mono text-[8px] sm:text-[9px] font-bold tracking-tight shadow-md transition-all pointer-events-none whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-400 text-black font-black scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : isFocused
                    ? 'bg-white text-black font-bold'
                    : 'bg-black/75 text-white/80 border border-white/20'
                }`}
              >
                {String(track.number).padStart(2, '0')}
              </div>
            </button>
          </div>
        );
      })}

      {/* ─────────────────────────────────────────────────────────────
          FOCAL CENTER SWEET SPOT PILL (Inside the Semicircle)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: `${cx}px`,
          top: `${cy - (isMobile ? 12 : 18)}px`,
          transform: 'translate(-50%, -50%)',
        }}
        className="z-35 pointer-events-auto"
      >
        <div
          onClick={() => onSelectTrack(activeFocusIndex)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-2xl border shadow-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
            isLightMode
              ? 'bg-white/95 border-black/15 text-gray-900 shadow-black/10'
              : 'bg-[#0f111d]/90 border-white/15 text-white shadow-black/60'
          }`}
          title="Clicca per ascoltare questo brano"
        >
          {/* Mini Play / Pause Indicator */}
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
              activeFocusIndex === currentIndex && isPlaying
                ? 'bg-amber-400 text-black'
                : 'bg-white/15 text-white'
            }`}
          >
            {activeFocusIndex === currentIndex && isPlaying ? (
              <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            ) : (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current translate-x-0.5" />
            )}
          </div>

          {/* Track Name & Duration */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-[160px] sm:max-w-[260px] truncate">
            <span className="font-mono text-[9px] sm:text-[10px] text-amber-400 font-bold">
              TRK {String(focusTrack.number).padStart(2, '0')}
            </span>
            <span className="opacity-40">•</span>
            <span className="font-sans font-bold text-xs sm:text-sm truncate">
              {focusTrack.title}
            </span>
          </div>

          <span className="font-mono text-[9px] sm:text-[10px] opacity-50 shrink-0">
            {focusTrack.duration}
          </span>
        </div>
      </div>
    </div>
  );
};
