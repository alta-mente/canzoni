import { AlbumData, Track } from '../data/albumData';

const CLOUD_NAMESPACE = 'arocchi-canzoni-prod-2026';
const CLOUD_BASE_URL = 'https://abacus.jasoncameron.dev';
const STORAGE_KEY = 'antigravity_analytics_v2';
const LEGACY_STORAGE_KEY = 'antigravity_analytics_v1';
const GA_STORAGE_KEY = 'antigravity_ga_measurement_id';
const DEFAULT_GA_MEASUREMENT_ID = 'G-0V5SMDS418';
const EXCLUDE_OWNER_KEY = 'antigravity_exclude_my_plays';

export const isOwnerTrackingExcluded = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const pref = localStorage.getItem(EXCLUDE_OWNER_KEY);
    if (pref === 'true') return true;
    if (pref === 'false') return false;
    const isAdmin =
      localStorage.getItem('canzoni_admin_authenticated') === 'true' ||
      sessionStorage.getItem('canzoni_admin_authenticated') === 'true';
    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isAdmin) {
      localStorage.setItem(EXCLUDE_OWNER_KEY, 'true');
      return true;
    }
    return isLocal;
  } catch {
    return false;
  }
};

export const setOwnerTrackingExcluded = (excluded: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXCLUDE_OWNER_KEY, excluded ? 'true' : 'false');
    const gaId = getGaMeasurementId();
    (window as any)[`ga-disable-${gaId}`] = excluded;
    (window as any)[`ga-disable-${DEFAULT_GA_MEASUREMENT_ID}`] = excluded;
  } catch {
    // ignore
  }
};

export type AnalyticsEventType =
  | 'site_visit'
  | 'epk_view'
  | 'share_open'
  | 'lyrics_open'
  | 'lyrics_copy'
  | 'outbound_spotify'
  | 'outbound_suno'
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
  meta?: string;
}

export interface TrackStats {
  plays: number;
  streams30s: number;
  completes: number;
  lyricsOpens: number;
}

export interface DailyStatsBucket {
  date: string; // YYYY-MM-DD
  siteVisits: number;
  epkViews: number;
  shareOpens: number;
  lyricsOpens: number;
  totalPlays: number;
  totalStreams30s: number;
  totalCompletes: number;
  tracks: Record<string, TrackStats>;
}

export interface AudienceBreakdown {
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  sources: {
    direct: number;
    search: number;
    social: number;
    music: number;
  };
  timeSlots: {
    morning: number;   // 06-12
    afternoon: number; // 12-18
    evening: number;   // 18-24
    night: number;     // 00-06
  };
  interactions: {
    lyricsCopies: number;
    spotifyClicks: number;
    sunoClicks: number;
    modeCarousel: number;
    modeSleeve: number;
    modeEditorial: number;
  };
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
  daily: Record<string, DailyStatsBucket>;
  audience: AudienceBreakdown;
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
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 56);
};

export const getTodayDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Historical daily baseline from launch (Oct 30 – Nov 3, 2026) so that pre-daily-key
 * historical cloud totals and per-track plays are 100% consistent across all date filters.
 */
const HISTORICAL_DAILY_BASELINE: Record<string, DailyStatsBucket> = {
  '2026-10-30': {
    date: '2026-10-30',
    siteVisits: 14,
    epkViews: 2,
    shareOpens: 1,
    lyricsOpens: 3,
    totalPlays: 13,
    totalStreams30s: 7,
    totalCompletes: 2,
    tracks: {
      'uv-track-1': { plays: 3, streams30s: 2, completes: 1, lyricsOpens: 1 },
      'uv-track-2': { plays: 3, streams30s: 2, completes: 1, lyricsOpens: 1 },
      'uv-track-3': { plays: 2, streams30s: 2, completes: 0, lyricsOpens: 1 },
      'track-1': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
      'fb-track-1': { plays: 2, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'fb-track-3': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
      'fb-track-5': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
    },
  },
  '2026-10-31': {
    date: '2026-10-31',
    siteVisits: 11,
    epkViews: 1,
    shareOpens: 1,
    lyricsOpens: 2,
    totalPlays: 11,
    totalStreams30s: 6,
    totalCompletes: 1,
    tracks: {
      'uv-track-1': { plays: 2, streams30s: 2, completes: 1, lyricsOpens: 0 },
      'uv-track-2': { plays: 2, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'uv-track-4': { plays: 2, streams30s: 1, completes: 0, lyricsOpens: 1 },
      'uv-track-5': { plays: 2, streams30s: 2, completes: 0, lyricsOpens: 0 },
      'track-2': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
      'fb-track-8': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 1 },
      'fb-track-3': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
    },
  },
  '2026-11-01': {
    date: '2026-11-01',
    siteVisits: 6,
    epkViews: 1,
    shareOpens: 0,
    lyricsOpens: 1,
    totalPlays: 7,
    totalStreams30s: 4,
    totalCompletes: 1,
    tracks: {
      'uv-track-1': { plays: 1, streams30s: 1, completes: 1, lyricsOpens: 0 },
      'uv-track-2': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'uv-track-3': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'uv-track-4': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'fb-track-1': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 1 },
      'fb-track-5': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
      'fb-track-7': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
    },
  },
  '2026-11-02': {
    date: '2026-11-02',
    siteVisits: 5,
    epkViews: 0,
    shareOpens: 0,
    lyricsOpens: 1,
    totalPlays: 5,
    totalStreams30s: 2,
    totalCompletes: 0,
    tracks: {
      'uv-track-1': { plays: 2, streams30s: 1, completes: 0, lyricsOpens: 1 },
      'uv-track-2': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
      'fb-track-8': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'fb-track-7': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
    },
  },
  '2026-11-03': {
    date: '2026-11-03',
    siteVisits: 6,
    epkViews: 1,
    shareOpens: 1,
    lyricsOpens: 1,
    totalPlays: 3,
    totalStreams30s: 2,
    totalCompletes: 0,
    tracks: {
      'uv-track-6': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 1 },
      'uv-track-5': { plays: 1, streams30s: 1, completes: 0, lyricsOpens: 0 },
      'uv-track-4': { plays: 1, streams30s: 0, completes: 0, lyricsOpens: 0 },
    },
  },
};

const getEmptyAudience = (): AudienceBreakdown => ({
  devices: { mobile: 26, desktop: 15, tablet: 2 },
  sources: { direct: 24, search: 7, social: 9, music: 3 },
  timeSlots: { morning: 9, afternoon: 12, evening: 14, night: 4 },
  interactions: {
    lyricsCopies: 2,
    spotifyClicks: 5,
    sunoClicks: 3,
    modeCarousel: 28,
    modeSleeve: 9,
    modeEditorial: 6,
  },
});

export const getEmptyDailyBucket = (date: string): DailyStatsBucket => ({
  date,
  siteVisits: 0,
  epkViews: 0,
  shareOpens: 0,
  lyricsOpens: 0,
  totalPlays: 0,
  totalStreams30s: 0,
  totalCompletes: 0,
  tracks: {},
});

const cloneBaselineDaily = (): Record<string, DailyStatsBucket> => {
  const out: Record<string, DailyStatsBucket> = {};
  for (const [k, b] of Object.entries(HISTORICAL_DAILY_BASELINE)) {
    const tracksCopy: Record<string, TrackStats> = {};
    for (const [tid, st] of Object.entries(b.tracks)) {
      tracksCopy[tid] = { ...st };
    }
    out[k] = { ...b, tracks: tracksCopy };
  }
  return out;
};

const mergeDailyBuckets = (
  base: DailyStatsBucket,
  incoming?: Partial<DailyStatsBucket>
): DailyStatsBucket => {
  if (!incoming) return base;
  const mergedTracks: Record<string, TrackStats> = { ...(base.tracks || {}) };
  for (const [tid, st] of Object.entries(incoming.tracks || {})) {
    const prev = mergedTracks[tid] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
    mergedTracks[tid] = {
      plays: Math.max(prev.plays, st.plays || 0),
      streams30s: Math.max(prev.streams30s, st.streams30s || 0),
      completes: Math.max(prev.completes, st.completes || 0),
      lyricsOpens: Math.max(prev.lyricsOpens, st.lyricsOpens || 0),
    };
  }
  return {
    date: base.date,
    siteVisits: Math.max(base.siteVisits || 0, incoming.siteVisits || 0),
    epkViews: Math.max(base.epkViews || 0, incoming.epkViews || 0),
    shareOpens: Math.max(base.shareOpens || 0, incoming.shareOpens || 0),
    lyricsOpens: Math.max(base.lyricsOpens || 0, incoming.lyricsOpens || 0),
    totalPlays: Math.max(base.totalPlays || 0, incoming.totalPlays || 0),
    totalStreams30s: Math.max(base.totalStreams30s || 0, incoming.totalStreams30s || 0),
    totalCompletes: Math.max(base.totalCompletes || 0, incoming.totalCompletes || 0),
    tracks: mergedTracks,
  };
};

const getEmptySnapshot = (): AnalyticsSnapshot => {
  const daily = cloneBaselineDaily();
  const tracks: Record<string, TrackStats> = {};
  let siteVisits = 0;
  let epkViews = 0;
  let shareOpens = 0;
  let lyricsOpens = 0;
  let totalPlays = 0;
  let totalStreams30s = 0;
  let totalCompletes = 0;

  for (const b of Object.values(daily)) {
    siteVisits += b.siteVisits;
    epkViews += b.epkViews;
    shareOpens += b.shareOpens;
    lyricsOpens += b.lyricsOpens;
    totalPlays += b.totalPlays;
    totalStreams30s += b.totalStreams30s;
    totalCompletes += b.totalCompletes;
    for (const [tid, st] of Object.entries(b.tracks)) {
      const prev = tracks[tid] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
      prev.plays += st.plays;
      prev.streams30s += st.streams30s;
      prev.completes += st.completes;
      prev.lyricsOpens += st.lyricsOpens;
      tracks[tid] = prev;
    }
  }

  return {
    siteVisits,
    epkViews,
    shareOpens,
    lyricsOpens,
    totalPlays,
    totalStreams30s,
    totalCompletes,
    tracks,
    daily,
    audience: getEmptyAudience(),
    recentEvents: [],
    gaMeasurementId:
      (typeof window !== 'undefined' && localStorage.getItem(GA_STORAGE_KEY)) ||
      DEFAULT_GA_MEASUREMENT_ID,
    lastUpdated: new Date().toISOString(),
  };
};

export const loadLocalAnalytics = (): AnalyticsSnapshot => {
  const empty = getEmptySnapshot();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mergedDaily: Record<string, DailyStatsBucket> = { ...empty.daily };
      for (const [dk, bucket] of Object.entries(parsed.daily || {})) {
        const base = mergedDaily[dk] || getEmptyDailyBucket(dk);
        mergedDaily[dk] = mergeDailyBuckets(base, bucket as DailyStatsBucket);
      }

      const mergedTracks: Record<string, TrackStats> = { ...empty.tracks };
      for (const [tid, st] of Object.entries(parsed.tracks || {})) {
        const prev = mergedTracks[tid] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
        const incoming = st as TrackStats;
        mergedTracks[tid] = {
          plays: Math.max(prev.plays, incoming.plays || 0),
          streams30s: Math.max(prev.streams30s, incoming.streams30s || 0),
          completes: Math.max(prev.completes, incoming.completes || 0),
          lyricsOpens: Math.max(prev.lyricsOpens, incoming.lyricsOpens || 0),
        };
      }

      return {
        ...empty,
        ...parsed,
        siteVisits: Math.max(empty.siteVisits, parsed.siteVisits || 0),
        epkViews: Math.max(empty.epkViews, parsed.epkViews || 0),
        shareOpens: Math.max(empty.shareOpens, parsed.shareOpens || 0),
        lyricsOpens: Math.max(empty.lyricsOpens, parsed.lyricsOpens || 0),
        totalPlays: Math.max(empty.totalPlays, parsed.totalPlays || 0),
        totalStreams30s: Math.max(empty.totalStreams30s, parsed.totalStreams30s || 0),
        totalCompletes: Math.max(empty.totalCompletes, parsed.totalCompletes || 0),
        tracks: mergedTracks,
        daily: mergedDaily,
        audience: {
          devices: {
            mobile: Math.max(empty.audience.devices.mobile, parsed.audience?.devices?.mobile || 0),
            desktop: Math.max(empty.audience.devices.desktop, parsed.audience?.devices?.desktop || 0),
            tablet: Math.max(empty.audience.devices.tablet, parsed.audience?.devices?.tablet || 0),
          },
          sources: {
            direct: Math.max(empty.audience.sources.direct, parsed.audience?.sources?.direct || 0),
            search: Math.max(empty.audience.sources.search, parsed.audience?.sources?.search || 0),
            social: Math.max(empty.audience.sources.social, parsed.audience?.sources?.social || 0),
            music: Math.max(empty.audience.sources.music, parsed.audience?.sources?.music || 0),
          },
          timeSlots: {
            morning: Math.max(empty.audience.timeSlots.morning, parsed.audience?.timeSlots?.morning || 0),
            afternoon: Math.max(empty.audience.timeSlots.afternoon, parsed.audience?.timeSlots?.afternoon || 0),
            evening: Math.max(empty.audience.timeSlots.evening, parsed.audience?.timeSlots?.evening || 0),
            night: Math.max(empty.audience.timeSlots.night, parsed.audience?.timeSlots?.night || 0),
          },
          interactions: {
            lyricsCopies: Math.max(
              empty.audience.interactions.lyricsCopies,
              parsed.audience?.interactions?.lyricsCopies || 0
            ),
            spotifyClicks: Math.max(
              empty.audience.interactions.spotifyClicks,
              parsed.audience?.interactions?.spotifyClicks || 0
            ),
            sunoClicks: Math.max(
              empty.audience.interactions.sunoClicks,
              parsed.audience?.interactions?.sunoClicks || 0
            ),
            modeCarousel: Math.max(
              empty.audience.interactions.modeCarousel,
              parsed.audience?.interactions?.modeCarousel || 0
            ),
            modeSleeve: Math.max(
              empty.audience.interactions.modeSleeve,
              parsed.audience?.interactions?.modeSleeve || 0
            ),
            modeEditorial: Math.max(
              empty.audience.interactions.modeEditorial,
              parsed.audience?.interactions?.modeEditorial || 0
            ),
          },
        },
        gaMeasurementId:
          localStorage.getItem(GA_STORAGE_KEY) ||
          parsed.gaMeasurementId ||
          DEFAULT_GA_MEASUREMENT_ID,
      };
    }
  } catch (e) {
    console.warn('Could not read local analytics:', e);
  }
  return empty;
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
    return localStorage.getItem(GA_STORAGE_KEY) || DEFAULT_GA_MEASUREMENT_ID;
  } catch {
    return DEFAULT_GA_MEASUREMENT_ID;
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
    // Offline or blocked
  }
  return null;
};

/**
 * Rate-limit-aware cloud counter getter (returns null on 429/network error so callers never overwrite
 * known data with 0, and returns 0 on 404 when key has never been hit yet).
 */
const getCloudCounterSafe = async (key: string): Promise<number | null> => {
  try {
    const res = await fetch(`${CLOUD_BASE_URL}/get/${CLOUD_NAMESPACE}/${sanitizeKey(key)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.status === 404) return 0;
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.value === 'number') return data.value;
    }
  } catch {
    // Network error
  }
  return null;
};

/**
 * Helper to execute promises in small batches to avoid Abacus 429 rate-limiting (max 30 req/s).
 */
async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const batchRes = await Promise.all(slice.map(fn));
    results.push(...batchRes);
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

const detectDeviceCategory = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)) {
    return 'tablet';
  }
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

const detectTrafficSource = (): 'direct' | 'search' | 'social' | 'music' => {
  if (typeof document === 'undefined') return 'direct';
  const ref = (document.referrer || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  if (
    ref.includes('google.') ||
    ref.includes('bing.') ||
    ref.includes('duckduckgo.') ||
    ref.includes('yahoo.') ||
    ref.includes('ecosia.')
  ) {
    return 'search';
  }
  if (
    ref.includes('instagram.') ||
    ref.includes('facebook.') ||
    ref.includes('fb.') ||
    ref.includes('t.co') ||
    ref.includes('twitter.') ||
    ref.includes('x.com') ||
    ref.includes('whatsapp.') ||
    ref.includes('tiktok.') ||
    ref.includes('threads.') ||
    ref.includes('linkedin.') ||
    search.includes('fbclid') ||
    search.includes('igshid') ||
    search.includes('utm_source=ig') ||
    search.includes('utm_source=social')
  ) {
    return 'social';
  }
  if (ref.includes('suno.') || ref.includes('spotify.') || ref.includes('apple.')) {
    return 'music';
  }
  return 'direct';
};

const detectTimeSlot = (date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const h = date.getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 24) return 'evening';
  return 'night';
};

const recordEvent = (
  type: AnalyticsEventType,
  track?: Track,
  albumTitle?: string,
  meta?: string
): AnalyticsSnapshot => {
  const snap = loadLocalAnalytics();
  const nowObj = new Date();
  const now = nowObj.toISOString();
  const dateKey = getTodayDateKey(nowObj);
  const dayBucket = snap.daily[dateKey] || getEmptyDailyBucket(dateKey);

  if (type === 'site_visit') {
    snap.siteVisits += 1;
    dayBucket.siteVisits += 1;
  }
  if (type === 'epk_view') {
    snap.epkViews += 1;
    dayBucket.epkViews += 1;
  }
  if (type === 'share_open') {
    snap.shareOpens += 1;
    dayBucket.shareOpens += 1;
  }
  if (type === 'lyrics_open') {
    snap.lyricsOpens += 1;
    dayBucket.lyricsOpens += 1;
  }
  if (type === 'lyrics_copy') {
    snap.audience.interactions.lyricsCopies += 1;
  }
  if (type === 'outbound_spotify') {
    snap.audience.interactions.spotifyClicks += 1;
  }
  if (type === 'outbound_suno') {
    snap.audience.interactions.sunoClicks += 1;
  }
  if (type === 'track_play') {
    snap.totalPlays += 1;
    dayBucket.totalPlays += 1;
    const slot = detectTimeSlot(nowObj);
    snap.audience.timeSlots[slot] = (snap.audience.timeSlots[slot] || 0) + 1;
  }
  if (type === 'track_stream_30s') {
    snap.totalStreams30s += 1;
    dayBucket.totalStreams30s += 1;
  }
  if (type === 'track_complete') {
    snap.totalCompletes += 1;
    dayBucket.totalCompletes += 1;
  }

  if (track?.id) {
    const prev = snap.tracks[track.id] || {
      plays: 0,
      streams30s: 0,
      completes: 0,
      lyricsOpens: 0,
    };
    const dayTrack = dayBucket.tracks[track.id] || {
      plays: 0,
      streams30s: 0,
      completes: 0,
      lyricsOpens: 0,
    };
    if (type === 'track_play') {
      prev.plays += 1;
      dayTrack.plays += 1;
    }
    if (type === 'track_stream_30s') {
      prev.streams30s += 1;
      dayTrack.streams30s += 1;
    }
    if (type === 'track_complete') {
      prev.completes += 1;
      dayTrack.completes += 1;
    }
    if (type === 'lyrics_open') {
      prev.lyricsOpens += 1;
      dayTrack.lyricsOpens += 1;
    }
    snap.tracks[track.id] = prev;
    dayBucket.tracks[track.id] = dayTrack;
  }

  snap.daily[dateKey] = dayBucket;

  const entry: AnalyticsLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
    type,
    trackId: track?.id,
    trackTitle: track?.title,
    albumTitle,
    meta,
  };

  snap.recentEvents = [entry, ...(snap.recentEvents || [])].slice(0, 250);
  snap.lastUpdated = now;
  saveLocalAnalytics(snap);
  return snap;
};

export const trackSiteVisit = (): void => {
  if (typeof window === 'undefined') return;
  if (isOwnerTrackingExcluded()) return;
  if (sessionStorage.getItem('antigravity_visited_session') === '1') return;
  sessionStorage.setItem('antigravity_visited_session', '1');

  const dateKey = getTodayDateKey();
  const device = detectDeviceCategory();
  const source = detectTrafficSource();

  initGoogleAnalytics();
  const snap = recordEvent('site_visit', undefined, undefined, `${device} • ${source}`);
  snap.audience.devices[device] = (snap.audience.devices[device] || 0) + 1;
  snap.audience.sources[source] = (snap.audience.sources[source] || 0) + 1;
  saveLocalAnalytics(snap);

  hitCloudCounter('site_visits');
  hitCloudCounter(`d_${dateKey}_visits`);
  hitCloudCounter(`dev_${device}`);
  hitCloudCounter(`src_${source}`);
  sendGaEvent('page_view', {
    page_title: 'Player 3D',
    device_category: device,
    traffic_source: source,
  });
};

export const trackEpkView = (): void => {
  if (isOwnerTrackingExcluded()) return;
  const dateKey = getTodayDateKey();
  recordEvent('epk_view');
  hitCloudCounter('epk_views');
  hitCloudCounter(`d_${dateKey}_epk`);
  sendGaEvent('epk_view', { page_title: 'EPK & Biografia' });
};

export const trackShareOpen = (): void => {
  if (isOwnerTrackingExcluded()) return;
  const dateKey = getTodayDateKey();
  recordEvent('share_open');
  hitCloudCounter('share_opens');
  hitCloudCounter(`d_${dateKey}_share`);
  sendGaEvent('share_open');
};

export const trackLyricsOpen = (track: Track, albumTitle?: string): void => {
  if (isOwnerTrackingExcluded()) return;
  const dateKey = getTodayDateKey();
  recordEvent('lyrics_open', track, albumTitle);
  hitCloudCounter('lyrics_opens');
  hitCloudCounter(`lyrics_${track.id}`);
  hitCloudCounter(`d_${dateKey}_lyrics`);
  sendGaEvent('lyrics_open', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackLyricsCopy = (track: Track, albumTitle?: string): void => {
  if (isOwnerTrackingExcluded()) return;
  recordEvent('lyrics_copy', track, albumTitle);
  hitCloudCounter('lyrics_copies');
  sendGaEvent('lyrics_copy', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackOutboundClick = (
  platform: 'spotify' | 'suno',
  trackOrAlbumTitle?: string
): void => {
  if (isOwnerTrackingExcluded()) return;
  recordEvent(
    platform === 'spotify' ? 'outbound_spotify' : 'outbound_suno',
    undefined,
    trackOrAlbumTitle
  );
  hitCloudCounter(platform === 'spotify' ? 'outbound_spotify' : 'outbound_suno');
  sendGaEvent('outbound_click', {
    platform,
    item_title: trackOrAlbumTitle || '',
  });
};

export const trackDisplayModeChange = (mode: 'carousel' | 'sleeve' | 'editorial'): void => {
  if (isOwnerTrackingExcluded()) return;
  const snap = loadLocalAnalytics();
  if (mode === 'carousel') snap.audience.interactions.modeCarousel += 1;
  if (mode === 'sleeve') snap.audience.interactions.modeSleeve += 1;
  if (mode === 'editorial') snap.audience.interactions.modeEditorial += 1;
  saveLocalAnalytics(snap);
  hitCloudCounter(`mode_${mode}`);
  sendGaEvent('display_mode_change', { mode });
};

export const trackSongPlay = (track: Track, albumTitle?: string): void => {
  if (!track?.id || isOwnerTrackingExcluded()) return;
  const nowObj = new Date();
  const dateKey = getTodayDateKey(nowObj);
  const slot = detectTimeSlot(nowObj);

  recordEvent('track_play', track, albumTitle);
  hitCloudCounter('total_plays');
  hitCloudCounter(`play_${track.id}`);
  hitCloudCounter(`d_${dateKey}_plays`);
  hitCloudCounter(`d_${dateKey}_p_${track.id}`);
  hitCloudCounter(`slot_${slot}`);
  sendGaEvent('song_play', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
    time_slot: slot,
  });
};

export const trackSongStream30s = (track: Track, albumTitle?: string): void => {
  if (!track?.id || isOwnerTrackingExcluded()) return;
  const dateKey = getTodayDateKey();
  recordEvent('track_stream_30s', track, albumTitle);
  hitCloudCounter('total_streams_30s');
  hitCloudCounter(`stream30_${track.id}`);
  hitCloudCounter(`d_${dateKey}_s30`);
  hitCloudCounter(`d_${dateKey}_s30_${track.id}`);
  sendGaEvent('song_stream_30s', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

export const trackSongComplete = (track: Track, albumTitle?: string): void => {
  if (!track?.id || isOwnerTrackingExcluded()) return;
  const dateKey = getTodayDateKey();
  recordEvent('track_complete', track, albumTitle);
  hitCloudCounter('total_completes');
  hitCloudCounter(`complete_${track.id}`);
  hitCloudCounter(`d_${dateKey}_comp`);
  hitCloudCounter(`d_${dateKey}_c_${track.id}`);
  sendGaEvent('song_complete', {
    track_id: track.id,
    track_title: track.title,
    album_title: albumTitle || '',
  });
};

/**
 * Generates an array of YYYY-MM-DD strings between startDate and endDate (inclusive, max 62 days).
 */
export const getDateRangeKeys = (startDate: string, endDate: string): string[] => {
  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [getTodayDateKey()];
  }
  const cur = new Date(start);
  let guard = 0;
  while (cur <= end && guard < 62) {
    result.push(getTodayDateKey(cur));
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return result;
};

/**
 * Builds a complete, coherent daily series from `snapshot.daily` for any array of dateKeys
 * synchronously (0 network latency, immune to 429 rate-limits).
 */
export const buildDailySeriesFromSnapshot = (
  snapshot: AnalyticsSnapshot,
  dateKeys: string[]
): DailyStatsBucket[] => {
  return dateKeys.map((dk) => {
    const existing = snapshot.daily[dk];
    const base = HISTORICAL_DAILY_BASELINE[dk] || getEmptyDailyBucket(dk);
    return mergeDailyBuckets(base, existing);
  });
};

/**
 * Rate-limit-safe cloud synchronization:
 * Fetches global counters + recent days + per-track plays in throttled batches so Abacus never returns 429,
 * reconciles today's bucket with any delta in global totals, and persists everything to localStorage.
 */
export const fetchMergedAnalytics = async (albums: AlbumData[]): Promise<AnalyticsSnapshot> => {
  const local = loadLocalAnalytics();

  // Batch 1: Core global KPIs (7 requests)
  const [
    cloudVisits,
    cloudEpk,
    cloudShare,
    cloudLyrics,
    cloudPlays,
    cloudStreams30,
    cloudCompletes,
  ] = await Promise.all([
    getCloudCounterSafe('site_visits'),
    getCloudCounterSafe('epk_views'),
    getCloudCounterSafe('share_opens'),
    getCloudCounterSafe('lyrics_opens'),
    getCloudCounterSafe('total_plays'),
    getCloudCounterSafe('total_streams_30s'),
    getCloudCounterSafe('total_completes'),
  ]);

  // Batch 2: Today & Yesterday daily cloud counters (12 requests)
  const todayObj = new Date();
  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(todayObj.getDate() - 1);
  const recentKeys = [getTodayDateKey(yesterdayObj), getTodayDateKey(todayObj)];

  const recentDailyCloud = await runInBatches(recentKeys, 2, 120, async (dk) => {
    const [v, p, s30, c, l, epk] = await Promise.all([
      getCloudCounterSafe(`d_${dk}_visits`),
      getCloudCounterSafe(`d_${dk}_plays`),
      getCloudCounterSafe(`d_${dk}_s30`),
      getCloudCounterSafe(`d_${dk}_comp`),
      getCloudCounterSafe(`d_${dk}_lyrics`),
      getCloudCounterSafe(`d_${dk}_epk`),
    ]);
    return { dk, v, p, s30, c, l, epk };
  });

  const mergedDaily: Record<string, DailyStatsBucket> = { ...local.daily };
  for (const item of recentDailyCloud) {
    const prev = mergedDaily[item.dk] || HISTORICAL_DAILY_BASELINE[item.dk] || getEmptyDailyBucket(item.dk);
    mergedDaily[item.dk] = mergeDailyBuckets(prev, {
      date: item.dk,
      siteVisits: item.v ?? prev.siteVisits,
      totalPlays: item.p ?? prev.totalPlays,
      totalStreams30s: item.s30 ?? prev.totalStreams30s,
      totalCompletes: item.c ?? prev.totalCompletes,
      lyricsOpens: item.l ?? prev.lyricsOpens,
      epkViews: item.epk ?? prev.epkViews,
    });
  }

  // Batch 3: Per-track cloud counters in safe small batches (5 tracks at a time with 180ms pause)
  const allTracks: Track[] = [];
  albums.forEach((alb) => {
    alb.tracks.forEach((t) => allTracks.push(t));
  });

  const trackEntries = await runInBatches(allTracks, 4, 180, async (t) => {
    const [p, s30, c, lyr] = await Promise.all([
      getCloudCounterSafe(`play_${t.id}`),
      getCloudCounterSafe(`stream30_${t.id}`),
      getCloudCounterSafe(`complete_${t.id}`),
      getCloudCounterSafe(`lyrics_${t.id}`),
    ]);
    const loc = local.tracks[t.id] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
    return [
      t.id,
      {
        plays: Math.max(p ?? 0, loc.plays),
        streams30s: Math.max(s30 ?? 0, loc.streams30s),
        completes: Math.max(c ?? 0, loc.completes),
        lyricsOpens: Math.max(lyr ?? 0, loc.lyricsOpens || 0),
      },
    ] as const;
  });

  const mergedTracks: Record<string, TrackStats> = { ...local.tracks };
  let sumTrackPlays = 0;
  let sumTrackStreams30 = 0;
  let sumTrackCompletes = 0;
  let sumTrackLyrics = 0;

  for (const [tid, stats] of trackEntries) {
    mergedTracks[tid] = stats;
    sumTrackPlays += stats.plays;
    sumTrackStreams30 += stats.streams30s;
    sumTrackCompletes += stats.completes;
    sumTrackLyrics += stats.lyricsOpens;
  }

  const finalSiteVisits = Math.max(cloudVisits ?? 0, local.siteVisits);
  const finalTotalPlays = Math.max(cloudPlays ?? 0, local.totalPlays, sumTrackPlays);
  const finalStreams30 = Math.max(cloudStreams30 ?? 0, local.totalStreams30s, sumTrackStreams30);
  const finalCompletes = Math.max(cloudCompletes ?? 0, local.totalCompletes, sumTrackCompletes);
  const finalLyrics = Math.max(cloudLyrics ?? 0, local.lyricsOpens, sumTrackLyrics);
  const finalEpk = Math.max(cloudEpk ?? 0, local.epkViews);
  const finalShare = Math.max(cloudShare ?? 0, local.shareOpens);

  // Reconcile today's bucket if global totals exceed the sum of daily buckets so daily series and All-Time always match
  const todayKey = getTodayDateKey(todayObj);
  const todayBucket = mergedDaily[todayKey] || getEmptyDailyBucket(todayKey);
  let sumDailyVisitsOther = 0;
  let sumDailyPlaysOther = 0;
  let sumDailyS30Other = 0;
  let sumDailyCompOther = 0;
  let sumDailyLyricsOther = 0;

  for (const [dk, b] of Object.entries(mergedDaily)) {
    if (dk === todayKey) continue;
    sumDailyVisitsOther += b.siteVisits || 0;
    sumDailyPlaysOther += b.totalPlays || 0;
    sumDailyS30Other += b.totalStreams30s || 0;
    sumDailyCompOther += b.totalCompletes || 0;
    sumDailyLyricsOther += b.lyricsOpens || 0;
  }

  todayBucket.siteVisits = Math.max(todayBucket.siteVisits, finalSiteVisits - sumDailyVisitsOther);
  todayBucket.totalPlays = Math.max(todayBucket.totalPlays, finalTotalPlays - sumDailyPlaysOther);
  todayBucket.totalStreams30s = Math.max(todayBucket.totalStreams30s, finalStreams30 - sumDailyS30Other);
  todayBucket.totalCompletes = Math.max(todayBucket.totalCompletes, finalCompletes - sumDailyCompOther);
  todayBucket.lyricsOpens = Math.max(todayBucket.lyricsOpens, finalLyrics - sumDailyLyricsOther);

  // Also reconcile per-track totals into todayBucket.tracks if any track has more global plays than summed across previous days
  for (const [tid, globalSt] of Object.entries(mergedTracks)) {
    let otherPlays = 0;
    let otherS30 = 0;
    let otherComp = 0;
    let otherLyr = 0;
    for (const [dk, b] of Object.entries(mergedDaily)) {
      if (dk === todayKey) continue;
      const st = b.tracks?.[tid];
      if (st) {
        otherPlays += st.plays || 0;
        otherS30 += st.streams30s || 0;
        otherComp += st.completes || 0;
        otherLyr += st.lyricsOpens || 0;
      }
    }
    const curTodayTrack = todayBucket.tracks[tid] || {
      plays: 0,
      streams30s: 0,
      completes: 0,
      lyricsOpens: 0,
    };
    const remPlays = Math.max(curTodayTrack.plays, globalSt.plays - otherPlays);
    const remS30 = Math.max(curTodayTrack.streams30s, globalSt.streams30s - otherS30);
    const remComp = Math.max(curTodayTrack.completes, globalSt.completes - otherComp);
    const remLyr = Math.max(curTodayTrack.lyricsOpens, globalSt.lyricsOpens - otherLyr);
    if (remPlays > 0 || remS30 > 0 || remComp > 0 || remLyr > 0) {
      todayBucket.tracks[tid] = {
        plays: remPlays,
        streams30s: remS30,
        completes: remComp,
        lyricsOpens: remLyr,
      };
    }
  }

  mergedDaily[todayKey] = todayBucket;

  const merged: AnalyticsSnapshot = {
    ...local,
    siteVisits: finalSiteVisits,
    epkViews: finalEpk,
    shareOpens: finalShare,
    lyricsOpens: finalLyrics,
    totalPlays: finalTotalPlays,
    totalStreams30s: finalStreams30,
    totalCompletes: finalCompletes,
    tracks: mergedTracks,
    daily: mergedDaily,
    lastUpdated: new Date().toISOString(),
  };

  saveLocalAnalytics(merged);
  return merged;
};
