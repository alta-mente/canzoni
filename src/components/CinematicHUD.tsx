import React from 'react';
import { ALBUM_DATA } from '../data/albumData';
import { useAudio } from '../context/NativeAudioContext';
import { Radio, Share2, ExternalLink, Compass, Play, Pause } from 'lucide-react';

interface CinematicHUDProps {
  currentScene: number; // 0 to 11
  onNavigateToScene: (index: number) => void;
  onOpenShare: () => void;
}

export const CinematicHUD: React.FC<CinematicHUDProps> = ({
  currentScene,
  onNavigateToScene,
  onOpenShare,
}) => {
  const { isPlaying, togglePlay, currentTrack } = useAudio();

  const sceneLabels = [
    { idx: 0, label: '00 // OVERTURE' },
    ...ALBUM_DATA.tracks.map((t, i) => ({
      idx: i + 1,
      label: `${String(i + 1).padStart(2, '0')} // ${t.title.toUpperCase()}`,
    })),
    { idx: 11, label: '11 // EPILOGO & CREDITI' },
  ];

  return (
    <>
      {/* Top Header HUD */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 pointer-events-none flex items-center justify-between">
        {/* Brand / Mission Tag */}
        <div className="pointer-events-auto flex items-center space-x-3 hud-border px-4 py-2 rounded-full">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-mars-bright animate-ping' : 'bg-mars-crimson'}`} />
          <div className="flex items-center space-x-2 font-mono text-xs tracking-wider">
            <span className="text-white font-bold tracking-widest uppercase">
              {ALBUM_DATA.artist}
            </span>
            <span className="text-white/30">/</span>
            <span className="text-white/70 hidden sm:inline uppercase">
              Non C'è Vita Su Marte
            </span>
          </div>
        </div>

        {/* Center: Current Chapter Indicator */}
        <div className="hidden md:flex pointer-events-auto items-center space-x-2 hud-border px-4 py-1.5 rounded-full text-xs font-mono text-white/80">
          <Compass className="w-3.5 h-3.5 text-mars-crimson animate-spin-slow" />
          <span className="text-mars-bright font-semibold">
            {sceneLabels[currentScene]?.label || '00 // INTRO'}
          </span>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Share */}
          <button
            onClick={onOpenShare}
            aria-label="Condividi album"
            className="hud-border p-2.5 rounded-full text-white/70 hover:text-white hover:border-mars-crimson/50 transition-all duration-300"
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
            <span className="tracking-wide">SPOTIFY</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Right Side: Vertical Orbital Mission Timeline */}
      <nav
        aria-label="Orbital Timeline"
        className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end space-y-2.5 pointer-events-auto select-none"
      >
        <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 mr-1 mb-1">
          CAPITOLI
        </span>
        {sceneLabels.map((s) => {
          const isActive = currentScene === s.idx;
          return (
            <button
              key={s.idx}
              onClick={() => onNavigateToScene(s.idx)}
              className="group flex items-center space-x-3 py-1 text-right focus:outline-none"
            >
              {/* Tooltip on hover */}
              <span
                className={`text-[11px] font-mono transition-all duration-300 uppercase tracking-wider ${
                  isActive
                    ? 'text-mars-bright font-bold opacity-100 translate-x-0'
                    : 'text-white/40 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                }`}
              >
                {s.label}
              </span>

              {/* Dot */}
              <div
                className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'w-3 h-3 bg-mars-crimson shadow-[0_0_12px_#e63946]'
                    : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-white/60 group-hover:scale-150'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Bottom Info HUD & Quick Floating Audio Pill */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 pointer-events-none flex items-center justify-between text-[10px] font-mono text-white/40">
        <div className="hidden sm:block">
          <span>LOC: MARS // 21°24'N 175°12'E • ALESSANDRO ROCCHI © 2026</span>
        </div>

        {/* Minimalist Floating Audio Pill */}
        <div className="pointer-events-auto flex items-center space-x-3 hud-border px-3.5 py-1.5 rounded-full backdrop-blur-xl shadow-lg border border-white/10">
          <button
            onClick={togglePlay}
            className="w-6 h-6 rounded-full bg-mars-crimson text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current translate-x-0.5" />
            )}
          </button>
          <span className="text-white/90 text-[11px] truncate max-w-[140px] sm:max-w-[200px]">
            {currentTrack.number}. {currentTrack.title}
          </span>
          {isPlaying && (
            <div className="flex items-end space-x-0.5 h-2.5">
              <span className="w-0.5 h-full bg-mars-bright animate-pulse" />
              <span className="w-0.5 h-1/2 bg-mars-bright animate-ping" />
              <span className="w-0.5 h-3/4 bg-mars-bright animate-pulse" />
            </div>
          )}
        </div>
      </footer>
    </>
  );
};
