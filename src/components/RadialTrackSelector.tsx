import React, { useState, useEffect } from 'react';
import { Track } from '../data/albumData';
import { Play, Pause, X, List, Sparkles } from 'lucide-react';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'radial' | 'list'>('radial');
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = tracks.length;
  const activePreviewIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;
  const previewTrack = tracks[activePreviewIndex] || tracks[0];

  // Arc Geometry parameters
  // Start from left (168 deg) to right (12 deg)
  const startDeg = 168;
  const endDeg = 12;
  const rx = isMobile ? 142 : 270;
  const ry = isMobile ? 115 : 180;

  // SVG Orbit Arc coordinates
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const startX = rx * Math.cos(startRad);
  const startY = ry * Math.sin(startRad);
  const endX = rx * Math.cos(endRad);
  const endY = ry * Math.sin(endRad);

  // SVG path centered at origin (0, 0), Y goes upwards in our math so in SVG it is negative Y
  const svgPath = `M ${startX} ${-startY} A ${rx} ${ry} 0 0 1 ${endX} ${-endY}`;

  return (
    <>
      {/* Click-outside backdrop with subtle blur */}
      <div
        className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Semicircle Orbit Dock Container */}
      <div
        className={`absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-[96vw] max-w-2xl rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-2xl border transition-all z-40 animate-in fade-in zoom-in-95 duration-300 select-none overflow-visible ${
          isLightMode
            ? 'bg-white/95 border-black/15 text-gray-900 shadow-black/20'
            : 'bg-[#0b0c13]/90 border-white/15 text-white shadow-black/80'
        }`}
      >
        {/* Top Mini Control Bar (Title, Mode Switch & Close) */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-amber-400/15 text-amber-400 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Semicircolare Orbitale</span>
            </span>
            <span className="text-[10px] font-mono opacity-50 hidden sm:inline">
              {total} BRANI DISCOGRAFICI
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* View Mode Toggle (Radial vs Classic List) */}
            <button
              onClick={() => setViewMode((m) => (m === 'radial' ? 'list' : 'radial'))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono tracking-wider transition-all border ${
                isLightMode
                  ? 'hover:bg-black/5 text-gray-700 border-black/10'
                  : 'hover:bg-white/10 text-white/70 border-white/10'
              }`}
              title={viewMode === 'radial' ? 'Visualizza lista classica' : 'Visualizza semicerchio'}
            >
              <List className="w-3 h-3" />
              <span className="hidden xs:inline">{viewMode === 'radial' ? 'Lista' : 'Orbita'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isLightMode ? 'hover:bg-black/10 text-gray-700' : 'hover:bg-white/15 text-white/80'
              }`}
              title="Chiudi (ESC)"
              aria-label="Chiudi orbita brani"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MODE A: THE CELESTIAL RADIAL ORBIT (Semicircle Cover Arc)
            ───────────────────────────────────────────────────────────── */}
        {viewMode === 'radial' ? (
          <div className="relative w-full h-[220px] sm:h-[290px] flex items-center justify-center overflow-visible">
            
            {/* Center Origin Anchor point for all calculations */}
            <div className="absolute left-1/2 bottom-2 sm:bottom-4 w-0 h-0 flex items-center justify-center">

              {/* Glowing SVG Orbit Line Guide */}
              <svg
                className="overflow-visible pointer-events-none"
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                }}
              >
                <defs>
                  <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Primary Celestial Arc Line */}
                <path
                  d={svgPath}
                  fill="none"
                  stroke="url(#orbitGlow)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="opacity-70 animate-pulse"
                />

                {/* Ambient Soft Blur Arc */}
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  className="opacity-20 blur-[3px]"
                />
              </svg>

              {/* ─────────────────────────────────────────────────────────
                  Orbital Track Cover Nodes (Fanned out along the arc)
                  ───────────────────────────────────────────────────────── */}
              {tracks.map((track, idx) => {
                const isSelected = idx === currentIndex;
                const isHovered = idx === hoveredIndex;
                const tFrac = idx / Math.max(1, total - 1);
                const angleDeg = startDeg - tFrac * (startDeg - endDeg);
                const angleRad = (angleDeg * Math.PI) / 180;

                const posX = Math.round(rx * Math.cos(angleRad));
                const posY = Math.round(ry * Math.sin(angleRad));

                const discArtwork = track.artworkUrl || albumCover;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      onSelectTrack(idx);
                      onClose();
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      transform: `translate(${posX}px, ${-posY}px)`,
                      transitionDelay: `${idx * 25}ms`,
                    }}
                    title={`Brano ${track.number}: ${track.title} (${track.duration})`}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none ${
                      isSelected
                        ? 'z-30 scale-110 sm:scale-125'
                        : isHovered
                        ? 'z-25 scale-110 sm:scale-120 opacity-100'
                        : 'z-10 scale-95 sm:scale-100 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* The Mini-Vinyl Cover Disc */}
                    <div
                      className={`relative rounded-full aspect-square overflow-hidden shadow-lg transition-all duration-300 ${
                        isMobile ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'
                      } ${
                        isSelected
                          ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.65)]'
                          : isHovered
                          ? 'border-2 border-white ring-2 ring-white/40 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'border border-white/25 hover:border-white/60'
                      }`}
                    >
                      {/* Artwork Image (Spins if active & playing) */}
                      <img
                        src={discArtwork}
                        alt={track.title}
                        className={`w-full h-full object-cover transition-transform duration-700 pointer-events-none ${
                          isSelected && isPlaying ? 'animate-spin-slow' : 'group-hover:scale-110'
                        }`}
                      />

                      {/* Vinyl Groove Rings Sheen */}
                      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
                      <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />

                      {/* Center Spindle Hole */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#05060a] border border-white/70 shadow-sm pointer-events-none flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-amber-400/80" />
                      </div>

                      {/* Specular Glint */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.2) 0deg, transparent 60deg, rgba(255,255,255,0.15) 180deg, transparent 240deg, rgba(255,255,255,0.2) 360deg)',
                        }}
                      />
                    </div>

                    {/* Number Badge floating below/above the disc */}
                    <div
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full font-mono text-[8px] sm:text-[9px] font-bold tracking-tight shadow-md transition-colors pointer-events-none whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-400 text-black font-black'
                          : isHovered
                          ? 'bg-white text-black'
                          : isLightMode
                          ? 'bg-black/75 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    >
                      {String(track.number).padStart(2, '0')}
                    </div>
                  </button>
                );
              })}

              {/* ─────────────────────────────────────────────────────────
                  Central Floating Focal Preview Card (Inside the Arc)
                  ───────────────────────────────────────────────────────── */}
              <div
                onClick={() => {
                  onSelectTrack(activePreviewIndex);
                  onClose();
                }}
                className={`absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-6 w-[240px] sm:w-[300px] p-2.5 sm:p-3 rounded-2xl backdrop-blur-2xl border transition-all duration-200 cursor-pointer group flex items-center gap-3 shadow-xl ${
                  isLightMode
                    ? 'bg-white/95 border-black/10 text-gray-900 shadow-black/10 hover:border-black/30'
                    : 'bg-[#12131d]/95 border-white/15 text-white shadow-black/70 hover:border-amber-400/50'
                }`}
                title="Clicca per ascoltare questo brano"
              >
                {/* Artwork Thumbnail */}
                <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md">
                  <img
                    src={previewTrack.artworkUrl || albumCover}
                    alt={previewTrack.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {activePreviewIndex === currentIndex && isPlaying ? (
                      <Pause className="w-4 h-4 text-white fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                    )}
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    <span>TRK {String(previewTrack.number).padStart(2, '0')}</span>
                    <span>•</span>
                    <span>{previewTrack.duration}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold font-sans tracking-tight truncate mt-0.5 text-inherit">
                    {previewTrack.title}
                  </h4>

                  <span className="text-[9px] font-mono opacity-50 block truncate mt-0.5">
                    {previewTrack.mood || artistName}
                  </span>
                </div>

                {/* Play Indicator / CTA Button */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                    activePreviewIndex === currentIndex
                      ? 'bg-amber-400 text-black'
                      : isLightMode
                      ? 'bg-black/10 text-gray-900 group-hover:bg-black group-hover:text-white'
                      : 'bg-white/15 text-white group-hover:bg-white group-hover:text-black'
                  }`}
                >
                  {activePreviewIndex === currentIndex && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              MODE B: CLASSIC COMPACT VERTICAL LIST (Optional view)
              ───────────────────────────────────────────────────────────── */
          <div className="space-y-1 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
            {tracks.map((t, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTrack(idx);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-all ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-md'
                      : isLightMode
                      ? 'hover:bg-black/5 text-gray-800'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono text-[10px] opacity-60 w-4 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/20">
                      <img
                        src={t.artworkUrl || albumCover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-50 shrink-0 ml-2">
                    {t.duration}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer instruction tip */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono opacity-40 px-1">
          <span>Tocca o passa sopra a un vinile per selezionarlo</span>
          <span>ESC per chiudere</span>
        </div>
      </div>
    </>
  );
};
