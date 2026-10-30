import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const SITE_URL = 'https://alta-mente.github.io/canzoni';

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveFullUrl(assetPath) {
  if (!assetPath) return `${SITE_URL}/images/albums/una-vertigine-cover.jpeg`;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const clean = assetPath.replace(/^\/+/, '');
  return `${SITE_URL}/${clean}`;
}

const albums = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/data/albums.json'), 'utf8'));

// Build list of all 51 URLs (1 Home + 1 Bio + 3 Albums + 23 Songs + 23 Lyrics pages)
const urls = [`${SITE_URL}/`, `${SITE_URL}/bio/`];

const albumEntries = [];
const trackEntries = [];
const usedTrackSlugs = new Set();

for (const album of albums) {
  const albumSlug = slugify(album.id || album.title);
  const albumUrl = `${SITE_URL}/album/${albumSlug}/`;
  urls.push(albumUrl);
  albumEntries.push({ album, albumSlug, albumUrl });

  for (const track of album.tracks || []) {
    let trackSlug = slugify(track.title);
    if (usedTrackSlugs.has(trackSlug)) {
      trackSlug = `${trackSlug}-${albumSlug}`;
    }
    usedTrackSlugs.add(trackSlug);
    const trackUrl = `${SITE_URL}/brano/${trackSlug}/`;
    const lyricsUrl = `${SITE_URL}/testo/${trackSlug}/`;
    urls.push(trackUrl);
    urls.push(lyricsUrl);
    trackEntries.push({ track, album, albumSlug, trackSlug, trackUrl, lyricsUrl });
  }
}

// 1. Generate sitemap.xml and sitemap.txt in public/ (and dist/ if present)
const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((u, idx) => {
    const priority = idx === 0 ? '1.0' : u.includes('/album/') || u.endsWith('/bio/') ? '0.9' : '0.8';
    return [
      '  <url>',
      `    <loc>${u}</loc>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }),
  '</urlset>',
  '',
].join('\n');

const sitemapTxt = urls.join('\n') + '\n';

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(publicDir, 'sitemap.txt'), sitemapTxt, 'utf8');

if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(distDir, 'sitemap.txt'), sitemapTxt, 'utf8');

  const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  function buildPageHtml({ title, description, canonicalUrl, imageUrl, jsonLd, routeConfig, staticBodyHtml }) {
    let html = baseHtml;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}" />`
    );
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );
    html = html.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );
    html = html.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(title)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(description)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${imageUrl}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${imageUrl}" />`
    );
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n    <script>window.__INITIAL_SEO_ROUTE__ = ${JSON.stringify(routeConfig)};</script>`
    );
    html = html.replace(
      /<div id="root">[\s\S]*?<\/main>\s*<\/div>/i,
      `<div id="root">\n${staticBodyHtml}\n    </div>`
    );
    return html;
  }

  // 2. Generate /bio/index.html
  const bioDir = path.join(distDir, 'bio');
  fs.mkdirSync(bioDir, { recursive: true });
  const bioHtml = buildPageHtml({
    title: 'Alessandro Rocchi — Biografia Ufficiale, Comunicati Stampa ed Electronic Press Kit (EPK)',
    description:
      'Biografia ufficiale di Alessandro Rocchi, cantautore e produttore italiano. Comunicati stampa, discografia completa (Una Vertigine, Le Cose Che Tornano A Galla, Non C\'è Vita Su Marte) e contatti stampa.',
    canonicalUrl: `${SITE_URL}/bio/`,
    imageUrl: `${SITE_URL}/images/albums/una-vertigine-cover.jpeg`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'MusicGroup',
        name: 'Alessandro Rocchi',
        url: `${SITE_URL}/`,
        genre: ['Cantautorato italiano', 'Indie Pop', 'Alternative Pop'],
      },
    },
    routeConfig: { view: 'epk' },
    staticBodyHtml: `      <main style="color:#f5f5f7;background:#030407;padding:2rem;font-family:sans-serif;">
        <h1>Alessandro Rocchi — Biografia ed Electronic Press Kit (EPK)</h1>
        <p>Cantautore e produttore italiano. Scopri la biografia ufficiale, i comunicati stampa e la discografia completa.</p>
        <p><a href="${SITE_URL}/">Torna al Player Discografia Completa</a></p>
      </main>`,
  });
  fs.writeFileSync(path.join(bioDir, 'index.html'), bioHtml, 'utf8');

  // 3. Generate /album/<slug>/index.html for each album
  for (const { album, albumSlug, albumUrl } of albumEntries) {
    const dir = path.join(distDir, 'album', albumSlug);
    fs.mkdirSync(dir, { recursive: true });
    const coverUrl = resolveFullUrl(album.coverArt);
    const tracksForAlbum = trackEntries.filter((t) => t.album.id === album.id);

    const albumHtml = buildPageHtml({
      title: `${album.title} — Alessandro Rocchi (Album Ufficiale, Tracklist e Testi)`,
      description: `Ascolta l'album "${album.title}" di Alessandro Rocchi (${album.releaseYear || '2026'}). Tracklist completa di tutti i ${tracksForAlbum.length} brani, testi ufficiali e streaming audio.`,
      canonicalUrl: albumUrl,
      imageUrl: coverUrl,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'MusicAlbum',
        name: album.title,
        url: albumUrl,
        image: coverUrl,
        datePublished: String(album.releaseYear || '2026'),
        byArtist: {
          '@type': 'MusicGroup',
          name: 'Alessandro Rocchi',
          url: `${SITE_URL}/`,
        },
        numTracks: tracksForAlbum.length,
        track: tracksForAlbum.map((t, i) => ({
          '@type': 'MusicRecording',
          position: i + 1,
          name: t.track.title,
          url: t.trackUrl,
        })),
      },
      routeConfig: { view: 'player', albumId: album.id },
      staticBodyHtml: `      <main style="color:#f5f5f7;background:#030407;padding:2rem;font-family:sans-serif;">
        <h1>${escapeHtml(album.title)} — Alessandro Rocchi</h1>
        <p>${escapeHtml(album.subtitle || '')} (${escapeHtml(album.releaseYear || '2026')})</p>
        <h2>Tracklist e Testi</h2>
        <ol>
${tracksForAlbum.map((t) => `          <li><a href="${t.trackUrl}">${escapeHtml(t.track.title)}</a> — <a href="${t.lyricsUrl}">Testo / Lyrics</a> (${escapeHtml(t.track.duration || '')})</li>`).join('\n')}
        </ol>
        <p><a href="${SITE_URL}/">Discografia completa di Alessandro Rocchi</a> | <a href="${SITE_URL}/bio/">Biografia & EPK</a></p>
      </main>`,
    });
    fs.writeFileSync(path.join(dir, 'index.html'), albumHtml, 'utf8');
  }

  // 4. Generate /brano/<slug>/index.html AND /testo/<slug>/index.html for each of the 23 tracks
  for (const { track, album, albumSlug, trackSlug, trackUrl, lyricsUrl } of trackEntries) {
    const branoDir = path.join(distDir, 'brano', trackSlug);
    const testoDir = path.join(distDir, 'testo', trackSlug);
    fs.mkdirSync(branoDir, { recursive: true });
    fs.mkdirSync(testoDir, { recursive: true });

    const imageUrl = resolveFullUrl(track.coverImage || album.coverArt);
    const lyricsSnippet = track.lyrics
      ? track.lyrics.replace(/\s+/g, ' ').trim().slice(0, 140) + '...'
      : '';

    const sharedJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: track.title,
      url: trackUrl,
      image: imageUrl,
      inAlbum: {
        '@type': 'MusicAlbum',
        name: album.title,
        url: `${SITE_URL}/album/${albumSlug}/`,
      },
      byArtist: {
        '@type': 'MusicGroup',
        name: 'Alessandro Rocchi',
        url: `${SITE_URL}/`,
      },
      ...(track.lyrics
        ? {
            recordingOf: {
              '@type': 'MusicComposition',
              name: track.title,
              composer: { '@type': 'Person', name: 'Alessandro Rocchi' },
              lyrics: {
                '@type': 'CreativeWork',
                text: track.lyrics,
              },
            },
          }
        : {}),
    };

    const staticBody = `      <main style="color:#f5f5f7;background:#030407;padding:2rem;font-family:sans-serif;">
        <article>
          <h1>${escapeHtml(track.title)} — Alessandro Rocchi (Testo e Audio Ufficiale)</h1>
          <p>Brano tratto dall'album <a href="${SITE_URL}/album/${albumSlug}/">${escapeHtml(album.title)}</a> (${escapeHtml(album.releaseYear || '2026')}) — Durata: ${escapeHtml(track.duration || '')}</p>
          ${track.lyrics ? `<h2>Testo (Lyrics) di ${escapeHtml(track.title)}</h2>\n          <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(track.lyrics)}</pre>` : ''}
          <p><a href="${trackUrl}">Ascolta ${escapeHtml(track.title)}</a> | <a href="${lyricsUrl}">Leggi Testo / Lyrics</a> | <a href="${SITE_URL}/album/${albumSlug}/">Album ${escapeHtml(album.title)}</a> | <a href="${SITE_URL}/">Discografia Completa</a></p>
        </article>
      </main>`;

    // /brano/<slug>/
    const trackHtml = buildPageHtml({
      title: `${track.title} — Alessandro Rocchi (Ascolta Brano e Testo | ${album.title})`,
      description: `Ascolta "${track.title}" di Alessandro Rocchi (dall'album "${album.title}") e leggi il testo ufficiale. ${lyricsSnippet}`.trim(),
      canonicalUrl: trackUrl,
      imageUrl,
      jsonLd: sharedJsonLd,
      routeConfig: { view: 'player', albumId: album.id, trackId: track.id, openLyrics: false },
      staticBodyHtml: staticBody,
    });
    fs.writeFileSync(path.join(branoDir, 'index.html'), trackHtml, 'utf8');

    // /testo/<slug>/ (automatically opens Lyrics Modal in React player!)
    const lyricsHtml = buildPageHtml({
      title: `Testo ${track.title} — Alessandro Rocchi (Lyrics Ufficiali | ${album.title})`,
      description: `Testo ufficiale (lyrics) di "${track.title}", canzone di Alessandro Rocchi tratta dall'album "${album.title}". ${lyricsSnippet}`.trim(),
      canonicalUrl: lyricsUrl,
      imageUrl,
      jsonLd: {
        ...sharedJsonLd,
        url: lyricsUrl,
      },
      routeConfig: { view: 'player', albumId: album.id, trackId: track.id, openLyrics: true },
      staticBodyHtml: staticBody,
    });
    fs.writeFileSync(path.join(testoDir, 'index.html'), lyricsHtml, 'utf8');
  }

  // 5. Update root dist/index.html static fallback with links to all albums, tracks, lyrics, and bio
  const rootLinksHtml = `      <main style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h1>Alessandro Rocchi — Discografia Ufficiale, Canzoni, Testi (Lyrics) e Bio</h1>
        <p><a href="${SITE_URL}/bio/">Biografia ed Electronic Press Kit (EPK) di Alessandro Rocchi</a></p>
${albumEntries
  .map(({ album, albumUrl }) => {
    const tList = trackEntries.filter((t) => t.album.id === album.id);
    return `        <section>
          <h2><a href="${albumUrl}">${escapeHtml(album.title)} (${escapeHtml(album.releaseYear || '2026')})</a></h2>
          <ul>
${tList.map((t) => `            <li><a href="${t.trackUrl}">${escapeHtml(t.track.title)}</a> — <a href="${t.lyricsUrl}">Testo (Lyrics) di ${escapeHtml(t.track.title)}</a></li>`).join('\n')}
          </ul>
        </section>`;
  })
  .join('\n')}
      </main>`;

  const updatedRootHtml = baseHtml.replace(
    /<div id="root">[\s\S]*?<\/main>\s*<\/div>/i,
    `<div id="root">\n${rootLinksHtml}\n    </div>`
  );
  fs.writeFileSync(path.join(distDir, 'index.html'), updatedRootHtml, 'utf8');
}

console.log(`Generated SEO sitemap with ${urls.length} URLs (${albumEntries.length} albums, ${trackEntries.length} tracks + ${trackEntries.length} lyrics pages).`);
