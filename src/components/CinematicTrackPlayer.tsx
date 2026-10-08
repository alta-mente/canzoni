import React from 'react';
import { useAudio } from '../context/NativeAudioContext';
import { Track } from '../data/albumData';
import { Play, Pause, Volume2, VolumeX, Radio, ExternalLink } from 'lucide-react';

interface CinematicTrackPlayerProps {
  track: Track;
}

export const CinematicTrackPlayer: React.FC<CinematicTrackPlayerProps> = ({ track }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration, seek, isMuted, toggleMute } = useAudio();

  const isThisTrackActive = currentTrack.id === track.id;
  const isThisTrackPlaying = isThisTrackActive && isPlaying;

  const handlePlayToggle = () => {
    if (isThisTrackActive) {
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

  const progress = isThisTrackActive && duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isThisTrackActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  return (
    <div className="w-full max-w-xl hud-border p-4 sm:p-5 rounded-3xl cinematic-box-glow space-y-4">
      
      {/* Top Meta info */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isThisTrackPlaying ? 'bg-mars-bright animate-ping' : 'bg-white/30'}`} />
          <span className="text-white/80 uppercase tracking-widest font-semibold">
            {isThisTrackPlaying ? 'IN RIPRODUZIONE NATIVA' : 'STREAM DIRETTO'}
          </span>
        </div>

        {/* Clean Spotify link without iframe */}
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-[#1DB954] flex items-center space-x-1.5 transition-colors"
          title="Apri questo brano su Spotify"
        >
          <Radio className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>Apri su Spotify</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Transport Row */}
      <div className="flex items-center space-x-4">
        {/* Big Glow Play Button */}
        <button
          onClick={handlePlayToggle}
          aria-label={isThisTrackPlaying ? 'Metti in pausa' : 'Riproduci brano'}
          className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-xl ${
            isThisTrackPlaying
              ? 'bg-gradient-to-r from-mars-crimson to-amber-500 text-white shadow-mars-crimson/50 scale-105'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-mars-bright/50'
          }`}
        >
          {isThisTrackPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Middle: Waveform / Scrubber and Time */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>{isThisTrackActive ? formatTime(currentTime) : '0:00'}</span>
            <span>{track.duration}</span>
          </div>

          {/* Interactive Progress Bar */}
          <div
            onClick={handleSeek}
            className="h-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative overflow-hidden transition-colors"
          >
            <div
              className="h-full bg-gradient-to-r from-mars-crimson via-mars-bright to-amber-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Mute toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-xl text-white/40 hover:text-white transition-colors"
          title={isMuted ? 'Riattiva audio' : 'Disattiva audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-mars-bright" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Equalizer frequency bars when active */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-end space-x-1 h-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isThisTrackPlaying ? 'bg-gradient-to-t from-mars-crimson to-amber-400' : 'bg-white/10'
              }`}
              style={{
                height: isThisTrackPlaying ? `${Math.max(15, ((i * 17) % 85) + 15)}%` : '15%',
                animation: isThisTrackPlaying ? `pulse ${0.4 + (i % 5) * 0.15}s ease infinite alternate` : 'none',
              }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-white/40 tracking-wider">
          MASTER HIGH-RES AUDIO
        </span>
      </div>

    </div>
  );
};
