import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Function to generate a UUID
export function generateUUID(): string {
  // Generate UUIDv4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}
