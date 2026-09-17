/**
 * P23: register the service worker, and say nothing when it is not available.
 *
 * Registration is deliberately quiet. A browser that refuses service workers, a private window, or
 * the desktop shell where the files are already local all end up here, and in every one of those
 * the application still works: the service worker makes a second visit possible without a network,
 * it is not what makes the application function.
 *
 * Nothing in this file fetches anything. `register` points the browser at a file that is already
 * part of the build and inside the same origin.
 */

export type OfflineState = 'registered' | 'unsupported' | 'failed' | 'not_needed';

export async function registerServiceWorker(): Promise<OfflineState> {
  // Inside the desktop shell every asset is already on the local disk, so a service worker would
  // cache a copy of something that cannot be missing.
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) return 'not_needed';
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported';
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') return 'not_needed';

  try {
    // Relative to the document, not to this module. The bundle lives under assets/, so resolving
    // against import.meta.url would ask for assets/sw.js, which does not exist, and registration
    // would fail quietly. The service worker and the page sit side by side at the build root.
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
    return 'registered';
  } catch {
    return 'failed';
  }
}
