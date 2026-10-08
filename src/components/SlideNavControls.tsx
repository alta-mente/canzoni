import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight, Sun, Moon, Share2, Radio, ExternalLink } from 'lucide-react';
import { ALBUM_DATA } from '../data/albumData';

interface SlideNavControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  onOpenShare: () => void;
}

export const SlideNavControls: React.FC<SlideNavControlsProps> = ({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onGoTo,
  onOpenShare,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {/* Top Bar HUD */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 pointer-events-none flex items-center justify-between">
        {/* Brand */}
        <div className="pointer-events-auto flex items-center space-x-3 backdrop-blur-xl px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-mars-crimson animate-pulse" />
          <div className="flex items-center space-x-2 font-mono text-xs tracking-wider">
            <span className="font-bold tracking-widest uppercase text-gray-900 dark:text-white">
              {ALBUM_DATA.artist}
            </span>
            <span className="text-gray-400 dark:text-white/30">/</span>
            <span className="text-gray-600 dark:text-white/70 uppercase hidden sm:inline">
              Non C'è Vita Su Marte
            </span>
          </div>
        </div>

        {/* Center: Slide indicator */}
        <div className="hidden md:flex pointer-events-auto items-center space-x-2 backdrop-blur-xl px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-xs font-mono">
          <span className="text-mars-crimson font-bold">
            {String(currentSlide).padStart(2, '0')}
          </span>
          <span className="text-gray-400 dark:text-white/30">/</span>
          <span className="text-gray-600 dark:text-white/60">
            {String(totalSlides - 1).padStart(2, '0')}
          </span>
        </div>

        {/* Right Tools: Theme Switcher, Share, Spotify */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Cambia tema chiaro/scuro"
            className="backdrop-blur-xl p-2.5 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-gray-800 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
            title={isDark ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={onOpenShare}
            aria-label="Condividi"
            className="backdrop-blur-xl p-2.5 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-gray-800 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Spotify Direct Link */}
          <a
            href={ALBUM_DATA.spotifyAlbumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-4 py-2 rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="tracking-wide hidden sm:inline">SPOTIFY</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Bottom Floating Navigation Dock */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 pointer-events-none flex items-center justify-between">
        {/* Left: Previous Slide Button */}
        <button
          onClick={onPrev}
          disabled={currentSlide === 0}
          className={`pointer-events-auto flex items-center space-x-2 px-4 py-2.5 rounded-full backdrop-blur-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/50 shadow-xl font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
            currentSlide === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:border-mars-crimson/50 hover:scale-105 active:scale-95 text-gray-900 dark:text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">PRECEDENTE</span>
        </button>

        {/* Center: Interactive Slide Dots / Thumbnails */}
        <div className="pointer-events-auto flex items-center space-x-1.5 sm:space-x-2 backdrop-blur-xl px-3 sm:px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/50 shadow-xl overflow-x-auto max-w-[55vw] sm:max-w-none">
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={idx}
                onClick={() => onGoTo(idx)}
                className={`transition-all duration-300 rounded-full font-mono text-[10px] flex items-center justify-center ${
                  isActive
                    ? 'w-7 sm:w-8 h-6 sm:h-7 bg-mars-crimson text-white font-bold shadow-md shadow-mars-crimson/50'
                    : 'w-6 sm:w-7 h-6 sm:h-7 text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {String(idx).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Right: Next Slide Button */}
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className={`pointer-events-auto flex items-center space-x-2 px-4 py-2.5 rounded-full backdrop-blur-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/50 shadow-xl font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
            currentSlide === totalSlides - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:border-mars-crimson/50 hover:scale-105 active:scale-95 text-gray-900 dark:text-white'
          }`}
        >
          <span className="hidden sm:inline">SUCCESSIVO</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </>
  );
};
