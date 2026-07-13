export type FontPreset = 'default' | 'cairo' | 'tajawal' | 'noto-kufi' | 'baloo';

export const FONT_PRESETS: Record<FontPreset, { label: string; family: string; googleUrl?: string }> = {
  default: { label: 'Default (Fredoka)', family: '' },
  cairo: {
    label: 'Cairo',
    family: "'Cairo', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap',
  },
  tajawal: {
    label: 'Tajawal',
    family: "'Tajawal', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap',
  },
  'noto-kufi': {
    label: 'Noto Kufi Arabic',
    family: "'Noto Kufi Arabic', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;800;900&display=swap',
  },
  baloo: {
    label: 'Baloo 2',
    family: "'Baloo 2', 'Nunito', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap',
  },
};

export interface SiteSettings {
  color1: string;
  color2: string;
  color3: string;
  font: FontPreset;
  textOverrides: Record<string, Record<string, string>>;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  color1: '#FF5A00',
  color2: '#1A1A1A',
  color3: '#FF5A00',
  font: 'default',
  textOverrides: { EN: {}, AR: {}, KU: {} },
};

const STORAGE_KEY = 'vetmarket-site-settings';

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      textOverrides: {
        EN: parsed.textOverrides?.EN ?? {},
        AR: parsed.textOverrides?.AR ?? {},
        KU: parsed.textOverrides?.KU ?? {},
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSiteSettings(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function colorLuminance(hex: string): number {
  if (!hex.startsWith('#') || hex.length < 7) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function textOnBg(bgHex: string): string {
  return colorLuminance(bgHex) > 0.5 ? '#1a1a2e' : '#ffffff';
}

export function darkenColor(hex: string, factor = 0.65): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function colorForText(hex: string): string {
  return colorLuminance(hex) > 0.55 ? darkenColor(hex) : hex;
}
