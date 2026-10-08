import React from 'react';
import { ALBUM_DATA } from '../data/albumData';
import { Disc3, Heart, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="pt-16 pb-32 sm:pb-28 px-4 sm:px-8 border-t border-white/10 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <Disc3 className="w-5 h-5 text-mars-400" />
          <div className="text-center md:text-left">
            <span className="font-display font-bold text-white text-sm">
              {ALBUM_DATA.title}
            </span>
            <span className="text-white/40 text-xs block font-mono">
              © {ALBUM_DATA.year} {ALBUM_DATA.artist} • weagency{' '}
              <a
                href="https://altamente.it"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                altamente.it
              </a>
            </span>
          </div>
        </div>

        {/* Center: Quote or Note */}
        <p className="text-xs text-white/50 text-center max-w-sm">
          Esperienza di streaming audio immersiva con Liquid Glassmorphism & Spotify iFrame Controller.
        </p>

        {/* Right: Back to top */}
        <button
          onClick={scrollToTop}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full glass-card hover:bg-white/10 text-xs font-mono text-white/70 hover:text-white transition-all"
        >
          <span>Torna su</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

      </div>
    </footer>
  );
};
