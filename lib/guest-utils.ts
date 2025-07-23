// Guest management utilities
const GUEST_CLIENT_ID_KEY = 'draft-guest-client-id'

/**
 * Get or create a guest client ID from localStorage
 */
export function getGuestClientId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let clientId = localStorage.getItem(GUEST_CLIENT_ID_KEY)
  if (!clientId) {
    clientId = crypto.randomUUID()
    localStorage.setItem(GUEST_CLIENT_ID_KEY, clientId)
  }
  return clientId
}

/**
 * Check if a client ID exists in localStorage
 */
export function hasGuestClientId(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!localStorage.getItem(GUEST_CLIENT_ID_KEY)
}

/**
 * Clear the guest client ID from localStorage
 */
export function clearGuestClientId(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(GUEST_CLIENT_ID_KEY)
}

/**
 * Create a fetch function that includes guest headers when needed
 */
export function createGuestFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const clientId = getGuestClientId()

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(clientId ? { 'x-client-id': clientId } : {})
      }
    })
  }
}
