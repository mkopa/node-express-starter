/**
 * Formats uptime in seconds to human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    const hoursPart = hours > 0 ? ` ${hours}h` : '';
    return `${days}d${hoursPart}`;
  }

  if (hours > 0) {
    const minutesPart = minutes > 0 ? ` ${minutes}m` : '';
    return `${hours}h${minutesPart}`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}
