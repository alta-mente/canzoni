import React, { useState } from 'react';
import { EPK_DATA, PressPhoto, PressRelease } from '../data/epkData';
import { DISCOGRAPHY, AlbumData, Track } from '../data/albumData';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Disc,
  ExternalLink,
  Mail,
  Calendar,
  MapPin,
  Music2,
  Sparkles,
  Sun,
  Moon,
  FileText,
  Share2,
  Mic2,
  Sliders,
  Radio,
  Quote,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';

interface EPKViewProps {
  onBackToPlayer: () => void;
  onSelectAlbumAndPlay?: (album: AlbumData) => void;
  albums?: AlbumData[];
}

export const EPKView: React.FC<EPKViewProps> = ({ onBackToPlayer, onSelectAlbumAndPlay, albums }) => {
  const discography = albums && albums.length > 0 ? albums : DISCOGRAPHY;
  const { isDark, toggleTheme } = useTheme();
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedPrId, setCopiedPrId] = useState<string | null>(null);
  const [activeAlbumTab, setActiveAlbumTab] = useState<string>(discography[0].id);
  const [activePrTab, setActivePrTab] = useState<string>(EPK_DATA.pressReleases[0].id);
  const [selectedLyricsTrack, setSelectedLyricsTrack] = useState<{ track: Track; albumTitle: string } | null>(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const isLightMode = !isDark;

  const handleCopyBio = () => {
    navigator.clipboard.writeText(EPK_DATA.artist.shortBio);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2500);
  };

  const handleCopyPressRelease = (pr: PressRelease) => {
    const fullText = `${pr.title}\n${pr.subtitle}\nData: ${pr.date}\n\n${pr.body.join('\n\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedPrId(pr.id);
    setTimeout(() => setCopiedPrId(null), 2500);
  };

  const handleDownloadAsset = (photo: PressPhoto) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.id}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 selection:bg-amber-400 selection:text-black ${
        isLightMode ? 'bg-[#f8f9fa] text-gray-900' : 'bg-[#0a0a0f] text-white'
      }`}
    >
      {/* STICKY TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${
          isLightMode
            ? 'bg-white/85 border-black/10 shadow-sm'
            : 'bg-[#0c0d14]/85 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Back to 3D Turntable */}
          <button
            onClick={onBackToPlayer}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-mono text-xs font-bold transition-all shadow-sm group ${
              isLightMode
                ? 'bg-black/5 hover:bg-black/10 text-gray-900'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Torna al giradischi 3D interattivo"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>GIRADISCHI 3D</span>
          </button>

          {/* Center Brand / Badge */}
          <div className="hidden md:flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] font-bold opacity-80">
              ELECTRONIC PRESS KIT • CARTELLE STAMPA
            </span>
          </div>

          {/* Quick Anchor Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider opacity-75">
              <a href="#bio" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Bio</a>
              <a href="#discografia" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Discografia</a>
              <a href="#media-kit" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Foto HD</a>
              <a href="#comunicati" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Comunicati</a>
              <a href="#live" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Live</a>
              <a href="#contatti" className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Contatti</a>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${
                isLightMode ? 'bg-black/5 hover:bg-black/10 text-gray-900' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isDark ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Direct Contact Button */}
            <a
              href="#contatti"
              className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-black px-4 py-2 rounded-full transition-all shadow-md shadow-amber-500/20"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>CONTATTI PR</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-white/10">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            {/* Main Info */}
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-amber-400/10 text-amber-500 border border-amber-400/20">
                <Sparkles className="w-3 h-3" />
                <span>OFFICIAL ARTIST PRESS KIT</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.95]">
                {EPK_DATA.artist.name}
              </h1>

              <p className="text-lg sm:text-xl font-light opacity-80">
                {EPK_DATA.artist.tagline} • <span className="opacity-60">{EPK_DATA.artist.location}</span>
              </p>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {EPK_DATA.artist.genres.map((genre) => (
                  <span
                    key={genre}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase border ${
                      isLightMode
                        ? 'bg-black/5 border-black/10 text-gray-700'
                        : 'bg-white/5 border-white/15 text-white/70'
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Roots / Influences Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="text-[10px] uppercase opacity-55">Radici cantautorali:</span>
                <span className="font-bold text-amber-400">
                  {EPK_DATA.artist.influences.join(' • ')}
                </span>
                <span className="opacity-40">•</span>
                <span className="opacity-70 italic text-[11px]">Poesia d'autore & Scrittura dei Testi</span>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={handleCopyBio}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/20"
                >
                  {copiedBio ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedBio ? 'BIO COPIATA!' : 'COPIA BIO BREVE (PER GIORNALISTI)'}</span>
                </button>

                <a
                  href="#media-kit"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs font-bold transition-all border ${
                    isLightMode
                      ? 'bg-black/5 hover:bg-black/10 text-gray-900 border-black/10'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>SCARICA FOTO & ARTWORK HD</span>
                </a>
              </div>
            </div>

            {/* Fast Stats Card */}
            <div
              className={`w-full lg:w-80 rounded-2xl p-6 border backdrop-blur-xl shrink-0 ${
                isLightMode
                  ? 'bg-white/80 border-black/10 shadow-lg'
                  : 'bg-white/[0.04] border-white/15 shadow-2xl'
              }`}
            >
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] opacity-60 mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>DATI CHIAVE PER LA STAMPA</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {EPK_DATA.fastStats.map((stat, i) => (
                  <div key={i} className="space-y-0.5">
                    <span className="text-[10px] font-mono opacity-50 uppercase block">{stat.label}</span>
                    <span className="text-2xl font-black text-amber-400">{stat.value}</span>
                    <span className="text-[10px] opacity-65 block">{stat.subtext}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono opacity-70 space-y-1.5">
                <div className="flex justify-between">
                  <span>Etichetta:</span>
                  <span className="font-bold">{EPK_DATA.artist.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base:</span>
                  <span>{EPK_DATA.artist.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ufficio Stampa:</span>
                  <a href={`mailto:${EPK_DATA.contacts.pressEmail}`} className="text-amber-400 underline">
                    Contatta
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-24">
        {/* SEZIONE 1: BIOGRAFIA UFFICIALE */}
        <section id="bio" className="scroll-mt-24 space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              01 • BIOGRAFIA ARTISTICA
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Short Bio for Fast Copy */}
            <div className="lg:col-span-4 space-y-4">
              <div
                className={`p-6 rounded-2xl border ${
                  isLightMode
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-amber-400/5 border-amber-400/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                    BIO BREVE (PRONTA PER ARTICOLI)
                  </span>
                  <button
                    onClick={handleCopyBio}
                    className="p-1.5 rounded-lg hover:bg-amber-400/20 text-amber-400 transition-colors"
                    title="Copia negli appunti"
                  >
                    {copiedBio ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-sans opacity-90 italic">
                  "{EPK_DATA.artist.shortBio}"
                </p>
                <button
                  onClick={handleCopyBio}
                  className="mt-4 w-full py-2 rounded-xl text-center text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all"
                >
                  {copiedBio ? '✓ Copiata negli appunti' : 'Copia Bio Breve'}
                </button>
              </div>

              {/* Manifesto Quote */}
              <div
                className={`p-6 rounded-2xl border ${
                  isLightMode ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
                }`}
              >
                <Quote className="w-6 h-6 text-amber-400 opacity-60 mb-2" />
                <p className="text-xs sm:text-sm font-sans italic opacity-85 leading-relaxed">
                  {EPK_DATA.artist.artisticManifesto}
                </p>
                <span className="block mt-3 text-[10px] font-mono uppercase tracking-wider opacity-60">
                  — Alessandro Rocchi, Dichiarazione Poetica
                </span>
              </div>
            </div>

            {/* Right: Full Extended Biography */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                La Cartografia Sonora di Alessandro Rocchi
              </h3>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed opacity-85 font-sans">
                {EPK_DATA.artist.fullBio.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE 2: DISCOGRAFIA & SCHEDE ALBUM */}
        <section id="discografia" className="scroll-mt-24 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
                02 • DISCOGRAFIA IN EVIDENZA
              </h2>
            </div>

            {/* Switch Album Tabs */}
            <div
              className={`inline-flex p-1 rounded-2xl border backdrop-blur-xl ${
                isLightMode ? 'bg-black/5 border-black/10' : 'bg-black/40 border-white/15'
              }`}
            >
              {discography.map((alb) => (
                <button
                  key={alb.id}
                  onClick={() => setActiveAlbumTab(alb.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all ${
                    activeAlbumTab === alb.id
                      ? 'bg-amber-400 text-black shadow-md'
                      : isLightMode
                      ? 'text-gray-600 hover:text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {alb.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Album Detail Card */}
          {(() => {
            const album = discography.find((a) => a.id === activeAlbumTab) || discography[0];
            return (
              <div
                className={`p-6 sm:p-10 rounded-3xl border transition-all duration-300 ${
                  isLightMode
                    ? 'bg-white border-black/10 shadow-xl'
                    : 'bg-white/[0.03] border-white/15 shadow-2xl'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left: Packshot & Vinyl Visual */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="relative group max-w-sm mx-auto">
                      <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/15 pointer-events-none" />
                      </div>
                      {/* Vinyl Peek */}
                      <div className="absolute -top-3 -right-3 -z-10 w-28 h-28 rounded-full bg-neutral-900 border-2 border-white/20 shadow-xl flex items-center justify-center animate-spin-slow">
                        <div className="w-8 h-8 rounded-full bg-amber-400/80" />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5 max-w-sm mx-auto">
                      <button
                        onClick={() => {
                          if (onSelectAlbumAndPlay) {
                            onSelectAlbumAndPlay(album);
                          }
                          onBackToPlayer();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/25"
                      >
                        <Disc className="w-4 h-4 animate-spin-slow" />
                        <span>ASCOLTA SUL GIRADISCHI 3D</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {album.spotifyAlbumUrl && (
                          <a
                            href={album.spotifyAlbumUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-[11px] font-bold bg-[#1DB954] hover:bg-[#1ed760] text-black transition-all"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>SPOTIFY</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={album.coverUrl}
                          download={`${album.id}-cover.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-[11px] font-bold border transition-all ${
                            isLightMode
                              ? 'bg-black/5 hover:bg-black/10 text-gray-800 border-black/10'
                              : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>COVER HD</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right: Album Details & Tracklist */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono opacity-60 mb-1">
                        <span className="uppercase">{album.genre}</span>
                        <span>{album.releaseDate} • {album.tracks.length} TRACCE</span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        {album.title}
                      </h3>
                      <p className="text-sm font-sans italic opacity-75 mt-1">
                        «{album.tagline}»
                      </p>
                    </div>

                    <p className="text-sm sm:text-base leading-relaxed opacity-85 font-sans">
                      {album.synopsis}
                    </p>

                    {/* Technical & Production Credits */}
                    <div
                      className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono ${
                        isLightMode ? 'bg-black/[0.02] border-black/10' : 'bg-white/[0.02] border-white/10'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] opacity-50 block uppercase">Testi & Musica</span>
                        <span className="font-bold">{album.credits.lyricsAndMusic}</span>
                      </div>
                      <div>
                        <span className="text-[10px] opacity-50 block uppercase">Produzione</span>
                        <span className="font-bold">{album.credits.production}</span>
                      </div>
                      <div>
                        <span className="text-[10px] opacity-50 block uppercase">Mix & Master</span>
                        <span>{album.credits.mixAndMaster}</span>
                      </div>
                      <div>
                        <span className="text-[10px] opacity-50 block uppercase">Artwork</span>
                        <span>{album.credits.artwork}</span>
                      </div>
                      <div>
                        <span className="text-[10px] opacity-50 block uppercase">Etichetta</span>
                        <span>{album.credits.label}</span>
                      </div>
                    </div>

                    {/* Official Tracklist */}
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-[0.2em] opacity-60 mb-3 flex items-center justify-between">
                        <span>TRACKLIST UFFICIALE</span>
                        <span>DURATA COMPLESSIVA</span>
                      </h4>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {album.tracks.map((track) => (
                          <div
                            key={track.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              isLightMode
                                ? 'bg-white hover:bg-black/5 border-black/5'
                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-[10px] opacity-50 w-5 shrink-0">
                                {String(track.number).padStart(2, '0')}
                              </span>
                              <div className="truncate">
                                <span className="font-bold truncate">{track.title}</span>
                                {track.mood && (
                                  <span className="text-[10px] font-mono opacity-50 block truncate">
                                    {track.mood}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              {track.lyrics && (
                                <button
                                  onClick={() => setSelectedLyricsTrack({ track, albumTitle: album.title })}
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    isLightMode
                                      ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 border border-purple-500/20'
                                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30'
                                  }`}
                                  title="Leggi testo del brano"
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>TESTO</span>
                                </button>
                              )}
                              <span className="font-mono text-[11px] opacity-60">
                                {track.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* SEZIONE 3: MEDIA KIT & FOTO IN ALTA RISOLUZIONE */}
        <section id="media-kit" className="scroll-mt-24 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
                03 • MEDIA KIT & FOTO PER LA STAMPA
              </h2>
            </div>
            <span className="text-xs font-mono opacity-60">
              Immagini in alta definizione autorizzate per uso editoriale e stampa.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EPK_DATA.photos.map((photo) => (
              <div
                key={photo.id}
                className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  isLightMode
                    ? 'bg-white border-black/10 hover:border-black/30 shadow-md'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/30 shadow-xl'
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-black/40">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button
                      onClick={() => handleDownloadAsset(photo)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>SCARICA HD</span>
                    </button>
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-black/70 text-white border border-white/20">
                    {photo.category}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-sm tracking-tight truncate">{photo.title}</h4>
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-60">
                    <span>{photo.resolution}</span>
                    <span>{photo.format}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[9px] font-mono opacity-50">{photo.credits}</span>
                    <button
                      onClick={() => handleDownloadAsset(photo)}
                      className="text-xs font-mono font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Scarica</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 4: COMUNICATI STAMPA UFFICIALI */}
        <section id="comunicati" className="scroll-mt-24 space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              04 • COMUNICATI STAMPA UFFICIALI (PRESS RELEASES)
            </h2>
          </div>

          {/* Switch PR Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            {EPK_DATA.pressReleases.map((pr) => (
              <button
                key={pr.id}
                onClick={() => setActivePrTab(pr.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all shrink-0 ${
                  activePrTab === pr.id
                    ? 'bg-amber-400 text-black shadow'
                    : isLightMode
                    ? 'text-gray-600 hover:bg-black/5'
                    : 'text-white/60 hover:bg-white/10'
                }`}
              >
                {pr.title.split('«')[1]?.replace('»', '') || pr.title}
              </button>
            ))}
          </div>

          {/* Active Press Release Reader */}
          {(() => {
            const pr = EPK_DATA.pressReleases.find((p) => p.id === activePrTab) || EPK_DATA.pressReleases[0];
            const isCopied = copiedPrId === pr.id;

            return (
              <div
                className={`p-6 sm:p-10 rounded-3xl border space-y-6 ${
                  isLightMode ? 'bg-white border-black/10 shadow-lg' : 'bg-white/[0.03] border-white/15 shadow-2xl'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                      COMUNICATO STAMPA UFFICIALE • {pr.date}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{pr.title}</h3>
                    <p className="text-xs sm:text-sm font-sans italic opacity-75 mt-0.5">{pr.subtitle}</p>
                  </div>

                  <button
                    onClick={() => handleCopyPressRelease(pr)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shrink-0 self-start sm:self-auto"
                  >
                    {isCopied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'COMUNICATO COPIATO!' : 'COPIA COMUNICATO'}</span>
                  </button>
                </div>

                <div className="space-y-4 text-sm sm:text-base leading-relaxed opacity-85 font-sans">
                  {pr.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Track by track breakdown */}
                {pr.trackByTrack && pr.trackByTrack.length > 0 && (
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                      GUIDA ALL'ASCOLTO (TRACK BY TRACK)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pr.trackByTrack.map((item, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs font-sans ${
                            isLightMode ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.02] border-white/5'
                          }`}
                        >
                          <span className="font-bold block font-mono text-[11px] mb-0.5">{item.title}</span>
                          <span className="opacity-75">{item.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* SEZIONE 5: RASSEGNA STAMPA & CITAZIONI */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              05 • RASSEGNA STAMPA & CRITICA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EPK_DATA.quotes.map((q) => (
              <div
                key={q.id}
                className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  isLightMode ? 'bg-white border-black/10 shadow-md' : 'bg-white/[0.03] border-white/10 shadow-xl'
                }`}
              >
                <div>
                  <Quote className="w-6 h-6 text-amber-400 opacity-60 mb-3" />
                  <p className="text-sm font-sans italic opacity-85 leading-relaxed">
                    "{q.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold">{q.source}</span>
                  <span className="opacity-50">{q.role} • {q.year}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 6: LIVE & SCHEDA TECNICA */}
        <section id="live" className="scroll-mt-24 space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              06 • LIVE, FORMAZIONI & SCHEDA TECNICA
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Setups */}
            <div className="space-y-6">
              {EPK_DATA.liveSetups.map((setup, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border space-y-3 ${
                    isLightMode ? 'bg-white border-black/10 shadow-md' : 'bg-white/[0.03] border-white/10 shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-400/10 text-amber-500 border border-amber-400/20 font-bold">
                      {setup.duration}
                    </span>
                    <Mic2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-lg font-black tracking-tight">{setup.format}</h4>
                  <p className="text-xs sm:text-sm font-sans opacity-80 leading-relaxed">{setup.description}</p>

                  <div className="pt-3 border-t border-white/10">
                    <span className="text-[10px] font-mono opacity-50 block uppercase mb-1.5">Line-Up Palco</span>
                    <ul className="space-y-1">
                      {setup.lineup.map((member, i) => (
                        <li key={i} className="text-xs font-mono flex items-center gap-2 opacity-85">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{member}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Tech Rider Essentials */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border space-y-4 ${
                isLightMode ? 'bg-black/[0.02] border-black/10' : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h4 className="font-mono text-xs uppercase tracking-widest font-bold">
                  REQUISITI AUDIO & STAGE PLOT ESSENZIALE
                </h4>
              </div>
              <p className="text-xs opacity-75 font-sans">
                Specifiche tecniche minime per promoter e direzioni tecniche. La scheda tecnica e il canale mixer completi vengono inviati su richiesta prima dell'evento.
              </p>

              <ul className="space-y-2.5 pt-2">
                {EPK_DATA.techRiderNotes.map((note, i) => (
                  <li key={i} className="text-xs font-mono flex items-start gap-2.5 opacity-85">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-white/10">
                <a
                  href={`mailto:${EPK_DATA.contacts.bookingEmail}?subject=Richiesta%20Scheda%20Tecnica%20Live%20-%20Alessandro%20Rocchi`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-bold border hover:border-amber-400 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>RICHIEDI SCHEDA TECNICA COMPLETA & RIDER</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SEZIONE 7: CONTATTI, BOOKING & MANAGEMENT */}
        <section id="contatti" className="scroll-mt-24 space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              07 • CONTATTI & BOOKING
            </h2>
          </div>

          <div
            className={`p-8 sm:p-12 rounded-3xl border ${
              isLightMode
                ? 'bg-white border-black/10 shadow-2xl'
                : 'bg-gradient-to-br from-white/[0.05] to-transparent border-white/15 shadow-2xl'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Ufficio Stampa */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  UFFICIO STAMPA & PR
                </span>
                <h4 className="text-lg font-black tracking-tight">Comunicati & Interviste</h4>
                <p className="text-xs opacity-75 font-sans">
                  Per richieste di interviste, recensioni, accrediti stampa e materiale promozionale.
                </p>
                <a
                  href={`mailto:${EPK_DATA.contacts.pressEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:underline pt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{EPK_DATA.contacts.pressEmail}</span>
                </a>
              </div>

              {/* Booking */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  BOOKING & CONCERTI
                </span>
                <h4 className="text-lg font-black tracking-tight">Date & Festival</h4>
                <p className="text-xs opacity-75 font-sans">
                  Disponibile per club, teatri, rassegne cantautorali e festival in tutta Italia ed Europa.
                </p>
                <a
                  href={`mailto:${EPK_DATA.contacts.bookingEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:underline pt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{EPK_DATA.contacts.bookingEmail}</span>
                </a>
              </div>

              {/* Management */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  MANAGEMENT & INFO
                </span>
                <h4 className="text-lg font-black tracking-tight">Direzione Artistica</h4>
                <p className="text-xs opacity-75 font-sans">
                  Contatto diretto con l'artista e coordinamento progetti discografici.
                </p>
                <a
                  href={`mailto:${EPK_DATA.contacts.managementEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:underline pt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{EPK_DATA.contacts.managementEmail}</span>
                </a>
              </div>
            </div>

            {/* Social & Platform Links */}
            <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-mono opacity-60">
                PROFILI UFFICIALI & STREAMING:
              </span>

              <div className="flex flex-wrap items-center gap-3">
                {EPK_DATA.contacts.socials.spotify && (
                  <a
                    href={EPK_DATA.contacts.socials.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold bg-[#1DB954] hover:bg-[#1ed760] text-black transition-all"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>SPOTIFY</span>
                  </a>
                )}
                {EPK_DATA.contacts.socials.instagram && (
                  <a
                    href={EPK_DATA.contacts.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold border transition-all ${
                      isLightMode
                        ? 'bg-black/5 hover:bg-black/10 text-gray-900 border-black/10'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                    }`}
                  >
                    <span>INSTAGRAM</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onBackToPlayer}
            className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Torna al Giradischi 3D</span>
          </button>
          <span className="opacity-30">•</span>
          <a href="#bio" className="font-mono text-xs opacity-60 hover:opacity-100">
            Torna in cima ↑
          </a>
        </div>
        <p className="text-xs font-mono opacity-60">
          © {new Date().getFullYear()} Alessandro Rocchi • weagency{' '}
          <a
            href="https://altamente.it"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
          >
            altamente.it
          </a>
        </p>
      </footer>

      {/* EPK Lyrics Viewer Modal */}
      {selectedLyricsTrack && selectedLyricsTrack.track.lyrics && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedLyricsTrack(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white text-gray-900 border-black/10' : 'bg-[#12131b] text-white border-white/15'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  {selectedLyricsTrack.albumTitle} • Traccia {String(selectedLyricsTrack.track.number).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-bold font-mono mt-0.5">
                  {selectedLyricsTrack.track.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedLyricsTrack.track.lyrics) {
                      navigator.clipboard.writeText(selectedLyricsTrack.track.lyrics);
                      setCopiedLyrics(true);
                      setTimeout(() => setCopiedLyrics(false), 2000);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shadow-sm ${
                    copiedLyrics
                      ? 'bg-emerald-500 text-black'
                      : isLightMode
                      ? 'bg-black/5 hover:bg-black/10 text-gray-800'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                  title="Copia testo negli appunti per recensioni / stampa"
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
                  onClick={() => setSelectedLyricsTrack(null)}
                  className="p-2 rounded-xl hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
                  title="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 space-y-4 font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line opacity-90 select-text">
              {selectedLyricsTrack.track.lyrics}
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono opacity-60">
              <span>{selectedLyricsTrack.track.lyrics.split('\n').filter(Boolean).length} VERSI</span>
              <span>TESTO & MUSICA: ALESSANDRO ROCCHI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
