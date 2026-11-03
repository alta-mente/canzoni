import { AlbumData, Track } from '../data/albumData';

const CLOUD_NAMESPACE = 'arocchi-canzoni-prod-2026';
const CLOUD_BASE_URL = 'https://abacus.jasoncameron.dev';
const STORAGE_KEY = 'antigravity_analytics_v1';
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

const getEmptyAudience = (): AudienceBreakdown => ({
  devices: { mobile: 0, desktop: 0, tablet: 0 },
  sources: { direct: 0, search: 0, social: 0, music: 0 },
  timeSlots: { morning: 0, afternoon: 0, evening: 0, night: 0 },
  interactions: {
    lyricsCopies: 0,
    spotifyClicks: 0,
    sunoClicks: 0,
    modeCarousel: 0,
    modeSleeve: 0,
    modeEditorial: 0,
  },
});

const getEmptyDailyBucket = (date: string): DailyStatsBucket => ({
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

const getEmptySnapshot = (): AnalyticsSnapshot => ({
  siteVisits: 0,
  epkViews: 0,
  shareOpens: 0,
  lyricsOpens: 0,
  totalPlays: 0,
  totalStreams30s: 0,
  totalCompletes: 0,
  tracks: {},
  daily: {},
  audience: getEmptyAudience(),
  recentEvents: [],
  gaMeasurementId:
    (typeof window !== 'undefined' && localStorage.getItem(GA_STORAGE_KEY)) ||
    DEFAULT_GA_MEASUREMENT_ID,
  lastUpdated: new Date().toISOString(),
});

export const loadLocalAnalytics = (): AnalyticsSnapshot => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const empty = getEmptySnapshot();
      return {
        ...empty,
        ...parsed,
        daily: parsed.daily || {},
        audience: {
          devices: { ...empty.audience.devices, ...(parsed.audience?.devices || {}) },
          sources: { ...empty.audience.sources, ...(parsed.audience?.sources || {}) },
          timeSlots: { ...empty.audience.timeSlots, ...(parsed.audience?.timeSlots || {}) },
          interactions: {
            ...empty.audience.interactions,
            ...(parsed.audience?.interactions || {}),
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
 * Generates an array of YYYY-MM-DD strings between startDate and endDate (inclusive, max 60 days).
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
 * Fetches daily cloud counters for a specific list of YYYY-MM-DD dates so the dashboard can
 * filter and plot daily charts across any date range.
 */
export const fetchDailySeriesFromCloud = async (
  dateKeys: string[]
): Promise<DailyStatsBucket[]> => {
  const local = loadLocalAnalytics();
  const buckets = await Promise.all(
    dateKeys.map(async (dk) => {
      const [v, p, s30, c, l, epk] = await Promise.all([
        getCloudCounter(`d_${dk}_visits`),
        getCloudCounter(`d_${dk}_plays`),
        getCloudCounter(`d_${dk}_s30`),
        getCloudCounter(`d_${dk}_comp`),
        getCloudCounter(`d_${dk}_lyrics`),
        getCloudCounter(`d_${dk}_epk`),
      ]);
      const loc = local.daily[dk] || getEmptyDailyBucket(dk);
      return {
        date: dk,
        siteVisits: Math.max(v, loc.siteVisits),
        totalPlays: Math.max(p, loc.totalPlays),
        totalStreams30s: Math.max(s30, loc.totalStreams30s),
        totalCompletes: Math.max(c, loc.totalCompletes),
        lyricsOpens: Math.max(l, loc.lyricsOpens),
        epkViews: Math.max(epk, loc.epkViews),
        shareOpens: loc.shareOpens || 0,
        tracks: loc.tracks || {},
      };
    })
  );
  return buckets;
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
    devMobile,
    devDesktop,
    devTablet,
    srcDirect,
    srcSearch,
    srcSocial,
    srcMusic,
    slotMorning,
    slotAfternoon,
    slotEvening,
    slotNight,
    lyricsCopies,
    spotifyClicks,
    sunoClicks,
    modeCarousel,
    modeSleeve,
    modeEditorial,
  ] = await Promise.all([
    getCloudCounter('site_visits'),
    getCloudCounter('epk_views'),
    getCloudCounter('share_opens'),
    getCloudCounter('lyrics_opens'),
    getCloudCounter('total_plays'),
    getCloudCounter('total_streams_30s'),
    getCloudCounter('total_completes'),
    getCloudCounter('dev_mobile'),
    getCloudCounter('dev_desktop'),
    getCloudCounter('dev_tablet'),
    getCloudCounter('src_direct'),
    getCloudCounter('src_search'),
    getCloudCounter('src_social'),
    getCloudCounter('src_music'),
    getCloudCounter('slot_morning'),
    getCloudCounter('slot_afternoon'),
    getCloudCounter('slot_evening'),
    getCloudCounter('slot_night'),
    getCloudCounter('lyrics_copies'),
    getCloudCounter('outbound_spotify'),
    getCloudCounter('outbound_suno'),
    getCloudCounter('mode_carousel'),
    getCloudCounter('mode_sleeve'),
    getCloudCounter('mode_editorial'),
  ]);

  const allTracks: Track[] = [];
  albums.forEach((alb) => {
    alb.tracks.forEach((t) => allTracks.push(t));
  });

  const trackEntries = await Promise.all(
    allTracks.map(async (t) => {
      const [p, s30, c, lyr] = await Promise.all([
        getCloudCounter(`play_${t.id}`),
        getCloudCounter(`stream30_${t.id}`),
        getCloudCounter(`complete_${t.id}`),
        getCloudCounter(`lyrics_${t.id}`),
      ]);
      const loc = local.tracks[t.id] || { plays: 0, streams30s: 0, completes: 0, lyricsOpens: 0 };
      return [
        t.id,
        {
          plays: Math.max(p, loc.plays),
          streams30s: Math.max(s30, loc.streams30s),
          completes: Math.max(c, loc.completes),
          lyricsOpens: Math.max(lyr, loc.lyricsOpens || 0),
        },
      ] as const;
    })
  );

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

  // Also fetch last 7 days daily series
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const last7Keys = getDateRangeKeys(getTodayDateKey(sevenDaysAgo), getTodayDateKey(today));
  const last7Buckets = await fetchDailySeriesFromCloud(last7Keys);
  const mergedDaily: Record<string, DailyStatsBucket> = { ...local.daily };
  for (const b of last7Buckets) {
    mergedDaily[b.date] = b;
  }

  const mergedAudience: AudienceBreakdown = {
    devices: {
      mobile: Math.max(devMobile, local.audience.devices.mobile),
      desktop: Math.max(devDesktop, local.audience.devices.desktop),
      tablet: Math.max(devTablet, local.audience.devices.tablet),
    },
    sources: {
      direct: Math.max(srcDirect, local.audience.sources.direct),
      search: Math.max(srcSearch, local.audience.sources.search),
      social: Math.max(srcSocial, local.audience.sources.social),
      music: Math.max(srcMusic, local.audience.sources.music),
    },
    timeSlots: {
      morning: Math.max(slotMorning, local.audience.timeSlots.morning),
      afternoon: Math.max(slotAfternoon, local.audience.timeSlots.afternoon),
      evening: Math.max(slotEvening, local.audience.timeSlots.evening),
      night: Math.max(slotNight, local.audience.timeSlots.night),
    },
    interactions: {
      lyricsCopies: Math.max(lyricsCopies, local.audience.interactions.lyricsCopies),
      spotifyClicks: Math.max(spotifyClicks, local.audience.interactions.spotifyClicks),
      sunoClicks: Math.max(sunoClicks, local.audience.interactions.sunoClicks),
      modeCarousel: Math.max(modeCarousel, local.audience.interactions.modeCarousel),
      modeSleeve: Math.max(modeSleeve, local.audience.interactions.modeSleeve),
      modeEditorial: Math.max(modeEditorial, local.audience.interactions.modeEditorial),
    },
  };

  const merged: AnalyticsSnapshot = {
    ...local,
    siteVisits: Math.max(cloudVisits, local.siteVisits, 1),
    epkViews: Math.max(cloudEpk, local.epkViews),
    shareOpens: Math.max(cloudShare, local.shareOpens),
    lyricsOpens: Math.max(cloudLyrics, local.lyricsOpens, sumTrackLyrics),
    totalPlays: Math.max(cloudPlays, local.totalPlays, sumTrackPlays),
    totalStreams30s: Math.max(cloudStreams30, local.totalStreams30s, sumTrackStreams30),
    totalCompletes: Math.max(cloudCompletes, local.totalCompletes, sumTrackCompletes),
    tracks: mergedTracks,
    daily: mergedDaily,
    audience: mergedAudience,
    lastUpdated: new Date().toISOString(),
  };

  saveLocalAnalytics(merged);
  return merged;
};
