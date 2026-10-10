import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NativeAudioProvider } from './context/NativeAudioContext';
import { VinylOdysseyView } from './components/VinylOdysseyView';
import { EPKView } from './components/EPKView';
import { BackofficeView } from './components/BackofficeView';
import { BackofficeAuthGate } from './components/BackofficeAuthGate';
import { ShareModal } from './components/ShareModal';
import { AlbumData, DISCOGRAPHY } from './data/albumData';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'player' | 'epk' | 'admin'>('player');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [albums, setAlbums] = useState<AlbumData[]>(() => {
    try {
      const saved = localStorage.getItem('antigravity_discography_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse localStorage discography:', e);
    }
    return DISCOGRAPHY;
  });

  // Fetch latest discography from server if available (e.g. local dev server)
  useEffect(() => {
    fetch('/api/albums')
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) return res.json();
        return null;
      })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          // If no local storage customization exists, use server data
          const hasLocalCustom = !!localStorage.getItem('antigravity_discography_custom');
          if (!hasLocalCustom) {
            setAlbums(data);
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

  // Manage viewport scroll behavior per view (lock on player, unlock on admin/epk)
  useEffect(() => {
    if (currentView === 'player') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [currentView]);

  const navigateTo = (view: 'player' | 'epk' | 'admin') => {
    setCurrentView(view);
    if (view === 'epk') {
      window.location.hash = 'epk';
    } else if (view === 'admin') {
      window.location.hash = 'admin';
    } else {
      // Remove hash cleanly without full reload
      if (window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider>
      <NativeAudioProvider>
        {currentView === 'epk' ? (
          <EPKView
            albums={albums}
            onBackToPlayer={() => navigateTo('player')}
            onSelectAlbumAndPlay={(_album: AlbumData) => {
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
              />
            )}
          </BackofficeAuthGate>
        ) : (
          <VinylOdysseyView
            albums={albums}
            onOpenShare={() => setIsShareOpen(true)}
            onOpenEPK={() => navigateTo('epk')}
            onOpenBackoffice={() => navigateTo('admin')}
          />
        )}
        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      </NativeAudioProvider>
    </ThemeProvider>
  );
};

export default App;
