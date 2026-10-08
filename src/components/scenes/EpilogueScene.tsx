import React from 'react';
import { ALBUM_DATA } from '../../data/albumData';
import { Radio, ArrowUp, Share2, Award, ExternalLink, Sparkles } from 'lucide-react';

interface EpilogueSceneProps {
  onRestart: () => void;
  onOpenShare: () => void;
}

export const EpilogueScene: React.FC<EpilogueSceneProps> = ({
  onRestart,
  onOpenShare,
}) => {
  return (
    <section
      id="scene-11"
      className="relative min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 md:px-20 py-28 text-white select-none"
    >
      <div className="max-w-5xl mx-auto w-full space-y-12 z-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs sm:text-sm font-bold text-mars-bright tracking-widest-xl uppercase">
              EPILOGO // TRASMISSIONE FINALE
            </span>
          </div>
          <span className="text-xs font-mono text-white/40">MARS ARCHIVE 2026</span>
        </div>

        {/* The Artist Manifesto */}
        <div className="space-y-6">
          <h2 className="font-cinematic font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight leading-tight cinematic-glow">
            Il Manifesto dell'Album
          </h2>
          <p className="font-sans text-base sm:text-lg md:text-xl text-white/80 font-light leading-relaxed max-w-3xl">
            {ALBUM_DATA.synopsis}
          </p>
          <div className="pt-2 border-l-2 border-mars-crimson pl-6">
            <p className="text-mars-dust italic text-base sm:text-lg">
              «E se anche non c'è vita su Marte, lasciamo che la musica risuoni comunque nel silenzio.»
            </p>
            <span className="block text-xs font-mono text-white/50 mt-2 uppercase">
              — Alessandro Rocchi
            </span>
          </div>
        </div>

        {/* Cinematic Credits Layout */}
        <div className="hud-border p-6 sm:p-8 rounded-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs font-mono">
          <div>
            <span className="text-white/40 block mb-1">TESTI E MUSICHE</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.credits.lyricsAndMusic}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-1">PRODUZIONE</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.credits.production}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-1">MIX & MASTERING</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.credits.mixAndMaster}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-1">ARTWORK ORIGINALE</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.credits.artwork}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-1">DATA DI PUBBLICAZIONE</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.releaseDate}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-1">DISTRIBUZIONE</span>
            <span className="text-white font-semibold text-sm">{ALBUM_DATA.credits.label}</span>
          </div>
        </div>

        {/* Artist Profile & Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-mars-crimson shadow-xl shrink-0">
              <img src={ALBUM_DATA.coverUrl} alt={ALBUM_DATA.artist} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{ALBUM_DATA.artist}</h3>
              <p className="text-xs text-white/50 font-mono">Profilo Ufficiale dell'Artista</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={ALBUM_DATA.spotifyArtistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-5 py-3 rounded-full transition-all duration-300 shadow-xl shadow-emerald-500/20"
            >
              <Radio className="w-4 h-4" />
              <span>SEGUI SU SPOTIFY</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onOpenShare}
              className="hud-border px-5 py-3 rounded-full text-xs font-mono text-white/80 hover:text-white hover:border-mars-crimson/50 transition-all flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>CONDIVIDI</span>
            </button>

            <button
              onClick={onRestart}
              className="hud-border px-5 py-3 rounded-full text-xs font-mono text-white/80 hover:text-white hover:border-mars-crimson/50 transition-all flex items-center space-x-2"
            >
              <ArrowUp className="w-4 h-4" />
              <span>RICOMINCIA DA CAPO</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
