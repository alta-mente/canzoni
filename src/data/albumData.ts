import albumsJson from './albums.json';

export interface Track {
  id: string;
  number: number;
  title: string;
  spotifyId: string;
  spotifyUri: string;
  spotifyUrl: string;
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

export const resolveAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  // Avoid double-prepending if url already starts with base
  if (cleanBase !== '/' && (url.startsWith(cleanBase) || url.startsWith(base))) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const baseWithoutSlash = cleanBase.startsWith('/') ? cleanBase.slice(1) : cleanBase;
  if (baseWithoutSlash && cleanUrl.startsWith(baseWithoutSlash)) {
    return `/${cleanUrl}`;
  }
  return `${cleanBase}${cleanUrl}`;
};

const normalizeAlbum = (album: AlbumData): AlbumData => ({
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
