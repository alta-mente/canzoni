import React from 'react';
import { Track, ALBUM_DATA } from '../../data/albumData';
import { CinematicTrackPlayer } from '../CinematicTrackPlayer';
import { ArrowDown, Quote, Sparkles } from 'lucide-react';

interface TrackSceneProps {
  track: Track;
  index: number;
  totalTracks: number;
  onNextChapter?: () => void;
}

export const TrackScene: React.FC<TrackSceneProps> = ({
  track,
  index,
  totalTracks,
  onNextChapter,
}) => {
  const chapterNumber = String(index + 1).padStart(2, '0');
  const isLast = index + 1 === totalTracks;

  return (
    <section
      id={`scene-${index + 1}`}
      className="relative min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 md:px-20 py-28 border-b border-white/5"
    >
      {/* Dynamic atmospheric radial backdrop */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[160px] opacity-20 pointer-events-none -z-10"
        style={{
          background: index % 2 === 0
            ? 'radial-gradient(circle, rgba(230, 57, 70, 0.7) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 140, 66, 0.6) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 z-10">
        
        {/* Chapter Super-Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs sm:text-sm font-bold text-mars-bright tracking-widest-xl uppercase">
              CAPITOLO {chapterNumber} / {String(totalTracks).padStart(2, '0')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-mars-crimson animate-ping" />
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-white/50">
            <span>DURATA: {track.duration}</span>
            <span>•</span>
            <span className="text-white/80 uppercase">{track.mood}</span>
          </div>
        </div>

        {/* Track Title */}
        <div className="space-y-3">
          <h2 className="font-cinematic font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight uppercase leading-[1.08] cinematic-glow">
            {track.title}
          </h2>
          <p className="font-mono text-xs sm:text-sm text-mars-dust/70 tracking-widest uppercase">
            {ALBUM_DATA.artist} // TRACCIA N° {track.number}
          </p>
        </div>

        {/* The Poetic Quote / Story behind the song */}
        {track.storyQuote && (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-mars-crimson/80 max-w-2xl py-2">
            <p className="font-sans text-base sm:text-xl md:text-2xl text-white/90 italic font-light leading-relaxed">
              {track.storyQuote}
            </p>
            <span className="block text-xs font-mono text-white/40 mt-2 uppercase tracking-wider">
              — Dalla genesi del brano
            </span>
          </div>
        )}

        {/* Native Cinematic Player (No Spotify Iframe, No Grey Box!) */}
        <div className="pt-2">
          <CinematicTrackPlayer track={track} />
        </div>

        {/* Next Chapter Navigation Link */}
        {onNextChapter && (
          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={onNextChapter}
              className="group inline-flex items-center space-x-2 text-xs font-mono tracking-widest uppercase text-white/60 hover:text-white transition-colors"
            >
              <span>{isLast ? 'PASSA ALL\'EPILOGO & CREDITI' : 'CAPITOLO SUCCESSIVO'}</span>
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
