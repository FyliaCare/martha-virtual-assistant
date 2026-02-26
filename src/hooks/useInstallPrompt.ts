// ============================================================
// useInstallPrompt — PWA install prompt hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const val = localStorage.getItem('martha-install-dismissed');
      if (!val) return false;
      // Allow re-showing after 7 days
      const ts = parseInt(val, 10);
      return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Also check for iOS standalone
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem('martha-install-dismissed', String(Date.now()));
    } catch { /* ignore */ }
  }, []);

  const canInstall = !!deferredPrompt && !isInstalled;
  const showBanner = canInstall && !dismissed;

  // Detect iOS for manual install instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const showIOSGuide = isIOS && !isInstalled && !dismissed;

  return {
    canInstall,
    isInstalled,
    showBanner,
    showIOSGuide,
    install,
    dismiss,
  };
}
