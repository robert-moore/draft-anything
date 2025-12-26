/**
 * Parses timestamps from the database into JavaScript timestamps (milliseconds since epoch).
 * 
 * IMPORTANT: Draft selections (picks) are stored in the database WITHOUT timezone information
 * (e.g., "2025-12-26 20:42:27.187"), while draft messages are stored WITH timezone information
 * (e.g., "2025-12-26 20:42:30.12215+00"). This function handles both formats and ensures
 * timestamps without timezone are interpreted as UTC to maintain chronological accuracy.
 * 
 * @param timestamp - Timestamp string from the database (may or may not include timezone)
 * @returns Milliseconds since epoch, or Number.MAX_SAFE_INTEGER if parsing fails
 */
export function parseTimestamp(timestamp: string | undefined): number {
  if (!timestamp) {
    return Number.MAX_SAFE_INTEGER // Put items without timestamps at the end
  }
  try {
    let dateStr = timestamp.trim()
    const hasSpace = dateStr.includes(' ')
    const hasT = dateStr.includes('T')
    // Check for timezone at the END of the string (not in the date part like -26)
    const hasTimezone = dateStr.match(/[+-]\d{2}(:?\d{2})?$/)

    // Handle PostgreSQL timestamp with timezone: "2025-12-26 20:42:30.12215+00"
    if (hasSpace && !hasT) {
      // Check if it has timezone offset at the end (e.g., +00, +00:00, -05:00)
      if (hasTimezone) {
        // Has timezone, replace space with T
        dateStr = dateStr.replace(' ', 'T')
        // Normalize timezone format: +00 -> +00:00, +0530 -> +05:30
        if (dateStr.match(/[+-]\d{4}$/)) {
          // Format like +0530
          dateStr = dateStr.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3')
        } else if (dateStr.match(/[+-]\d{2}$/)) {
          // Format like +00 (add :00)
          dateStr = dateStr + ':00'
        }
        // Parse as ISO string with timezone
        const parsed = new Date(dateStr)
        return isNaN(parsed.getTime())
          ? Number.MAX_SAFE_INTEGER
          : parsed.getTime()
      } else {
        // No timezone info (e.g., "2025-12-26 20:42:27.187")
        // Draft selections are stored without timezone, so we must parse as UTC
        // Parse manually to ensure UTC interpretation
        const match = dateStr.match(
          /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
        )
        if (match) {
          const [, year, month, day, hour, minute, second, millis = '0'] =
            match
          // Use Date.UTC to explicitly create UTC timestamp
          // Handle milliseconds: pad to 3 digits, take first 3
          let ms = 0
          if (millis) {
            const padded = millis.padEnd(3, '0').substring(0, 3)
            ms = parseInt(padded, 10)
          }
          const utcTime = Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1, // months are 0-indexed
            parseInt(day, 10),
            parseInt(hour, 10),
            parseInt(minute, 10),
            parseInt(second, 10),
            ms
          )
          return utcTime
        } else {
          // Fallback: try with Z appended
          dateStr = dateStr.replace(' ', 'T') + 'Z'
          const parsed = new Date(dateStr)
          const time = parsed.getTime()
          return isNaN(time) ? Number.MAX_SAFE_INTEGER : time
        }
      }
    }
    // If it already has T but no timezone, add Z (assume UTC)
    else if (
      dateStr.includes('T') &&
      !dateStr.includes('Z') &&
      !dateStr.match(/[+-]\d{2}(:?\d{2})?$/)
    ) {
      dateStr = dateStr + 'Z'
    }

    // Try parsing the normalized string
    const parsed = new Date(dateStr)
    const time = parsed.getTime()

    // Check if parsing was successful (not NaN)
    if (isNaN(time)) {
      return Number.MAX_SAFE_INTEGER
    }

    return time
  } catch (error) {
    return Number.MAX_SAFE_INTEGER
  }
}

