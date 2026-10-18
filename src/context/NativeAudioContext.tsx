import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { ALBUM_DATA, AlbumData, Track, DISCOGRAPHY, resolveAssetUrl } from '../data/albumData';

interface AudioContextType {
  currentTrack: Track;
  isPlaying: boolean;
  duration: number;
  volume: number;
  isMuted: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);
const AudioTimeContext = createContext<number>(0);

export const NativeAudioProvider: React.FC<{ children: ReactNode; albums?: AlbumData[] }> = ({
  children,
  albums,
}) => {
  const activeDiscography = albums && albums.length > 0 ? albums : DISCOGRAPHY;

  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    const firstAlbum = activeDiscography[0] || ALBUM_DATA;
    return firstAlbum.tracks && firstAlbum.tracks.length > 0
      ? firstAlbum.tracks[0]
      : ({} as Track);
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track>(currentTrack);
  const nextTrackRef = useRef<() => void>(() => {});

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (nextTrackRef.current) {
        nextTrackRef.current();
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = (e: Event) => {
      console.warn('NativeAudio error on source:', audio.src, e);
      const track = currentTrackRef.current;
      if (audio.src && audio.src.includes('audio-fette') && !audio.src.includes('raw.githubusercontent.com') && !audio.src.includes('cdn1.suno.ai')) {
        const filename = audio.src.split('/').pop()?.split('?')[0];
        if (filename) {
          console.info('Retrying with GitHub raw fallback:', filename);
          audio.src = `https://raw.githubusercontent.com/alta-mente/canzoni/main/public/audio-fette/${filename}`;
          audio.currentTime = 0;
          audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          return;
        }
      }
      if (track?.sunoId && !audio.src.includes('cdn1.suno.ai')) {
        console.info('Retrying with Suno CDN fallback:', track.sunoId);
        audio.src = `https://cdn1.suno.ai/${track.sunoId}.mp4`;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        return;
      }
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentTime(0);
    if (track.durationSeconds) {
      setDuration(track.durationSeconds);
    }
    const audio = audioRef.current;
    if (audio) {
      audio.src = resolveAssetUrl(track.audioSrc);
      audio.currentTime = 0;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      const resolvedSrc = resolveAssetUrl(currentTrack.audioSrc);
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        audio.src = resolvedSrc;
      }
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const nextTrack = useCallback(() => {
    const currentAlbum =
      activeDiscography.find((a) => a.tracks.some((t) => t.id === currentTrack.id)) ||
      activeDiscography[0] ||
      ALBUM_DATA;
    const currIdx = currentAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (currIdx + 1) % currentAlbum.tracks.length;
    playTrack(currentAlbum.tracks[nextIdx]);
  }, [activeDiscography, currentTrack, playTrack]);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const prevTrack = useCallback(() => {
    const currentAlbum =
      activeDiscography.find((a) => a.tracks.some((t) => t.id === currentTrack.id)) ||
      activeDiscography[0] ||
      ALBUM_DATA;
    const currIdx = currentAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (currIdx - 1 + currentAlbum.tracks.length) % currentAlbum.tracks.length;
    playTrack(currentAlbum.tracks[prevIdx]);
  }, [activeDiscography, currentTrack, playTrack]);

  const contextValue = useMemo<AudioContextType>(
    () => ({
      currentTrack,
      isPlaying,
      duration,
      volume,
      isMuted,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
    }),
    [
      currentTrack,
      isPlaying,
      duration,
      volume,
      isMuted,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
    ]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      <AudioTimeContext.Provider value={currentTime}>
        {children}
      </AudioTimeContext.Provider>
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within NativeAudioProvider');
  }
  return context;
};

export const useAudioTime = (): number => {
  return useContext(AudioTimeContext);
};
