import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { ALBUM_DATA } from '../data/albumData';
import { Disc3, Share2, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenShare }) => {
  const { activeTab, setActiveTab } = usePlayer();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand */}
        <div className="flex items-center space-x-3 glass-panel px-4 py-2 rounded-full border border-white/10 shadow-lg">
          <div className="relative flex items-center justify-center">
            <Disc3 className="w-5 h-5 text-mars-400 animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm tracking-wide text-white">
              {ALBUM_DATA.artist}
            </span>
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider hidden sm:inline">
              Non C'è Vita Su Marte
            </span>
          </div>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center space-x-1 glass-panel px-2 py-1.5 rounded-full border border-white/10 shadow-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'tracks'
                ? 'bg-gradient-to-r from-mars-crimson to-mars-neon text-white shadow-md shadow-mars-500/30'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Tracklist (10)
          </button>
          <button
            onClick={() => setActiveTab('concept')}
            className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'concept'
                ? 'bg-gradient-to-r from-mars-crimson to-mars-neon text-white shadow-md shadow-mars-500/30'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Il Concept
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
              activeTab === 'credits'
                ? 'bg-gradient-to-r from-mars-crimson to-mars-neon text-white shadow-md shadow-mars-500/30'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Crediti
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Share */}
          <button
            onClick={onOpenShare}
            aria-label="Condividi album"
            className="glass-panel p-2.5 rounded-full border border-white/10 text-white/80 hover:text-white hover:border-mars-500/40 hover:bg-white/10 transition-all duration-300 shadow-lg"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Direct Spotify Link */}
          <a
            href={ALBUM_DATA.spotifyAlbumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-3.5 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          >
            <span>Spotify</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
