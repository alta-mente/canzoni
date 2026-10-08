import React, { useState, useEffect, useRef } from 'react';
import { AlbumData, DISCOGRAPHY } from '../data/albumData';
import { useAudio } from '../context/NativeAudioContext';
import { useTheme } from '../context/ThemeContext';
import { VinylCarousel } from './VinylCarousel';
import { EditorialSwissView } from './EditorialSwissView';
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

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'carousel' | 'sleeve' | 'editorial'>('sleeve');
  const [showCanvasBackground, setShowCanvasBackground] = useState<boolean>(true);
  const [showTracklist, setShowTracklist] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration, seek, isMuted, toggleMute } = useAudio();
  const { isDark, toggleTheme } = useTheme();

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
          onSwitchDisplayMode={(mode) => setDisplayMode(mode)}
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

              <div className="flex-1 overflow-y-auto pr-3 space-y-4 font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line text-black/85 select-text">
                {activeTrack.lyrics}
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
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between px-6 sm:px-12 md:px-16 py-3.5 sm:py-5 select-none"
      style={{
        color: isLightMode ? '#111827' : '#ffffff',
      }}
    >
      {/* 1. Underlying Solid Color Layer (Transitions smoothly) */}
      <div
        className="absolute inset-0 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] -z-20"
        style={{ backgroundColor: currentBgColor }}
      />

      {/* 2. Background Canvas Video Loop (On top of color, under UI) */}
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
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isLightMode ? 'opacity-30 mix-blend-multiply' : 'opacity-55 mix-blend-screen'
            }`}
          />
          {/* Contrast scrim for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />
        </div>
      )}

      {/* 3. Subtle Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/5 to-black/30 pointer-events-none -z-10" />

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & IDENTITY BAR (Full-width, perfectly aligned)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full flex items-end justify-between gap-4 border-b border-white/10 sm:border-white/15">
        
        {/* Left: Canzoni Tag + Simple Transparent Tabs resting on the fullwidth line */}
        <div className="flex items-end gap-3 sm:gap-5 shrink-0">
          {/* Subtle Canzoni Tag */}
          <div className="hidden lg:flex flex-col pr-1 pb-2 sm:pb-2.5">
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase opacity-50 font-semibold leading-none">
              CANZONI
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase opacity-90 leading-tight mt-0.5">
              ALESSANDRO ROCCHI
            </span>
          </div>

          <div className="hidden lg:block h-6 w-px bg-white/15 mb-2 sm:mb-2.5" />

          {/* Semplici Linguette Trasparenti appoggiate sulla linea fullwidth */}
          <nav
            aria-label="Selezione Album"
            className="flex items-end gap-1.5 sm:gap-2 mb-[-1px]"
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

                  {/* Album Title + Meta (Anno, Numero Tracce, Spotify) */}
                  <div className="flex flex-col min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight uppercase whitespace-nowrap">
                        <span className="hidden md:inline">{album.title}</span>
                        <span className="md:hidden">{idx === 0 ? "MARTE" : "FETTE BISCOTTATE"}</span>
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

        {/* Right: Actions & Settings Gear Menu */}
        <div className="relative flex items-center gap-2 sm:gap-2.5 shrink-0 pb-1.5 sm:pb-2">
          {/* EPK / Electronic Press Kit Button */}
          <button
            onClick={onOpenEPK}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider backdrop-blur-xl border ${
              isLightMode
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border-amber-600/30 shadow-sm'
                : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            }`}
            title="Cartella Stampa / Electronic Press Kit (EPK)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px]">EPK</span>
          </button>

          {/* Settings & Tools Toggle (Menu Ingranaggio) */}
          <button
            onClick={() => setShowSettingsMenu((prev) => !prev)}
            aria-expanded={showSettingsMenu}
            aria-label="Opzioni visualizzazione e strumenti"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl border ${
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
            <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : ''}`} />
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
                          setDisplayMode('sleeve');
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
                          setDisplayMode('carousel');
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

      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. TRACK HERO & EDITORIAL LINER ROW (Spacious, balanced)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-start gap-2.5 pt-3 sm:pt-4 max-w-3xl">
        
        {/* Track Counter & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-70">
              TRACCIA {String(activeTrack.number).padStart(2, '0')} DI {currentAlbum.tracks.length}
            </span>
            <span className="opacity-40 font-mono text-[11px]">•</span>
            <span className="font-mono text-[10px] sm:text-[11px] opacity-70">
              {activeTrack.duration}
            </span>
            <span className="opacity-40 font-mono text-[11px]">•</span>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider opacity-60">
              {currentAlbum.title}
            </span>
          </div>

          <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tight leading-[0.95] drop-shadow-md">
            {activeTrack.title.includes(' ') ? (
              <>
                <span>{activeTrack.title.split(' ')[0]}</span>
                <br />
                <span>{activeTrack.title.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <span>{activeTrack.title}</span>
            )}
          </h1>
        </div>

        {/* Poetic Quote & Lyrics button - Free floating under the title, no dark background, no tags */}
        {(activeTrack.storyQuote || activeTrack.lyrics) && (
          <div className="space-y-2 pt-0.5">
            {activeTrack.storyQuote && (
              <p className="text-xs sm:text-sm font-sans italic leading-relaxed opacity-85 drop-shadow-sm max-w-xl">
                {activeTrack.storyQuote}
              </p>
            )}

            {activeTrack.lyrics && (
              <div>
                <button
                  onClick={() => setShowLyricsModal(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] sm:text-[11px] font-bold tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm ${
                    isLightMode
                      ? 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-950 border border-purple-600/25'
                      : 'bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 hover:text-white border border-purple-400/30'
                  }`}
                  title="Apri libretto con il testo completo"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>TESTO CANZONE →</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CENTER STAGE: The 3D Vinyl Carousel */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto w-full">
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
      <div className="relative z-20 flex flex-col items-center pb-2 sm:pb-3 px-4 w-full">
        <div className="relative w-full max-w-2xl flex flex-col items-center">
          {/* Quick Tracklist Popover Drawer (Floats strictly ABOVE the capsule) */}
          {showTracklist && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowTracklist(false)}
              />

              <div
                className={`absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-[92vw] max-w-md sm:max-w-lg rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl border transition-all z-40 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  isLightMode
                    ? 'bg-white/95 border-black/10 text-gray-900 shadow-black/20'
                    : 'bg-[#0f1017]/95 border-white/15 text-white shadow-black/70'
                }`}
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/10 mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-widest opacity-60">Seleziona Brano</span>
                  <span className="text-[10px] font-mono opacity-50">{currentAlbum.tracks.length} TRACCE</span>
                </div>

                <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                  {currentAlbum.tracks.map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleSelectTrack(idx);
                        setShowTracklist(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-all ${
                        currentIndex === idx
                          ? 'bg-white text-black font-bold shadow-md'
                          : isLightMode
                          ? 'hover:bg-black/5 text-gray-800'
                          : 'hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono text-[10px] opacity-60 w-4 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-50 shrink-0 ml-2">
                        {t.duration}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Unified Capsule */}
          <div
            className={`w-full px-3 sm:px-6 py-2.5 sm:py-3 rounded-full backdrop-blur-2xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2.5 sm:gap-4 relative z-40 ${
            isLightMode
              ? 'bg-white/85 border border-black/10 text-gray-900 shadow-black/10'
              : 'bg-[#0d0e14]/85 border border-white/15 text-white'
          }`}
        >
          {/* Playback Controls: Prev | Play/Pause | Next */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handlePrev}
              title="Traccia precedente"
              aria-label="Traccia precedente"
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${
                isLightMode ? 'hover:bg-black/10 text-gray-800' : 'hover:bg-white/15 text-white/80'
              }`}
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pausa' : 'Riproduci'}
              aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-lg ${
                isLightMode
                  ? 'bg-gray-900 text-white hover:bg-black'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              title="Traccia successiva"
              aria-label="Traccia successiva"
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${
                isLightMode ? 'hover:bg-black/10 text-gray-800' : 'hover:bg-white/15 text-white/80'
              }`}
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>
          </div>

          {/* Time Scrubber (Continuous, wide seekbar) */}
          <div className="flex-1 flex items-center space-x-2 sm:space-x-3 min-w-0">
            <span className="text-[11px] font-mono opacity-70 w-8 sm:w-9 text-right tabular-nums shrink-0">
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

            <span className="text-[11px] font-mono opacity-70 w-8 sm:w-9 text-left tabular-nums shrink-0">
              {activeTrack.duration}
            </span>
          </div>

          {/* Divider */}
          <div className={`h-5 w-px shrink-0 hidden xs:block ${isLightMode ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Right Section: Track Badge & Mute */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Track indicator badge + toggle list */}
            <button
              onClick={() => setShowTracklist((prev) => !prev)}
              title="Apri lista tracce"
              className={`font-mono text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-full font-bold tracking-wider flex items-center space-x-1.5 transition-all ${
                showTracklist
                  ? 'bg-white text-black shadow-md'
                  : isLightMode
                  ? 'bg-black/10 hover:bg-black/15 text-gray-900'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>{String(activeTrack.number).padStart(2, '0')}&thinsp;/&thinsp;{String(currentAlbum.tracks.length).padStart(2, '0')}</span>
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Riattiva audio' : 'Disattiva audio'}
              className={`p-2 rounded-full transition-all ${
                isLightMode ? 'text-gray-800 hover:bg-black/10' : 'text-white/80 hover:bg-white/15'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="pt-1.5 text-center text-[10px] sm:text-[11px] font-mono opacity-50 hover:opacity-90 transition-opacity">
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

      {/* Full Lyrics Modal (Libretto del Disco) */}
      {showLyricsModal && activeTrack.lyrics && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLyricsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white/95 text-gray-900 border-black/10' : 'bg-[#12131b]/95 text-white border-white/15'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Libretto del Disco • Traccia {String(activeTrack.number).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-bold font-mono mt-0.5">
                  {activeTrack.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLyrics}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shadow-sm ${
                    copiedLyrics
                      ? 'bg-emerald-500 text-black'
                      : isLightMode
                      ? 'bg-black/5 hover:bg-black/10 text-gray-800'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
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
                  className="p-2 rounded-xl hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
                  title="Chiudi (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 space-y-4 font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line opacity-90 select-text">
              {activeTrack.lyrics}
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono opacity-60">
              <span>{activeTrack.lyrics.split('\n').filter(Boolean).length} VERSI</span>
              <span>TESTO & MUSICA: {currentAlbum.artist}</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
