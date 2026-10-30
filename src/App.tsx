import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NativeAudioProvider } from './context/NativeAudioContext';
import { VinylOdysseyView } from './components/VinylOdysseyView';
import { AlbumData, DISCOGRAPHY, normalizeAlbum } from './data/albumData';

const EPKView = lazy(() =>
  import('./components/EPKView').then((m) => ({ default: m.EPKView }))
);
const BackofficeView = lazy(() =>
  import('./components/BackofficeView').then((m) => ({ default: m.BackofficeView }))
);
const BackofficeAuthGate = lazy(() =>
  import('./components/BackofficeAuthGate').then((m) => ({ default: m.BackofficeAuthGate }))
);
const ShareModal = lazy(() =>
  import('./components/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const WidgetEmbedView = lazy(() =>
  import('./components/WidgetEmbedView').then((m) => ({ default: m.WidgetEmbedView }))
);

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'player' | 'epk' | 'admin' | 'widget'>('player');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<AlbumData[]>(() => {
    try {
      localStorage.removeItem('antigravity_discography_custom');
      localStorage.removeItem('antigravity_discography_v2');
      localStorage.removeItem('antigravity_discography_v3');
      localStorage.removeItem('antigravity_discography_v4');
      localStorage.removeItem('antigravity_discography_v5');
      const saved = localStorage.getItem('antigravity_discography_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeAlbum);
        }
      }
    } catch (e) {
      console.warn('Could not parse localStorage discography:', e);
    }
    return DISCOGRAPHY;
  });

  // Fetch latest discography from server if available (e.g. local dev server)
  useEffect(() => {
    fetch(`/api/albums?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) return res.json();
        return null;
      })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const hasLocalCustom = !!localStorage.getItem('antigravity_discography_v6');
          if (!hasLocalCustom) {
            setAlbums(data.map(normalizeAlbum));
          }
        }
      })
      .catch((err) => {
        console.warn('Using bundled DISCOGRAPHY (API fetch skipped or offline):', err);
      });
  }, []);

  // Sync with URL hash (e.g. #epk, #admin, #backoffice) for direct linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      const epkHashes = ['#epk', '#bio', '#discografia', '#media-kit', '#comunicati', '#live', '#contatti'];
      if (epkHashes.some((h) => hash.startsWith(h))) {
        setCurrentView('epk');
      } else if (hash.startsWith('#admin') || hash.startsWith('#backoffice')) {
        setCurrentView('admin');
      } else if (hash.startsWith('#widget') || hash.startsWith('#embed')) {
        setCurrentView('widget');
      } else if (hash === '#player' || hash === '') {
        if (hash === '#player') {
          setCurrentView('player');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Manage viewport scroll & background behavior per view (lock on player/widget, unlock on admin/epk)
  useEffect(() => {
    if (currentView === 'widget') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.classList.remove('bg-[#030407]');
      document.body.classList.add('bg-transparent');
    } else if (currentView === 'player') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('bg-transparent');
      document.body.classList.add('bg-[#030407]');
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('bg-transparent');
      document.body.classList.add('bg-[#030407]');
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('bg-transparent');
      document.body.classList.add('bg-[#030407]');
    };
  }, [currentView]);

  const navigateTo = (view: 'player' | 'epk' | 'admin') => {
    setCurrentView(view);
    if (view === 'epk') {
      window.location.hash = 'epk';
    } else if (view === 'admin') {
      window.location.hash = 'admin';
    } else {
      if (window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'widget') {
    return (
      <Suspense fallback={null}>
        <WidgetEmbedView albums={albums} />
      </Suspense>
    );
  }

  return (
    <ThemeProvider>
      <NativeAudioProvider albums={albums}>
        <Suspense fallback={<div className="min-h-screen bg-[#030407]" />}>
          {currentView === 'epk' ? (
            <EPKView
              albums={albums}
              onBackToPlayer={() => navigateTo('player')}
              onSelectAlbumAndPlay={(album: AlbumData) => {
                setSelectedAlbumId(album.id);
                navigateTo('player');
              }}
            />
          ) : currentView === 'admin' ? (
            <BackofficeAuthGate onBackToPlayer={() => navigateTo('player')}>
              {(handleLogout) => (
                <BackofficeView
                  albums={albums}
                  onAlbumsUpdated={(updated) => setAlbums(updated)}
                  onBackToPlayer={() => navigateTo('player')}
                  onLogout={handleLogout}
                  onOpenWidgetGenerator={() => setIsShareOpen(true)}
                />
              )}
            </BackofficeAuthGate>
          ) : (
            <VinylOdysseyView
              albums={albums}
              initialAlbumId={selectedAlbumId}
              onOpenShare={() => setIsShareOpen(true)}
              onOpenEPK={() => navigateTo('epk')}
              onOpenBackoffice={() => navigateTo('admin')}
            />
          )}
        </Suspense>
        {isShareOpen && (
          <Suspense fallback={null}>
            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} albums={albums} />
          </Suspense>
        )}
      </NativeAudioProvider>
    </ThemeProvider>
  );
};

export default App;
