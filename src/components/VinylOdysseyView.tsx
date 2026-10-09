import React, { useState, useEffect, useRef } from 'react';
import { AlbumData, DISCOGRAPHY } from '../data/albumData';
import { useAudio } from '../context/NativeAudioContext';
import { useTheme } from '../context/ThemeContext';
import { VinylCarousel } from './VinylCarousel';
import { EditorialSwissView } from './EditorialSwissView';
import { RadialTrackSelector } from './RadialTrackSelector';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Play, 
  Pause, 
  Sun, 
  Moon, 
  Radio, 
  Share2, 
  ExternalLink,
  Disc,
  Layers,
  Volume2,
  VolumeX,
  Clapperboard,
  SkipBack,
  SkipForward,
  ListMusic,
  FileText,
  Settings,
  Sliders,
  X,
  Copy,
  Check
} from 'lucide-react';

interface VinylOdysseyViewProps {
  onOpenShare: () => void;
  onOpenEPK: () => void;
  onOpenBackoffice?: () => void;
  albums?: AlbumData[];
}

export const VinylOdysseyView: React.FC<VinylOdysseyViewProps> = ({ 
  onOpenShare, 
  onOpenEPK, 
  onOpenBackoffice,
  albums
}) => {
  const discography = albums && albums.length > 0 ? albums : DISCOGRAPHY;
  const [currentAlbumId, setCurrentAlbumId] = useState<string>(discography[0].id);
  const currentAlbum = discography.find((a) => a.id === currentAlbumId) || discography[0];

  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration, seek, isMuted, toggleMute } = useAudio();
  const { isDark, toggleTheme } = useTheme();

  // Start with the random track chosen by NativeAudioContext on first load
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (currentTrack) {
      const idx = currentAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
      if (idx !== -1) return idx;
    }
    const count = currentAlbum.tracks.length;
    return count > 0 ? Math.floor(Math.random() * count) : 0;
  });

  const [displayMode, setDisplayMode] = useState<'carousel' | 'sleeve' | 'editorial'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('canzoni_display_mode');
      if (saved === 'carousel' || saved === 'sleeve' || saved === 'editorial') {
        return saved as 'carousel' | 'sleeve' | 'editorial';
      }
    }
    // Default to 3D Carousel everywhere for an immersive, visual experience
    return 'carousel';
  });

  const handleSetDisplayMode = (mode: 'carousel' | 'sleeve' | 'editorial') => {
    setDisplayMode(mode);
    try {
      localStorage.setItem('canzoni_display_mode', mode);
    } catch {
      // ignore
    }
  };
  const [showCanvasBackground, setShowCanvasBackground] = useState<boolean>(true);
  const [showTracklist, setShowTracklist] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeTrack = currentAlbum.tracks[currentIndex] || currentAlbum.tracks[0];
  // Track-specific video canvas takes precedence over album-level fallback video
  const activeVideoSrc = activeTrack.canvasVideoSrc || currentAlbum.canvasVideoSrc;

  const handleSelectTrack = (index: number) => {
    setCurrentIndex(index);
    playTrack(currentAlbum.tracks[index]);
  };

  const handlePrev = () => {
    const prev = (currentIndex - 1 + currentAlbum.tracks.length) % currentAlbum.tracks.length;
    handleSelectTrack(prev);
  };

  const handleNext = () => {
    const next = (currentIndex + 1) % currentAlbum.tracks.length;
    handleSelectTrack(next);
  };

  const handleSelectAlbum = (album: AlbumData) => {
    setCurrentAlbumId(album.id);
    setCurrentIndex(0);
    playTrack(album.tracks[0]);
  };

  const handleCopyLyrics = () => {
    if (activeTrack.lyrics) {
      navigator.clipboard.writeText(activeTrack.lyrics);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    }
  };

  // Attempt autoplay of the chosen random track, with fallback on very first user interaction
  useEffect(() => {
    const initialTrack = currentAlbum.tracks[currentIndex] || currentAlbum.tracks[0];
    if (!initialTrack) return;

    // 1. Try immediate playback
    playTrack(initialTrack);

    // 2. Fallback listener if browser autoplay policy stopped immediate playback
    const handleFirstUserGesture = () => {
      playTrack(initialTrack);
    };

    window.addEventListener('pointerdown', handleFirstUserGesture, { once: true });
    window.addEventListener('keydown', handleFirstUserGesture, { once: true });
    window.addEventListener('touchstart', handleFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
    };
  }, []);

  // Synchronize visual state whenever audio track changes (e.g. auto-play next track on ended)
  useEffect(() => {
    if (!currentTrack) return;
    const foundAlbum = discography.find((a) => a.tracks.some((t) => t.id === currentTrack.id));
    if (foundAlbum) {
      if (foundAlbum.id !== currentAlbumId) {
        setCurrentAlbumId(foundAlbum.id);
      }
      const idx = foundAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [currentTrack, currentAlbumId, currentIndex, discography]);

  // Keyboard navigation & modal shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLyricsModal) {
          setShowLyricsModal(false);
          return;
        }
        if (showTracklist) {
          setShowTracklist(false);
          return;
        }
        if (showSettingsMenu) {
          setShowSettingsMenu(false);
          return;
        }
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, isPlaying, showLyricsModal, showTracklist, showSettingsMenu]);

  // Ensure video plays smoothly whenever track or album changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Canvas video play prevented:', err);
      });
    }
  }, [activeVideoSrc, showCanvasBackground]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const currentBgColor = isDark ? activeTrack.colorDark : activeTrack.colorLight;
  const isLightMode = !isDark;

  if (displayMode === 'editorial') {
    return (
      <>
        <EditorialSwissView
          albums={discography}
          currentAlbum={currentAlbum}
          activeTrack={activeTrack}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isMuted={isMuted}
          onSelectTrack={handleSelectTrack}
          onSelectAlbum={handleSelectAlbum}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onSeek={seek}
          onPrev={handlePrev}
          onNext={handleNext}
          onOpenLyrics={() => setShowLyricsModal(true)}
          onOpenEPK={onOpenEPK}
          onOpenShare={onOpenShare}
          onOpenBackoffice={onOpenBackoffice}
          onSwitchDisplayMode={(mode) => handleSetDisplayMode(mode)}
          displayMode={displayMode}
          formatTime={formatTime}
        />

        {/* Full Lyrics Modal (Libretto del Disco) */}
        {showLyricsModal && activeTrack.lyrics && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowLyricsModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl animate-in zoom-in-95 duration-200 bg-white/95 text-gray-900 border-black/10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#d94436] font-bold block">
                    Libretto del Disco • Traccia {String(activeTrack.number).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-bold font-mono mt-0.5 text-black">
                    {activeTrack.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLyrics}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shadow-sm ${
                      copiedLyrics
                        ? 'bg-emerald-500 text-black'
                        : 'bg-black/5 hover:bg-black/10 text-gray-800'
                    }`}
                    title="Copia testo negli appunti"
                  >
                    {copiedLyrics ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIATO!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">COPIA TESTO</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowLyricsModal(false)}
                    className="p-2 rounded-xl hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
                    title="Chiudi (ESC)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-3 space-y-6 font-sans text-sm sm:text-base leading-relaxed text-black/85 select-text">
                {activeTrack.lyrics.split(/\n\s*\n/).map((stanza, sIdx) => (
                  <p key={sIdx} className="space-y-1.5 font-normal leading-relaxed">
                    {stanza.split('\n').map((line, lIdx) => (
                      <span key={lIdx} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                ))}
              </div>

              <div className="pt-3 mt-3 border-t border-black/10 flex items-center justify-between text-[10px] font-mono opacity-60">
                <span>{activeTrack.lyrics.split('\n').filter(Boolean).length} VERSI</span>
                <span>TESTO & MUSICA: {currentAlbum.artist}</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between px-3 sm:px-12 md:px-16 pt-2 pb-1 sm:py-5 select-none"
      style={{
        color: isLightMode ? '#111827' : '#ffffff',
      }}
    >
      {/* 1. Underlying Base Background Layer with Atmospheric Gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] -z-30"
        style={{
          background: isLightMode
            ? `radial-gradient(ellipse at 50% 45%, ${activeTrack.colorLight} 0%, #e2e8f0 70%, #cbd5e1 100%)`
            : `radial-gradient(ellipse at 50% 45%, ${activeTrack.colorDark}cc 0%, #11131c 60%, #08090d 100%)`,
        }}
      />

      {/* 2. Luminous Ambient Stage Glow (Centered behind the Vinyl carousel) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] max-w-[1000px] h-[70vh] max-h-[700px] rounded-full blur-[120px] pointer-events-none -z-20 transition-all duration-1000 opacity-60"
        style={{
          backgroundColor: isLightMode ? activeTrack.colorLight : activeTrack.colorDark,
        }}
      />

      {/* 3. Background Canvas Video Loop (Crisp, atmospheric, non-crushed) */}
      {showCanvasBackground && activeVideoSrc && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <video
            ref={videoRef}
            key={activeVideoSrc}
            src={activeVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isLightMode ? 'opacity-30 mix-blend-multiply' : 'opacity-65 mix-blend-normal'
            }`}
          />
          {/* Subtle contrast scrim for header & footer UI legibility, keeping center stage open */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/45" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40" />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & IDENTITY BAR (Full-width, perfectly aligned)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full border-b border-white/10 sm:border-white/15 pb-2 md:pb-0">
        <div className="w-full flex items-center md:items-end justify-between gap-3 sm:gap-4">
          {/* Left: Artist Identity + Album Tabs (Desktop) */}
          <div className="flex items-center md:items-end gap-3 sm:gap-5 shrink-0 min-w-0">
            {/* Artist Brand Tag - ALWAYS VISIBLE on mobile & desktop */}
            <div className="flex flex-col pr-1 pb-0.5 md:pb-2.5 select-none shrink-0">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.22em] uppercase text-amber-400 font-bold leading-none">
                CANZONI
              </span>
              <span className="text-xs sm:text-sm font-mono font-black tracking-wider uppercase opacity-95 leading-tight mt-0.5 whitespace-nowrap">
                ALESSANDRO ROCCHI
              </span>
            </div>

            {/* Desktop vertical divider */}
            <div className="hidden md:block h-6 w-px bg-white/15 mb-2 sm:mb-2.5 shrink-0" />

            {/* Desktop Navigation Tabs (Hidden on mobile, replaced by row 2) */}
            <nav
              aria-label="Selezione Album"
              className="hidden md:flex items-end gap-1.5 sm:gap-2 mb-[-1px]"
            >
              {discography.map((album, idx) => {
                const isSelected = album.id === currentAlbum.id;
                const spotifyUrl = album.spotifyAlbumUrl;
                return (
                  <div
                    key={album.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!isSelected) handleSelectAlbum(album);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isSelected) {
                        e.preventDefault();
                        handleSelectAlbum(album);
                      }
                    }}
                    className={`group relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-lg sm:rounded-t-xl transition-all duration-200 text-left border-t border-x cursor-pointer select-none ${
                      isSelected
                        ? isLightMode
                          ? 'bg-white/85 backdrop-blur-xl text-gray-950 border-black/15 border-b-transparent shadow-sm z-10'
                          : 'bg-white/15 backdrop-blur-xl text-white border-white/25 border-b-transparent shadow-md z-10'
                        : isLightMode
                        ? 'bg-black/[0.02] hover:bg-black/[0.06] text-gray-600 hover:text-gray-900 border-black/10 border-b-black/10'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white/80 border-white/10 border-b-white/15'
                    }`}
                    title={`Ascolta ${album.title}`}
                  >
                    {/* Numero Album: 1 e 2 */}
                    <span className={`font-mono text-[10px] sm:text-xs font-black shrink-0 ${
                      isSelected ? 'text-amber-400' : 'opacity-40 group-hover:opacity-75'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Miniature Cover Art */}
                    <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-[2px] overflow-hidden shrink-0 opacity-85 group-hover:opacity-100 transition-opacity border border-white/20 shadow-sm">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Album Title + Meta */}
                    <div className="flex flex-col min-w-0 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight uppercase whitespace-nowrap">
                          {album.title}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono tracking-wider mt-0.5">
                        <span className="opacity-50">{album.year}</span>
                        <span className="opacity-40">•</span>
                        <span className="opacity-50">{album.tracks.length} tracce</span>
                        {spotifyUrl && (
                          <>
                            <span className="opacity-40">•</span>
                            <a
                              href={spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#1DB954] hover:text-[#1ed760] font-semibold transition-colors cursor-pointer group/spot shrink-0"
                              title={`Apri ${album.title} su Spotify`}
                            >
                              <svg className="w-2.5 h-2.5 fill-[#1DB954] group-hover/spot:fill-[#1ed760] shrink-0" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                              </svg>
                              <span className="underline underline-offset-2 decoration-[#1DB954]/40 group-hover/spot:decoration-[#1ed760]">Spotify</span>
                              <ExternalLink className="w-2 h-2 opacity-70 group-hover/spot:opacity-100" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions (Spotify mobile, EPK & Settings Menu) */}
          <div className="relative flex items-center gap-1.5 sm:gap-2.5 shrink-0 pb-0.5 md:pb-2">
            {/* Spotify Pill on Mobile if available */}
            {currentAlbum.spotifyAlbumUrl && (
              <a
                href={currentAlbum.spotifyAlbumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="md:hidden h-7 sm:h-8 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-mono font-bold bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1ed760] border border-[#1DB954]/30 transition-all shadow-sm"
                title="Apri su Spotify"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span className="hidden xs:inline">SPOTIFY</span>
              </a>
            )}

            {/* EPK / Electronic Press Kit Button */}
            <button
              onClick={onOpenEPK}
              className={`h-7 sm:h-9 px-2.5 sm:px-3.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider backdrop-blur-xl border ${
                isLightMode
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border-amber-600/30 shadow-sm'
                  : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              }`}
              title="Cartella Stampa / Electronic Press Kit (EPK)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] sm:text-xs">EPK</span>
            </button>

            {/* Settings & Tools Toggle (Menu Ingranaggio) */}
            <button
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              aria-expanded={showSettingsMenu}
              aria-label="Opzioni visualizzazione e strumenti"
              className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl border ${
                showSettingsMenu
                  ? isLightMode
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : isLightMode
                  ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-800'
                  : 'bg-white/5 hover:bg-white/15 border-white/10 text-white/80'
              }`}
              title="Personalizza interfaccia e strumenti"
            >
              <Settings className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : ''}`} />
            </button>

          {/* Dropdown Popover Menu (Interface Customization & Share) */}
          {showSettingsMenu && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
                onClick={() => setShowSettingsMenu(false)}
              />

              <div
                className={`absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl border transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isLightMode
                    ? 'bg-white/95 border-black/10 text-gray-900 shadow-black/20'
                    : 'bg-[#0f1017]/95 border-white/15 text-white shadow-black/80'
                }`}
              >
                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 font-semibold">
                    Personalizzazione
                  </span>
                  <button
                    onClick={() => setShowSettingsMenu(false)}
                    className="p-1 rounded-lg hover:bg-white/10 opacity-50 hover:opacity-100 transition-opacity"
                    title="Chiudi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  {/* Vista Interfaccia: Custodia | Carosello 3D */}
                  <div className="p-2 rounded-xl bg-black/20 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-60 font-semibold px-1">
                      <span>Stile Interfaccia</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => {
                          handleSetDisplayMode('sleeve');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center ${
                          displayMode === 'sleeve'
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Custodia
                      </button>
                      <button
                        onClick={() => {
                          handleSetDisplayMode('carousel');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center ${
                          displayMode === 'carousel'
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Carosello 3D
                      </button>
                    </div>
                  </div>

                  {/* Sfondo Video Canvas (se disponibile) */}
                  {activeVideoSrc && (
                    <button
                      onClick={() => setShowCanvasBackground((prev) => !prev)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isLightMode ? 'hover:bg-black/5 text-gray-800' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clapperboard className="w-4 h-4 text-rose-400" />
                        <span>Sfondo Video Canvas</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                          showCanvasBackground
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-white/10 opacity-50'
                        }`}
                      >
                        {showCanvasBackground ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* Tema Chiaro / Scuro */}
                  <button
                    onClick={toggleTheme}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      isLightMode ? 'hover:bg-black/5 text-gray-800' : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      )}
                      <span>Tema Visivo</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 opacity-80">
                      {isDark ? 'Scuro' : 'Chiaro'}
                    </span>
                  </button>

                  {/* Testo Canzone (Lyrics) - if available */}
                  {activeTrack.lyrics && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowLyricsModal(true);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isLightMode ? 'hover:bg-black/5 text-gray-800' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Testo del Brano</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                        Lyrics
                      </span>
                    </button>
                  )}

                  <div className="my-1.5 border-t border-white/10" />

                  {/* Condividi */}
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenShare();
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                      isLightMode ? 'hover:bg-black/5 text-gray-900' : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium">Condividi Album / Brano</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-50">↗</span>
                  </button>

                  {/* Studio Backoffice Link */}
                  {onOpenBackoffice && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onOpenBackoffice();
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isLightMode ? 'hover:bg-black/5 text-gray-900' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span className="font-medium">Studio Backoffice</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold">
                        Gestione
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

        {/* Mobile-Only Dedicated Album Switcher Segmented Control */}
        <div className="flex md:hidden items-center p-0.5 rounded-lg bg-black/40 dark:bg-black/60 border border-white/10 backdrop-blur-xl w-full mt-1.5">
          {discography.map((album, idx) => {
            const isSelected = album.id === currentAlbum.id;
            return (
              <button
                key={album.id}
                type="button"
                onClick={() => {
                  if (!isSelected) handleSelectAlbum(album);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-200 min-w-0 ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-sm font-black'
                    : isLightMode
                    ? 'text-gray-700 hover:text-black hover:bg-black/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-3 h-3 rounded-[2px] overflow-hidden shrink-0 border border-black/20">
                  <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="truncate">{idx === 0 ? "Non C'è Vita su Marte" : "Fette Biscottate"}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. TRACK HERO & EDITORIAL LINER ROW (Spacious, balanced)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-start gap-1 pt-1 sm:pt-3 max-w-3xl shrink-0 w-full">
        
        {/* Track Title */}
        <div className="space-y-0.5 w-full">
          {/* Metadata info: Hidden on mobile per request, visible on sm+ */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono">
            <span className="font-bold uppercase tracking-widest text-amber-400">
              TRK {String(activeTrack.number).padStart(2, '0')}/{currentAlbum.tracks.length}
            </span>
            <span className="opacity-40">•</span>
            <span className="opacity-70">
              {activeTrack.duration}
            </span>
            <span className="opacity-40">•</span>
            <span className="uppercase tracking-wider opacity-60">
              {currentAlbum.title}
            </span>
          </div>

          <h1 className="font-sans font-black text-xl sm:text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight leading-tight drop-shadow-md truncate max-w-full">
            {activeTrack.title}
          </h1>
        </div>

        {/* Poetic Quote & Lyrics textual link - Free floating under the title */}
        {(activeTrack.storyQuote || activeTrack.lyrics) && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5 max-w-xl">
            {activeTrack.storyQuote && (
              <p className="text-[11px] sm:text-xs md:text-sm font-sans italic leading-snug opacity-80 drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                {activeTrack.storyQuote}
              </p>
            )}

            {activeTrack.lyrics && (
              <button
                onClick={() => setShowLyricsModal(true)}
                className={`group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono tracking-wider uppercase transition-all shrink-0 border backdrop-blur-md ${
                  isLightMode
                    ? 'bg-black/5 hover:bg-black/10 text-neutral-800 border-black/15 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20 shadow-sm'
                }`}
                title="Visualizza i testi del brano (Lyrics)"
              >
                <span>Lyrics</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-60">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CENTER STAGE: The 3D Vinyl Carousel */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center my-auto w-full">
        <VinylCarousel
          currentIndex={currentIndex}
          onSelectTrack={handleSelectTrack}
          onPrevTrack={handlePrev}
          onNextTrack={handleNext}
          displayMode={displayMode}
          album={currentAlbum}
        />
      </div>

      {/* BOTTOM CONTROLS: Unified Hi-Fi Capsule */}
      <div className="relative z-20 flex flex-col items-center pb-[max(0.35rem,env(safe-area-inset-bottom))] px-2 sm:px-4 w-full shrink-0">
        <div className="relative w-full max-w-2xl flex flex-col items-center">
          {/* Unified Capsule */}
          <div
            className={`w-full px-2.5 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-2xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1.5 sm:gap-4 relative z-40 ${
            isLightMode
              ? 'bg-white/85 border border-black/10 text-gray-900 shadow-black/10'
              : 'bg-[#0d0e14]/85 border border-white/15 text-white'
          }`}
        >
          {/* Playback Controls: Prev | Play/Pause | Next */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
            <button
              onClick={handlePrev}
              title="Traccia precedente"
              aria-label="Traccia precedente"
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${
                isLightMode ? 'hover:bg-black/10 text-gray-800' : 'hover:bg-white/15 text-white/80'
              }`}
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pausa' : 'Riproduci'}
              aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-lg ${
                isLightMode
                  ? 'bg-gray-900 text-white hover:bg-black'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              title="Traccia successiva"
              aria-label="Traccia successiva"
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${
                isLightMode ? 'hover:bg-black/10 text-gray-800' : 'hover:bg-white/15 text-white/80'
              }`}
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>
          </div>

          {/* Time Scrubber (Continuous, wide seekbar) */}
          <div className="flex-1 flex items-center space-x-1.5 sm:space-x-3 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-mono opacity-70 w-7 sm:w-9 text-right tabular-nums shrink-0">
              {formatTime(currentTime)}
            </span>

            <div
              onClick={handleSeek}
              className="flex-1 h-6 flex items-center cursor-pointer group relative"
              title="Scorri brano"
            >
              <div
                className={`w-full h-1.5 group-hover:h-2 rounded-full transition-all duration-150 relative overflow-hidden ${
                  isLightMode ? 'bg-black/15' : 'bg-white/20'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    isLightMode ? 'bg-gray-950' : 'bg-white'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] font-mono opacity-70 w-7 sm:w-9 text-left tabular-nums shrink-0">
              {activeTrack.duration}
            </span>
          </div>

          {/* Divider */}
          <div className={`h-5 w-px shrink-0 hidden xs:block ${isLightMode ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Right Section: Track Badge & Mute */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Track indicator badge + toggle list */}
            <button
              onClick={() => setShowTracklist((prev) => !prev)}
              title="Apri lista tracce"
              className={`font-mono text-[9px] sm:text-[11px] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full font-bold tracking-wider flex items-center space-x-1 sm:space-x-1.5 transition-all ${
                showTracklist
                  ? 'bg-white text-black shadow-md'
                  : isLightMode
                  ? 'bg-black/10 hover:bg-black/15 text-gray-900'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
              }`}
            >
              <ListMusic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{String(activeTrack.number).padStart(2, '0')}&thinsp;/&thinsp;{String(currentAlbum.tracks.length).padStart(2, '0')}</span>
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Riattiva audio' : 'Disattiva audio'}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                isLightMode ? 'text-gray-800 hover:bg-black/10' : 'text-white/80 hover:bg-white/15'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="pt-1 pb-0.5 text-center text-[9px] sm:text-[11px] font-mono opacity-50 hover:opacity-90 transition-opacity shrink-0">
          <span>© {new Date().getFullYear()} Alessandro Rocchi • weagency </span>
          <a
            href="https://altamente.it"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
          >
            altamente.it
          </a>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LYRICS SLIDE-OVER DRAWER (Desktop) & BOTTOM SHEET (Mobile)
          Non-blocking, glassmorphic, Apple Music style
          ───────────────────────────────────────────────────────────── */}
      {showLyricsModal && activeTrack.lyrics && (
        <div className="fixed inset-0 z-50 flex justify-end items-end md:items-stretch pointer-events-none">
          {/* Subtle click-outside backdrop */}
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300 animate-in fade-in"
            onClick={() => setShowLyricsModal(false)}
          />

          {/* Glass Slide-over Drawer / Bottom Sheet Container */}
          <aside
            role="dialog"
            aria-label={`Testi di ${activeTrack.title}`}
            onClick={(e) => e.stopPropagation()}
            className={`relative pointer-events-auto w-full md:w-[440px] lg:w-[480px] max-h-[80dvh] md:max-h-full h-auto md:h-full flex flex-col rounded-t-[28px] md:rounded-t-none md:rounded-l-3xl shadow-2xl backdrop-blur-3xl border-t md:border-t-0 md:border-l transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in slide-in-from-bottom md:slide-in-from-right ${
              isLightMode
                ? 'bg-white/90 border-black/15 text-gray-900 shadow-black/20'
                : 'bg-[#0b0c13]/85 border-white/15 text-white shadow-black/80'
            }`}
          >
            {/* Mobile Drag Handle Indicator */}
            <div className="md:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1 rounded-full bg-white/25" />
            </div>

            {/* Header: Track info + Actions */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-6 pb-3 border-b border-white/10 shrink-0">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  LYRICS • TRK {String(activeTrack.number).padStart(2, '0')}/{currentAlbum.tracks.length}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans tracking-tight truncate mt-0.5">
                  {activeTrack.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Copy Button */}
                <button
                  onClick={handleCopyLyrics}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all border ${
                    copiedLyrics
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                      : isLightMode
                      ? 'bg-black/5 hover:bg-black/10 text-gray-800 border-black/10'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                  title="Copia testo negli appunti"
                >
                  {copiedLyrics ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>COPIATO</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="hidden xs:inline">COPIA</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowLyricsModal(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isLightMode
                      ? 'hover:bg-black/10 text-gray-700'
                      : 'hover:bg-white/15 text-white/80'
                  }`}
                  title="Chiudi pannello (ESC)"
                  aria-label="Chiudi testi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lyric Content Body (Scrollable, elegant poetic typography with preserved stanzas & linebreaks) */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 sm:py-6 space-y-6 font-sans text-sm sm:text-base leading-relaxed tracking-wide select-text opacity-95">
              {activeTrack.lyrics.split(/\n\s*\n/).map((stanza, sIdx) => (
                <p key={sIdx} className="space-y-1.5 font-normal leading-relaxed">
                  {stanza.split('\n').map((line, lIdx) => (
                    <span key={lIdx} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            {/* Footer Meta */}
            <div className="px-5 sm:px-6 py-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono opacity-50 shrink-0">
              <span>{activeTrack.lyrics.split('\n').filter(Boolean).length} VERSI</span>
              <span className="uppercase">TESTO & MUSICA: {currentAlbum.artist}</span>
            </div>
          </aside>
        </div>
      )}

      {/* Full-Screen Celestial Semicircle Orbit Track Selector */}
      {showTracklist && (
        <RadialTrackSelector
          tracks={currentAlbum.tracks}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onSelectTrack={handleSelectTrack}
          onClose={() => setShowTracklist(false)}
          isLightMode={isLightMode}
          albumCover={currentAlbum.coverUrl}
          artistName={currentAlbum.artist}
        />
      )}
    </div>
    </div>
  );
};
