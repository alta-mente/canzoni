import React, { useState, useEffect, useRef } from 'react';
import { AlbumData, Track, DISCOGRAPHY } from '../data/albumData';
import albumsAllJson from '../data/albums.all.json';
import {
  AnalyticsSnapshot,
  fetchMergedAnalytics,
  loadLocalAnalytics,
  getGaMeasurementId,
  setGaMeasurementId,
} from '../utils/analytics';

const STORAGE_KEY = 'antigravity_discography_v6';
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
  FileJson,
  Code,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

interface BackofficeViewProps {
  onBackToPlayer: () => void;
  onLogout?: () => void;
  albums?: AlbumData[];
  onAlbumsUpdated?: (albums: AlbumData[]) => void;
  onOpenWidgetGenerator?: () => void;
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
  onAlbumsUpdated,
  onOpenWidgetGenerator
}) => {
  const [albums, setAlbums] = useState<AlbumData[]>(() => {
    if (initialAlbums && initialAlbums.length > 0) return initialAlbums;
    try {
      localStorage.removeItem('antigravity_discography_custom'); // Clear legacy cache
      localStorage.removeItem('antigravity_discography_v2');
      localStorage.removeItem('antigravity_discography_v3');
      const saved = localStorage.getItem(STORAGE_KEY);
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
  const [activeTab, setActiveTab] = useState<'albums' | 'tracks' | 'lyrics' | 'media' | 'stats'>('tracks');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [mediaSearch, setMediaSearch] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot>(() => loadLocalAnalytics());
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [gaInputId, setGaInputId] = useState<string>(() => getGaMeasurementId());
  
  // Status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Suno lyrics import state
  const [sunoImportUrl, setSunoImportUrl] = useState<string>('');
  const [isImportingSuno, setIsImportingSuno] = useState<boolean>(false);

  // Suno Albums & Playlists discovery / import state
  const [sunoProfileAlbums, setSunoProfileAlbums] = useState<
    Array<{
      id: string;
      name: string;
      imageUrl: string;
      songCount: number;
      albumType?: string;
      url: string;
      type: 'album' | 'playlist';
    }>
  >([]);
  const [sunoProfilePlaylists, setSunoProfilePlaylists] = useState<
    Array<{
      id: string;
      name: string;
      imageUrl: string;
      songCount: number;
      url: string;
      type: 'album' | 'playlist';
    }>
  >([]);
  const [isLoadingSunoProfile, setIsLoadingSunoProfile] = useState<boolean>(false);
  const [sunoAlbumImportUrl, setSunoAlbumImportUrl] = useState<string>('');
  const [isImportingSunoAlbum, setIsImportingSunoAlbum] = useState<boolean>(false);

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

  const refreshAnalytics = async (currentAlbums = albums) => {
    setIsLoadingAnalytics(true);
    try {
      const merged = await fetchMergedAnalytics(currentAlbums);
      setAnalyticsData(merged);
    } catch (e) {
      console.warn('Analytics refresh error:', e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch albums, media & Suno profile on mount
  useEffect(() => {
    fetchAlbums();
    fetchMediaFiles();
    fetchSunoProfile();
    refreshAnalytics(albums);
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const fetchSunoProfile = async () => {
    setIsLoadingSunoProfile(true);
    try {
      const res = await fetch('/api/suno-profile');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setSunoProfileAlbums(data.albums || []);
          setSunoProfilePlaylists(data.playlists || []);
          return;
        }
      }
      // Fallback: direct Suno unified feed call if running without Vite backend
      const targetUserId = 'f1f44a03-db07-49da-8099-36a0e72b34dd';
      const [albRes, plRes] = await Promise.all([
        fetch('https://studio-api.prod.suno.com/api/unified/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feed_id: 'user_albums', target_user_id: targetUserId, page_size: 25 })
        }).then((r) => r.json()),
        fetch('https://studio-api.prod.suno.com/api/unified/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feed_id: 'user_playlists', target_user_id: targetUserId, page_size: 25 })
        }).then((r) => r.json())
      ]);
      const parsedAlbums = (albRes?.feed?.items || [])
        .map((it: any) => it.content_item)
        .filter(Boolean)
        .map((alb: any) => ({
          id: alb.id,
          name: alb.name,
          imageUrl: alb.image_url,
          songCount: alb.song_count || 0,
          albumType: alb.album_type || 'lp',
          url: `https://suno.com/album/${alb.id}`,
          type: 'album' as const
        }));
      const parsedPlaylists = (plRes?.feed?.items || [])
        .map((it: any) => it.content_item)
        .filter(Boolean)
        .map((pl: any) => ({
          id: pl.playlist_id || pl.id,
          name: (pl.playlist_name || pl.name || '').trim(),
          imageUrl: pl.playlist_image_url || pl.image_url,
          songCount: pl.playlist_song_count || pl.song_count || 0,
          url: `https://suno.com/playlist/${pl.playlist_id || pl.id}`,
          type: 'playlist' as const
        }));
      setSunoProfileAlbums(parsedAlbums);
      setSunoProfilePlaylists(parsedPlaylists);
    } catch (err) {
      console.warn('Could not fetch Suno profile albums:', err);
    } finally {
      setIsLoadingSunoProfile(false);
    }
  };

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/albums');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const hasLocalCustom = !!localStorage.getItem(STORAGE_KEY);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(albumsToSave, null, 2));
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
      localStorage.removeItem(STORAGE_KEY);
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

  // Import or synchronize an entire Suno Album or Playlist
  const handleImportSunoAlbum = async (customUrlOrId?: string, feedType?: 'album' | 'playlist') => {
    const targetInput = (customUrlOrId || sunoAlbumImportUrl).trim();
    if (!targetInput) return;
    setIsImportingSunoAlbum(true);
    try {
      let data: any = null;
      try {
        const res = await fetch('/api/import-suno-album', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlOrId: targetInput, feedType })
        });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          data = await res.json();
        }
      } catch {
        // Fallback to direct Suno API below
      }

      if (!data || !data.success) {
        const m = targetInput.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (!m) {
          showNotification('Nessun ID o link Album/Playlist Suno valido trovato', 'error');
          return;
        }
        const collectionId = m[1];
        const isPl = feedType === 'playlist' || targetInput.includes('/playlist/');
        const candidates = isPl
          ? [`generic_playlist:${collectionId}`, `album:${collectionId}`]
          : [`album:${collectionId}`, `generic_playlist:${collectionId}`];

        for (const fid of candidates) {
          const r = await fetch('https://studio-api.prod.suno.com/api/unified/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feed_id: fid, page_size: 50 })
          }).then((x) => x.json());
          if (r?.feed && Array.isArray(r.feed.items)) {
            const feed = r.feed;
            const resolvedType = fid.startsWith('album:') ? 'album' : 'playlist';
            const tracks = (feed.items || [])
              .map((it: any) => it.content_item)
              .filter(Boolean)
              .map((clip: any, idx: number) => {
                const durSec = Math.round(clip.metadata?.duration || 0);
                const mins = Math.floor(durSec / 60);
                const secs = String(durSec % 60).padStart(2, '0');
                return {
                  sunoId: clip.id,
                  sunoUrl: `https://suno.com/song/${clip.id}`,
                  number: idx + 1,
                  title: (clip.title || `Traccia ${idx + 1}`).trim(),
                  duration: `${mins}:${secs}`,
                  durationSeconds: durSec,
                  audioUrl:
                    clip.media_urls?.[0]?.url ||
                    `https://d2lwuy8qc234o3.cloudfront.net/1/clip/${clip.id}.m4a`,
                  videoUrl: clip.video_url || clip.video_cover_url || '',
                  artworkUrl: clip.image_large_url || clip.image_url || feed.feed_image_url || '',
                  lyrics: (clip.metadata?.prompt || '').trim(),
                  tags: clip.display_tags || clip.metadata?.tags || ''
                };
              });
            data = {
              success: true,
              collectionId,
              collectionType: resolvedType,
              title: (feed.feed_title || 'Nuovo Album Suno').replace(/\s*\(album\)\s*/i, '').trim(),
              coverUrl: feed.feed_image_url || tracks[0]?.artworkUrl || '',
              sunoUrl: `https://suno.com/${resolvedType}/${collectionId}`,
              tracks
            };
            break;
          }
        }
      }

      if (!data || !data.success || !Array.isArray(data.tracks)) {
        showNotification(data?.error || 'Impossibile leggere questo Album/Playlist da Suno', 'error');
        return;
      }

      const norm = (s: string) =>
        (s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');

      const importedTitleNorm = norm(data.title);
      const allReferenceAlbums: AlbumData[] = [
        ...albums,
        ...((albumsAllJson || []) as AlbumData[])
      ];

      // Find matching reference album (if any) to preserve curated local metadata/assets
      const matchedRefAlbum = allReferenceAlbums.find(
        (a) =>
          a.sunoAlbumId === data.collectionId ||
          norm(a.title) === importedTitleNorm ||
          (importedTitleNorm.includes('marte') && a.id.includes('marte')) ||
          ((importedTitleNorm.includes('salto') || importedTitleNorm.includes('fette')) &&
            a.id.includes('fette'))
      );

      // Pool of all known reference tracks for smart matching
      const refTracksPool: Track[] = allReferenceAlbums.flatMap((a) => a.tracks || []);

      const darkPalette = ['#2c1520', '#0c2340', '#862e9c', '#d9480f', '#1e3a8a', '#093e19', '#701a75', '#9c174d'];
      const lightPalette = ['#f8f9fa', '#e6f0fa', '#faf5ff', '#fff9db', '#eff6ff', '#ecfdf5', '#fdf4ff', '#fff0f6'];

      const mergedTracks: Track[] = data.tracks.map((st: any, idx: number) => {
        const existingTrack =
          (matchedRefAlbum?.tracks || []).find(
            (t) => t.sunoId === st.sunoId || norm(t.title) === norm(st.title)
          ) ||
          refTracksPool.find((t) => t.sunoId === st.sunoId || norm(t.title) === norm(st.title));

        return {
          id: existingTrack?.id || `suno-track-${st.sunoId.slice(0, 8)}`,
          number: idx + 1,
          title: existingTrack?.title || st.title,
          spotifyId: existingTrack?.spotifyId || '',
          spotifyUri: existingTrack?.spotifyUri || '',
          spotifyUrl: existingTrack?.spotifyUrl || '',
          sunoId: st.sunoId,
          sunoUrl: st.sunoUrl,
          duration: existingTrack?.duration || st.duration,
          durationSeconds: existingTrack?.durationSeconds || st.durationSeconds,
          audioSrc: existingTrack?.audioSrc || st.audioUrl,
          canvasVideoSrc: existingTrack?.canvasVideoSrc || st.videoUrl || undefined,
          artworkUrl: existingTrack?.artworkUrl || st.artworkUrl || data.coverUrl,
          mood: existingTrack?.mood || (st.tags ? st.tags.split(',').slice(0, 3).join(' • ') : 'Canzone d\'Autore • Suno LP'),
          storyQuote:
            existingTrack?.storyQuote ||
            (st.lyrics
              ? `«${st.lyrics
                  .split('\n')
                  .map((l: string) => l.trim())
                  .find((l: string) => l.length > 20 && !l.startsWith('[')) || st.title}»`
              : `«${st.title}»`),
          colorDark: existingTrack?.colorDark || darkPalette[idx % darkPalette.length],
          colorLight: existingTrack?.colorLight || lightPalette[idx % lightPalette.length],
          highlight: existingTrack?.highlight ?? idx === 0,
          lyrics: existingTrack?.lyrics || st.lyrics || ''
        };
      });

      const albumSlug =
        matchedRefAlbum?.id ||
        data.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        `suno-album-${data.collectionId.slice(0, 8)}`;

      const builtAlbum: AlbumData = {
        id: albumSlug,
        title: matchedRefAlbum?.title || data.title.toUpperCase(),
        artist: matchedRefAlbum?.artist || 'ALESSANDRO ROCCHI',
        year: matchedRefAlbum?.year || new Date().getFullYear().toString(),
        releaseDate: matchedRefAlbum?.releaseDate || 'Ottobre 2026',
        genre: matchedRefAlbum?.genre || 'Canzone d\'Autore / Indie',
        spotifyAlbumId: matchedRefAlbum?.spotifyAlbumId,
        spotifyAlbumUri: matchedRefAlbum?.spotifyAlbumUri,
        spotifyAlbumUrl: matchedRefAlbum?.spotifyAlbumUrl,
        spotifyArtistUrl: matchedRefAlbum?.spotifyArtistUrl,
        sunoAlbumId: data.collectionId,
        sunoAlbumUrl: data.sunoUrl,
        coverUrl: matchedRefAlbum?.coverUrl || data.coverUrl,
        canvasVideoSrc: matchedRefAlbum?.canvasVideoSrc || mergedTracks[0]?.canvasVideoSrc,
        tagline:
          matchedRefAlbum?.tagline ||
          `Album pubblicato su Suno (@arocchi) • ${mergedTracks.length} tracce inedite.`,
        synopsis:
          matchedRefAlbum?.synopsis ||
          `«${data.title}» è un'opera musicale di Alessandro Rocchi importata e sincronizzata direttamente da Suno (${mergedTracks.length} brani).`,
        tracks: mergedTracks,
        credits: matchedRefAlbum?.credits || {
          lyricsAndMusic: 'Alessandro Rocchi',
          production: 'Alessandro Rocchi',
          mixAndMaster: 'Suno Studio & Mastering d\'Autore',
          artwork: 'Suno / Alessandro Rocchi 2026',
          label: 'Indipendente'
        }
      };

      const existsInActive = albums.some((a) => a.id === builtAlbum.id || a.sunoAlbumId === data.collectionId);
      const nextAlbums = existsInActive
        ? albums.map((a) => (a.id === builtAlbum.id || a.sunoAlbumId === data.collectionId ? builtAlbum : a))
        : [...albums, builtAlbum];

      setAlbums(nextAlbums);
      setSelectedAlbumId(builtAlbum.id);
      setSelectedTrackIndex(0);
      setSunoAlbumImportUrl('');
      showNotification(
        `${existsInActive ? 'Sincronizzato' : 'Importato'} album Suno «${builtAlbum.title}» (${mergedTracks.length} brani)! Clicca "Salva" per confermare.`,
        'success'
      );
    } catch (err: any) {
      showNotification(`Errore importazione album Suno: ${err.message}`, 'error');
    } finally {
      setIsImportingSunoAlbum(false);
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

  // Check which backup albums (e.g. Quel Salto Nel Vuoto) can be restored
  const backupAlbumsAvailable = ((albumsAllJson || []) as AlbumData[]).filter(
    (bAlb) => !albums.some((a) => a.id === bAlb.id)
  );

  // 1. Add new empty album
  const handleAddEmptyAlbum = () => {
    const num = albums.length + 1;
    const newId = `album-${Date.now()}`;
    const newAlbum: AlbumData = {
      id: newId,
      title: `NUOVO ALBUM ${num}`,
      artist: 'ALESSANDRO ROCCHI',
      year: new Date().getFullYear().toString(),
      releaseDate: '2026',
      genre: 'Canzone d\'Autore / Indie Rock',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      tagline: 'Nuovo progetto musicale.',
      synopsis: 'Descrizione del nuovo album...',
      tracks: [
        {
          id: `${newId}-track-1`,
          number: 1,
          title: 'Traccia 1',
          spotifyId: '',
          spotifyUri: '',
          spotifyUrl: '',
          duration: '3:30',
          durationSeconds: 210,
          audioSrc: '',
          artworkUrl: '',
          mood: 'Intro • Atmosferico',
          storyQuote: '',
          colorDark: '#1a1b26',
          colorLight: '#f8f9fa',
          lyrics: ''
        }
      ],
      credits: {
        lyricsAndMusic: 'Alessandro Rocchi',
        production: 'Alessandro Rocchi',
        mixAndMaster: '',
        artwork: '',
        label: 'Indipendente'
      }
    };
    const nextAlbums = [...albums, newAlbum];
    setAlbums(nextAlbums);
    setSelectedAlbumId(newId);
    setSelectedTrackIndex(0);
    setActiveTab('albums');
    showNotification(`Nuovo album "${newAlbum.title}" creato! Compila i dettagli e clicca "Salva".`, 'success');
  };

  // 2. Restore backup album (e.g. Quel Salto Nel Vuoto)
  const handleRestoreBackupAlbum = (backupAlbum: AlbumData) => {
    if (albums.some((a) => a.id === backupAlbum.id)) {
      showNotification(`L'album "${backupAlbum.title}" è già presente nella discografia.`, 'info');
      setSelectedAlbumId(backupAlbum.id);
      return;
    }
    const nextAlbums = [...albums, backupAlbum];
    setAlbums(nextAlbums);
    setSelectedAlbumId(backupAlbum.id);
    setSelectedTrackIndex(0);
    showNotification(
      `Album "${backupAlbum.title}" (${backupAlbum.tracks.length} brani) ripristinato! Clicca "Salva" per confermare.`,
      'success'
    );
  };

  // 3. Delete an album
  const handleDeleteAlbum = (albumId: string) => {
    if (albums.length <= 1) {
      showNotification('Non puoi eliminare l\'unico album presente. Aggiungine un altro prima di rimuovere questo.', 'error');
      return;
    }
    const targetAlbum = albums.find((a) => a.id === albumId);
    const confirmed = window.confirm(
      `Sei sicuro di voler rimuovere l'album "${targetAlbum?.title || albumId}" dalla discografia attiva? (I file e backup rimangono intatti)`
    );
    if (!confirmed) return;

    const nextAlbums = albums.filter((a) => a.id !== albumId);
    setAlbums(nextAlbums);
    setSelectedAlbumId(nextAlbums[0].id);
    setSelectedTrackIndex(0);
    showNotification(`Album rimosso. Ricordati di cliccare su "Salva" per confermare!`, 'success');
  };

  // 4. Add a track to current album
  const handleAddTrack = () => {
    if (!currentAlbum) return;
    const newNum = currentAlbum.tracks.length + 1;
    const newTrack: Track = {
      id: `${currentAlbum.id}-track-${Date.now()}`,
      number: newNum,
      title: `Nuovo Brano ${newNum}`,
      spotifyId: '',
      spotifyUri: '',
      spotifyUrl: '',
      duration: '3:30',
      durationSeconds: 210,
      audioSrc: '',
      artworkUrl: currentAlbum.coverUrl,
      mood: 'Atmosferico',
      storyQuote: '',
      colorDark: '#1a1b26',
      colorLight: '#f8f9fa',
      lyrics: ''
    };
    const updatedTracks = [...currentAlbum.tracks, newTrack];
    updateCurrentAlbum('tracks', updatedTracks);
    setSelectedTrackIndex(updatedTracks.length - 1);
    showNotification(`Traccia ${newNum} aggiunta all'album!`, 'info');
  };

  // 5. Delete a track from current album
  const handleDeleteTrack = (indexToDelete: number) => {
    if (!currentAlbum) return;
    if (currentAlbum.tracks.length <= 1) {
      showNotification('L\'album deve avere almeno un brano.', 'error');
      return;
    }
    const track = currentAlbum.tracks[indexToDelete];
    if (!window.confirm(`Sei sicuro di voler eliminare il brano "${track.title}"?`)) return;
    const updatedTracks = currentAlbum.tracks
      .filter((_, idx) => idx !== indexToDelete)
      .map((t, idx) => ({ ...t, number: idx + 1 }));
    updateCurrentAlbum('tracks', updatedTracks);
    setSelectedTrackIndex(Math.max(0, indexToDelete - 1));
    showNotification(`Brano "${track.title}" rimosso. Clicca "Salva" per applicare.`, 'info');
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
    <div className="w-full min-h-screen bg-[#0d0e14] text-gray-100 flex flex-col font-sans overflow-x-hidden overflow-y-auto">
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

          <button
            onClick={() => {
              setActiveTab('stats');
              refreshAnalytics(albums);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-emerald-400 text-black shadow'
                : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-500/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistiche & Play</span>
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

          {/* Generatore Widget Embed */}
          {onOpenWidgetGenerator && (
            <button
              onClick={onOpenWidgetGenerator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono text-xs font-bold transition-all shadow-sm"
              title="Genera il widget per siti esterni (flottante o incorporato)"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Genera Widget</span>
            </button>
          )}

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
        
        {/* ALBUM SELECTOR BAR (Present on tracks, lyrics, and albums tabs) */}
        {(activeTab === 'tracks' || activeTab === 'lyrics' || activeTab === 'albums') && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">Album attivo:</span>
              <div className="flex flex-wrap items-center gap-2">
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

                {/* + Nuovo Album */}
                <button
                  onClick={handleAddEmptyAlbum}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
                  title="Aggiungi un nuovo album alla discografia"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo Album</span>
                </button>

                {/* Ripristina Album da Backup se disponibile */}
                {backupAlbumsAvailable.map((bAlb) => (
                  <button
                    key={bAlb.id}
                    onClick={() => handleRestoreBackupAlbum(bAlb)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all shadow-sm"
                    title={`Ripristina ${bAlb.title} con tutti i suoi brani`}
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Ripristina «{bAlb.title}»</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-white/50">
                {currentAlbum?.tracks.length || 0} Tracce • Anno {currentAlbum?.year}
              </div>

              {albums.length > 1 && currentAlbum && (
                <button
                  onClick={() => handleDeleteAlbum(currentAlbum.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                  title={`Rimuovi l'album "${currentAlbum.title}" dalla discografia`}
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Rimuovi Album</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: TRACCE & CANZONI
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'tracks' && currentAlbum && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Track List */}
            <div className="lg:col-span-5 space-y-2 lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs font-mono uppercase tracking-widest text-white/50 font-bold">
                  Elenco Brani
                </span>
                <span className="text-xs font-mono text-white/40">
                  {currentAlbum.tracks.length} canzoni
                </span>
              </div>

              <div className="space-y-1.5 lg:max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
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

              {/* + Aggiungi Nuovo Brano */}
              <button
                type="button"
                onClick={handleAddTrack}
                className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-white/20 hover:border-amber-400/50 bg-white/[0.02] hover:bg-amber-400/10 text-white/70 hover:text-amber-300 font-mono text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Nuovo Brano ({currentAlbum.tracks.length + 1})</span>
              </button>
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

                    <button
                      onClick={() => {
                        const code = `<!-- Alessandro Rocchi - Player Flottante per "${activeTrack.title}" -->\n<div style="position:fixed;bottom:20px;right:20px;z-index:999999;filter:drop-shadow(0 15px 35px rgba(0,0,0,0.5));">\n  <iframe src="https://alta-mente.github.io/canzoni/#widget?album=${currentAlbum.id}&track=${activeTrack.number}&style=floating&theme=dark" width="340" height="165" frameborder="0" allow="autoplay; encrypted-media" style="border:none;border-radius:24px;overflow:hidden;background:transparent;"></iframe>\n</div>`;
                        navigator.clipboard.writeText(code);
                        showNotification(`Codice widget flottante per "${activeTrack.title}" copiato!`, 'success');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/80 hover:text-white transition-all"
                      title="Copia codice HTML del widget flottante per questo brano"
                    >
                      <Code className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Copia Widget</span>
                    </button>

                    {currentAlbum.tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(selectedTrackIndex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-mono text-white/60 hover:text-rose-300 transition-all"
                        title={`Elimina traccia "${activeTrack.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Elimina</span>
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
            <div className="lg:col-span-4 space-y-1.5 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
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
            {/* Header & Album Management Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={currentAlbum.coverUrl} className="w-14 h-14 rounded-xl shadow-lg border border-white/20 object-cover" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Scheda Album ({albums.findIndex(a => a.id === currentAlbum.id) + 1} di {albums.length})
                  </span>
                  <h2 className="text-2xl font-bold font-mono text-white mt-0.5">
                    {currentAlbum.title}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddEmptyAlbum}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold transition-all shadow-sm"
                  title="Crea un nuovo album"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aggiungi Album</span>
                </button>

                {backupAlbumsAvailable.map((bAlb) => (
                  <button
                    key={bAlb.id}
                    type="button"
                    onClick={() => handleRestoreBackupAlbum(bAlb)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 font-mono text-xs font-bold transition-all shadow-sm"
                    title={`Ripristina l'album ${bAlb.title} con tutte le sue tracce`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ripristina «{bAlb.title}»</span>
                  </button>
                ))}

                {albums.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAlbum(currentAlbum.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-xs font-bold transition-all shadow-sm"
                    title="Elimina questo album dalla discografia"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Elimina Questo Album</span>
                  </button>
                )}
              </div>
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

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono text-white/60 uppercase">Link Ufficiale Album / Playlist Suno</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={currentAlbum.sunoAlbumUrl || ''}
                    onChange={(e) => updateCurrentAlbum('sunoAlbumUrl', e.target.value)}
                    placeholder="https://suno.com/album/e941c273-3558-4fa6-8768-d37a6a123f84"
                    className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-purple-400 outline-none"
                  />
                  {currentAlbum.sunoAlbumUrl && (
                    <>
                      <button
                        type="button"
                        disabled={isImportingSunoAlbum}
                        onClick={() => handleImportSunoAlbum(currentAlbum.sunoAlbumUrl)}
                        className="px-3.5 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                        title="Sincronizza tracce, testi e metadati da questo Album/Playlist Suno"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isImportingSunoAlbum ? 'animate-spin' : ''}`} />
                        <span>Sincronizza da Suno</span>
                      </button>
                      <a
                        href={currentAlbum.sunoAlbumUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                        <span>Apri su Suno</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                SEZIONE SUNO CLOUD (@arocchi) — ALBUM & PLAYLIST LIVE
                ───────────────────────────────────────────────────────────── */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>I Tuoi Album & Playlist su Suno (@arocchi)</span>
                  </h3>
                  <p className="text-xs font-mono text-white/50 mt-1">
                    Rilevati in tempo reale dal tuo profilo Suno. Importa un nuovo album o sincronizza brani e testi con 1 click.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchSunoProfile}
                    disabled={isLoadingSunoProfile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/80 hover:text-white transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isLoadingSunoProfile ? 'animate-spin' : ''}`} />
                    <span>Aggiorna da Suno</span>
                  </button>
                  <a
                    href="https://suno.com/@arocchi"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-mono text-purple-200 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>@arocchi</span>
                  </a>
                </div>
              </div>

              {/* Manual URL Import Bar */}
              <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/25 flex flex-col sm:flex-row items-center gap-2">
                <span className="text-xs font-mono text-purple-300 font-bold shrink-0 px-1">
                  Importa da Link:
                </span>
                <input
                  type="text"
                  value={sunoAlbumImportUrl}
                  onChange={(e) => setSunoAlbumImportUrl(e.target.value)}
                  placeholder="Incolla link Album o Playlist Suno (es. https://suno.com/album/e941c273-...)"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-purple-400 outline-none w-full"
                />
                <button
                  type="button"
                  disabled={isImportingSunoAlbum || !sunoAlbumImportUrl.trim()}
                  onClick={() => handleImportSunoAlbum()}
                  className="px-4 py-1.5 rounded-xl font-mono text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {isImportingSunoAlbum ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importazione...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Importa / Sincronizza Album</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cards Grid of Live Suno Albums & Playlists */}
              {(sunoProfileAlbums.length > 0 || sunoProfilePlaylists.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...sunoProfileAlbums, ...sunoProfilePlaylists].map((item) => {
                    const isAlreadyLinked = albums.some(
                      (a) =>
                        a.sunoAlbumId === item.id ||
                        (item.name.toLowerCase().includes('marte') && a.id.includes('marte')) ||
                        ((item.name.toLowerCase().includes('salto') || item.name.toLowerCase().includes('fette')) &&
                          a.id.includes('fette'))
                    );
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-purple-500/40 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                  item.type === 'album'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {item.type === 'album' ? 'ALBUM LP' : 'PLAYLIST'}
                              </span>
                              {isAlreadyLinked && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                  Attivo
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono font-bold text-white truncate mt-1" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono text-white/40">
                              {item.songCount} brani • ID: {item.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isImportingSunoAlbum}
                            onClick={() => handleImportSunoAlbum(item.url, item.type)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/30 text-purple-200 font-mono text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                            title={
                              isAlreadyLinked
                                ? 'Sincronizza brani e testi con Suno'
                                : 'Importa questo album/playlist nella discografia'
                            }
                          >
                            <RefreshCw className={`w-3 h-3 ${isImportingSunoAlbum ? 'animate-spin' : ''}`} />
                            <span>{isAlreadyLinked ? 'Sincronizza' : 'Importa'}</span>
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            title="Apri su Suno"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

        {/* ═════════════════════════════════════════════════════════════
            TAB 5: STATISTICHE & PLAY (Visite, Ascolti, GA4 Integration)
            ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Top Bar */}
            <div className="bg-[#151621] border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
                    Statistiche Visite & Ascolti Live
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Cloud Counter + Local Sync
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Monitoraggio in tempo reale di visite al player, play avviati, ascolti certificati (&gt;30 secondi), brani completati e aperture testi.
                </p>
              </div>

              <button
                onClick={() => refreshAnalytics(albums)}
                disabled={isLoadingAnalytics}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                <span>{isLoadingAnalytics ? 'Aggiornamento...' : 'Aggiorna Contatori Live'}</span>
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#151621] border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
                  Visite Sito
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                  {analyticsData.siteVisits}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 block">
                  Sessioni Player 3D
                </span>
              </div>

              <div className="bg-[#151621] border border-amber-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block">
                  Play Totali
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
                  {analyticsData.totalPlays}
                </div>
                <span className="text-[10px] font-mono text-white/50 block">
                  Riproduzioni avviate
                </span>
              </div>

              <div className="bg-[#151621] border border-emerald-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">
                  Stream &gt; 30s
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                  {analyticsData.totalStreams30s}
                </div>
                <span className="text-[10px] font-mono text-white/50 block">
                  Standard Spotify
                </span>
              </div>

              <div className="bg-[#151621] border border-indigo-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300/80 block">
                  Ascolti 100%
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-400">
                  {analyticsData.totalCompletes}
                </div>
                <span className="text-[10px] font-mono text-white/50 block">
                  Fino a fine brano
                </span>
              </div>

              <div className="bg-[#151621] border border-purple-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 block">
                  Aperture Testi
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-purple-400">
                  {analyticsData.lyricsOpens}
                </div>
                <span className="text-[10px] font-mono text-white/50 block">
                  Libretto Lyrics
                </span>
              </div>

              <div className="bg-[#151621] border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
                  Visite BIO / EPK
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                  {analyticsData.epkViews}
                </div>
                <span className="text-[10px] font-mono text-white/50 block">
                  Condivisioni: {analyticsData.shareOpens}
                </span>
              </div>
            </div>

            {/* Per-Album & Per-Track Breakdown */}
            <div className="space-y-6">
              {albums.map((alb) => {
                const albumPlays = alb.tracks.reduce(
                  (acc, t) => acc + (analyticsData.tracks[t.id]?.plays || 0),
                  0
                );
                const albumStreams30 = alb.tracks.reduce(
                  (acc, t) => acc + (analyticsData.tracks[t.id]?.streams30s || 0),
                  0
                );
                const albumCompletes = alb.tracks.reduce(
                  (acc, t) => acc + (analyticsData.tracks[t.id]?.completes || 0),
                  0
                );
                const maxTrackPlay = Math.max(
                  1,
                  ...alb.tracks.map((t) => analyticsData.tracks[t.id]?.plays || 0)
                );

                return (
                  <div
                    key={alb.id}
                    className="bg-[#151621] border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/20">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={alb.coverUrl}
                          alt={alb.title}
                          className="w-12 h-12 rounded-xl object-cover border border-white/15"
                        />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                            ALBUM • {alb.tracks.length} BRANI
                          </span>
                          <h3 className="text-base font-mono font-bold text-white uppercase">
                            {alb.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 uppercase block">Play Album</span>
                          <span className="text-base font-black text-amber-400">{albumPlays}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 uppercase block">&gt; 30s</span>
                          <span className="text-base font-black text-emerald-400">{albumStreams30}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 uppercase block">Completati</span>
                          <span className="text-base font-black text-indigo-400">{albumCompletes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {alb.tracks.map((track) => {
                        const st = analyticsData.tracks[track.id] || {
                          plays: 0,
                          streams30s: 0,
                          completes: 0,
                          lyricsOpens: 0,
                        };
                        const barWidth = st.plays > 0 ? Math.max(6, Math.round((st.plays / maxTrackPlay) * 100)) : 0;
                        return (
                          <div
                            key={track.id}
                            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-mono text-xs text-white/40 w-6 shrink-0">
                                #{String(track.number).padStart(2, '0')}
                              </span>
                              {track.artworkUrl && (
                                <img
                                  src={track.artworkUrl}
                                  alt={track.title}
                                  className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white truncate">
                                    {track.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-white/40">
                                    {track.duration}
                                  </span>
                                </div>
                                <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-5 font-mono text-xs shrink-0 self-end sm:self-center">
                              <div className="text-center min-w-[54px]">
                                <span className="text-[9px] text-white/40 uppercase block">Play</span>
                                <span className="font-bold text-amber-400">{st.plays}</span>
                              </div>
                              <div className="text-center min-w-[54px]">
                                <span className="text-[9px] text-white/40 uppercase block">&gt;30s</span>
                                <span className="font-bold text-emerald-400">{st.streams30s}</span>
                              </div>
                              <div className="text-center min-w-[54px]">
                                <span className="text-[9px] text-white/40 uppercase block">100%</span>
                                <span className="font-bold text-indigo-400">{st.completes}</span>
                              </div>
                              <div className="text-center min-w-[54px]">
                                <span className="text-[9px] text-white/40 uppercase block">Testo</span>
                                <span className="font-bold text-purple-300">{st.lyricsOpens || 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Grid: Google Analytics 4 Setup + Recent Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Google Analytics 4 Integration Box */}
              <div className="bg-[#151621] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                      Collegamento Google Analytics 4 (GA4)
                    </h3>
                  </div>
                  {analyticsData.gaMeasurementId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Attivo: {analyticsData.gaMeasurementId}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/60 leading-relaxed">
                  Inserisci qui il tuo ID di misurazione <strong>Google Analytics 4</strong> (formato <code>G-XXXXXXXXXX</code>) oppure invialo in chat per integrarlo direttamente nel codice sorgente. Tutti gli eventi (<code>song_play</code>, <code>song_stream_30s</code>, <code>song_complete</code>, <code>lyrics_open</code>, <code>epk_view</code>) vengono inoltrati automaticamente a GA4.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gaInputId}
                    onChange={(e) => setGaInputId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      setGaMeasurementId(gaInputId);
                      setAnalyticsData(loadLocalAnalytics());
                      showNotification(
                        gaInputId.trim()
                          ? `Google Analytics 4 (${gaInputId.trim().toUpperCase()}) attivato!`
                          : 'ID Google Analytics rimosso.',
                        'success'
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-bold transition-all"
                  >
                    Salva GA4
                  </button>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-[#151621] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                      Ultimi Eventi Registrati (Sessione Locale)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    Ultimi {analyticsData.recentEvents?.length || 0} eventi
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {(!analyticsData.recentEvents || analyticsData.recentEvents.length === 0) ? (
                    <p className="text-xs font-mono text-white/40 py-6 text-center">
                      Nessun evento locale ancora registrato in questa sessione.
                    </p>
                  ) : (
                    analyticsData.recentEvents.slice(0, 25).map((ev) => (
                      <div
                        key={ev.id}
                        className="px-3 py-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              ev.type === 'track_play'
                                ? 'bg-amber-400'
                                : ev.type === 'track_stream_30s'
                                ? 'bg-emerald-400'
                                : ev.type === 'track_complete'
                                ? 'bg-indigo-400'
                                : 'bg-purple-400'
                            }`}
                          />
                          <span className="text-white/90 truncate">
                            {ev.type === 'site_visit' && 'Visita al Player 3D'}
                            {ev.type === 'epk_view' && 'Apertura pagina BIO / EPK'}
                            {ev.type === 'share_open' && 'Apertura Condividi / Widget'}
                            {ev.type === 'lyrics_open' && `Lettura testo: ${ev.trackTitle || ''}`}
                            {ev.type === 'track_play' && `Play: ${ev.trackTitle || ''}`}
                            {ev.type === 'track_stream_30s' && `Stream >30s: ${ev.trackTitle || ''}`}
                            {ev.type === 'track_complete' && `Ascolto 100%: ${ev.trackTitle || ''}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 shrink-0 ml-2">
                          {new Date(ev.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
