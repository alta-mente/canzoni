import React, { useState, useRef, useEffect } from 'react';
import { AlbumData, Track } from '../data/albumData';
import { useTheme } from '../context/ThemeContext';
import { 
  Play, 
  Pause, 
  FileText, 
  ExternalLink, 
  Radio,
  Layers, 
  Disc, 
  Share2, 
  Settings,
  X,
  Moon,
  Sun,
  Sliders,
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward 
} from 'lucide-react';

interface EditorialSwissViewProps {
  albums: AlbumData[];
  currentAlbum: AlbumData;
  activeTrack: Track;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  onSelectTrack: (index: number) => void;
  onSelectAlbum: (album: AlbumData) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenLyrics: () => void;
  onOpenEPK: () => void;
  onOpenShare: () => void;
  onOpenBackoffice?: () => void;
  onSwitchDisplayMode: (mode: 'sleeve' | 'carousel' | 'editorial') => void;
  displayMode: 'sleeve' | 'carousel' | 'editorial';
  formatTime: (secs: number) => string;
}

export const EditorialSwissView: React.FC<EditorialSwissViewProps> = ({
  albums,
  currentAlbum,
  activeTrack,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  isMuted,
  onSelectTrack,
  onSelectAlbum,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onPrev,
  onNext,
  onOpenLyrics,
  onOpenEPK,
  onOpenShare,
  onOpenBackoffice,
  onSwitchDisplayMode,
  displayMode,
  formatTime,
}) => {
  const [showAllTracks, setShowAllTracks] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const vinylCenterRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { isDark, toggleTheme } = useTheme();
  const isLightMode = !isDark;

  // Active video canvas (track-specific video takes precedence over album fallback)
  const activeVideoSrc = activeTrack.canvasVideoSrc || currentAlbum.canvasVideoSrc;

  // Autoplay video loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Swiss video background play prevented:', err);
      });
    }
  }, [activeVideoSrc]);

  // Playback ratio 0..1
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Circular scrubber arc configuration:
  // Sweep from top (+Y angle: -80deg) down along the visible right semicircle to bottom (+80deg)
  const START_ANGLE = -80;
  const END_ANGLE = 80;
  const currentAngle = START_ANGLE + progressRatio * (END_ANGLE - START_ANGLE);
  const currentAngleRad = (currentAngle * Math.PI) / 180;

  // Scaled SVG Orbit Geometry (viewBox: 1000 x 1000, Center: 500, 500)
  const SVG_CENTER = 500;
  const ORBIT_RADIUS = 465;
  const dotX = Math.cos(currentAngleRad) * ORBIT_RADIUS;
  const dotY = Math.sin(currentAngleRad) * ORBIT_RADIUS;

  // Interactive seek on circular orbit click
  const handleOrbitClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!vinylCenterRef.current) return;
    const rect = vinylCenterRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clickX = e.clientX - centerX;
    const clickY = e.clientY - centerY;

    let angleDeg = (Math.atan2(clickY, clickX) * 180) / Math.PI;
    if (angleDeg < START_ANGLE) angleDeg = START_ANGLE;
    if (angleDeg > END_ANGLE) angleDeg = END_ANGLE;

    const ratio = (angleDeg - START_ANGLE) / (END_ANGLE - START_ANGLE);
    onSeek(ratio * duration);
  };

  // Tracks to display (either top 4 or all)
  const visibleTracks = showAllTracks ? currentAlbum.tracks : currentAlbum.tracks.slice(0, 4);

  // Genre / Mood tags line
  const genreTags = activeTrack.mood 
    ? `INDIE POP, CANTAUTORATO, ${activeTrack.mood.toUpperCase()}, ANALOG`
    : 'INDIE POP, CANTAUTORATO, SYNTH-POP, ANALOG LO-FI';

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between px-6 sm:px-12 md:px-16 py-3.5 sm:py-5 select-none font-sans transition-colors duration-500 ${
        isLightMode ? 'text-[#111111]' : 'text-white'
      }`}
    >
      
      {/* ─────────────────────────────────────────────────────────────
          1. FULLSCREEN VIDEO BACKGROUND LAYER (100% Pure & Vivid)
          ───────────────────────────────────────────────────────────── */}
      {activeVideoSrc ? (
        <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            key={activeVideoSrc}
            src={activeVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-opacity duration-1000 opacity-100 scale-105"
          />
        </div>
      ) : (
        <div 
          className="absolute inset-0 -z-30 transition-colors duration-700" 
          style={{ backgroundColor: isDark ? activeTrack.colorDark || '#07090e' : activeTrack.colorLight || '#e0dfd5' }} 
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FULLSCREEN CLEAR LAYER (WHITE REMOVED ENTIRELY FROM RIGHT)
             - Left Half: 100% Pure Video (no overlay)
             - Right Half: Pure subtle glass blur for text contrast, NO WHITE
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-20 pointer-events-none flex">
        {/* Left half: Pure video */}
        <div className="w-1/2 h-full" />

        {/* Right half: Pure glass blur without white background */}
        <div 
          className="w-1/2 h-full transition-all duration-700"
          style={{
            backdropFilter: 'blur(16px) saturate(120%)',
            WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TOP NAVIGATION & IDENTITY BAR (Identical to other headers)
          ───────────────────────────────────────────────────────────── */}
      <header className={`relative z-50 w-full flex items-end justify-between gap-4 border-b ${
        isLightMode ? 'border-black/15' : 'border-white/15'
      }`}>
        
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

          <div className={`hidden lg:block h-6 w-px mb-2 sm:mb-2.5 ${isLightMode ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Semplici Linguette Trasparenti appoggiate sulla linea fullwidth */}
          <nav
            aria-label="Selezione Album"
            className="flex items-end gap-1.5 sm:gap-2 mb-[-1px]"
          >
            {albums.map((album, idx) => {
              const isSelected = album.id === currentAlbum.id;
              const spotifyUrl = album.spotifyAlbumUrl;
              return (
                <div
                  key={album.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isSelected) onSelectAlbum(album);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isSelected) {
                      e.preventDefault();
                      onSelectAlbum(album);
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

          {/* Direct Switch to Custodia / 3D */}
          <button
            onClick={() => onSwitchDisplayMode('sleeve')}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider backdrop-blur-xl border ${
              isLightMode
                ? 'bg-white/70 hover:bg-white/95 text-black border-black/15 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm'
            }`}
            title="Torna alla vista Custodia Vinile"
          >
            <Layers className="w-3.5 h-3.5 text-[#d94436]" />
            <span className="hidden sm:inline text-[10px]">CUSTODIA</span>
          </button>

          {/* Settings & Tools Toggle (Menu Ingranaggio) */}
          <button
            onClick={() => setShowSettingsMenu((prev) => !prev)}
            aria-expanded={showSettingsMenu}
            aria-label="Opzioni visualizzazione e strumenti"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl border ${
              showSettingsMenu
                ? 'bg-black text-white border-black shadow-md'
                : isLightMode
                ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-800'
                : 'bg-white/5 hover:bg-white/15 border-white/10 text-white/80'
            }`}
            title="Personalizza interfaccia e strumenti"
          >
            <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : ''}`} />
          </button>

          {/* Dropdown Popover Menu (Dark Studio Black Theme) */}
          {showSettingsMenu && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
                onClick={() => setShowSettingsMenu(false)}
              />

              <div className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl border transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-200 bg-[#0c0d14]/98 border-white/15 text-white shadow-black/90">
                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 font-semibold text-white/70">
                    Personalizzazione
                  </span>
                  <button
                    onClick={() => setShowSettingsMenu(false)}
                    className="p-1 rounded-lg hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity text-white"
                    title="Chiudi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  {/* Vista Interfaccia: Custodia | 3D | Swiss Poster */}
                  <div className="p-2 rounded-xl bg-white/[0.06] space-y-1.5 border border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-60 font-semibold px-1 text-white/70">
                      <span>Stile Interfaccia</span>
                      <span className="text-amber-400 font-bold">3 Viste</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => {
                          onSwitchDisplayMode('sleeve');
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
                          onSwitchDisplayMode('carousel');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center ${
                          displayMode === 'carousel'
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        3D
                      </button>
                      <button
                        onClick={() => {
                          onSwitchDisplayMode('editorial');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center ${
                          displayMode === 'editorial'
                            ? 'bg-[#d94436] text-white shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Swiss
                      </button>
                    </div>
                  </div>

                  {/* Theme Mode Toggle (Scuro / Chiaro) */}
                  <button
                    onClick={toggleTheme}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/10 text-white/90"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Moon className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                      <span>Tema Colore</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                      {isDark ? 'Notte' : 'Luce'}
                    </span>
                  </button>

                  {/* Audio Mute / Unmute */}
                  <button
                    onClick={onToggleMute}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/10 text-white/90"
                  >
                    <div className="flex items-center gap-2.5">
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>Audio Master</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                      {isMuted ? 'Muto' : 'Attivo'}
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  {/* Share Album / Track Link */}
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenShare();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/10 text-white/90"
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
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/10 text-white/90"
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
          4. MAIN VIEWPORT STAGE:
             - Exactly 50% of the GIANT VINYL is hidden off the left edge (center at left: 0)
             - Right half: Swiss typography & tracklist floating freely (NO BOX, NO WHITE)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative w-full flex-1 flex items-center justify-between my-auto py-2 overflow-visible">
        
        {/* ────────────── LEFT: 50% CROPPED GIANT VINYL DISC ────────────── */}
        {/* Center of the vinyl is anchored precisely at `left: 0`, so exactly half is hidden outside screen */}
        <div 
          ref={vinylCenterRef}
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] sm:w-[780px] md:w-[880px] lg:w-[980px] xl:w-[1040px] aspect-square flex items-center justify-center pointer-events-auto z-20"
        >
          
          {/* Circular Orbit Progress Arc & Scrubber Dot (SVG) */}
          <svg 
            className="absolute inset-[-60px] w-[calc(100%+120px)] h-[calc(100%+120px)] pointer-events-auto cursor-pointer"
            viewBox="0 0 1000 1000"
            onClick={handleOrbitClick}
          >
            {/* Guide hairline circular arc around visible half */}
            <circle 
              cx={SVG_CENTER} 
              cy={SVG_CENTER} 
              r={ORBIT_RADIUS} 
              fill="none" 
              stroke={isLightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"} 
              strokeWidth="2.5" 
            />
            
            {/* Active Progress Arc in Terracotta Red */}
            <path
              d={`M ${SVG_CENTER + Math.cos((START_ANGLE * Math.PI) / 180) * ORBIT_RADIUS} ${SVG_CENTER + Math.sin((START_ANGLE * Math.PI) / 180) * ORBIT_RADIUS} A ${ORBIT_RADIUS} ${ORBIT_RADIUS} 0 0 1 ${SVG_CENTER + dotX} ${SVG_CENTER + dotY}`}
              fill="none"
              stroke="#d94436"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Progress Scrubber Dot Marker (Red with white ring & shadow) */}
            <circle
              cx={SVG_CENTER + dotX}
              cy={SVG_CENTER + dotY}
              r="9"
              fill="#d94436"
              stroke="#ffffff"
              strokeWidth="3"
              className="shadow-xl transition-transform duration-100"
            />
          </svg>

          {/* THE OFFICIAL GIANT VINYL DISC (Identical to VinylCarousel & Sleeve view) */}
          <div 
            onClick={onTogglePlay}
            title={isPlaying ? "Metti in pausa" : "Riproduci brano"}
            className="relative w-full h-full rounded-full bg-[#0c0c11] border-[5px] border-[#22222c] overflow-hidden select-none cursor-pointer shadow-[0_45px_120px_rgba(0,0,0,0.85),0_0_80px_rgba(0,0,0,0.5)] group"
          >
            {/* Grooves & Artwork Container (spins smoothly when playing) */}
            <div className={`absolute inset-0 rounded-full overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
              
              {/* Track Unique Artwork printed on the Vinyl */}
              <img
                src={activeTrack.artworkUrl || currentAlbum.coverUrl}
                alt={activeTrack.title}
                className="w-full h-full object-cover scale-105 pointer-events-none transition-transform duration-700"
              />

              {/* Subtle Vinyl Sound Grooves Overprinted on the Artwork */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              <div className="absolute inset-6 sm:inset-10 rounded-full border border-white/[0.08] pointer-events-none" />
              <div className="absolute inset-12 sm:inset-20 rounded-full border border-white/[0.07] pointer-events-none" />
              <div className="absolute inset-18 sm:inset-30 rounded-full border border-white/[0.06] pointer-events-none" />
              <div className="absolute inset-24 sm:inset-40 rounded-full border border-white/[0.05] pointer-events-none" />
              <div className="absolute inset-30 sm:inset-50 rounded-full border border-white/[0.04] pointer-events-none" />

              {/* Vinyl Specular Light Sheen (Conic Glint Reflection) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.25) 0deg, transparent 60deg, rgba(255,255,255,0.18) 180deg, transparent 240deg, rgba(255,255,255,0.25) 360deg)',
                }}
              />

              {/* Center Spindle Label (Solid Black Circle with typography) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 md:w-64 lg:w-72 aspect-square rounded-full bg-[#0a0a0f] border-2 border-white/25 shadow-[0_0_40px_rgba(0,0,0,0.9)] z-10 overflow-hidden select-none">
                
                {/* Top Section: Artist & Title (above center hole) */}
                <div className="absolute top-0 inset-x-0 bottom-1/2 flex flex-col items-center justify-end pb-3 sm:pb-4 px-3 text-center pointer-events-none">
                  <span className="text-[8px] sm:text-[10px] md:text-[11px] font-mono tracking-widest text-white/50 uppercase leading-tight">
                    {currentAlbum.artist}
                  </span>
                  <span className="text-[11px] sm:text-[13px] md:text-[15px] font-bold tracking-tight uppercase line-clamp-1 px-1 text-white leading-tight mt-0.5">
                    {activeTrack.title}
                  </span>
                </div>

                {/* DEAD-CENTER Spindle Hole */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#05060a] border border-white/70 shadow-sm pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/25" />
                </div>

                {/* Bottom Section: Year & Track Info (below center hole) */}
                <div className="absolute top-1/2 inset-x-0 bottom-0 flex flex-col items-center justify-start pt-3 sm:pt-4 px-3 text-center pointer-events-none">
                  <span className="text-[8px] sm:text-[10px] md:text-[11px] font-mono text-white/50 tracking-wider uppercase leading-tight">
                    {currentAlbum.year} • TRK {String(activeTrack.number).padStart(2, '0')}
                  </span>
                </div>
              </div>

            </div>

            {/* Hover Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[1px]">
              <div className="w-20 h-20 rounded-full bg-black/75 backdrop-blur-md text-white flex items-center justify-center shadow-2xl border border-white/25 transform group-hover:scale-105 transition-transform">
                {isPlaying ? (
                  <Pause className="w-9 h-9 fill-current" />
                ) : (
                  <Play className="w-9 h-9 fill-current translate-x-0.5" />
                )}
              </div>
            </div>

          </div>

          {/* Time Display Badge positioned at the lower rim of the semicircle */}
          <div className={`absolute bottom-8 left-[calc(50%+40px)] sm:left-[calc(50%+70px)] font-mono text-xs sm:text-sm font-bold tracking-wider whitespace-nowrap px-3.5 py-1 rounded-full border shadow-md backdrop-blur-md ${
            isLightMode 
              ? 'bg-white/60 text-black/90 border-white/50' 
              : 'bg-black/60 text-white/90 border-white/20'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 opacity-40">/</span>
            <span>{formatTime(duration)}</span>
          </div>

        </div>

        {/* ────────────── RIGHT: FREE-FLOATING EDITORIAL TYPOGRAPHY & TRACKLIST (NO BOX, NO WHITE) ────────────── */}
        <div className="w-full flex justify-end pl-[320px] sm:pl-[380px] md:pl-[440px] lg:pl-[480px] xl:pl-[520px] pr-2 sm:pr-8 lg:pr-12 z-10">
          
          <div className="w-full max-w-xl lg:max-w-2xl flex flex-col justify-center select-none py-4">
            
            {/* GIANT TYPOGRAPHY: ALESSANDRO ROCCHI (Matches TAME IMPALA style) */}
            <div className="space-y-1">
              <h1 className={`font-sans font-black text-6xl sm:text-7xl md:text-8xl lg:text-[98px] tracking-[-0.04em] leading-[0.82] uppercase select-none ${
                isLightMode ? 'text-black drop-shadow-sm' : 'text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]'
              }`}>
                <div>ALESSANDRO</div>
                <div>ROCCHI</div>
              </h1>

              {/* Genre / Subtitle line */}
              <p className={`font-mono text-xs sm:text-sm font-bold tracking-[0.2em] uppercase pt-2 ${
                isLightMode ? 'text-black/65' : 'text-white/70 drop-shadow-sm'
              }`}>
                {genreTags}
              </p>
            </div>

            {/* SECTION HEADER: POPULAR & ALBUM SELECTOR */}
            <div className={`mt-8 sm:mt-10 mb-3 flex items-center justify-between border-b pb-2 ${
              isLightMode ? 'border-black/15' : 'border-white/15'
            }`}>
              <span className="font-mono text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase text-[#d94436]">
                POPULAR
              </span>

              {/* Album selector tabs */}
              <div className="flex items-center gap-2">
                {albums.map((album, idx) => {
                  const isActive = album.id === currentAlbum.id;
                  return (
                    <button
                      key={album.id}
                      onClick={() => onSelectAlbum(album)}
                      className={`text-[10px] sm:text-xs font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded transition-all ${
                        isActive 
                          ? 'bg-[#d94436]/25 text-[#ff8f82] font-bold' 
                          : isLightMode 
                          ? 'text-black/55 hover:text-black hover:bg-black/5' 
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {idx === 0 ? 'MARTE' : 'FETTE BISCOTTATE'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRACKLIST (Free-floating rows with cover thumbnails and duration) */}
            <div className="space-y-1.5">
              {visibleTracks.map((track) => {
                const trackIdx = currentAlbum.tracks.findIndex((t) => t.id === track.id);
                const isSelected = trackIdx === currentIndex;
                const isCurrentlyPlaying = isSelected && isPlaying;

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(trackIdx)}
                    className={`group w-full py-2 px-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? isLightMode
                          ? 'bg-black/10 text-black shadow-sm font-bold backdrop-blur-sm' 
                          : 'bg-white/15 text-white shadow-lg font-bold backdrop-blur-sm'
                        : isLightMode
                        ? 'hover:bg-black/5 text-black/85 hover:text-black'
                        : 'hover:bg-white/10 text-white/85 hover:text-white'
                    }`}
                  >
                    {/* Left: Index + Thumbnail + Title/Album */}
                    <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                      {/* Track number */}
                      <span className={`font-mono text-xs sm:text-sm font-bold w-6 shrink-0 ${
                        isSelected 
                          ? 'text-[#d94436]' 
                          : isLightMode 
                          ? 'text-black/40 group-hover:text-black/70' 
                          : 'text-white/40 group-hover:text-white/70'
                      }`}>
                        {String(track.number).padStart(2, '0')}
                      </span>

                      {/* Square Cover Art thumbnail */}
                      <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-[2px] overflow-hidden shrink-0 border border-white/20 bg-black/20 shadow-sm">
                        <img 
                          src={track.artworkUrl || currentAlbum.coverUrl} 
                          alt={track.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        {isCurrentlyPlaying && (
                          <div className="absolute inset-0 bg-[#d94436]/40 flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Titles */}
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold text-xs sm:text-sm tracking-tight truncate uppercase leading-tight ${
                          isSelected ? 'font-extrabold' : 'opacity-90'
                        }`}>
                          {track.title}
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] tracking-wider uppercase opacity-55 truncate mt-0.5">
                          {currentAlbum.title}
                        </span>
                      </div>
                    </div>

                    {/* Right: Duration + Play status */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#d94436] shrink-0" />
                      )}
                      <span className="font-mono text-xs sm:text-sm opacity-70 font-medium">
                        {track.duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FOOTER ACTIONS: VIEW MORE & TESTO CANZONE */}
            <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase ${
              isLightMode ? 'border-black/15' : 'border-white/15'
            }`}>
              {/* Lyrics button */}
              {activeTrack.lyrics ? (
                <button
                  onClick={onOpenLyrics}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    isLightMode ? 'text-purple-800 hover:text-purple-950' : 'text-purple-300 hover:text-purple-100'
                  }`}
                  title="Leggi testo completo"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>TESTO CANZONE</span>
                </button>
              ) : (
                <span className="opacity-35 font-normal">TESTO NON PRESENTE</span>
              )}

              {/* View all toggle */}
              <button
                onClick={() => setShowAllTracks((prev) => !prev)}
                className={`transition-colors underline underline-offset-4 ${
                  isLightMode ? 'text-black/75 hover:text-black decoration-black/30' : 'text-white/75 hover:text-white decoration-white/30'
                }`}
              >
                {showAllTracks ? 'VEDI MENO' : 'VIEW MORE'}
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. BOTTOM CONTROLS BAR (Minimalist Glass Bar)
          ───────────────────────────────────────────────────────────── */}
      <footer className={`relative z-30 w-full pt-3 border-t flex items-center justify-between text-xs font-mono ${
        isLightMode ? 'border-black/15' : 'border-white/15'
      }`}>
        {/* Left: Playback Controls */}
        <div className={`flex items-center space-x-3 backdrop-blur-md px-3.5 py-1 rounded-full border shadow-sm ${
          isLightMode ? 'bg-white/40 border-white/40 text-black' : 'bg-black/40 border-white/15 text-white'
        }`}>
          <button
            onClick={onPrev}
            className="p-1 rounded-lg hover:bg-white/10 opacity-75 hover:opacity-100 transition-opacity"
            title="Brano precedente"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={onTogglePlay}
            className="px-3.5 py-1 rounded-full bg-black text-white hover:bg-[#d94436] transition-all font-bold tracking-wider flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
            title={isPlaying ? "Pausa" : "Play"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>PAUSA</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 ml-0.5" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1 rounded-lg hover:bg-white/10 opacity-75 hover:opacity-100 transition-opacity"
            title="Brano successivo"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Track title pill */}
        <div className={`hidden md:flex items-center space-x-2 text-[11px] backdrop-blur-md px-4 py-1 rounded-full border shadow-sm ${
          isLightMode ? 'bg-white/40 text-black/70 border-white/40' : 'bg-black/40 text-white/80 border-white/15'
        }`}>
          <span className="font-bold uppercase">{activeTrack.title}</span>
          <span>•</span>
          <span>{currentAlbum.title}</span>
        </div>

        {/* Right: Audio Volume, Share, Backoffice */}
        <div className={`flex items-center space-x-3 backdrop-blur-md px-3.5 py-1 rounded-full border shadow-sm ${
          isLightMode ? 'bg-white/40 text-black/75 border-white/40' : 'bg-black/40 text-white/80 border-white/15'
        }`}>
          <button
            onClick={onToggleMute}
            className="p-1 rounded-lg hover:bg-white/10 opacity-80 hover:opacity-100 transition-opacity"
            title={isMuted ? "Riattiva audio" : "Silenzia"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#d94436]" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenShare}
            className="p-1 rounded-lg hover:bg-white/10 opacity-80 hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1"
            title="Condividi brano"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-wider uppercase font-bold">CONDIVIDI</span>
          </button>

          {onOpenBackoffice && (
            <button
              onClick={onOpenBackoffice}
              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors font-bold text-[10px] uppercase tracking-wider hidden sm:inline"
              title="Gestione Studio Backoffice"
            >
              BACKOFFICE
            </button>
          )}
        </div>
      </footer>

    </div>
  );
};
