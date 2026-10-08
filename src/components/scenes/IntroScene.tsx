import React from 'react';
import { ALBUM_DATA } from '../../data/albumData';
import { useAudio } from '../../context/NativeAudioContext';
import { ArrowDown, Radio, Sparkles, Play, Pause, ExternalLink } from 'lucide-react';

interface IntroSceneProps {
  onStartOdyssey: () => void;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ onStartOdyssey }) => {
  const { isPlaying, togglePlay, currentTrack } = useAudio();

  return (
    <section
      id="scene-0"
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-8 py-24 text-center select-none"
    >
      {/* Background ambient radial halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[800px] aspect-square rounded-full bg-mars-crimson/15 blur-[140px] pointer-events-none -z-10" />

      {/* Mission Prologue / Artist Stamp */}
      <div className="space-y-5 max-w-4xl mx-auto z-10 flex flex-col items-center">
        
        <div className="inline-flex items-center space-x-2.5 hud-border px-4 py-1.5 rounded-full text-xs font-mono text-mars-bright tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NUOVO ALBUM • OTTOBRE 2026</span>
        </div>

        {/* Artist Name */}
        <p className="font-mono text-xs sm:text-sm tracking-widest-2xl uppercase text-white/60">
          ALESSANDRO ROCCHI
        </p>

        {/* Monumental Cinematic Title */}
        <h1 className="font-cinematic font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight sm:tracking-widest uppercase text-white leading-[1.05] cinematic-glow">
          NON C'È VITA <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-mars-dust to-mars-crimson">
            SU MARTE
          </span>
        </h1>

        {/* Subtitle / Poetic Premise */}
        <p className="max-w-2xl text-sm sm:text-base md:text-lg text-white/65 font-sans font-light leading-relaxed">
          Un'opera concettuale viscerale in dieci capitoli. Il vuoto cosmico, il riverbero di stanze lontane e la ricerca della vita dove sembra esserci solo silenzio.
        </p>

        {/* Monolith Artwork with Direct Native Play Button */}
        <div className="relative pt-4 pb-2 group cursor-pointer" onClick={togglePlay}>
          <div className="relative w-52 sm:w-64 aspect-square rounded-3xl overflow-hidden hud-border p-2.5 cinematic-box-glow transition-transform duration-500 group-hover:scale-105">
            <img
              src={ALBUM_DATA.coverUrl}
              alt={ALBUM_DATA.title}
              className="w-full h-full object-cover rounded-2xl"
            />

            {/* Glowing play overlay on cover */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 flex items-center justify-center transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-mars-crimson to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-mars-crimson/60 group-hover:scale-110 active:scale-95 transition-transform">
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                )}
              </div>
            </div>

            {/* Live Indicator Badge */}
            <div className="absolute bottom-4 left-4 right-4 hud-border px-3 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-mono backdrop-blur-md">
              <span className="text-white/80 truncate">
                {isPlaying ? `IN ASCOLTO: ${currentTrack.title}` : 'CLICCA PER ASCOLTARE'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-mars-bright animate-ping' : 'bg-white/40'}`} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStartOdyssey}
            className="group flex items-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-mars-crimson via-mars-bright to-amber-500 text-white font-mono text-xs tracking-widest uppercase font-semibold shadow-2xl shadow-mars-crimson/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>ESPLORA I 10 CAPITOLI</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </button>

          <a
            href={ALBUM_DATA.spotifyAlbumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hud-border px-6 py-4 rounded-full text-xs font-mono text-white/80 hover:text-white hover:border-mars-crimson/40 tracking-wider uppercase transition-all flex items-center space-x-2"
          >
            <Radio className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>DISPONIBILE ANCHE SU SPOTIFY</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>

      {/* Scroll Down Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none opacity-60">
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">
          SCORRI PER ENTRARE NELL'ORBITA
        </span>
        <div className="w-0.5 h-6 bg-gradient-to-b from-mars-crimson to-transparent animate-pulse" />
      </div>
    </section>
  );
};
