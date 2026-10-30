import { AlbumData, Track } from '../data/albumData';

const CLOUD_NAMESPACE = 'arocchi-canzoni-prod-2026';
const CLOUD_BASE_URL = 'https://abacus.jasoncameron.dev';
const STORAGE_KEY = 'antigravity_analytics_v1';
const GA_STORAGE_KEY = 'antigravity_ga_measurement_id';

export type AnalyticsEventType =
  | 'site_visit'
  | 'epk_view'
  | 'share_open'
  | 'lyrics_open'
  | 'track_play'
  | 'track_stream_30s'
  | 'track_complete';

export interface AnalyticsLogEntry {
  id: string;
  timestamp: string;
  type: AnalyticsEventType;
  trackId?: string;
  trackTitle?: string;
  albumTitle?: string;
}

export interface TrackStats {
  plays: number;
  streams30s: number;
  completes: number;
  lyricsOpens: number;
}

export interface AnalyticsSnapshot {
  siteVisits: number;
  epkViews: number;
  shareOpens: number;
  lyricsOpens: number;
  totalPlays: number;
  totalStreams30s: number;
  totalCompletes: number;
  tracks: Record<string, TrackStats>;
  recentEvents: AnalyticsLogEntry[];
  gaMeasurementId: string;
  lastUpdated: string;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __gaInitializedId?: string;
  }
}

const sanitizeKey = (raw: string): string => {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
};

const getEmptySnapshot = (): AnalyticsSnapshot => ({
  siteVisits: 0,
  epkViews: 0,
  shareOpens: 0,
  lyricsOpens: 0,
  totalPlays: 0,
  totalStreams30s: 0,
  totalCompletes: 0,
  tracks: {},
  recentEvents: [],
  gaMeasurementId: localStorage.getItem(GA_STORAGE_KEY) || '',
  lastUpdated: new Date().toISOString(),
});

export const loadLocalAnalytics = (): AnalyticsSnapshot => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getEmptySnapshot(),
        ...parsed,
        gaMeasurementId: localStorage.getItem(GA_STORAGE_KEY) || parsed.gaMeasurementId || '',
      };
    }
  } catch (e) {
    console.warn('Could not read local analytics:', e);
  }
  return getEmptySnapshot();
};

export const saveLocalAnalytics = (snapshot: AnalyticsSnapshot): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Could not save local analytics:', e);
  }
};

export const getGaMeasurementId = (): string => {
  try {
    return localStorage.getItem(GA_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setGaMeasurementId = (id: string): void => {
  const clean = id.trim().toUpperCase();
  try {
    localStorage.setItem(GA_STORAGE_KEY, clean);
    const snap = loadLocalAnalytics();
    snap.gaMeasurementId = clean;
    saveLocalAnalytics(snap);
  } catch {
    // ignore
  }
  if (clean.startsWith('G-')) {
    initGoogleAnalytics(clean);
  }
};

export const initGoogleAnalytics = (customId?: string): void => {
  if (typeof window === 'undefined') return;
  const gaId = (customId || getGaMeasurementId()).trim();
  if (!gaId || !gaId.startsWith('G-')) return;
  if (window.__gaInitializedId === gaId) return;

  window.__gaInitializedId = gaId;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    page_title: document.title,
    page_location: window.location.href,
  });

  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (!existingScript) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s);
  }
};

const sendGaEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, params);
    } catch {
      // ignore
    }
  }
};

const hitCloudCounter = async (key: string): Promise<number | null> => {
  try {
    const res = await fetch(`${CLOUD_BASE_URL}/hit/${CLOUD_NAMESPACE}/${sanitizeKey(key)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.value === 'number') return data.value;
    }
  } catch {
    // Offline or blocked by adblocker
  }
  return null;
};

const getCloudCounter = async (key: string): Promise<number> => {
  try {
    const res = await fetch(`${CLOUD_BASE_URL}/get/${CLOUD_NAMESPACE}/${sanitizeKey(key)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.value === 'number') return data.value;
    }
  } catch {
    // Offline or key not initialized yet
  }
  return 0;
};

const recordEvent = (
  type: AnalyticsEventType,
  track?: Track,
  albumTitle?: string
): AnalyticsSnapshot => {
  const snap = loadLocalAnalytics();
  const now = new Date().toISOString();

  if (type === 'site_visit') snap.siteVisits += 1;
  if (type === 'epk_view') snap.epkViews += 1;
  if (type === 'share_open') snap.shareOpens += 1;
  if (type === 'lyrics_open') snap.lyricsOpens += 1;
  if (type === 'track_play') snap.totalPlays += 1;
  if (type === 'track_stream_30s') snap.totalStreams30s += 1;
  if (type === 'track_complete') snap.totalCompletes += 1;

  if (track?.id) {
    const prev = snap.tracks[track.id] || {
      plays: 0,
      streams30s: 0,
      completes: 0,
      lyricsOpens: 0,
    };
    if (type === 'track_play') prev.plays += 1;
    if (type === 'track_stream_30s') prev.streams30s += 1;
    if (type === 'track_complete') prev.completes += 1;
    if (type === 'lyrics_open') prev.lyricsOpens += 1;
    snap.tracks[track.id] = prev;
  }

  const entry: AnalyticsLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
    type,
    trackId: track?.id,
    trackTitle: track?.title,
    albumTitle,
  };

  snap.recentEvents = [entry, ...(snap.recentEvents || [])].slice(0, 100);
  snap.lastUpdated = now;
  saveLocalAnalytics(snap);
  return snap;
};

export const trackSiteVisit = (): void => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem('antigravity_visited_session') === '1') return;
  sessionStorage.setItem('antigravity_visited_session', '1');

  initGoogleAnalytics();
  recordEvent('site_visit');
  hitCloudCounter('site_visits');
  sendGaEvent('page_view', { page_title: 'Player 3D' });
};

export const trackEpkView = (): void => {
  recordEvent('epk_view');
  hitCloudCounter('epk_views');
  sendGaEvent('epk_view', { page_title: 'EPK & Biografia' });
};

export const trackShareOpen = (): void => {
  recordEvent('share_open');
  hitCloudCounter('share_opens');
  sendGaEvent('share_open');
};

export const trackLyricsOpen = (track: Track, albumTitle?: string): void => {
  recordEvent('lyrics_open', track, albumTitle);
  hitCloudCounter('lyrics_opens');
  hitCloudCounter(`lyrics_${track.id}`);
  sendGaEvent('lyrics_open', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackSongPlay = (track: Track, albumTitle?: string): void => {
  if (!track?.id) return;
  recordEvent('track_play', track, albumTitle);
  hitCloudCounter('total_plays');
  hitCloudCounter(`play_${track.id}`);
  sendGaEvent('song_play', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackSongStream30s = (track: Track, albumTitle?: string): void => {
  if (!track?.id) return;
  recordEvent('track_stream_30s', track, albumTitle);
  hitCloudCounter('total_streams_30s');
  hitCloudCounter(`stream30_${track.id}`);
  sendGaEvent('song_stream_30s', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackSongComplete = (track: Track, albumTitle?: string): void => {
  if (!track?.id) return;
  recordEvent('track_complete', track, albumTitle);
  hitCloudCounter('total_completes');
  hitCloudCounter(`complete_${track.id}`);
  sendGaEvent('song_complete', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

/**
 * Fetches global cloud counters for all tracks across the discography and merges with local stats
 * (taking the maximum between cloud counter and local counter so numbers never under-report).
 */
export const fetchMergedAnalytics = async (albums: AlbumData[]): Promise<AnalyticsSnapshot> => {
  const local = loadLocalAnalytics();

  const [
    cloudVisits,
    cloudEpk,
    cloudShare,
    cloudLyrics,
    cloudPlays,
    cloudStreams30,
    cloudCompletes,
  ] = await Promise.all([
    getCloudCounter('site_visits'),
    getCloudCounter('epk_views'),
    getCloudCounter('share_opens'),
    getCloudCounter('lyrics_opens'),
    getCloudCounter('total_plays'),
    getCloudCounter('total_streams_30s'),
    getCloudCounter('total_completes'),
  ]);

  const allTracks: Track[] = [];
  albums.forEach((alb) => {
    alb.tracks.forEach((t) => allTracks.push(t));
  });

  const trackEntries = await Promise.all(
    allTracks.map(async (t) => {
      const [p, s30, c] = await Promise.all([
        getCloudCounter(`play_${t.id}`),
        getCloudCounter(`stream30_${t.id}`),
        getCloudCounter(`complete_${t.id}`),
      ]);
      const loc = local.tracks[t.id] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
      return [
        t.id,
        {
          plays: Math.max(p, loc.plays),
          streams30s: Math.max(s30, loc.streams30s),
          completes: Math.max(c, loc.completes),
          lyricsOpens: loc.lyricsOpens || 0,
        },
      ] as const;
    })
  );

  const mergedTracks: Record<string, TrackStats> = { ...local.tracks };
  let sumTrackPlays = 0;
  let sumTrackStreams30 = 0;
  let sumTrackCompletes = 0;

  for (const [tid, stats] of trackEntries) {
    mergedTracks[tid] = stats;
    sumTrackPlays += stats.plays;
    sumTrackStreams30 += stats.streams30s;
    sumTrackCompletes += stats.completes;
  }

  const merged: AnalyticsSnapshot = {
    ...local,
    siteVisits: Math.max(cloudVisits, local.siteVisits, 1),
    epkViews: Math.max(cloudEpk, local.epkViews),
    shareOpens: Math.max(cloudShare, local.shareOpens),
    lyricsOpens: Math.max(cloudLyrics, local.lyricsOpens),
    totalPlays: Math.max(cloudPlays, local.totalPlays, sumTrackPlays),
    totalStreams30s: Math.max(cloudStreams30, local.totalStreams30s, sumTrackStreams30),
    totalCompletes: Math.max(cloudCompletes, local.totalCompletes, sumTrackCompletes),
    tracks: mergedTracks,
    lastUpdated: new Date().toISOString(),
  };

  saveLocalAnalytics(merged);
  return merged;
};
