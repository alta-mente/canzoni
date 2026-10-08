import React from 'react';
import { Track, ALBUM_DATA } from '../../data/albumData';
import { useAudio } from '../../context/NativeAudioContext';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause, Volume2, VolumeX, Radio, ExternalLink, Sparkles } from 'lucide-react';

interface SlideTrackProps {
  track: Track;
  index: number;
  totalTracks: number;
  onNextSlide?: () => void;
}

export const SlideTrack: React.FC<SlideTrackProps> = ({
  track,
  index,
  totalTracks,
  onNextSlide,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration, seek, isMuted, toggleMute } = useAudio();
  const { isDark } = useTheme();

  const isCurrent = currentTrack.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const chapterNumber = String(index + 1).padStart(2, '0');

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = isCurrent && duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrent) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  return (
    <div className="w-screen h-screen flex-shrink-0 flex items-center justify-center px-6 sm:px-12 md:px-20 pt-16 pb-20 select-none relative overflow-hidden">
      
      {/* Giant Background Number for Brutalist Impact */}
      <div className="absolute inset-0 flex items-center justify-end pr-8 sm:pr-24 pointer-events-none -z-10 select-none overflow-hidden">
        <span
          className={`font-cinematic font-black text-[30vw] leading-none tracking-tighter transition-colors duration-700 select-none ${
            isDark ? 'text-white/[0.04]' : 'text-black/[0.04]'
          }`}
        >
          {chapterNumber}
        </span>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center z-10">
        
        {/* Left Column: Visual Vinyl / Artwork Case */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            onClick={handlePlayToggle}
            className="relative cursor-pointer group transition-transform duration-300"
          >
            {/* Vinyl record disc */}
            <div
              className={`absolute top-2 bottom-2 w-[90%] aspect-square rounded-full bg-[#14141a] border-4 border-[#252530] shadow-2xl transition-all duration-700 ease-out flex items-center justify-center -z-10 ${
                isThisPlaying
                  ? 'translate-x-[42%] rotate-[90deg]'
                  : 'group-hover:translate-x-[36%]'
              }`}
            >
              <div className="absolute inset-4 rounded-full border border-white/5 opacity-80" />
              <div className="absolute inset-8 rounded-full border border-white/5 opacity-60" />
              <div className="absolute inset-12 rounded-full border border-white/5 opacity-40" />
              
              <div
                className={`w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 relative shadow-inner ${
                  isThisPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <img src={ALBUM_DATA.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#05060a] border border-white/40" />
              </div>
            </div>

            {/* Sleeve Card */}
            <div
              className={`relative w-60 sm:w-72 md:w-84 aspect-square rounded-[4px] overflow-hidden p-2 backdrop-blur-2xl transition-all duration-300 shadow-2xl border ${
                isDark
                  ? 'border-white/15 bg-white/[0.04] shadow-[0_20px_50px_-15px_rgba(230,57,70,0.35)]'
                  : 'border-black/10 bg-white/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)]'
              }`}
            >
              <img
                src={track.artworkUrl || ALBUM_DATA.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover rounded-[2px] group-hover:scale-105 transition-transform duration-700"
              />

              {/* Center Play Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2px]">
                <div className="w-16 h-16 rounded-full bg-mars-crimson text-white flex items-center justify-center shadow-2xl shadow-mars-crimson/70 group-hover:scale-110 transition-transform">
                  {isThisPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  )}
                </div>
              </div>

              {/* Track badge */}
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 bg-black/40 text-white flex items-center justify-between text-[11px] font-mono">
                <span className="truncate">
                  {isThisPlaying ? 'IN RIPRODUZIONE' : `CAPITOLO ${chapterNumber}`}
                </span>
                <span className={`w-2 h-2 rounded-full ${isThisPlaying ? 'bg-mars-crimson animate-ping' : 'bg-white/40'}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Track Story, Bold Title & Custom Native Player */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6">
          
          {/* Header Info */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-mars-crimson/15 text-mars-crimson font-bold tracking-widest uppercase">
              CAPITOLO {chapterNumber} / {String(totalTracks).padStart(2, '0')}
            </span>
            <span className="text-gray-400 dark:text-white/40">•</span>
            <span className="text-gray-600 dark:text-white/60 tracking-wider uppercase">
              {track.mood}
            </span>
          </div>

          {/* Track Title */}
          <div className="space-y-1">
            <h2 className="font-cinematic font-black text-3xl sm:text-5xl md:text-6xl text-gray-950 dark:text-white tracking-tight uppercase leading-[1.08]">
              {track.title}
            </h2>
            <p className="font-mono text-xs text-gray-500 dark:text-white/40 uppercase tracking-widest">
              {ALBUM_DATA.artist} // TRACCIA N° {track.number} • {track.duration}
            </p>
          </div>

          {/* Poetic Author Note */}
          {track.storyQuote && (
            <div className="border-l-2 border-mars-crimson pl-5 py-1">
              <p className="font-sans text-base sm:text-xl text-gray-800 dark:text-white/90 italic font-light leading-relaxed">
                {track.storyQuote}
              </p>
            </div>
          )}

          {/* High-Impact Native Audio Player */}
          <div
            className={`w-full max-w-xl p-5 rounded-3xl backdrop-blur-2xl border transition-all duration-300 shadow-xl ${
              isDark
                ? 'bg-white/[0.04] border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
                : 'bg-white/80 border-black/10 shadow-[0_15px_40px_rgba(0,0,0,0.08)]'
            }`}
          >
            {/* Top Bar of player */}
            <div className="flex items-center justify-between text-xs font-mono mb-3">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isThisPlaying ? 'bg-mars-crimson animate-ping' : 'bg-gray-400 dark:bg-white/30'}`} />
                <span className="font-bold text-gray-700 dark:text-white/80 uppercase tracking-wider">
                  {isThisPlaying ? 'AUDIO STREAMING ATTIVO' : 'AUDIO NATIVO 100%'}
                </span>
              </div>

              {/* Direct Spotify Single link */}
              <a
                href={track.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-white/40 hover:text-[#1DB954] flex items-center space-x-1 transition-colors"
                title="Apri brano su Spotify"
              >
                <Radio className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Spotify</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Transport & Waveform */}
            <div className="flex items-center space-x-4">
              {/* Big Play Button */}
              <button
                onClick={handlePlayToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 shadow-xl ${
                  isThisPlaying
                    ? 'bg-mars-crimson text-white shadow-mars-crimson/50 scale-105'
                    : 'bg-black/10 dark:bg-white/10 hover:bg-mars-crimson hover:text-white text-gray-900 dark:text-white border border-black/10 dark:border-white/20'
                }`}
              >
                {isThisPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Scrubber & Timings */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-white/50">
                  <span>{isCurrent ? formatTime(currentTime) : '0:00'}</span>
                  <span>{track.duration}</span>
                </div>

                <div
                  onClick={handleSeek}
                  className="h-2 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-mars-crimson to-amber-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Mute button */}
              <button
                onClick={toggleMute}
                className="p-2 text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-mars-crimson" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Equalizer Frequency Bars */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-end space-x-1 h-3">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isThisPlaying ? 'bg-mars-crimson' : 'bg-black/10 dark:bg-white/10'
                    }`}
                    style={{
                      height: isThisPlaying ? `${Math.max(20, ((i * 19) % 80) + 20)}%` : '20%',
                      animation: isThisPlaying ? `pulse ${0.4 + (i % 4) * 0.15}s ease infinite alternate` : 'none',
                    }}
                  />
                ))}
              </div>

              <span className="text-[10px] font-mono text-gray-400 dark:text-white/30 uppercase tracking-widest">
                ALESSANDRO ROCCHI © 2026
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
