import React, { useState, useEffect, useRef } from 'react';
import { AlbumData, Track, DISCOGRAPHY } from '../data/albumData';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Music, 
  Film, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Search,
  Disc,
  FolderOpen,
  Sparkles,
  Palette,
  Eye,
  CheckCircle2,
  Download,
  Lock,
  RotateCcw,
  FileJson
} from 'lucide-react';

interface BackofficeViewProps {
  onBackToPlayer: () => void;
  onLogout?: () => void;
  albums?: AlbumData[];
  onAlbumsUpdated?: (albums: AlbumData[]) => void;
}

interface MediaFile {
  name: string;
  url: string;
  folder: string;
  size: number;
  type: 'audio' | 'video' | 'image' | 'other';
  mtime: number;
}

export const BackofficeView: React.FC<BackofficeViewProps> = ({ 
  onBackToPlayer,
  onLogout,
  albums: initialAlbums,
  onAlbumsUpdated
}) => {
  const [albums, setAlbums] = useState<AlbumData[]>(() => {
    if (initialAlbums && initialAlbums.length > 0) return initialAlbums;
    try {
      const saved = localStorage.getItem('antigravity_discography_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse localStorage discography:', e);
    }
    return DISCOGRAPHY;
  });
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialAlbums?.[0]?.id || DISCOGRAPHY[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'albums' | 'tracks' | 'lyrics' | 'media'>('tracks');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [mediaSearch, setMediaSearch] = useState<string>('');
  
  // Status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Suno lyrics import state
  const [sunoImportUrl, setSunoImportUrl] = useState<string>('');
  const [isImportingSuno, setIsImportingSuno] = useState<boolean>(false);

  // Audio preview in backoffice
  const [previewAudioSrc, setPreviewAudioSrc] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // JSON export/import helpers
  const [hasCopiedJson, setHasCopiedJson] = useState<boolean>(false);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync if initialAlbums prop updates
  useEffect(() => {
    if (initialAlbums && initialAlbums.length > 0) {
      setAlbums(initialAlbums);
    }
  }, [initialAlbums]);

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId) || albums[0];
  const activeTrack: Track | undefined = currentAlbum?.tracks[selectedTrackIndex] || currentAlbum?.tracks[0];

  // Fetch albums & media on mount
  useEffect(() => {
    fetchAlbums();
    fetchMediaFiles();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/albums');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const hasLocalCustom = !!localStorage.getItem('antigravity_discography_custom');
          if (!hasLocalCustom) {
            setAlbums(data);
            if (!selectedAlbumId) {
              setSelectedAlbumId(data[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch from /api/albums, using local data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMediaFiles = async () => {
    try {
      const res = await fetch('/api/media');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setMediaFiles(data.files || []);
      }
    } catch (err) {
      console.warn('Could not fetch /api/media', err);
    }
  };

  const saveAlbumsToDisk = async (albumsToSave = albums) => {
    setIsSaving(true);
    try {
      // 1. ALWAYS persist immediately to browser localStorage
      try {
        localStorage.setItem('antigravity_discography_custom', JSON.stringify(albumsToSave, null, 2));
      } catch (storageErr) {
        console.warn('LocalStorage save error:', storageErr);
      }

      if (onAlbumsUpdated) {
        onAlbumsUpdated(albumsToSave);
      }

      // 2. Try saving to server (local development Vite backend)
      let savedOnServer = false;
      try {
        const res = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(albumsToSave, null, 2)
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json().catch(() => ({}));
          if (data?.success) {
            savedOnServer = true;
          }
        }
      } catch {
        // Server fetch failed (e.g. static hosting on GitHub Pages)
      }

      if (savedOnServer) {
        showNotification('Modifiche salvate con successo su disco e nel browser!', 'success');
      } else {
        showNotification(
          'Modifiche salvate nel browser e attive nel player! Su GitHub Pages usa "Scarica JSON" per aggiornare il repository.',
          'success'
        );
      }
    } catch (err: any) {
      showNotification(`Errore: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadAlbumsJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(albums, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'albums.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('File albums.json scaricato con successo!', 'success');
    } catch (err: any) {
      showNotification(`Errore download: ${err.message}`, 'error');
    }
  };

  const copyAlbumsJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(albums, null, 2));
      setHasCopiedJson(true);
      showNotification('JSON completo copiato negli appunti!', 'success');
      setTimeout(() => setHasCopiedJson(false), 2500);
    } catch (err: any) {
      showNotification(`Errore copia: ${err.message}`, 'error');
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tracks) {
          setAlbums(parsed);
          saveAlbumsToDisk(parsed);
          showNotification('Nuovo albums.json importato con successo!', 'success');
        } else {
          showNotification('Formato JSON non valido (atteso array di album)', 'error');
        }
      } catch (err: any) {
        showNotification(`Errore lettura JSON: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetToDefault = () => {
    if (window.confirm('Vuoi ripristinare la discografia originale? Tutte le modifiche locali non salvate su file andranno perse.')) {
      localStorage.removeItem('antigravity_discography_custom');
      setAlbums(DISCOGRAPHY);
      if (onAlbumsUpdated) onAlbumsUpdated(DISCOGRAPHY);
      showNotification('Discografia originale ripristinata!', 'info');
    }
  };

  const handleImportFromSuno = async () => {
    if (!sunoImportUrl.trim()) return;
    setIsImportingSuno(true);
    try {
      const res = await fetch('/api/import-suno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrId: sunoImportUrl.trim() })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.lyrics) {
          updateCurrentTrack('lyrics', data.lyrics);
          showNotification('Testo importato da Suno con successo!', 'success');
          setSunoImportUrl('');
        } else {
          showNotification(data.error || 'Errore importazione testo da Suno', 'error');
        }
      } else {
        showNotification('Importazione Suno disponibile solo in locale con server attivo (npm run dev)', 'info');
      }
    } catch (err: any) {
      showNotification(`Errore di rete: ${err.message}`, 'error');
    } finally {
      setIsImportingSuno(false);
    }
  };

  // Upload file helper
  const handleFileUpload = async (
    file: File, 
    targetFolder: 'audio' | 'audio-fette' | 'video' | 'images' | 'uploads'
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              targetFolder,
              base64Data
            })
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const result = await res.json();
            if (result.success) {
              showNotification(`File "${result.filename}" caricato in ${targetFolder}!`, 'success');
              fetchMediaFiles();
              resolve(result.url);
              return;
            } else {
              showNotification(`Upload fallito: ${result.error}`, 'error');
              resolve(null);
              return;
            }
          }
          showNotification('Upload file su disco disponibile solo in locale con server attivo (npm run dev)', 'info');
          resolve(null);
        } catch (err: any) {
          showNotification(`Errore upload: ${err.message}`, 'error');
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Track modification helper
  const updateCurrentTrack = (field: keyof Track, value: any) => {
    if (!currentAlbum || selectedTrackIndex === undefined) return;
    const updatedAlbums = albums.map((alb) => {
      if (alb.id !== currentAlbum.id) return alb;
      const updatedTracks = [...alb.tracks];
      updatedTracks[selectedTrackIndex] = {
        ...updatedTracks[selectedTrackIndex],
        [field]: value
      };
      return { ...alb, tracks: updatedTracks };
    });
    setAlbums(updatedAlbums);
  };

  // Album modification helper
  const updateCurrentAlbum = (field: keyof AlbumData, value: any) => {
    if (!currentAlbum) return;
    const updatedAlbums = albums.map((alb) => {
      if (alb.id !== currentAlbum.id) return alb;
      return { ...alb, [field]: value };
    });
    setAlbums(updatedAlbums);
  };

  // Audio preview toggle
  const toggleAudioPreview = (src: string) => {
    if (!audioPreviewRef.current) return;
    if (previewAudioSrc === src && isPreviewPlaying) {
      audioPreviewRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      setPreviewAudioSrc(src);
      audioPreviewRef.current.src = src;
      audioPreviewRef.current.play().then(() => {
        setIsPreviewPlaying(true);
      }).catch((err) => {
        showNotification('Impossibile riprodurre audio: ' + err.message, 'error');
      });
    }
  };

  // Filtered media files
  const filteredMedia = mediaFiles.filter((f) => {
    const matchesType = mediaFilter === 'all' || f.type === mediaFilter;
    const matchesSearch = f.name.toLowerCase().includes(mediaSearch.toLowerCase()) || 
                          f.folder.toLowerCase().includes(mediaSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#0d0e14] text-gray-100 flex flex-col font-sans">
      <audio
        ref={audioPreviewRef}
        onEnded={() => setIsPreviewPlaying(false)}
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#12131b]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-medium transition-all"
            title="Torna al Player 3D"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vedi Player</span>
          </button>

          <div className="h-4 w-px bg-white/15" />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Studio Backoffice
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              Alessandro Rocchi
            </span>
          </div>
        </div>

        {/* Center: Main View Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tracks'
                ? 'bg-amber-400 text-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Tracce & Canzoni</span>
          </button>

          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'lyrics'
                ? 'bg-amber-400 text-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Testi (Lyrics)</span>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'albums'
                ? 'bg-amber-400 text-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Album & Dati</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'media'
                ? 'bg-amber-400 text-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Libreria File</span>
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {statusMessage && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Salva modifiche */}
          <button
            onClick={() => saveAlbumsToDisk()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            title="Salva modifiche (salva immediatamente nel browser e su file se in locale)"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Salva</span>
          </button>

          {/* Scarica JSON */}
          <button
            onClick={downloadAlbumsJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-mono text-xs font-medium transition-all"
            title="Scarica il file albums.json aggiornato"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Scarica JSON</span>
          </button>

          {/* Copia JSON */}
          <button
            onClick={copyAlbumsJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-mono text-xs font-medium transition-all"
            title="Copia l'intero JSON negli appunti"
          >
            {hasCopiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
            <span className="hidden md:inline">{hasCopiedJson ? 'Copiato!' : 'Copia'}</span>
          </button>

          {/* Importa JSON */}
          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-mono text-xs font-medium transition-all"
            title="Importa un file albums.json salvato"
          >
            <Upload className="w-3.5 h-3.5 text-white/60" />
            <span className="hidden lg:inline">Importa</span>
            <input
              ref={jsonFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
          </button>

          {/* Ripristina Default */}
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/60 hover:text-amber-300 border border-white/10 font-mono text-xs transition-all"
            title="Ripristina la discografia originale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 border border-white/10 hover:border-red-500/30 font-mono text-xs font-medium transition-all"
              title="Blocca e disconnetti dal Backoffice"
            >
              <Lock className="w-3.5 h-3.5 text-white/60" />
              <span className="hidden sm:inline">Disconnetti</span>
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* ALBUM SELECTOR BAR (Present on tracks and lyrics tabs) */}
        {(activeTab === 'tracks' || activeTab === 'lyrics' || activeTab === 'albums') && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">Album attivo:</span>
              <div className="flex items-center gap-2">
                {albums.map((alb) => (
                  <button
                    key={alb.id}
                    onClick={() => {
                      setSelectedAlbumId(alb.id);
                      setSelectedTrackIndex(0);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                      alb.id === currentAlbum?.id
                        ? 'bg-white/15 text-white border border-amber-400/50 shadow-md font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <img src={alb.coverUrl} className="w-5 h-5 rounded-[2px] object-cover" />
                    <span>{alb.title}</span>
                    <span className="text-[10px] opacity-60">({alb.tracks.length})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-white/50">
              {currentAlbum?.tracks.length || 0} Tracce • Anno {currentAlbum?.year}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: TRACCE & CANZONI
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'tracks' && currentAlbum && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Track List */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs font-mono uppercase tracking-widest text-white/50 font-bold">
                  Elenco Brani
                </span>
                <span className="text-xs font-mono text-white/40">
                  {currentAlbum.tracks.length} canzoni
                </span>
              </div>

              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {currentAlbum.tracks.map((track, idx) => {
                  const isSelected = idx === selectedTrackIndex;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => setSelectedTrackIndex(idx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400/50 shadow-lg text-white'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 font-mono text-xs opacity-50 shrink-0">
                          {String(track.number).padStart(2, '0')}
                        </span>
                        
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                          <img
                            src={track.artworkUrl || currentAlbum.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold truncate">
                            {track.title}
                          </div>
                          <div className="text-[10px] font-mono text-white/40 truncate">
                            {track.audioSrc.split('/').pop() || 'No audio'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Audio preview button */}
                        {track.audioSrc && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudioPreview(track.audioSrc);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all"
                            title="Ascolta anteprima"
                          >
                            {previewAudioSrc === track.audioSrc && isPreviewPlaying ? (
                              <Pause className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <span className="font-mono text-xs opacity-50">{track.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Track Detail Editor */}
            {activeTrack && (
              <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      Modifica Traccia {String(activeTrack.number).padStart(2, '0')}
                    </span>
                    <h2 className="text-xl font-bold font-mono text-white mt-1">
                      {activeTrack.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Player Widget */}
                    {activeTrack.audioSrc && (
                      <button
                        onClick={() => toggleAudioPreview(activeTrack.audioSrc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all"
                      >
                        {previewAudioSrc === activeTrack.audioSrc && isPreviewPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pausa</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ascolta</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Titolo */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-mono text-white/60 uppercase">Titolo Traccia</label>
                    <input
                      type="text"
                      value={activeTrack.title}
                      onChange={(e) => updateCurrentTrack('title', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400/80 outline-none"
                    />
                  </div>

                  {/* Durata */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-white/60 uppercase">Durata (es. 3:44)</label>
                    <input
                      type="text"
                      value={activeTrack.duration}
                      onChange={(e) => updateCurrentTrack('duration', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400/80 outline-none"
                    />
                  </div>

                  {/* Mood & Atmosfera */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-white/60 uppercase">Mood / Atmosfera</label>
                    <input
                      type="text"
                      value={activeTrack.mood}
                      onChange={(e) => updateCurrentTrack('mood', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400/80 outline-none"
                      placeholder="es. Cosmico • Evasione"
                    />
                  </div>

                  {/* Story Quote (Citazione concettuale) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-mono text-white/60 uppercase">
                      Citazione Poetica / Estratto Concettuale
                    </label>
                    <textarea
                      rows={2}
                      value={activeTrack.storyQuote}
                      onChange={(e) => updateCurrentTrack('storyQuote', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400/80 outline-none resize-none"
                      placeholder="«Scrivi qui la frase in evidenza per questo brano...»"
                    />
                  </div>
                </div>

                {/* Media Attachments Section (Audio, Video, Artwork) */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    File Multimediali del Brano
                  </span>

                  {/* 1. File Audio (MP3 / M4A / WAV) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-bold text-white">File Audio Principale</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">
                        {activeTrack.audioSrc || 'Nessun file collegato'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeTrack.audioSrc}
                        onChange={(e) => updateCurrentTrack('audioSrc', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400/80 outline-none"
                        placeholder="/audio/track-1.wav"
                      />

                      {/* File upload input */}
                      <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carica Audio</span>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.m4a,.wav,.flac"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const targetDir = currentAlbum.id.includes('fette') ? 'audio-fette' : 'audio';
                              const url = await handleFileUpload(file, targetDir);
                              if (url) updateCurrentTrack('audioSrc', url);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 2. Video Canvas (MP4) */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-mono font-bold text-white">Video Canvas Traccia (Opzionale)</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">
                        {activeTrack.canvasVideoSrc ? 'Canvas specifico attivo' : 'Usa canvas album predefinito'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeTrack.canvasVideoSrc || ''}
                        onChange={(e) => updateCurrentTrack('canvasVideoSrc', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-rose-400/80 outline-none"
                        placeholder="/video/track-1.mp4"
                      />

                      <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carica Video</span>
                        <input
                          type="file"
                          accept="video/*,.mp4,.webm"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const targetDir = currentAlbum.id.includes('fette') ? 'video-fette' : 'video';
                              const url = await handleFileUpload(file, targetDir);
                              if (url) updateCurrentTrack('canvasVideoSrc', url);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Live Video Preview Box */}
                    {activeTrack.canvasVideoSrc && (
                      <div className="relative rounded-xl overflow-hidden aspect-video max-h-40 bg-black/60 border border-white/15 mt-2">
                        <video
                          key={activeTrack.canvasVideoSrc}
                          src={activeTrack.canvasVideoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                          <Film className="w-3 h-3" />
                          <span>Anteprima Canvas Attivo</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCurrentTrack('canvasVideoSrc', '')}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 hover:bg-red-600/80 text-[10px] font-mono text-white/80 hover:text-white transition-all border border-white/20"
                          title="Rimuovi video specifico per tornare al video di default dell'album"
                        >
                          Rimuovi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Artwork Traccia */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-white">Artwork Traccia (JPG / PNG)</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">
                        {activeTrack.artworkUrl || 'Usa copertina album'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeTrack.artworkUrl || ''}
                        onChange={(e) => updateCurrentTrack('artworkUrl', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/80 outline-none"
                        placeholder="/images/artwork/track-1.jpeg"
                      />

                      <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carica Immagine</span>
                        <input
                          type="file"
                          accept="image/*,.jpeg,.jpg,.png,.webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const targetDir = currentAlbum.id.includes('fette') ? 'images/artwork-fette' : 'images/artwork';
                              const url = await handleFileUpload(file, targetDir as any);
                              if (url) updateCurrentTrack('artworkUrl', url);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 4. Colori di Sfondo Dinamici */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-black/30 border border-white/10">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-amber-400" />
                        <span>Colore Tema Scuro</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTrack.colorDark || '#781c1c'}
                          onChange={(e) => updateCurrentTrack('colorDark', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={activeTrack.colorDark}
                          onChange={(e) => updateCurrentTrack('colorDark', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-indigo-400" />
                        <span>Colore Tema Chiaro</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTrack.colorLight || '#fff5f5'}
                          onChange={(e) => updateCurrentTrack('colorLight', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={activeTrack.colorLight}
                          onChange={(e) => updateCurrentTrack('colorLight', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: TESTI & LYRICS
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'lyrics' && currentAlbum && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Track list */}
            <div className="lg:col-span-4 space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50 font-bold block mb-2 px-1">
                Seleziona Traccia
              </span>
              {currentAlbum.tracks.map((track, idx) => (
                <button
                  key={track.id || idx}
                  onClick={() => setSelectedTrackIndex(idx)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    idx === selectedTrackIndex
                      ? 'bg-amber-400/10 border-amber-400/50 text-white font-bold'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-xs opacity-50 w-5">
                      {String(track.number).padStart(2, '0')}
                    </span>
                    <span className="truncate text-xs font-mono">{track.title}</span>
                  </div>
                  {track.lyrics ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                      Testo OK
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/40 shrink-0">
                      Vuoto
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right: Lyrics Editor */}
            {activeTrack && (
              <div className="lg:col-span-8 bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      Editor Testo Canzone
                    </span>
                    <h3 className="text-lg font-bold font-mono text-white">
                      {activeTrack.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-white/40">
                      {activeTrack.lyrics ? `${activeTrack.lyrics.split('\n').length} versi` : 'Nessun verso'}
                    </span>
                  </div>
                </div>

                {/* Suno 1-Click Importer Bar */}
                <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/25 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-white">Importa da Suno:</span>
                  </div>
                  <input
                    type="text"
                    value={sunoImportUrl}
                    onChange={(e) => setSunoImportUrl(e.target.value)}
                    placeholder="Incolla link brano Suno (es. https://suno.com/song/xxxxxxxx-xxxx...)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-purple-400 outline-none w-full"
                  />
                  <button
                    type="button"
                    disabled={isImportingSuno || !sunoImportUrl.trim()}
                    onClick={handleImportFromSuno}
                    className="px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isImportingSuno ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Estrazione...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Scarica Testo</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={16}
                    value={activeTrack.lyrics || ''}
                    onChange={(e) => updateCurrentTrack('lyrics', e.target.value)}
                    placeholder={`Incolla o scrivi qui il testo completo di "${activeTrack.title}"...\n\nEsempio:\nUna sedia tirata vicino al termosifone,\nqui non serve spiegare nulla, basta restare.\nI confini tra sogno e veglia si sciolgono...`}
                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white font-mono text-sm leading-relaxed focus:border-amber-400 outline-none resize-y"
                  />
                  <span className="text-[10px] font-mono text-white/40 block">
                    Il testo verrà visualizzato nel player con formattazione a strofe.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: ALBUM & DATI
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'albums' && currentAlbum && (
          <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Metadati Album
                </span>
                <h2 className="text-2xl font-bold font-mono text-white mt-1">
                  {currentAlbum.title}
                </h2>
              </div>

              <img src={currentAlbum.coverUrl} className="w-14 h-14 rounded-xl shadow-lg border border-white/20 object-cover" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Titolo Album</label>
                <input
                  type="text"
                  value={currentAlbum.title}
                  onChange={(e) => updateCurrentAlbum('title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Artista</label>
                <input
                  type="text"
                  value={currentAlbum.artist}
                  onChange={(e) => updateCurrentAlbum('artist', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Anno</label>
                <input
                  type="text"
                  value={currentAlbum.year}
                  onChange={(e) => updateCurrentAlbum('year', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Genere</label>
                <input
                  type="text"
                  value={currentAlbum.genre}
                  onChange={(e) => updateCurrentAlbum('genre', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Copertina Album (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentAlbum.coverUrl}
                    onChange={(e) => updateCurrentAlbum('coverUrl', e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica Nuova Copertina</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'images');
                          if (url) updateCurrentAlbum('coverUrl', url);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Video Canvas Album (Loop Continuo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentAlbum.canvasVideoSrc || ''}
                    onChange={(e) => updateCurrentAlbum('canvasVideoSrc', e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
                    placeholder="/video/mars-full-canvas.mp4"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica Video Canvas</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const targetDir = currentAlbum.id.includes('fette') ? 'video-fette' : 'video';
                          const url = await handleFileUpload(file, targetDir);
                          if (url) updateCurrentAlbum('canvasVideoSrc', url);
                        }
                      }}
                    />
                  </label>
                </div>
                {currentAlbum.canvasVideoSrc && (
                  <div className="relative rounded-xl overflow-hidden aspect-video max-h-44 bg-black/60 border border-white/15 mt-2">
                    <video
                      key={currentAlbum.canvasVideoSrc}
                      src={currentAlbum.canvasVideoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <Film className="w-3 h-3" />
                      <span>Anteprima Canvas Album</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Tagline / Motto</label>
                <input
                  type="text"
                  value={currentAlbum.tagline}
                  onChange={(e) => updateCurrentAlbum('tagline', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Sinossi / Presentazione</label>
                <textarea
                  rows={3}
                  value={currentAlbum.synopsis}
                  onChange={(e) => updateCurrentAlbum('synopsis', e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none resize-none"
                />
              </div>
            </div>

            {/* Sezione Backup & Esportazione */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <span>Backup & Sincronizzazione Dati (JSON)</span>
                </h3>
                <p className="text-xs font-mono text-white/50 mt-1">
                  Salva le modifiche nel browser, esporta il file per il codice sorgente o ripristina la discografia predefinita.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => saveAlbumsToDisk()}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Modifiche</span>
                </button>

                <button
                  type="button"
                  onClick={downloadAlbumsJson}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Scarica albums.json</span>
                </button>

                <button
                  type="button"
                  onClick={copyAlbumsJson}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-xs font-bold transition-all"
                >
                  {hasCopiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                  <span>{hasCopiedJson ? 'Copiato!' : 'Copia JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetToDefault}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-xs font-bold transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ripristina Default</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: LIBRERIA FILE (FILE MANAGER)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMediaFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    mediaFilter === 'all' ? 'bg-amber-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  Tutti ({mediaFiles.length})
                </button>
                <button
                  onClick={() => setMediaFilter('audio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    mediaFilter === 'audio' ? 'bg-amber-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  Audio ({mediaFiles.filter((f) => f.type === 'audio').length})
                </button>
                <button
                  onClick={() => setMediaFilter('video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    mediaFilter === 'video' ? 'bg-amber-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  Video ({mediaFiles.filter((f) => f.type === 'video').length})
                </button>
                <button
                  onClick={() => setMediaFilter('image')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    mediaFilter === 'image' ? 'bg-amber-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  Immagini ({mediaFiles.filter((f) => f.type === 'image').length})
                </button>
              </div>

              {/* Search & Direct Upload */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Cerca file..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none w-48"
                  />
                </div>

                <label className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carica Nuovo File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        let folder: 'audio' | 'video' | 'images' | 'uploads' = 'uploads';
                        if (file.type.startsWith('audio/')) folder = 'audio';
                        else if (file.type.startsWith('video/')) folder = 'video';
                        else if (file.type.startsWith('image/')) folder = 'images';
                        await handleFileUpload(file, folder);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredMedia.map((file) => (
                <div
                  key={file.url}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type === 'audio' ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                      ) : file.type === 'video' ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] font-mono text-white/40">
                          {file.folder} • {formatBytes(file.size)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview snippet */}
                  {file.type === 'image' && (
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                      <img src={file.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {file.type === 'video' && (
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                      <video src={file.url} muted playsInline className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/30 truncate max-w-[140px]">
                      {file.url}
                    </span>

                    <div className="flex items-center gap-1">
                      {file.type === 'audio' && (
                        <button
                          onClick={() => toggleAudioPreview(file.url)}
                          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                          title="Ascolta"
                        >
                          {previewAudioSrc === file.url && isPreviewPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(file.url);
                          showNotification(`URL copiato: ${file.url}`, 'info');
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                        title="Copia percorso"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                        title="Apri file"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-white/10 font-mono text-xs text-white/40">
        Studio Backoffice • Alessandro Rocchi • weagency altamente.it
      </footer>
    </div>
  );
};
