/**
 * Get the application URL based on environment
 * This ensures we always use the correct URL for redirects
 */
export function getAppUrl() {
  // In production, use the configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // In Vercel preview deployments, use the Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  // In development, use localhost
  return 'http://localhost:3000'
}