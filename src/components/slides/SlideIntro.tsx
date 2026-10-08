import React, { useState } from 'react';
import { ALBUM_DATA } from '../../data/albumData';
import { useAudio } from '../../context/NativeAudioContext';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause, Sparkles, ChevronRight, Disc } from 'lucide-react';

interface SlideIntroProps {
  onStartOdyssey: () => void;
}

export const SlideIntro: React.FC<SlideIntroProps> = ({ onStartOdyssey }) => {
  const { isPlaying, togglePlay, currentTrack } = useAudio();
  const { isDark } = useTheme();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX(((y - rect.height / 2) / (rect.height / 2)) * -12);
    setRotateY(((x - rect.width / 2) / (rect.width / 2)) * 12);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="w-screen h-screen flex-shrink-0 flex items-center justify-center px-6 sm:px-12 md:px-20 pt-16 pb-20 select-none relative overflow-hidden">
      
      {/* Huge Background Typography for Maximum Impact */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
        <span
          className={`font-cinematic font-black text-[22vw] leading-none tracking-tighter transition-colors duration-700 select-none ${
            isDark ? 'text-white/[0.03]' : 'text-black/[0.04]'
          }`}
        >
          MARTE
        </span>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center z-10">
        
        {/* Left Column: 3D Holographic Vinyl Cover */}
        <div className="lg:col-span-6 flex justify-center perspective-1000">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={togglePlay}
            className="relative cursor-pointer transition-transform duration-200 ease-out group"
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Vinyl record sliding out */}
            <div
              className={`absolute top-2 bottom-2 w-[92%] aspect-square rounded-full bg-[#121217] border-4 border-[#24242e] shadow-2xl transition-all duration-700 ease-out flex items-center justify-center -z-10 ${
                isPlaying
                  ? 'translate-x-[42%] rotate-[90deg]'
                  : 'group-hover:translate-x-[40%]'
              }`}
              style={{
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.9)',
              }}
            >
              {/* Grooves */}
              <div className="absolute inset-4 rounded-full border border-white/5 opacity-80" />
              <div className="absolute inset-8 rounded-full border border-white/5 opacity-60" />
              <div className="absolute inset-14 rounded-full border border-white/5 opacity-40" />
              
              {/* Vinyl center label */}
              <div
                className={`w-28 h-28 rounded-full overflow-hidden border-2 border-white/30 relative shadow-inner ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <img
                  src={ALBUM_DATA.coverUrl}
                  alt={ALBUM_DATA.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#05060a] border border-white/40" />
              </div>
            </div>

            {/* Cover Sleeve */}
            <div
              className={`relative w-64 sm:w-80 md:w-96 aspect-square rounded-3xl overflow-hidden p-2.5 backdrop-blur-2xl transition-all duration-500 shadow-2xl border ${
                isDark
                  ? 'border-white/15 bg-white/[0.04] shadow-[0_20px_60px_-15px_rgba(230,57,70,0.4)]'
                  : 'border-black/10 bg-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]'
              }`}
            >
              <img
                src={ALBUM_DATA.coverUrl}
                alt={ALBUM_DATA.title}
                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
              />

              {/* Glass sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none rounded-2xl" />

              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-mars-crimson text-white flex items-center justify-center shadow-2xl shadow-mars-crimson/70 group-hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  )}
                </div>
              </div>

              {/* Bottom Playing Tag */}
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 bg-black/40 text-white flex items-center justify-between text-[11px] font-mono">
                <span className="truncate">
                  {isPlaying ? `IN ASCOLTO: ${currentTrack.title}` : 'CLICCA PER ASCOLTARE'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-mars-crimson animate-ping' : 'bg-white/40'}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: High-Impact Typography & Narrative */}
        <div className="lg:col-span-6 flex flex-col items-start space-y-5">
          
          <div className="inline-flex items-center space-x-2 backdrop-blur-xl px-4 py-1.5 rounded-full border border-mars-crimson/30 text-xs font-mono text-mars-crimson uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALBUM UFFICIALE • 2026</span>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs sm:text-sm tracking-widest-2xl uppercase text-gray-500 dark:text-white/50">
              {ALBUM_DATA.artist}
            </p>
            <h1 className="font-cinematic font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-gray-950 dark:text-white leading-[1.08]">
              Non C'è Vita <br />
              <span className="text-mars-crimson">Su Marte</span>
            </h1>
          </div>

          <p className="text-sm sm:text-base text-gray-700 dark:text-white/70 leading-relaxed font-light max-w-lg">
            {ALBUM_DATA.tagline} Dieci capitoli sonori a scorrimento orizzontale: naviga traccia per traccia o ascolta l'album in continuità.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-gray-800 dark:text-white/80">
              10 CAPITOLI AUDIO
            </span>
            <span className="backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-gray-800 dark:text-white/80">
              34:58 MINUTI
            </span>
            <span className="backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-gray-800 dark:text-white/80">
              AUDIO NATIVO 100%
            </span>
          </div>

          {/* Main Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={togglePlay}
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-full bg-mars-crimson hover:bg-red-600 text-white font-mono text-xs uppercase tracking-widest font-semibold shadow-2xl shadow-mars-crimson/50 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>IN PAUSA</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>ASCOLTA L'ALBUM</span>
                </>
              )}
            </button>

            <button
              onClick={onStartOdyssey}
              className="inline-flex items-center space-x-2 px-6 py-4 rounded-full border border-black/15 dark:border-white/15 hover:border-mars-crimson/50 text-gray-900 dark:text-white font-mono text-xs uppercase tracking-wider backdrop-blur-xl transition-all duration-200"
            >
              <span>SFOGLIA I BRANI</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] font-mono text-gray-400 dark:text-white/40 pt-1">
            * Usa le frecce della tastiera ← → o scorri con la rotellina per navigare
          </p>

        </div>

      </div>

    </div>
  );
};
