import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Ensure light theme by removing any dark classes and setting light background
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');
document.documentElement.style.backgroundColor = '#ffffff';
document.body.style.backgroundColor = '#f9fafb';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Robust ServiceWorker registration with stronger guards and idempotency
(function registerServiceWorker() {
  try {
    const supportsSW = 'serviceWorker' in navigator;
    const isSecure = (typeof window !== 'undefined') && (window.isSecureContext || location.protocol === 'https:');
    const isTopLevel = window.top === window.self; // avoid sandboxed iframes
    const hasOpaqueOrigin = location.origin === 'null' || location.protocol === 'file:';
    const isNotVisible = document.visibilityState !== 'visible'; // TS-safe check
    const isPrerender = ((document as any).visibilityState === 'prerender') || ((document as any).prerendering === true);

    let registering = false;
    let tries = 0;
    const maxTries = 3;

    if (!supportsSW || !isSecure || !isTopLevel || hasOpaqueOrigin) {
      console.info('[PWA] SW skipped:', { supportsSW, isSecure, isTopLevel, hasOpaqueOrigin });
      return;
    }

    async function hasExistingRegistration(): Promise<boolean> {
      try {
        if (navigator.serviceWorker.controller) return true;
        const reg = await navigator.serviceWorker.getRegistration();
        const regs = await navigator.serviceWorker.getRegistrations();
        return Boolean(reg) || (regs && regs.length > 0);
      } catch {
        return false;
      }
    }

    async function doRegister() {
      if (registering) return;
      registering = true;
      try {
        if (await hasExistingRegistration()) {
          console.info('[PWA] ServiceWorker already registered or controlling');
          return;
        }
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.info('[PWA] ServiceWorker registered', reg);
      } catch (err: any) {
        const msg = (err?.message || String(err));
        console.warn('[PWA] ServiceWorker registration failed:', msg);
        if (tries < maxTries && (msg.includes('InvalidStateError') || msg.includes('invalid state'))) {
          tries++;
          // Retry on load/pageshow/visibilitychange
          const retry = () => {
            window.removeEventListener('pageshow', retry);
            window.removeEventListener('load', retry);
            window.removeEventListener('visibilitychange', retry);
            registering = false;
            setTimeout(doRegister, 0);
          };
          window.addEventListener('pageshow', retry, { once: true });
          if (document.readyState !== 'complete') {
            window.addEventListener('load', retry, { once: true });
          }
          if (document.visibilityState !== 'visible') {
            window.addEventListener('visibilitychange', retry, { once: true });
          }
        }
      } finally {
        registering = false;
      }
    }

    function scheduleRegister() {
      if (isNotVisible || isPrerender) {
        console.info('[PWA] Deferring SW until visible/activated:', { visibility: document.visibilityState, isPrerender });
        const onVisible = () => {
          if (document.visibilityState === 'visible') {
            window.removeEventListener('visibilitychange', onVisible);
            setTimeout(doRegister, 0);
          }
        };
        window.addEventListener('visibilitychange', onVisible, { once: true });
        return;
      }

      if (document.readyState === 'complete') {
        setTimeout(doRegister, 0);
      } else {
        window.addEventListener('load', () => setTimeout(doRegister, 0), { once: true });
        window.addEventListener('pageshow', () => setTimeout(doRegister, 0), { once: true });
      }
    }

    scheduleRegister();
  } catch (e) {
    console.warn('[PWA] Unexpected error setting up ServiceWorker registration', e);
  }
})();
