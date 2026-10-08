import React, { useEffect } from 'react';
import { AlbumData, DISCOGRAPHY } from '../data/albumData';
import { X, Disc, Sparkles, Check, Play, Music2 } from 'lucide-react';

interface VinylCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlbum: AlbumData;
  onSelectAlbum: (album: AlbumData) => void;
}

export const VinylCrateModal: React.FC<VinylCrateModalProps> = ({
  isOpen,
  onClose,
  activeAlbum,
  onSelectAlbum,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in select-none">
      {/* Dark Ambient Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-300"
      />

      {/* Crate Container */}
      <div className="relative w-full max-w-4xl bg-[#101016]/95 border border-white/20 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 overflow-hidden flex flex-col my-auto">
        {/* Subtle wooden crate / brushed aluminum top rail */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-700/60 via-amber-500/40 to-amber-800/60 border-b border-white/10" />

        {/* Header */}
        <div className="p-6 sm:p-8 flex items-start justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] text-amber-400 uppercase font-bold">
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>COLLEZIONE VINILI • ALESSANDRO ROCCHI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-1">
              La Cassetta dei Vinili
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
              Sfoglia la discografia e scegli l'opera da estrarre e posizionare sul giradischi.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
            title="Chiudi cassetta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crate Albums Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 overflow-y-auto max-h-[70vh]">
          {DISCOGRAPHY.map((album) => {
            const isCurrent = album.id === activeAlbum.id;

            return (
              <div
                key={album.id}
                onClick={() => {
                  if (!isCurrent) {
                    onSelectAlbum(album);
                  }
                  onClose();
                }}
                className={`group relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${
                  isCurrent
                    ? 'bg-white/[0.08] border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.18)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/15 hover:border-white/35 hover:scale-[1.02]'
                }`}
              >
                {/* Active Album Badge */}
                {isCurrent && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-black font-mono text-[10px] font-black tracking-wider uppercase shadow-lg">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>SUL PIATTO</span>
                  </div>
                )}

                {/* Album Cover & Vinyl Peek */}
                <div className="relative flex items-center justify-center my-2">
                  {/* Cardboard Sleeve */}
                  <div className="relative w-44 sm:w-52 aspect-square rounded-[3px] overflow-hidden shadow-2xl z-10 border border-white/20 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                    {/* Ring wear */}
                    <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />
                  </div>

                  {/* Vinyl Record Peeking Out */}
                  <div
                    className={`w-40 sm:w-48 aspect-square rounded-full bg-[#0c0c11] border-2 border-white/20 -ml-28 z-0 transition-transform duration-500 ease-out shadow-2xl flex items-center justify-center overflow-hidden ${
                      isCurrent
                        ? 'translate-x-12 sm:translate-x-14 rotate-45'
                        : 'group-hover:translate-x-10 group-hover:rotate-12'
                    }`}
                  >
                    {album.tracks[0]?.artworkUrl ? (
                      <img
                        src={album.tracks[0].artworkUrl}
                        alt="Vinyl preview"
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-radial from-neutral-800 to-black" />
                    )}
                    <div className="absolute inset-0 rounded-full border border-white/10" />
                    <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border border-white/30 z-10 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    </div>
                  </div>
                </div>

                {/* Album Info */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                    <span className="uppercase">{album.genre}</span>
                    <span>LP • {album.year}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight group-hover:text-amber-300 transition-colors">
                    {album.title}
                  </h3>

                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                    {album.tagline}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-white/10 text-xs font-mono">
                    <span className="text-white/60">
                      {album.tracks.length} TRACCE
                    </span>

                    <button
                      className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-white/20 text-white cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Music2 className="w-3.5 h-3.5" />
                          <span>In ascolto</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Ascolta Album</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-mono gap-2">
          <span>Tutte le tracce sono masterizzate e pronte per lo streaming continuo</span>
          <span className="text-amber-400/80">Premi [ESC] o clicca fuori per tornare al giradischi</span>
        </div>
      </div>
    </div>
  );
};
