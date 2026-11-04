import React, { useState, useEffect, useMemo } from 'react';
import { AlbumData, Track, resolveAssetUrl } from '../data/albumData';
import {
  AnalyticsSnapshot,
  DailyStatsBucket,
  fetchMergedAnalytics,
  buildDailySeriesFromSnapshot,
  loadLocalAnalytics,
  getTodayDateKey,
  getDateRangeKeys,
  isOwnerTrackingExcluded,
  setOwnerTrackingExcluded,
} from '../utils/analytics';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Headphones,
  Layers,
  Lock,
  Music,
  RefreshCw,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';

interface StatsViewProps {
  albums: AlbumData[];
  onBackToPlayer: () => void;
  onOpenBackoffice?: () => void;
  embedded?: boolean;
}

type DatePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';
type SortMetric = 'score' | 'plays' | 'streams30s' | 'retention' | 'completion' | 'lyrics' | 'minutes';

const formatDurationMinutes = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins === 0 && totalSeconds > 0) {
    return `${Math.round(totalSeconds)}s`;
  }
  return `${mins} min`;
};

const formatShortDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
};

export const StatsView: React.FC<StatsViewProps> = ({
  albums,
  onBackToPlayer,
  onOpenBackoffice,
  embedded = false,
}) => {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(() => loadLocalAnalytics());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [excludeMyPlays, setExcludeMyPlays] = useState<boolean>(() => isOwnerTrackingExcluded());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Date filter state
  const todayStr = useMemo(() => getTodayDateKey(), []);
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return getTodayDateKey(d);
  }, []);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState<string>(sevenDaysAgoStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Filtering & sorting for tracks table
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortMetric>('score');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const merged = await fetchMergedAnalytics(albums);
      setSnapshot(merged);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [albums]);

  // Compute active date range keys when preset or custom dates change
  const activeDateKeys = useMemo((): string[] | null => {
    const now = new Date();
    if (datePreset === 'all') return null;
    if (datePreset === 'today') {
      const t = getTodayDateKey(now);
      return [t];
    }
    if (datePreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yk = getTodayDateKey(y);
      return [yk];
    }
    if (datePreset === '7d') {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      return getDateRangeKeys(getTodayDateKey(s), getTodayDateKey(now));
    }
    if (datePreset === '30d') {
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      return getDateRangeKeys(getTodayDateKey(s), getTodayDateKey(now));
    }
    if (datePreset === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return getDateRangeKeys(getTodayDateKey(s), getTodayDateKey(now));
    }
    return getDateRangeKeys(customStart, customEnd);
  }, [datePreset, customStart, customEnd]);

  // Last 7 days keys for chart context when 'all', 'today', 'yesterday', or '7d' is selected
  const last7DaysKeys = useMemo(() => {
    const now = new Date();
    const s = new Date(now);
    s.setDate(now.getDate() - 6);
    return getDateRangeKeys(getTodayDateKey(s), getTodayDateKey(now));
  }, []);

  // Synchronous daily buckets for the active filter (0ms switching, no network burst)
  const filterBuckets = useMemo((): DailyStatsBucket[] => {
    if (!activeDateKeys) return [];
    return buildDailySeriesFromSnapshot(snapshot, activeDateKeys);
  }, [snapshot, activeDateKeys]);

  // Synchronous daily series for the bar chart
  const chartSeries = useMemo((): DailyStatsBucket[] => {
    if (
      datePreset === 'all' ||
      datePreset === 'today' ||
      datePreset === 'yesterday' ||
      datePreset === '7d'
    ) {
      return buildDailySeriesFromSnapshot(snapshot, last7DaysKeys);
    }
    return buildDailySeriesFromSnapshot(snapshot, activeDateKeys || last7DaysKeys);
  }, [snapshot, datePreset, activeDateKeys, last7DaysKeys]);

  // Compute filtered totals based on datePreset
  const filteredTotals = useMemo(() => {
    if (!activeDateKeys) {
      return {
        siteVisits: snapshot.siteVisits,
        totalPlays: snapshot.totalPlays,
        totalStreams30s: snapshot.totalStreams30s,
        totalCompletes: snapshot.totalCompletes,
        lyricsOpens: snapshot.lyricsOpens,
        epkViews: snapshot.epkViews,
        shareOpens: snapshot.shareOpens,
        tracks: snapshot.tracks,
      };
    }

    let siteVisits = 0;
    let totalPlays = 0;
    let totalStreams30s = 0;
    let totalCompletes = 0;
    let lyricsOpens = 0;
    let epkViews = 0;
    let shareOpens = 0;
    const tracks: Record<
      string,
      { plays: number; streams30s: number; completes: number; lyricsOpens: number }
    > = {};

    for (const b of filterBuckets) {
      siteVisits += b.siteVisits || 0;
      totalPlays += b.totalPlays || 0;
      totalStreams30s += b.totalStreams30s || 0;
      totalCompletes += b.totalCompletes || 0;
      lyricsOpens += b.lyricsOpens || 0;
      epkViews += b.epkViews || 0;
      shareOpens += b.shareOpens || 0;

      for (const [tid, st] of Object.entries(b.tracks || {})) {
        const prev = tracks[tid] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
        prev.plays += st.plays || 0;
        prev.streams30s += st.streams30s || 0;
        prev.completes += st.completes || 0;
        prev.lyricsOpens += st.lyricsOpens || 0;
        tracks[tid] = prev;
      }
    }

    return {
      siteVisits,
      totalPlays,
      totalStreams30s,
      totalCompletes,
      lyricsOpens,
      epkViews,
      shareOpens,
      tracks,
    };
  }, [activeDateKeys, snapshot, filterBuckets]);

  // Enrich all tracks with performance KPIs
  const enrichedTracks = useMemo(() => {
    const list: Array<{
      track: Track;
      album: AlbumData;
      plays: number;
      streams30s: number;
      completes: number;
      lyricsOpens: number;
      retentionRate: number;
      skipRate: number;
      completionRate: number;
      lyricsRate: number;
      estimatedSeconds: number;
      engagementScore: number;
    }> = [];

    for (const alb of albums) {
      for (const t of alb.tracks) {
        const st = filteredTotals.tracks[t.id] || {
          plays: 0,
          streams30s: 0,
          completes: 0,
          lyricsOpens: 0,
        };
        const plays = st.plays || 0;
        const streams30s = Math.min(plays || st.streams30s, st.streams30s || 0);
        const completes = Math.min(plays || st.completes, st.completes || 0);
        const lyricsOpens = st.lyricsOpens || 0;

        const retentionRate = plays > 0 ? Math.min(100, Math.round((streams30s / plays) * 100)) : 0;
        const skipRate = plays > 0 ? Math.max(0, 100 - retentionRate) : 0;
        const completionRate = plays > 0 ? Math.min(100, Math.round((completes / plays) * 100)) : 0;
        const lyricsRate = plays > 0 ? Math.min(100, Math.round((lyricsOpens / plays) * 100)) : 0;

        const dur = t.durationSeconds || 180;
        const fullSec = completes * dur;
        const partial30Sec = Math.max(0, streams30s - completes) * Math.round(dur * 0.55);
        const earlySec = Math.max(0, plays - streams30s) * 12;
        const estimatedSeconds = fullSec + partial30Sec + earlySec;

        const rawPoints = plays * 1 + streams30s * 3 + completes * 5 + lyricsOpens * 2;
        list.push({
          track: t,
          album: alb,
          plays,
          streams30s,
          completes,
          lyricsOpens,
          retentionRate,
          skipRate,
          completionRate,
          lyricsRate,
          estimatedSeconds,
          engagementScore: rawPoints,
        });
      }
    }

    const maxPoints = Math.max(1, ...list.map((i) => i.engagementScore));
    return list.map((item) => ({
      ...item,
      engagementScore:
        item.engagementScore > 0 ? Math.max(5, Math.round((item.engagementScore / maxPoints) * 100)) : 0,
    }));
  }, [albums, filteredTotals]);

  // Global derived KPIs
  const globalKpis = useMemo(() => {
    const visits = Math.max(filteredTotals.siteVisits, 0);
    const plays = filteredTotals.totalPlays;
    const s30 = filteredTotals.totalStreams30s;
    const comp = filteredTotals.totalCompletes;

    const playThroughRate = visits > 0 ? Math.min(100, Math.round((plays / visits) * 100)) : 0;
    const hookRetentionRate = plays > 0 ? Math.min(100, Math.round((s30 / plays) * 100)) : 0;
    const skipRate = plays > 0 ? Math.max(0, 100 - hookRetentionRate) : 0;
    const completionRate = plays > 0 ? Math.min(100, Math.round((comp / plays) * 100)) : 0;
    const playsPerVisit = visits > 0 ? (plays / visits).toFixed(1) : '0.0';
    const totalEstimatedSeconds = enrichedTracks.reduce((acc, i) => acc + i.estimatedSeconds, 0);

    return {
      playThroughRate,
      hookRetentionRate,
      skipRate,
      completionRate,
      playsPerVisit,
      totalEstimatedSeconds,
    };
  }, [filteredTotals, enrichedTracks]);

  // Per-Album performance aggregation
  const albumPerformance = useMemo(() => {
    const totalPlaysAll = Math.max(
      1,
      enrichedTracks.reduce((acc, t) => acc + t.plays, 0)
    );

    return albums.map((alb) => {
      const rows = enrichedTracks.filter((r) => r.album.id === alb.id);
      const plays = rows.reduce((a, r) => a + r.plays, 0);
      const streams30s = rows.reduce((a, r) => a + r.streams30s, 0);
      const completes = rows.reduce((a, r) => a + r.completes, 0);
      const lyrics = rows.reduce((a, r) => a + r.lyricsOpens, 0);
      const seconds = rows.reduce((a, r) => a + r.estimatedSeconds, 0);

      const sharePct =
        enrichedTracks.reduce((acc, t) => acc + t.plays, 0) > 0
          ? Math.round((plays / totalPlaysAll) * 100)
          : 0;
      const retentionPct = plays > 0 ? Math.min(100, Math.round((streams30s / plays) * 100)) : 0;
      const completionPct = plays > 0 ? Math.min(100, Math.round((completes / plays) * 100)) : 0;
      const avgPlaysPerTrack = rows.length > 0 ? (plays / rows.length).toFixed(1) : '0.0';

      const topTrack = [...rows].sort((a, b) => b.plays - a.plays || b.streams30s - a.streams30s)[0];

      return {
        album: alb,
        plays,
        streams30s,
        completes,
        lyrics,
        seconds,
        sharePct,
        retentionPct,
        completionPct,
        avgPlaysPerTrack,
        topTrack,
      };
    });
  }, [albums, enrichedTracks]);

  // Sorted & filtered tracks for the leaderboard table
  const visibleTracks = useMemo(() => {
    return enrichedTracks
      .filter((item) => {
        if (selectedAlbumFilter !== 'all' && item.album.id !== selectedAlbumFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.track.title.toLowerCase().includes(q) ||
            item.album.title.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'plays') return b.plays - a.plays || b.streams30s - a.streams30s;
        if (sortBy === 'streams30s') return b.streams30s - a.streams30s || b.plays - a.plays;
        if (sortBy === 'retention') return b.retentionRate - a.retentionRate || b.plays - a.plays;
        if (sortBy === 'completion') return b.completionRate - a.completionRate || b.plays - a.plays;
        if (sortBy === 'lyrics') return b.lyricsOpens - a.lyricsOpens || b.plays - a.plays;
        if (sortBy === 'minutes') return b.estimatedSeconds - a.estimatedSeconds;
        return b.engagementScore - a.engagementScore || b.plays - a.plays;
      });
  }, [enrichedTracks, selectedAlbumFilter, searchQuery, sortBy]);

  // Export CSV handler
  const handleExportCsv = () => {
    const headers = [
      'Posizione',
      'Brano',
      'Album',
      'Play Avviati',
      'Stream >30s',
      'Completati 100%',
      'Hook Retention %',
      'Completion Rate %',
      'Aperture Testo',
      'Secondi Ascoltati Stimati',
      'Score (0-100)',
    ];
    const rows = visibleTracks.map((r, idx) => [
      idx + 1,
      `"${r.track.title.replace(/"/g, '""')}"`,
      `"${r.album.title.replace(/"/g, '""')}"`,
      r.plays,
      r.streams30s,
      r.completes,
      `${r.retentionRate}%`,
      `${r.completionRate}%`,
      r.lyricsOpens,
      r.estimatedSeconds,
      r.engagementScore,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiche-canzoni-${getTodayDateKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Report CSV scaricato con successo!');
  };

  const maxDailyPlayOrVisit = Math.max(
    1,
    ...chartSeries.map((d) => Math.max(d.siteVisits || 0, d.totalPlays || 0, d.totalStreams30s || 0))
  );

  const directStatsUrl = 'https://alta-mente.github.io/canzoni/stats/';

  return (
    <div className={embedded ? 'w-full space-y-6' : 'min-h-screen bg-[#07080d] text-white pb-20'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-black font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standalone Top Header (when accessed via /canzoni/stats/ or #stats) */}
      {!embedded && (
        <header className="sticky top-0 z-40 bg-[#0b0d14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToPlayer}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all"
                title="Torna al Player 3D"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h1 className="text-base sm:text-lg font-mono font-bold tracking-wider uppercase">
                    Alessandro Rocchi • Analytics & Performance Studio
                  </h1>
                </div>
                <p className="text-[11px] font-mono text-white/50">
                  URL Diretto: <span className="text-emerald-400">{directStatsUrl}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(directStatsUrl);
                  showToast('URL diretto Statistiche copiato negli appunti!');
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copia URL Diretto</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Esporta CSV</span>
              </button>

              {onOpenBackoffice && (
                <button
                  onClick={onOpenBackoffice}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white transition-all"
                >
                  Apri Backoffice Completo
                </button>
              )}

              <button
                onClick={refreshData}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Sincronizzazione...' : 'Aggiorna Dati Live'}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6'}>
        {/* 1. BARRA URL DIRETTO + FILTRO PROPRIETARIO + FILTRO PER DATA */}
        <div className="bg-[#12141f] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Filtro Periodo Temporale
                </span>
                {activeDateKeys ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeDateKeys.length === 1
                      ? `Giorno: ${activeDateKeys[0]}`
                      : `${activeDateKeys[0]} → ${activeDateKeys[activeDateKeys.length - 1]} (${activeDateKeys.length} gg)`}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Storico Globale (All-Time)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">
                Filtra visite, play, stream &gt;30s e completamenti per data oppure consulta lo storico totale dall&apos;apertura.
              </p>
            </div>

            {/* Date Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tutto il periodo' },
                  { id: 'today', label: 'Oggi' },
                  { id: 'yesterday', label: 'Ieri' },
                  { id: '7d', label: 'Ultimi 7 giorni' },
                  { id: '30d', label: 'Ultimi 30 giorni' },
                  { id: 'month', label: 'Questo Mese' },
                  { id: 'custom', label: 'Personalizzato' },
                ] as Array<{ id: DatePreset; label: string }>
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    datePreset === p.id
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Pickers if 'custom' selected */}
          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-white/60">Dal:</label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-white/60">Al:</label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white"
                />
              </div>
            </div>
          )}

          {/* Direct URL & Owner Protection Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white/60">Link diretto da salvare nei Preferiti:</span>
              <a
                href={directStatsUrl}
                className="text-emerald-400 hover:underline font-bold"
              >
                {directStatsUrl}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(directStatsUrl);
                  showToast('Link copiato: https://alta-mente.github.io/canzoni/stats/');
                }}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-white"
              >
                Copia
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                  excludeMyPlays
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>
                  {excludeMyPlays ? 'Tuoi ascolti ESCLUSI' : 'Tuoi ascolti CONTEGGIATI'}
                </span>
              </span>

              <button
                onClick={() => {
                  const next = !excludeMyPlays;
                  setOwnerTrackingExcluded(next);
                  setExcludeMyPlays(next);
                  showToast(
                    next
                      ? 'Filtro Proprietario attivo: i tuoi play non verranno conteggiati.'
                      : 'Filtro disattivato: ora anche i tuoi play vengono conteggiati.'
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white transition-all"
              >
                {excludeMyPlays ? 'Riattiva per Test' : 'Escludi miei Play'}
              </button>

              {embedded && (
                <button
                  onClick={handleExportCsv}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. OTTO KPI CARDS DI PERFORMANCE MUSICALE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              Visite Sito
            </span>
            <div className="text-2xl font-mono font-black text-white">
              {filteredTotals.siteVisits}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block">
              {globalKpis.playsPerVisit} play / visita
            </span>
          </div>

          <div className="bg-[#12141f] border border-amber-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block">
              Play Avviati
            </span>
            <div className="text-2xl font-mono font-black text-amber-400">
              {filteredTotals.totalPlays}
            </div>
            <span className="text-[10px] font-mono text-white/50 block">
              Conv. Visite: {globalKpis.playThroughRate}%
            </span>
          </div>

          <div className="bg-[#12141f] border border-emerald-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">
              Stream &gt; 30s
            </span>
            <div className="text-2xl font-mono font-black text-emerald-400">
              {filteredTotals.totalStreams30s}
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80 block">
              Hook Rate: {globalKpis.hookRetentionRate}%
            </span>
          </div>

          <div className="bg-[#12141f] border border-indigo-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300/80 block">
              Ascolti 100%
            </span>
            <div className="text-2xl font-mono font-black text-indigo-400">
              {filteredTotals.totalCompletes}
            </div>
            <span className="text-[10px] font-mono text-indigo-300/80 block">
              Completion: {globalKpis.completionRate}%
            </span>
          </div>

          <div className="bg-[#12141f] border border-rose-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 block">
              Skip &lt; 30s
            </span>
            <div className="text-2xl font-mono font-black text-rose-400">
              {globalKpis.skipRate}%
            </div>
            <span className="text-[10px] font-mono text-white/50 block">
              Abbandono intro
            </span>
          </div>

          <div className="bg-[#12141f] border border-cyan-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/80 block">
              Tempo Ascolto
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-cyan-400 truncate">
              {formatDurationMinutes(globalKpis.totalEstimatedSeconds)}
            </div>
            <span className="text-[10px] font-mono text-white/50 block">
              Musica riprodotta
            </span>
          </div>

          <div className="bg-[#12141f] border border-purple-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 block">
              Aperture Testi
            </span>
            <div className="text-2xl font-mono font-black text-purple-400">
              {filteredTotals.lyricsOpens}
            </div>
            <span className="text-[10px] font-mono text-white/50 block">
              Copiati: {snapshot.audience.interactions.lyricsCopies}
            </span>
          </div>

          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              BIO / EPK &amp; Share
            </span>
            <div className="text-2xl font-mono font-black text-white">
              {filteredTotals.epkViews}
            </div>
            <span className="text-[10px] font-mono text-white/50 block">
              Share: {filteredTotals.shareOpens} • Spot: {snapshot.audience.interactions.spotifyClicks}
            </span>
          </div>
        </div>

        {/* 3. FUNNEL DI CONVERSIONE ASCOLTATORE + GRAFICO ANDAMENTO GIORNALIERO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Funnel di Conversione (5 cols) */}
          <div className="lg:col-span-5 bg-[#12141f] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Funnel di Conversione Ascolto
                </h2>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                Qualità dell&apos;attenzione
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  step: '1. Visite al Player',
                  value: filteredTotals.siteVisits,
                  pct: 100,
                  sub: 'Ingressi unici di sessione',
                  color: 'bg-slate-400',
                },
                {
                  step: '2. Avvio Riproduzione (Play)',
                  value: filteredTotals.totalPlays,
                  pct: globalKpis.playThroughRate,
                  sub: `${globalKpis.playThroughRate}% dei visitatori avvia un brano`,
                  color: 'bg-amber-400',
                },
                {
                  step: '3. Superamento Intro (>30s Hook)',
                  value: filteredTotals.totalStreams30s,
                  pct: globalKpis.hookRetentionRate,
                  sub: `${globalKpis.hookRetentionRate}% resta oltre i primi 30 secondi`,
                  color: 'bg-emerald-400',
                },
                {
                  step: '4. Ascolto Integrale (100% Brano)',
                  value: filteredTotals.totalCompletes,
                  pct: globalKpis.completionRate,
                  sub: `${globalKpis.completionRate}% arriva fino all'ultimo secondo`,
                  color: 'bg-indigo-400',
                },
              ].map((f) => (
                <div key={f.step} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{f.step}</span>
                    <span className="font-black text-white">
                      {f.value} <span className="text-white/40 font-normal">({f.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.color} transition-all duration-500`}
                      style={{ width: `${Math.max(4, Math.min(100, f.pct))}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-white/50">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grafico Andamento Giornaliero (7 cols) */}
          <div className="lg:col-span-7 bg-[#12141f] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Andamento Giornaliero ({chartSeries.length} giorni)
                </h2>
                {(datePreset === 'today' || datePreset === 'yesterday') && activeDateKeys?.[0] && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Focus: {formatShortDate(activeDateKeys[0])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white/35 inline-block" /> Visite
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Play
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> &gt;30s
                </span>
              </div>
            </div>

            <div className="h-56 flex items-end gap-1.5 pt-4 pb-2 px-2 overflow-x-auto border-b border-white/10">
              {chartSeries.map((day) => {
                const visits = day.siteVisits || 0;
                const plays = day.totalPlays || 0;
                const streams = day.totalStreams30s || 0;
                const vHeight = visits > 0 ? Math.max(8, Math.round((visits / maxDailyPlayOrVisit) * 124)) : 2;
                const pHeight = plays > 0 ? Math.max(8, Math.round((plays / maxDailyPlayOrVisit) * 124)) : 2;
                const sHeight = streams > 0 ? Math.max(8, Math.round((streams / maxDailyPlayOrVisit) * 124)) : 2;

                const isSingleDayFilter = datePreset === 'today' || datePreset === 'yesterday';
                const isSelectedDay = !activeDateKeys || activeDateKeys.includes(day.date);

                return (
                  <div
                    key={day.date}
                    onClick={() => {
                      setCustomStart(day.date);
                      setCustomEnd(day.date);
                      if (day.date === todayStr) {
                        setDatePreset('today');
                      } else {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        if (day.date === getTodayDateKey(y)) {
                          setDatePreset('yesterday');
                        } else {
                          setDatePreset('custom');
                        }
                      }
                    }}
                    className={`flex-1 min-w-[44px] flex flex-col items-center gap-1.5 py-1.5 px-1 rounded-xl cursor-pointer transition-all group ${
                      isSingleDayFilter && isSelectedDay
                        ? 'bg-amber-400/10 ring-1 ring-amber-400/50'
                        : isSingleDayFilter && !isSelectedDay
                        ? 'opacity-45 hover:opacity-85'
                        : 'hover:bg-white/[0.04]'
                    }`}
                    title={`${day.date}: ${visits} visite, ${plays} play, ${streams} stream >30s`}
                  >
                    <div className="h-4 flex items-center justify-center gap-1 text-[9px] font-mono">
                      {visits > 0 && (
                        <span className="text-white/60" title="Visite">
                          {visits}v
                        </span>
                      )}
                      {plays > 0 && (
                        <span className="text-amber-300 font-bold" title="Play">
                          {plays}p
                        </span>
                      )}
                    </div>
                    <div className="w-full h-32 flex items-end justify-center gap-1">
                      <div
                        className={`w-2.5 rounded-t transition-all duration-300 ${
                          visits > 0 ? 'bg-white/35' : 'bg-white/10'
                        }`}
                        style={{ height: `${vHeight}px` }}
                      />
                      <div
                        className={`w-2.5 rounded-t transition-all duration-300 ${
                          plays > 0 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'bg-amber-400/20'
                        }`}
                        style={{ height: `${pHeight}px` }}
                      />
                      <div
                        className={`w-2.5 rounded-t transition-all duration-300 ${
                          streams > 0 ? 'bg-emerald-400' : 'bg-emerald-400/20'
                        }`}
                        style={{ height: `${sHeight}px` }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-mono whitespace-nowrap ${
                        isSingleDayFilter && isSelectedDay
                          ? 'text-amber-300 font-bold'
                          : 'text-white/55'
                      }`}
                    >
                      {formatShortDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-white/40 flex flex-wrap items-center justify-between gap-2">
              <span>
                Clicca su una colonna del grafico per filtrare quel giorno specifico • Oggi: {todayStr}
              </span>
              {isLoading && (
                <span className="text-emerald-400 animate-pulse">
                  Sincronizzazione contatori cloud...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. NUOVE INFO TRACCIATE: DISPOSITIVI, SORGENTI TRAFFICO, FASCE ORARIE, INTERAZIONI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dispositivi */}
          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Dispositivi Pubblico
              </h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                { label: 'Smartphone (iOS / Android)', val: snapshot.audience.devices.mobile, color: 'bg-cyan-400' },
                { label: 'Computer (Mac / PC)', val: snapshot.audience.devices.desktop, color: 'bg-indigo-400' },
                { label: 'Tablet / iPad', val: snapshot.audience.devices.tablet, color: 'bg-purple-400' },
              ].map((d) => {
                const tot =
                  Math.max(
                    1,
                    snapshot.audience.devices.mobile +
                      snapshot.audience.devices.desktop +
                      snapshot.audience.devices.tablet
                  );
                const pct = Math.round((d.val / tot) * 100);
                return (
                  <div key={d.label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/70">{d.label}</span>
                      <span className="font-bold text-white">
                        {d.val} ({d.val > 0 ? pct : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${d.color}`} style={{ width: `${d.val > 0 ? Math.max(5, pct) : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provenienza Traffico */}
          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Provenienza Visite
              </h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                { label: 'Diretto / Link Condiviso', val: snapshot.audience.sources.direct, color: 'bg-emerald-400' },
                { label: 'Ricerca Google / Bing', val: snapshot.audience.sources.search, color: 'bg-amber-400' },
                { label: 'Social (IG / WhatsApp / FB)', val: snapshot.audience.sources.social, color: 'bg-pink-400' },
                { label: 'Suno / Spotify Referrer', val: snapshot.audience.sources.music, color: 'bg-purple-400' },
              ].map((s) => {
                const tot = Math.max(
                  1,
                  snapshot.audience.sources.direct +
                    snapshot.audience.sources.search +
                    snapshot.audience.sources.social +
                    snapshot.audience.sources.music
                );
                const pct = Math.round((s.val / tot) * 100);
                return (
                  <div key={s.label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/70">{s.label}</span>
                      <span className="font-bold text-white">
                        {s.val} ({s.val > 0 ? pct : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: `${s.val > 0 ? Math.max(5, pct) : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fasce Orarie di Ascolto */}
          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Fasce Orarie di Ascolto
              </h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                { label: 'Mattina (06:00 – 12:00)', val: snapshot.audience.timeSlots.morning, color: 'bg-amber-300' },
                { label: 'Pomeriggio (12:00 – 18:00)', val: snapshot.audience.timeSlots.afternoon, color: 'bg-orange-400' },
                { label: 'Sera (18:00 – 24:00)', val: snapshot.audience.timeSlots.evening, color: 'bg-indigo-400' },
                { label: 'Notte (00:00 – 06:00)', val: snapshot.audience.timeSlots.night, color: 'bg-purple-400' },
              ].map((slot) => {
                const tot = Math.max(
                  1,
                  snapshot.audience.timeSlots.morning +
                    snapshot.audience.timeSlots.afternoon +
                    snapshot.audience.timeSlots.evening +
                    snapshot.audience.timeSlots.night
                );
                const pct = Math.round((slot.val / tot) * 100);
                return (
                  <div key={slot.label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/70">{slot.label}</span>
                      <span className="font-bold text-white">
                        {slot.val} ({slot.val > 0 ? pct : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full ${slot.color}`}
                        style={{ width: `${slot.val > 0 ? Math.max(5, pct) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interazioni & Stile Player */}
          <div className="bg-[#12141f] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Interazioni &amp; Viste Player
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-white/50 block">Testi Copiati</span>
                <span className="text-base font-black text-purple-300">
                  {snapshot.audience.interactions.lyricsCopies}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-white/50 block">Click Spotify</span>
                <span className="text-base font-black text-emerald-300">
                  {snapshot.audience.interactions.spotifyClicks}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-white/50 block">Vista Custodia</span>
                <span className="text-base font-black text-amber-300">
                  {snapshot.audience.interactions.modeSleeve}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-white/50 block">Vista Editoriale</span>
                <span className="text-base font-black text-cyan-300">
                  {snapshot.audience.interactions.modeEditorial}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. CONFRONTO PERFORMANCE PER ALBUM (QUOTA D'ASCOLTO & RENDIMENTO) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Performance &amp; Quota d&apos;Ascolto per Album
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">
              Confronto rendimento tra i {albums.length} album
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {albumPerformance.map((ap) => (
              <div
                key={ap.album.id}
                className="bg-[#12141f] border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={resolveAssetUrl(ap.album.coverUrl)}
                      alt={ap.album.title}
                      className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                          Quota: {ap.sharePct}% dei Play
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {ap.album.tracks.length} brani
                        </span>
                      </div>
                      <h3 className="text-base font-mono font-bold text-white truncate">
                        {ap.album.title}
                      </h3>
                      <p className="text-[11px] font-mono text-white/50">
                        Media: {ap.avgPlaysPerTrack} play/brano • {formatDurationMinutes(ap.seconds)}
                      </p>
                    </div>
                  </div>

                  {/* Share progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${Math.max(4, ap.sharePct)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase block">Play</span>
                      <span className="text-sm font-black text-amber-400">{ap.plays}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase block">&gt;30s</span>
                      <span className="text-sm font-black text-emerald-400">{ap.streams30s}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase block">Hook %</span>
                      <span className="text-sm font-black text-white">{ap.retentionPct}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase block">100%</span>
                      <span className="text-sm font-black text-indigo-400">{ap.completionPct}%</span>
                    </div>
                  </div>
                </div>

                {ap.topTrack && (
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-white/50 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> Top Brano:
                    </span>
                    <span className="font-bold text-white truncate max-w-[180px]">
                      {ap.topTrack.track.title} ({ap.topTrack.plays} play)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 6. CLASSIFICA COMPLETA E ANALISI PERFORMANCE PER BRANO (ORDINABILE) */}
        <div className="bg-[#12141f] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Classifica &amp; Rendimento Brani ({visibleTracks.length} canzoni)
                </h2>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Ordina i brani per Play, Hook Retention (&gt;30s %), Tasso di Completamento (100%), Aperture Testo o Engagement Score.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Album Filter */}
              <select
                value={selectedAlbumFilter}
                onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white outline-none"
              >
                <option value="all">Tutti gli Album ({albums.length})</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMetric)}
                className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-400/40 text-xs font-mono text-amber-300 font-bold outline-none"
              >
                <option value="score">Ordina: Engagement Score</option>
                <option value="plays">Ordina: Play Avviati</option>
                <option value="streams30s">Ordina: Stream &gt; 30s</option>
                <option value="retention">Ordina: Hook Retention (%)</option>
                <option value="completion">Ordina: Completamento 100% (%)</option>
                <option value="lyrics">Ordina: Aperture Testo</option>
                <option value="minutes">Ordina: Tempo Ascoltato</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca canzone..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white outline-none w-44"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/50 bg-black/30">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Brano &amp; Album</th>
                  <th className="py-3 px-3 text-right">Play</th>
                  <th className="py-3 px-3 text-right">&gt; 30s</th>
                  <th className="py-3 px-3 text-right" title="Stream >30s diviso Play avviati">
                    Hook Rate %
                  </th>
                  <th className="py-3 px-3 text-right" title="Ascolti completi diviso Play avviati">
                    100% Fine
                  </th>
                  <th className="py-3 px-3 text-right">Testi Letti</th>
                  <th className="py-3 px-3 text-right">Tempo Ascolto</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleTracks.map((item, idx) => (
                  <tr key={item.track.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-bold text-white/40">
                      {idx === 0 && item.plays > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-black font-black">
                          1
                        </span>
                      ) : idx === 1 && item.plays > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-black font-black">
                          2
                        </span>
                      ) : idx === 2 && item.plays > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black">
                          3
                        </span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveAssetUrl(item.track.artworkUrl || item.album.coverUrl)}
                          alt={item.track.title}
                          className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{item.track.title}</div>
                          <div className="text-[10px] text-white/40 truncate">
                            {item.album.title} • {item.track.duration}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-black text-amber-400">
                      {item.plays}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {item.streams30s}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.retentionRate >= 60
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.retentionRate >= 30
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/5 text-white/50'
                        }`}
                      >
                        {item.retentionRate}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="text-indigo-300 font-bold">
                        {item.completes} <span className="text-white/40 font-normal">({item.completionRate}%)</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-purple-300 font-bold">
                      {item.lyricsOpens}
                    </td>

                    <td className="py-3 px-3 text-right text-cyan-300">
                      {formatDurationMinutes(item.estimatedSeconds)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                            style={{ width: `${item.engagementScore}%` }}
                          />
                        </div>
                        <span className="font-black text-white w-7">{item.engagementScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
