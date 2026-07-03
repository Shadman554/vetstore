import { createContext } from 'react';
import type { SiteSettings } from './site-settings';

export interface CardColor { bg: string; text: string; }

export interface SiteSettingsContextType {
  settings: SiteSettings;
  update: (partial: Partial<SiteSettings>) => void;
  cardColors: CardColor[];
}

export const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);
