/**
 * Utility functions for Terra Tempo frontend
 */

/**
 * Truncate Ethereum address for display
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to readable date string
 */
export function formatDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp to readable date and time string
 */
export function formatDateTime(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get crop type name from enum value
 */
export function getCropTypeName(cropType: number): string {
  const types = ['Wheat', 'Corn', 'Rice', 'Vegetables', 'Fruits', 'Other'];
  return types[cropType] || 'Unknown';
}

/**
 * Get quality grade name from enum value
 */
export function getQualityGradeName(grade: number): string {
  const grades = ['A', 'B', 'C', 'D'];
  return grades[grade] || 'Unknown';
}

/**
 * Get soil type name from enum value
 */
export function getSoilTypeName(soilType: number): string {
  const types = ['Clay', 'Sandy', 'Loam', 'Silt'];
  return types[soilType] || 'Unknown';
}

/**
 * Get weather summary name from enum value
 */
export function getWeatherSummaryName(weather: number): string {
  const summaries = ['Normal', 'Drought', 'Flood', 'Storm'];
  return summaries[weather] || 'Unknown';
}

/**
 * Get fertilizer type name from enum value
 */
export function getFertilizerTypeName(fertType: number): string {
  const types = ['Organic', 'Chemical', 'Mixed', 'None'];
  return types[fertType] || 'Unknown';
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number | bigint): string {
  return Number(num).toLocaleString('en-US');
}

/**
 * Convert hectares * 100 to readable hectares
 */
export function formatHectares(value: number | bigint): string {
  return (Number(value) / 100).toFixed(2);
}

/**
 * Convert currency * 100 to readable currency
 */
export function formatCurrency(value: number | bigint): string {
  return `$${(Number(value) / 100).toFixed(2)}`;
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safe localStorage access
 */
export const storage = {
  get: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  
  remove: (key: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    if (!isBrowser()) return;
    try {
      localStorage.clear();
    } catch {
      // Ignore errors
    }
  },
};

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
}


