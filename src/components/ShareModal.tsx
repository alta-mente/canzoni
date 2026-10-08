import React, { useState } from 'react';
import { ALBUM_DATA } from '../data/albumData';
import { X, Check, Copy, ExternalLink, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ALBUM_DATA.spotifyAlbumUrl;
  const shareText = `Ascolta «${ALBUM_DATA.title}», il nuovo album di ${ALBUM_DATA.artist}!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    shareText + ' ' + currentUrl
  )}`;

  const shareToTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(currentUrl)}`;

  const shareToTelegram = `https://t.me/share/url?url=${encodeURIComponent(
    currentUrl
  )}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg shrink-0">
            <img src={ALBUM_DATA.coverUrl} alt={ALBUM_DATA.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-mars-400 uppercase tracking-wider block">
              Condividi Album
            </span>
            <h3 className="text-lg font-bold text-white leading-tight">
              {ALBUM_DATA.title}
            </h3>
            <p className="text-xs text-white/60">{ALBUM_DATA.artist}</p>
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/70 block">
            Link del sito / streaming
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/80 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center space-x-1.5 transition-all duration-200 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-mars-crimson hover:bg-mars-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/70 block">
            Condividi velocemente
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <a
              href={shareToWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card hover:bg-[#25D366]/20 border border-white/10 hover:border-[#25D366]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all"
            >
              WhatsApp
            </a>
            <a
              href={shareToTwitter}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card hover:bg-[#1DA1F2]/20 border border-white/10 hover:border-[#1DA1F2]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all"
            >
              X / Twitter
            </a>
            <a
              href={shareToTelegram}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card hover:bg-[#0088cc]/20 border border-white/10 hover:border-[#0088cc]/40 p-2.5 rounded-xl text-center text-white/90 hover:text-white transition-all"
            >
              Telegram
            </a>
          </div>
        </div>

        {/* Direct Spotify Button */}
        <a
          href={ALBUM_DATA.spotifyAlbumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <span>Apri direttamente su Spotify</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* EPK Link for Journalists & Curators */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-white/60">Cartella Stampa Ufficiale:</span>
          <a
            href="#epk"
            onClick={onClose}
            className="font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>Apri EPK</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};
