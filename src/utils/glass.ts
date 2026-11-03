import { AppSettings } from '../types/p2h';

export const getBlurClass = (blurLevel: AppSettings['blurLevel'] = 'medium'): string => {
  switch (blurLevel) {
    case 'none': return 'backdrop-blur-none';
    case 'low': return 'backdrop-blur-sm';
    case 'medium': return 'backdrop-blur-md';
    case 'high': return 'backdrop-blur-lg';
    case 'ultra': return 'backdrop-blur-xl';
    default: return 'backdrop-blur-md';
  }
};

/**
 * Returns modern, elegant, frosted white crystal Glassmorphism styling with crystal transparency.
 * Guarantees the card remains luminous white with specular crystal highlights and high contrast readability
 * across all user-selected glassIntensity (low/medium/high/ultra) and blurLevel settings.
 */
export const getGlassCardClass = (settings?: AppSettings): string => {
  const intensity = settings?.glassIntensity || 'medium';
  const blur = settings?.blurLevel || 'medium';
  const blurClass = getBlurClass(blur);

  let glassBg = 'bg-white/90 border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.10)]';
  if (intensity === 'low') {
    // Rendah (Solid Glossy) - Almost opaque glossy white with subtle blur
    glassBg = 'bg-white/96 border-white/90 shadow-[0_8px_24px_rgb(0,0,0,0.08)]';
  } else if (intensity === 'medium') {
    // Sedang (Balanced Glass) - Balanced white frosted glass, wallpaper shines through
    glassBg = 'bg-white/90 border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.10)]';
  } else if (intensity === 'high') {
    // Tinggi (Translucent) - Elevated crystal transparency with white sheen
    glassBg = 'bg-white/84 border-white/70 shadow-[0_8px_32px_rgb(0,0,0,0.12)]';
  } else if (intensity === 'ultra') {
    // Ultra (Crystal Clear) - Maximum crystal transparency while keeping white luminosity
    glassBg = 'bg-white/78 border-white/60 shadow-[0_8px_36px_rgb(0,0,0,0.15)]';
  }

  return `rounded-2xl ${blurClass} ${glassBg} border text-slate-800 transition-all duration-300 backdrop-saturate-150`;
};

export const getGlassSidebarClass = (settings?: AppSettings): string => {
  const intensity = settings?.glassIntensity || 'medium';
  const blur = settings?.blurLevel || 'medium';
  const blurClass = getBlurClass(blur);

  let glassBg = 'bg-white/92 border-white/80 shadow-[0_8px_32px_rgb(0,0,0,0.12)]';
  if (intensity === 'low') {
    glassBg = 'bg-white/96 border-white/90 shadow-[0_8px_24px_rgb(0,0,0,0.08)]';
  } else if (intensity === 'medium') {
    glassBg = 'bg-white/92 border-white/80 shadow-[0_8px_32px_rgb(0,0,0,0.12)]';
  } else if (intensity === 'high') {
    glassBg = 'bg-white/85 border-white/70 shadow-[0_8px_32px_rgb(0,0,0,0.15)]';
  } else if (intensity === 'ultra') {
    glassBg = 'bg-white/78 border-white/60 shadow-[0_8px_36px_rgb(0,0,0,0.18)]';
  }

  return `rounded-2xl ${blurClass} ${glassBg} border text-slate-800 transition-all duration-300 backdrop-saturate-150`;
};

export const getGlassNavbarClass = (settings?: AppSettings): string => {
  const intensity = settings?.glassIntensity || 'medium';
  const blur = settings?.blurLevel || 'medium';
  const blurClass = getBlurClass(blur);

  let glassBg = 'bg-white/90 border-white/80 shadow-[0_4px_24px_rgb(0,0,0,0.08)]';
  if (intensity === 'low') {
    glassBg = 'bg-white/96 border-white/90 shadow-[0_4px_20px_rgb(0,0,0,0.06)]';
  } else if (intensity === 'medium') {
    glassBg = 'bg-white/90 border-white/80 shadow-[0_4px_24px_rgb(0,0,0,0.08)]';
  } else if (intensity === 'high') {
    glassBg = 'bg-white/84 border-white/70 shadow-[0_4px_28px_rgb(0,0,0,0.10)]';
  } else if (intensity === 'ultra') {
    glassBg = 'bg-white/78 border-white/60 shadow-[0_4px_32px_rgb(0,0,0,0.12)]';
  }

  return `rounded-2xl ${blurClass} ${glassBg} border text-slate-800 transition-all duration-300 backdrop-saturate-150`;
};

export const getGlassInputClass = (settings?: AppSettings): string => {
  return `px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-xs transition-all shadow-soft-xxs`;
};

export const getGlassButtonClass = (settings?: AppSettings, isPrimary = false): string => {
  if (isPrimary) {
    return `px-4 py-2.5 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer`;
  }
  return `px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-white/80 hover:bg-white border border-white/80 shadow-soft-xxs backdrop-blur-xs transition-all active:scale-[0.98] cursor-pointer`;
};
