import React from 'react';
import { ALBUM_DATA } from '../../data/albumData';
import { useTheme } from '../../context/ThemeContext';
import { Radio, Share2, RotateCcw, ExternalLink, Sparkles } from 'lucide-react';

interface SlideEpilogueProps {
  onRestart: () => void;
  onOpenShare: () => void;
}

export const SlideEpilogue: React.FC<SlideEpilogueProps> = ({
  onRestart,
  onOpenShare,
}) => {
  const { isDark } = useTheme();

  return (
    <div className="w-screen h-screen flex-shrink-0 flex items-center justify-center px-6 sm:px-12 md:px-20 pt-16 pb-20 select-none relative overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 select-none overflow-hidden">
        <span
          className={`font-cinematic font-black text-[22vw] leading-none tracking-tighter transition-colors duration-700 select-none ${
            isDark ? 'text-white/[0.03]' : 'text-black/[0.04]'
          }`}
        >
          ORBITA
        </span>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center z-10">
        
        {/* Left: Manifesto & Quote */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 backdrop-blur-xl px-4 py-1.5 rounded-full border border-mars-crimson/30 text-xs font-mono text-mars-crimson uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EPILOGO & MANIFESTO</span>
          </div>

          <h2 className="font-cinematic font-black text-3xl sm:text-5xl md:text-6xl text-gray-950 dark:text-white uppercase tracking-tight leading-tight">
            Il Senso del Viaggio
          </h2>

          <p className="font-sans text-sm sm:text-base text-gray-700 dark:text-white/80 font-light leading-relaxed">
            {ALBUM_DATA.synopsis}
          </p>

          <div className="border-l-2 border-mars-crimson pl-5 py-2">
            <p className="italic text-mars-crimson text-sm sm:text-base">
              «E se anche non c'è vita su Marte, lasciamo che la musica risuoni comunque nel silenzio.»
            </p>
            <span className="block text-xs font-mono text-gray-400 dark:text-white/40 mt-1 uppercase">
              — Alessandro Rocchi
            </span>
          </div>
        </div>

        {/* Right: Credits Grid & Final Links */}
        <div className="lg:col-span-6 space-y-6">
          {/* Credits Box */}
          <div
            className={`p-6 rounded-3xl backdrop-blur-2xl border transition-all duration-300 shadow-xl grid grid-cols-2 gap-4 text-xs font-mono ${
              isDark
                ? 'bg-white/[0.04] border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
                : 'bg-white/80 border-black/10 shadow-[0_15px_40px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">TESTI E MUSICHE</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.credits.lyricsAndMusic}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">PRODUZIONE</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.credits.production}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">MIX & MASTERING</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.credits.mixAndMaster}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">ARTWORK</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.credits.artwork}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">PUBBLICAZIONE</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.releaseDate}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-white/40 block mb-1">DISTRIBUZIONE</span>
              <span className="font-bold text-gray-900 dark:text-white">{ALBUM_DATA.credits.label}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={ALBUM_DATA.spotifyArtistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-6 py-3.5 rounded-full transition-all duration-300 shadow-xl shadow-emerald-500/25"
            >
              <Radio className="w-4 h-4" />
              <span>SEGUI SU SPOTIFY</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onOpenShare}
              className="px-6 py-3.5 rounded-full border border-black/15 dark:border-white/15 hover:border-mars-crimson/50 text-gray-900 dark:text-white font-mono text-xs uppercase tracking-wider backdrop-blur-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>CONDIVIDI</span>
            </button>

            <button
              onClick={onRestart}
              className="px-6 py-3.5 rounded-full bg-mars-crimson hover:bg-red-600 text-white font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-mars-crimson/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RICOMINCIA DA CAPO</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
