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
  Eye, 
  Layers,
  Move,
  Quote,
  ChevronRight
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

  const [showWidgetGenerator, setShowWidgetGenerator] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialSelection.albumId);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | 'all'>(initialSelection.trackIndex);
  const [displayMode, setDisplayMode] = useState<'floating' | 'inpage'>('floating');
  const [floatingStyle, setFloatingStyle] = useState<'floating' | 'pill'>('floating');
  const [widgetStyle, setWidgetStyle] = useState<'card' | 'compact' | 'playlist'>('card');
  const [widgetTheme] = useState<'dark' | 'light'>('dark');
  const [codeType, setCodeType] = useState<'iframe' | 'script'>('iframe');

  useEffect(() => {
    if (isOpen) {
      const sel = findInitialAlbumAndTrack();
      setSelectedAlbumId(sel.albumId);
      setSelectedTrackIndex(sel.trackIndex);
      setShowWidgetGenerator(false);
    }
  }, [isOpen, currentTrack?.id]);

  if (!isOpen) return null;

  const activeAlbum =
    albums.find((a) => a.tracks.some((t) => t.id === currentTrack?.id)) ||
    albums[0] ||
    ALBUM_DATA;
  const activeTrack: Track =
    activeAlbum.tracks.find((t) => t.id === currentTrack?.id) ||
    activeAlbum.tracks[0];

  const baseSiteUrl = 'https://alta-mente.github.io/canzoni/';
  const trackSlug = slugify(activeTrack?.title || '');
  const shareUrl = `${baseSiteUrl}brano/${trackSlug}/`;

  const cleanQuote = activeTrack?.storyQuote
    ? activeTrack.storyQuote.replace(/^[«"]|[»"]$/g, '').trim()
    : '';

  const shareText = `Ascolta «${activeTrack.title}» di ${activeAlbum.artist}`;
  const shareTextWithQuote = cleanQuote
    ? `«${cleanQuote}»\n— ${activeTrack.title} (${activeAlbum.artist})\n${shareUrl}`
    : `${shareText}\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyQuoteAndLink = () => {
    navigator.clipboard.writeText(shareTextWithQuote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2200);
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: `${activeTrack.title} — ${activeAlbum.artist}`,
          text: cleanQuote ? `«${cleanQuote}» — ${shareText}` : shareText,
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    (cleanQuote ? `«${cleanQuote}»\n` : '') + `${shareText}\n${shareUrl}`
  )}`;

  const shareToTelegram = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  const shareToTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const previewArtwork = resolveAssetUrl(activeTrack?.artworkUrl || activeAlbum.coverUrl);
  const directSpotifyUrl = activeTrack?.spotifyUrl || activeAlbum.spotifyAlbumUrl;

  // Widget generator state
  const currentWidgetAlbum = albums.find((a) => a.id === selectedAlbumId) || activeAlbum;
  const effectiveStyle = displayMode === 'floating' ? floatingStyle : widgetStyle;
  const trackParam = selectedTrackIndex === 'all' ? '1' : String(Number(selectedTrackIndex) + 1);
  const widgetIframeUrl = `${baseSiteUrl}#widget?album=${encodeURIComponent(selectedAlbumId)}&track=${encodeURIComponent(trackParam)}&style=${encodeURIComponent(effectiveStyle)}&theme=${encodeURIComponent(widgetTheme)}`;

  let embedCode = '';
  if (displayMode === 'floating') {
    if (codeType === 'script') {
      embedCode = `<!-- Alessandro Rocchi - Player Flottante in basso a destra -->\n<script src="${baseSiteUrl}widget.js" data-album="${selectedAlbumId}" data-track="${trackParam}" data-style="${floatingStyle}" data-theme="${widgetTheme}"></script>`;
    } else if (floatingStyle === 'pill') {
      embedCode = `<!-- Alessandro Rocchi - Pillola Flottante in basso a destra -->\n<div style="position:fixed;bottom:20px;right:20px;z-index:999999;filter:drop-shadow(0 15px 35px rgba(0,0,0,0.5));">\n  <iframe src="${widgetIframeUrl}" width="260" height="56" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:28px;overflow:hidden;background:transparent;"></iframe>\n</div>`;
    } else {
      embedCode = `<!-- Alessandro Rocchi - Card Flottante in basso a destra -->\n<div style="position:fixed;bottom:20px;right:20px;z-index:999999;filter:drop-shadow(0 15px 35px rgba(0,0,0,0.5));">\n  <iframe src="${widgetIframeUrl}" width="330" height="135" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:20px;overflow:hidden;background:transparent;"></iframe>\n</div>`;
    }
  } else if (widgetStyle === 'compact') {
    embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:18px;max-width:600px;overflow:hidden;background:transparent;"></iframe>`;
  } else if (widgetStyle === 'card') {
    embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="230" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:24px;max-width:460px;overflow:hidden;background:transparent;"></iframe>`;
  } else {
    embedCode = `<iframe src="${widgetIframeUrl}" width="100%" height="420" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:24px;max-width:550px;overflow:hidden;background:transparent;"></iframe>`;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative glass-panel rounded-3xl p-5 sm:p-6 w-full border border-white/20 shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          showWidgetGenerator ? 'max-w-2xl' : 'max-w-sm'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        {!showWidgetGenerator ? (
          /* ─────────────────────────────────────────────────────────────
             SMART & MINIMAL SINGLE-TRACK SHARE CARD
             ───────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            {/* Song Mini Hero */}
            <div className="flex items-center gap-3.5 pr-6">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/25 shadow-lg shrink-0 bg-black">
                <img
                  src={previewArtwork}
                  alt={activeTrack.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#090a10] border border-white/50" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Condividi Brano
                </span>
                <h3 className="text-base font-bold text-white leading-tight truncate">
                  {activeTrack.title}
                </h3>
                <p className="text-xs text-white/55 truncate">
                  {activeAlbum.title} • {activeAlbum.artist}
                </p>
              </div>
            </div>

            {/* Primary 1-Click Action: Copy Direct Song Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full py-3 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                copiedLink
                  ? 'bg-emerald-400 text-black'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Link del brano copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copia Link Diretto a «{activeTrack.title}»</span>
                </>
              )}
            </button>

            {/* Secondary 1-Click Action: Copy Poetic Quote + Link */}
            {cleanQuote && (
              <button
                type="button"
                onClick={handleCopyQuoteAndLink}
                className={`w-full py-2.5 px-3.5 rounded-2xl border font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  copiedQuote
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/15 text-white/85 hover:text-white'
                }`}
              >
                {copiedQuote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Citazione + Link copiati!</span>
                  </>
                ) : (
                  <>
                    <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Copia Frase del Brano + Link</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Social Row */}
            <div className="grid grid-cols-3 gap-2 pt-0.5 text-xs font-mono">
              <a
                href={shareToWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-center text-white font-bold transition-all"
              >
                WhatsApp
              </a>
              <a
                href={shareToTelegram}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-center text-white font-bold transition-all"
              >
                Telegram
              </a>
              {canNativeShare ? (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-center text-white font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Altro...</span>
                </button>
              ) : (
                <a
                  href={shareToTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-center text-white font-bold transition-all"
                >
                  X / Post
                </a>
              )}
            </div>

            {/* Direct Spotify Link if available */}
            {directSpotifyUrl && (
              <a
                href={directSpotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutboundClick('spotify', activeTrack.title)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1ed760] font-mono font-bold text-xs transition-all"
              >
                <span>Apri questo brano su Spotify</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Subtle Footer Link for Web Widget Embed */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/45">
              <button
                type="button"
                onClick={() => setShowWidgetGenerator(true)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                <span>Incorpora player su un sito web</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             WIDGET GENERATOR (ONLY WHEN REQUESTED)
             ───────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between pr-8">
              <button
                type="button"
                onClick={() => setShowWidgetGenerator(false)}
                className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>← Torna a Condividi Brano</span>
              </button>
              <span className="text-xs font-mono text-white/50">Generatore Widget Embed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono">
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
                      <div className="truncate">Nella Pagina</div>
                    </div>
                  </button>
                </div>
              </div>

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
                      Card Vinile
                    </button>
                    <button
                      onClick={() => setFloatingStyle('pill')}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        floatingStyle === 'pill'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      Pillola
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
                      Card
                    </button>
                    <button
                      onClick={() => setWidgetStyle('compact')}
                      className={`p-1.5 rounded-xl text-center border transition-all ${
                        widgetStyle === 'compact'
                          ? 'bg-white/15 border-white text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      Barra
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-wider block font-bold">
                  4. Canzone
                </label>
                <select
                  value={selectedTrackIndex}
                  onChange={(e) => setSelectedTrackIndex(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="all">Tutto l'album</option>
                  {currentWidgetAlbum.tracks.map((tr, idx) => (
                    <option key={tr.id || idx} value={idx}>
                      {String(tr.number).padStart(2, '0')}. {tr.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Anteprima:</span>
                </span>
                {displayMode === 'floating' && (
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setCodeType('iframe')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        codeType === 'iframe' ? 'bg-white text-black font-bold' : 'text-white/50'
                      }`}
                    >
                      Iframe
                    </button>
                    <button
                      onClick={() => setCodeType('script')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        codeType === 'script' ? 'bg-white text-black font-bold' : 'text-white/50'
                      }`}
                    >
                      Script
                    </button>
                  </div>
                )}
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
                      : 'bg-white hover:bg-neutral-200 text-black'
                  }`}
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
