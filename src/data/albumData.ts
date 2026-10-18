import albumsJson from './albums.json';

export interface Track {
  id: string;
  number: number;
  title: string;
  spotifyId: string;
  spotifyUri: string;
  spotifyUrl: string;
  sunoId?: string;
  sunoUrl?: string;
  duration: string;
  durationSeconds: number;
  mood: string;
  storyQuote: string;
  audioSrc: string;
  canvasVideoSrc?: string;
  artworkUrl?: string;
  colorDark: string; // Vibrant saturated background in dark mode
  colorLight: string; // Clean tone in light mode
  highlight?: boolean;
  lyrics?: string; // Full song lyrics / testo del brano
}

export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: string;
  releaseDate: string;
  genre: string;
  spotifyAlbumId?: string;
  spotifyAlbumUri?: string;
  spotifyAlbumUrl?: string;
  spotifyArtistUrl?: string;
  sunoAlbumId?: string;
  sunoAlbumUrl?: string;
  coverUrl: string;
  canvasVideoSrc?: string; // Video Canvas unico continuo per l'intero album
  tagline: string;
  synopsis: string;
  tracks: Track[];
  credits: {
    production: string;
    lyricsAndMusic: string;
    mixAndMaster: string;
    artwork: string;
    label: string;
  };
}

export const resolveAssetUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl;
  if (url.includes('/audio/track-') && url.endsWith('.wav')) {
    url = url.replace(/\.wav$/, '.m4a');
  }
  if (url.includes('imagesartwork-fette/Progetto_senza_titolo__6_.png')) {
    url = '/images/artwork-fette/track-11.jpeg';
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  let resolved = url;
  if (cleanBase !== '/' && (url.startsWith(cleanBase) || url.startsWith(base))) {
    resolved = url;
  } else {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const baseWithoutSlash = cleanBase.startsWith('/') ? cleanBase.slice(1) : cleanBase;
    if (baseWithoutSlash && cleanUrl.startsWith(baseWithoutSlash)) {
      resolved = `/${cleanUrl}`;
    } else {
      resolved = `${cleanBase}${cleanUrl}`;
    }
  }

  if (resolved.includes('/audio-fette/') && !resolved.includes('?v=')) {
    resolved = `${resolved}?v=5`;
  }
  return resolved;
};

export const normalizeAlbum = (album: AlbumData): AlbumData => ({
  ...album,
  coverUrl: resolveAssetUrl(album.coverUrl),
  canvasVideoSrc: album.canvasVideoSrc ? resolveAssetUrl(album.canvasVideoSrc) : undefined,
  tracks: album.tracks.map((track) => ({
    ...track,
    audioSrc: resolveAssetUrl(track.audioSrc),
    canvasVideoSrc: track.canvasVideoSrc ? resolveAssetUrl(track.canvasVideoSrc) : undefined,
    artworkUrl: track.artworkUrl ? resolveAssetUrl(track.artworkUrl) : undefined,
  }))
});

export const DISCOGRAPHY: AlbumData[] = (albumsJson as AlbumData[]).map(normalizeAlbum);
export const ALBUM_DATA: AlbumData = DISCOGRAPHY[0];
export const ALBUM_FETTE_BISCOTTATE: AlbumData = DISCOGRAPHY[1] || DISCOGRAPHY[0];
