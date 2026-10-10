import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function backofficeApiPlugin(): Plugin {
  return {
    name: 'backoffice-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // 1. GET /api/albums
        if ((pathname === '/api/albums' || pathname.endsWith('/api/albums')) && req.method === 'GET') {
          const filePath = path.resolve(__dirname, 'src/data/albums.json');
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'albums.json not found' }));
          }
          return;
        }

        // 2. POST /api/albums
        if ((pathname === '/api/albums' || pathname.endsWith('/api/albums')) && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const albums = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'src/data/albums.json');
              fs.writeFileSync(filePath, JSON.stringify(albums, null, 2), 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: albums.length }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        // 3. POST /api/upload
        if ((pathname === '/api/upload' || pathname.endsWith('/api/upload')) && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const { filename, targetFolder = 'uploads', base64Data } = JSON.parse(body);
              if (!filename || !base64Data) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing filename or base64Data' }));
                return;
              }

              // Sanitize targetFolder (avoid traversal)
              const safeFolder = targetFolder.replace(/[^a-zA-Z0-9_-]/g, '');
              const publicDir = path.resolve(__dirname, 'public', safeFolder);
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
              }

              // Clean filename
              const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
              const targetPath = path.join(publicDir, safeFilename);

              // Extract base64 buffer
              const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(base64Clean, 'base64');
              fs.writeFileSync(targetPath, buffer);

              const publicUrl = `/${safeFolder}/${safeFilename}`;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                url: publicUrl,
                filename: safeFilename,
                size: buffer.length
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Upload failed' }));
            }
          });
          return;
        }

        // 4. GET /api/media
        if ((pathname === '/api/media' || pathname.endsWith('/api/media')) && req.method === 'GET') {
          const publicDir = path.resolve(__dirname, 'public');
          const results: Array<{
            name: string;
            url: string;
            folder: string;
            size: number;
            type: 'audio' | 'video' | 'image' | 'other';
            mtime: number;
          }> = [];

          const scanDir = (dir: string, relFolder: string) => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name.startsWith('.')) continue;
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                scanDir(fullPath, relFolder ? `${relFolder}/${entry.name}` : entry.name);
              } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                let type: 'audio' | 'video' | 'image' | 'other' = 'other';
                if (['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'].includes(ext)) {
                  type = 'audio';
                } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
                  type = 'video';
                } else if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)) {
                  type = 'image';
                }

                const stats = fs.statSync(fullPath);
                const fileUrl = relFolder ? `/${relFolder}/${entry.name}` : `/${entry.name}`;
                results.push({
                  name: entry.name,
                  url: fileUrl,
                  folder: relFolder || 'root',
                  size: stats.size,
                  type,
                  mtime: stats.mtimeMs
                });
              }
            }
          };

          scanDir(publicDir, '');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files: results }));
          return;
        }

        // 5. POST /api/import-suno
        if ((pathname === '/api/import-suno' || pathname.endsWith('/api/import-suno')) && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const { urlOrId } = JSON.parse(body);
              if (!urlOrId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing urlOrId' }));
                return;
              }
              const m = urlOrId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
              if (!m) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Nessun ID o link Suno valido trovato' }));
                return;
              }
              const songId = m[1];
              const https = await import('https');
              https.get(`https://suno.com/song/${songId}`, (sRes) => {
                let sData = '';
                sRes.on('data', (c) => sData += c);
                sRes.on('end', () => {
                  let lyrics = null;
                  const metaIdx = sData.indexOf('metadata\\":{');
                  if (metaIdx !== -1) {
                    const pIdx = sData.indexOf('prompt\\":\\"', metaIdx);
                    if (pIdx !== -1) {
                      const start = pIdx + 'prompt\\":\\"'.length;
                      const endMatch = sData.slice(start).match(/\\",\\"(type|edited_clip_id|gpt_description_prompt|refund_credits|stream|cover_clip_id)/);
                      if (endMatch) {
                        const raw = sData.slice(start, start + endMatch.index);
                        const parsed = raw
                          .replace(/\\\\n/g, '\n')
                          .replace(/\\n/g, '\n')
                          .replace(/\\\\"/g, '"')
                          .replace(/\\"/g, '"')
                          .replace(/&#x27;/g, "'")
                          .replace(/&quot;/g, '"')
                          .replace(/&amp;/g, '&')
                          .trim();
                        if (!parsed.startsWith('$') && parsed.length > 20) {
                          lyrics = parsed;
                        }
                      }
                    }
                  }
                  if (!lyrics) {
                    const streamMatches = [...sData.matchAll(/\\n([0-9a-f]+):T[0-9a-f]+,([\s\S]*?)(?=\\n[0-9a-f]+:|"\]\))/gi)];
                    for (const sm of streamMatches) {
                      const clean = sm[2]
                        .replace(/\\\\n/g, '\n')
                        .replace(/\\n/g, '\n')
                        .replace(/\\\\"/g, '"')
                        .replace(/\\"/g, '"')
                        .replace(/&#x27;/g, "'")
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .trim();
                      if (clean.length > 40 && clean.includes('\n')) {
                        lyrics = clean;
                        break;
                      }
                    }
                  }
                  if (lyrics) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, lyrics, songId }));
                  } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Testo non trovato per questo brano Suno' }));
                  }
                });
              }).on('error', (err) => {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              });
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? (process.env.BASE_URL || '/canzoni/') : '/',
  plugins: [react(), backofficeApiPlugin()],
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
