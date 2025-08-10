let serviceWorkerRegistration;

if ('serviceWorker' in navigator) {
  // Immediately register and keep the promise for reuse
  serviceWorkerRegistration = (async () => {
    // Ensure only one service worker controls this scope
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      return existing;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    registration.update();

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state:', newWorker.state);
        });
      }
    });

    return registration;
  })();
} else {
  serviceWorkerRegistration = Promise.resolve(null);
}

export default serviceWorkerRegistration;
