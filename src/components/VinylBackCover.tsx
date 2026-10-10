import React from 'react';
import { Track, AlbumData } from '../data/albumData';
import { Play, RotateCcw, Volume2, Sparkles, X } from 'lucide-react';

interface VinylBackCoverProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onClose: () => void;
  album: AlbumData;
  isLightMode: boolean;
}

export const VinylBackCover: React.FC<VinylBackCoverProps> = ({
  tracks,
  currentIndex,
  isPlaying,
  onSelectTrack,
  onClose,
  album,
  isLightMode,
}) => {
  const sideA = tracks.slice(0, 5);
  const sideB = tracks.slice(5, 10);

  const handleTrackClick = (index: number) => {
    onSelectTrack(index);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-[min(94vw,520px)] aspect-square rounded-[4px] p-4 sm:p-7 flex flex-col justify-between select-none shadow-[0_40px_100px_rgba(0,0,0,0.9),0_0_50px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden text-white"
      style={{
        backgroundColor: '#0f1016',
        backgroundImage:
          'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 80%)',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          VINTAGE VINYL JACKET TEXTURE & WEAR
          ───────────────────────────────────────────────────────────── */}
      {/* Vintage Circular Ring Wear Imprint */}
      <div className="absolute inset-4 sm:inset-6 rounded-full border border-white/[0.06] pointer-events-none" />
      <div className="absolute inset-8 sm:inset-10 rounded-full border border-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Cardboard Matte Surface Lighting */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/[0.08] pointer-events-none" />

      {/* Left Cardboard Spine Seam */}
      <div className="absolute top-0 left-0 bottom-0 w-5 bg-gradient-to-r from-black/70 via-black/30 to-transparent border-r border-white/10 pointer-events-none flex items-center justify-center overflow-hidden">
        <span className="text-[6px] sm:text-[7px] font-mono tracking-[0.25em] uppercase -rotate-90 text-white/40 whitespace-nowrap">
          {album.artist} • {album.title} • STEREO LP
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER: RETRO DELLA CUSTODIA (Back Cover Header)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 pl-2 sm:pl-3 flex items-start justify-between border-b border-white/10 pb-2.5 sm:pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.28em] text-amber-400 font-bold">
              LATO A / LATO B • 33⅓ GIRI
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono opacity-40">•</span>
            <span className="text-[8px] sm:text-[9px] font-mono opacity-60 uppercase">
              {album.year}
            </span>
          </div>
          <h2 className="text-sm sm:text-lg font-black font-sans tracking-tight uppercase mt-0.5 text-white">
            {album.artist} — {album.title}
          </h2>
        </div>

        {/* Flip Back to Front button */}
        <button
          onClick={onClose}
          type="button"
          title="Gira copertina sul fronte (ESC)"
          className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shrink-0"
        >
          <RotateCcw className="w-3 h-3 group-hover:-rotate-90 transition-transform duration-300 text-amber-400" />
          <span className="hidden xs:inline">Fronte</span>
          <X className="w-3 h-3 xs:hidden" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TRACKLIST: LATO A & LATO B (Two Columns)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 pl-2 sm:pl-3 my-auto grid grid-cols-2 gap-3 sm:gap-6 py-2">
        {/* LATO A (Tracce 1 - 5) */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-1.5 pb-1 border-b border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" />
            <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400">
              LATO A
            </span>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            {sideA.map((t, idx) => {
              const globalIdx = idx;
              const isSelected = globalIdx === currentIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTrackClick(globalIdx)}
                  type="button"
                  className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-150 flex items-center justify-between group focus:outline-none ${
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1 truncate">
                    <span
                      className={`font-mono text-[8px] sm:text-[9px] font-bold shrink-0 ${
                        isSelected ? 'text-amber-400' : 'opacity-40'
                      }`}
                    >
                      A{idx + 1}
                    </span>
                    <span className="font-sans text-[10px] sm:text-[12px] font-bold truncate leading-tight">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && isPlaying ? (
                      <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" />
                    ) : (
                      <span className="font-mono text-[8px] sm:text-[9px] opacity-40 group-hover:opacity-80">
                        {t.duration}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LATO B (Tracce 6 - 10) */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-1.5 pb-1 border-b border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" />
            <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400">
              LATO B
            </span>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            {sideB.map((t, idx) => {
              const globalIdx = idx + 5;
              const isSelected = globalIdx === currentIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTrackClick(globalIdx)}
                  type="button"
                  className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-150 flex items-center justify-between group focus:outline-none ${
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1 truncate">
                    <span
                      className={`font-mono text-[8px] sm:text-[9px] font-bold shrink-0 ${
                        isSelected ? 'text-amber-400' : 'opacity-40'
                      }`}
                    >
                      B{idx + 1}
                    </span>
                    <span className="font-sans text-[10px] sm:text-[12px] font-bold truncate leading-tight">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && isPlaying ? (
                      <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" />
                    ) : (
                      <span className="font-mono text-[8px] sm:text-[9px] opacity-40 group-hover:opacity-80">
                        {t.duration}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FOOTER: CREDITS, BARCODE & CATALOG STAMP
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 pl-2 sm:pl-3 pt-2 border-t border-white/10 flex items-end justify-between text-[7px] sm:text-[8px] font-mono text-white/50 shrink-0">
        <div className="space-y-0.5 leading-tight max-w-[240px] sm:max-w-[340px]">
          <div>PRODUZIONE: {album.credits?.production || 'Alessandro Rocchi'}</div>
          <div>TESTI & MUSICA: {album.artist} • WEAGENCY RECORDS</div>
          <div className="opacity-40 uppercase">GIRATO A 33 GIRI / MINUTO • STEREO HI-FI</div>
        </div>

        {/* Faux Vinyl Barcode Graphic */}
        <div className="flex flex-col items-center shrink-0">
          <div className="h-5 sm:h-6 w-16 sm:w-20 bg-white/90 p-0.5 rounded-[1px] flex items-center justify-between">
            {/* Barcode lines */}
            <div className="w-0.5 h-full bg-black" />
            <div className="w-1 h-full bg-black" />
            <div className="w-0.5 h-full bg-black" />
            <div className="w-1.5 h-full bg-black" />
            <div className="w-0.5 h-full bg-black" />
            <div className="w-0.5 h-full bg-black" />
            <div className="w-1 h-full bg-black" />
            <div className="w-0.5 h-full bg-black" />
            <div className="w-1 h-full bg-black" />
            <div className="w-0.5 h-full bg-black" />
          </div>
          <span className="text-[6px] tracking-widest text-white/60 mt-0.5 font-mono">
            8 032541 992014
          </span>
        </div>
      </div>
    </div>
  );
};
