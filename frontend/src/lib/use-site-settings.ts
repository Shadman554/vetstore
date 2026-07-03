import { useContext } from 'react';
import { SiteSettingsContext } from './site-settings-types';

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be inside SiteSettingsProvider');
  return ctx;
}
