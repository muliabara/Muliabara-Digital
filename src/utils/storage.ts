import LZString from 'lz-string';

export const saveCompressed = (key: string, data: any) => {
  try {
    const json = JSON.stringify(data);
    const compressed = LZString.compressToUTF16(json);
    localStorage.setItem(key, compressed);
  } catch (e) {
    console.warn(`Error saving compressed key ${key} to localStorage:`, e);
    try {
      // Fallback: try raw json stringify without compression or remove non-critical properties
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
    } catch (e2) {
      console.error(`QuotaExceeded storage fallback failed for ${key}`, e2);
      // Clear non-critical localStorage cache keys to free up space
      try {
        const keysToClean = ['jac_t9_notifs_v6', 'jac_t9_maint_logs_v6'];
        keysToClean.forEach(k => {
          if (k !== key) localStorage.removeItem(k);
        });
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // give up gracefully
      }
    }
  }
};

export const getCompressed = (key: string) => {
  try {
    const compressed = localStorage.getItem(key);
    if (!compressed) return null;
    
    // Check if it's already JSON (not compressed)
    if (compressed.startsWith('{') || compressed.startsWith('[')) {
      return JSON.parse(compressed);
    }
    
    const json = LZString.decompressFromUTF16(compressed);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.error(`Error reading from localStorage for key ${key}:`, e);
    try {
      const raw = localStorage.getItem(key);
      if (raw && (raw.startsWith('{') || raw.startsWith('['))) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  }
};

