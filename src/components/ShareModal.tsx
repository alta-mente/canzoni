import React, { useState, useEffect } from 'react';
import { AlbumData, Track, DISCOGRAPHY, ALBUM_DATA, resolveAssetUrl } from '../data/albumData';
import { useAudio } from '../context/NativeAudioContext';
import { trackOutboundClick } from '../utils/analytics';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Share2, 
  Code, 
  Disc, 
  Music,
  FileText,
  Eye, 
  Layers,
  Move,
  Quote
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  albums?: AlbumData[];
}

function slugify(str: string): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose,
  albums = DISCOGRAPHY 
}) => {
  const { currentTrack } = useAudio();

  const [activeTab, setActiveTab] = useState<'link' | 'widget'>('link');
  const [shareTargetMode, setShareTargetMode] = useState<'track' | 'lyrics' | 'album'>('track');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Find album and track matching the currently active track in player
  const findInitialAlbumAndTrack = () => {
    if (currentTrack?.id) {
      for (const alb of albums) {
        const tIdx = alb.tracks.findIndex((t) => t.id === currentTrack.id);
        if (tIdx !== -1) {
          return { albumId: alb.id, trackIndex: tIdx };
        }
      }
    }
    return { albumId: albums[0]?.id || 'una-vertigine', trackIndex: 0 };
  };

  const initialSelection = findInitialAlbumAndTrack();

  // Share & Widget customizer states
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialSelection.albumId);
  const [selectedShareTrackIdx, setSelectedShareTrackIdx] = useState<number>(initialSelection.trackIndex);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | 'all'>(initialSelection.trackIndex);
  const [displayMode, setDisplayMode] = useState<'floating' | 'inpage'>('floating');
  const [floatingStyle, setFloatingStyle] = useState<'floating' | 'pill'>('floating');
  const [widgetStyle, setWidgetStyle] = useState<'card' | 'compact' | 'playlist'>('card');
  const [widgetTheme] = useState<'dark' | 'light'>('dark');
  const [codeType, setCodeType] = useState<'iframe' | 'script'>('iframe');

  // Sync with current playing/selected track whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const sel = findInitialAlbumAndTrack();
      setSelectedAlbumId(sel.albumId);
      setSelectedShareTrackIdx(sel.trackIndex);
      setSelectedTrackIndex(sel.trackIndex);
    }
  }, [isOpen, currentTrack?.id]);

  if (!isOpen) return null;

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId) || albums[0] || ALBUM_DATA;
  const activeShareTrack: Track =
    currentAlbum.tracks[selectedShareTrackIdx] || currentAlbum.tracks[0];

  const baseSiteUrl = 'https://alta-mente.github.io/canzoni/';
  const albumSlug = slugify(currentAlbum.id || currentAlbum.title);
  const trackSlug = slugify(activeShareTrack?.title || '');

  // Dedicated SEO URLs with Open Graph previews for each track, lyrics, or album
  const shareUrl =
    shareTargetMode === 'track'
      ? `${baseSiteUrl}brano/${trackSlug}/`
      : shareTargetMode === 'lyrics'
      ? `${baseSiteUrl}testo/${trackSlug}/`
      : `${baseSiteUrl}album/${albumSlug}/`;

  const shareText =
    shareTargetMode === 'track'
      ? `Ascolta «${activeShareTrack.title}» di ${currentAlbum.artist} (dall'album «${currentAlbum.title}»)`
      : shareTargetMode === 'lyrics'
      ? `Leggi il testo e ascolta «${activeShareTrack.title}» di ${currentAlbum.artist}`
      : `Ascolta l'album «${currentAlbum.title}» di ${currentAlbum.artist}`;

  const cleanQuote = activeShareTrack?.storyQuote
    ? activeShareTrack.storyQuote.replace(/^[«"]|[»"]$/g, '').trim()
    : '';

  const shareTextWithQuote = cleanQuote
    ? `«${cleanQuote}» — ${activeShareTrack.title} (${currentAlbum.artist})\n${shareUrl}`
    : `${shareText} ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyQuoteAndLink = () => {
    navigator.clipboard.writeText(shareTextWithQuote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2200);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title:
            shareTargetMode === 'album'
              ? `${currentAlbum.title} — ${currentAlbum.artist}`
              : `${activeShareTrack.title} — ${currentAlbum.artist}`,
          text: cleanQuote ? `«${cleanQuote}» — ${ shareText }` : shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareToWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    shareText + (cleanQuote && shareTargetMode !== 'album' ? `\n«${cleanQuote}»` : '') + '\n' + shareUrl
  )}`;

  const shareToTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const shareToTelegram = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  const shareToFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}`;

  // Compute widget target URL
  const effectiveStyle = displayMode === 'floating' ? floatingStyle : widgetStyle;
  const trackParam = selectedTrackIndex === 'all' ? '1' : String(Number(selectedTrackIndex) + 1);
  
  const widgetIframeUrl = `${baseSiteUrl}#widget?album=${encodeURIComponent(selectedAlbumId)}&track=${encodeURIComponent(trackParam)}&style=${encodeURIComponent(effectiveStyle)}&theme=${encodeURIComponent(widgetTheme)}`;

  // Generate Embed Code
  let embedCode = '';
  if (displayMode === 'floating') {
    if (codeType === 'script') {
      embedCode = `<!-- Alessandro Rocchi - Player Flottante in basso a destra -->\n<script src="${baseSiteUrl}widget.js" data-album="${selectedAlbumId}" data-track="${trackParam}" data-style="${floatingStyle}" data-theme="${widgetTheme}"></script>`;
    } else {
      if (floatingStyle === 'pill') {
        embedCode = `<!-- Alessandro Rocchi - Pillola Flottante in basso a destra -->\n<div style="position:fixed;bottom:20px;right:20px;z-index:999999;filter:drop-shadow(0 15px 35px rgba(0,0,0,0.5));">\n  <iframe src="${widgetIframeUrl}" width="260" height="56" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:28px;overflow:hidden;background:transparent;"></iframe>\n</div>`;
      } else {
        embedCode = `<!-- Alessandro Rocchi - Card Flottante in basso a destra -->\n<div style="position:fixed;bottom:20px;right:20px;z-index:999999;filter:drop-shadow(0 15px 35px rgba(0,0,0,0.5));">\n  <iframe src="${widgetIframeUrl}" width="330" height="135" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:20px;overflow:hidden;background:transparent;"></iframe>\n</div>`;
      }
    }
  } else {
    // In-page embed
    if (widgetStyle === 'compact') {
      embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:18px;max-width:600px;overflow:hidden;background:transparent;"></iframe>`;
    } else if (widgetStyle === 'card') {
      embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="230" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:24px;max-width:460px;overflow:hidden;background:transparent;"></iframe>`;
    } else {
      embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="420" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:24px;max-width:550px;overflow:hidden;background:transparent;"></iframe>`;
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const previewArtwork = resolveAssetUrl(
    shareTargetMode === 'album'
      ? currentAlbum.coverUrl
      : activeShareTrack?.artworkUrl || currentAlbum.coverUrl
  );

  const directSpotifyUrl =
    shareTargetMode === 'album'
      ? currentAlbum.spotifyAlbumUrl
      : activeShareTrack?.spotifyUrl || currentAlbum.spotifyAlbumUrl;

  const directSunoUrl =
    shareTargetMode === 'album'
      ? currentAlbum.sunoAlbumUrl
      : activeShareTrack?.sunoUrl || currentAlbum.sunoAlbumUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className={`relative glass-panel rounded-3xl p-5 sm:p-7 w-full border border-white/20 shadow-2xl transition-all duration-300 max-h-[92vh] overflow-y-auto ${
        activeTab === 'widget' ? 'max-w-2xl' : 'max-w-lg'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 w-fit mb-5">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'link'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Condividi Brano / Album</span>
          </button>

          <button
            onClick={() => setActiveTab('widget')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'widget'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Widget per Siti</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: CONDIVIDI SINGOLO BRANO, TESTO O ALBUM
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* 1. Target Mode Selector: Singolo Brano vs Testo vs Intero Album */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShareTargetMode('track')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  shareTargetMode === 'track'
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span>Singolo Brano</span>
              </button>

              <button
                type="button"
                onClick={() => setShareTargetMode('lyrics')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  shareTargetMode === 'lyrics'
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Con Testo</span>
              </button>

              <button
                type="button"
                onClick={() => setShareTargetMode('album')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  shareTargetMode === 'album'
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5 shrink-0" />
                <span>Intero Album</span>
              </button>
            </div>

            {/* 2. Quick Selector for Album & Song */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                  Album
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => {
                    setSelectedAlbumId(e.target.value);
                    setSelectedShareTrackIdx(0);
                    setSelectedTrackIndex(0);
                  }}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title}
                    </option>
                  ))}
                </select>
              </div>

              {shareTargetMode !== 'album' && (
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                    Canzone da condividere
                  </label>
                  <select
                    value={selectedShareTrackIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedShareTrackIdx(idx);
                      setSelectedTrackIndex(idx);
                    }}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  >
                    {currentAlbum.tracks.map((tr, idx) => (
                      <option key={tr.id || idx} value={idx}>
                        {String(tr.number).padStart(2, '0')}. {tr.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Rich Card Preview (Come appare su WhatsApp / Social) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg shrink-0 bg-black/40">
                <img
                  src={previewArtwork}
                  alt={shareTargetMode === 'album' ? currentAlbum.title : activeShareTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block">
                  {shareTargetMode === 'track'
                    ? `BRANO #${String(activeShareTrack.number).padStart(2, '0')} • ${currentAlbum.title}`
                    : shareTargetMode === 'lyrics'
                    ? `TESTO UFFICIALE • ${currentAlbum.title}`
                    : `ALBUM COMPLETO (${currentAlbum.tracks.length} BRANI)`}
                </span>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  {shareTargetMode === 'album' ? currentAlbum.title : activeShareTrack.title}
                </h3>
                {cleanQuote && shareTargetMode !== 'album' ? (
                  <p className="text-[11px] text-white/65 italic line-clamp-2 mt-0.5">
                    «{cleanQuote}»
                  </p>
                ) : (
                  <p className="text-xs text-white/60 truncate">{currentAlbum.artist}</p>
                )}
              </div>
            </div>

            {/* 4. Copy Dedicated Link Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/70 flex items-center justify-between">
                <span>
                  {shareTargetMode === 'track'
                    ? 'Link diretto a questa canzone (con anteprima copertina)'
                    : shareTargetMode === 'lyrics'
                    ? 'Link diretto con apertura automatica del Testo'
                    : "Link diretto all'album"}
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white/90 font-mono focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs flex items-center space-x-1.5 transition-all duration-200 shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-white hover:bg-neutral-200 text-black font-bold'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 5. Copy Quote + Link (for Instagram / Stories / WhatsApp Status) */}
            {cleanQuote && shareTargetMode !== 'album' && (
              <button
                type="button"
                onClick={handleCopyQuoteAndLink}
                className={`w-full py-2.5 px-3.5 rounded-xl border font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  copiedQuote
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/15 text-white/85 hover:text-white'
                }`}
              >
                {copiedQuote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Citazione + Link copiati negli appunti!</span>
                  </>
                ) : (
                  <>
                    <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Copia Citazione del Brano + Link per Social/Storie</span>
                  </>
                )}
              </button>
            )}

            {/* 6. Quick Share Buttons (Native Share + WhatsApp, Telegram, X, Facebook) */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-white/70 block">
                Invia subito su
              </label>

              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mb-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Condividi con App del Dispositivo (AirDrop, Instagram, Messaggi...)</span>
                </button>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <a
                  href={shareToWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card hover:bg-[#25D366]/20 border border-white/10 hover:border-[#25D366]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all font-mono font-bold"
                >
                  WhatsApp
                </a>
                <a
                  href={shareToTelegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card hover:bg-[#0088cc]/20 border border-white/10 hover:border-[#0088cc]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all font-mono font-bold"
                >
                  Telegram
                </a>
                <a
                  href={shareToTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card hover:bg-[#1DA1F2]/20 border border-white/10 hover:border-[#1DA1F2]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all font-mono font-bold"
                >
                  X / Twitter
                </a>
                <a
                  href={shareToFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all font-mono font-bold"
                >
                  Facebook
                </a>
              </div>
            </div>

            {/* 7. Direct Streaming Links (Spotify Track/Album + Suno) */}
            {(directSpotifyUrl || directSunoUrl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {directSpotifyUrl && (
                  <a
                    href={directSpotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutboundClick('spotify', shareTargetMode === 'album' ? currentAlbum.title : activeShareTrack.title)}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-mono font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <span>
                      {shareTargetMode !== 'album' && activeShareTrack?.spotifyUrl
                        ? 'Brano su Spotify'
                        : 'Album su Spotify'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {directSunoUrl && (
                  <a
                    href={directSunoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutboundClick('suno', shareTargetMode === 'album' ? currentAlbum.title : activeShareTrack.title)}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono font-bold text-xs transition-colors"
                  >
                    <span>Ascolta su Suno</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* EPK Link for Journalists & Curators */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">Cartella Stampa &amp; Biografia:</span>
              <a
                href="#epk"
                onClick={onClose}
                className="font-bold text-white hover:text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Apri BIO / EPK</span>
                <span>→</span>
              </a>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: GENERATORE WIDGET PER SITI ESTERNI
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'widget' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-white" />
                <span>Generatore Widget Embed</span>
              </h3>
              <p className="text-xs font-mono text-white/50 mt-1">
                Incolla il lettore su WordPress, Webflow, Shopify, Wix, Squarespace, blog o qualsiasi sito HTML.
              </p>
            </div>

            {/* Configurator Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono">
              
              {/* 1. Posizione / Modalità */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">
                  1. Posizionamento
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setDisplayMode('floating')}
                    className={`px-2.5 py-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                      displayMode === 'floating'
                        ? 'bg-white/15 border-white text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate">Flottante</div>
                      <div className="text-[9px] opacity-60">In basso a destra</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDisplayMode('inpage')}
                    className={`px-2.5 py-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                      displayMode === 'inpage'
                        ? 'bg-white/15 border-white text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-white shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate">Nel Contenuto</div>
                      <div className="text-[9px] opacity-60">Dentro la pagina</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Formato Stile */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">
                  2. Stile Grafico
                </label>
                {displayMode === 'floating' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setFloatingStyle('floating')}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        floatingStyle === 'floating'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">✨ Card Vinile</div>
                      <div className="text-[9px] opacity-60">330×135 px</div>
                    </button>
                    <button
                      onClick={() => setFloatingStyle('pill')}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        floatingStyle === 'pill'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">💊 Pillola Flottante</div>
                      <div className="text-[9px] opacity-60">260×56 px</div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setWidgetStyle('card')}
                      className={`p-1.5 rounded-xl text-center border transition-all ${
                        widgetStyle === 'card'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      Card Vinile
                    </button>
                    <button
                      onClick={() => setWidgetStyle('compact')}
                      className={`p-1.5 rounded-xl text-center border transition-all ${
                        widgetStyle === 'compact'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      Mini Barra
                    </button>
                    <button
                      onClick={() => setWidgetStyle('playlist')}
                      className={`p-1.5 rounded-xl text-center border transition-all ${
                        widgetStyle === 'playlist'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      Playlist
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Album & Brano */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">
                  3. Album
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => {
                    setSelectedAlbumId(e.target.value);
                    setSelectedTrackIndex('all');
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-white/50"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} ({alb.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Traccia specifica */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">
                  4. Canzone da avviare
                </label>
                <select
                  value={selectedTrackIndex}
                  onChange={(e) => setSelectedTrackIndex(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-white/50"
                >
                  <option value="all">💿 Tutto l'album (inizia dal brano 01)</option>
                  {currentAlbum.tracks.map((tr, idx) => (
                    <option key={tr.id || idx} value={idx}>
                      {String(tr.number).padStart(2, '0')}. {tr.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Anteprima Live Interattiva:</span>
                </span>
                <span className="text-[10px] text-white/40">Prova i controlli e l'audio qui sotto</span>
              </div>

              <div className="relative rounded-2xl border border-white/15 bg-black/60 p-4 overflow-hidden flex items-center justify-center min-h-[140px]">
                <iframe
                  key={widgetIframeUrl}
                  src={widgetIframeUrl}
                  width="100%"
                  height={
                    displayMode === 'floating'
                      ? (floatingStyle === 'pill' ? 56 : 135)
                      : (widgetStyle === 'compact' ? 80 : widgetStyle === 'card' ? 230 : 380)
                  }
                  className="rounded-2xl transition-all duration-300"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    maxWidth: displayMode === 'floating'
                      ? (floatingStyle === 'pill' ? '260px' : '330px')
                      : (widgetStyle === 'compact' ? '600px' : widgetStyle === 'card' ? '460px' : '550px')
                  }}
                  title="Anteprima Widget"
                />
              </div>
            </div>

            {/* CODE OUTPUT & COPY BUTTON */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 font-bold">Codice da incollare:</span>
                  {displayMode === 'floating' && (
                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                      <button
                        onClick={() => setCodeType('iframe')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          codeType === 'iframe' ? 'bg-white text-black font-bold' : 'text-white/50'
                        }`}
                      >
                        HTML Iframe
                      </button>
                      <button
                        onClick={() => setCodeType('script')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          codeType === 'script' ? 'bg-white text-black font-bold' : 'text-white/50'
                        }`}
                      >
                        Script 1 riga
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-white/50">
                  {codeType === 'script' && displayMode === 'floating' ? 'Script auto-iniettante' : 'Compatibile con tutti i siti'}
                </span>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={embedCode}
                  className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-[11px] font-mono text-zinc-200 focus:outline-none resize-none select-all"
                />
                
                <button
                  onClick={handleCopyCode}
                  className={`absolute right-2.5 top-2.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg transition-all ${
                    copiedCode
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white hover:bg-neutral-200 text-black active:scale-95'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia Codice</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] font-mono text-white/40">
                💡 <strong>Come usarlo:</strong> Incolla questo codice nel blocco HTML personalizzato del tuo sito WordPress, Webflow, Shopify o Squarespace. Il lettore funzionerà subito con audio e copertine.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
