import { registerSW } from 'virtual:pwa-register'

export const initializePWA = () => {
  if (typeof window === 'undefined') {
    return
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {
          // swallow update errors for now; we'll surface them in a toast later
        })
      }
    },
  })
}
