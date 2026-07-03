import { useState, useEffect, useCallback, ReactNode } from 'react';
import { SiteSettings, getSiteSettings, saveSiteSettings, FONT_PRESETS, textOnBg } from './site-settings';
import { setI18nOverrides } from './i18n-core';
import { SiteSettingsContext, CardColor } from './site-settings-types';

function applyStyles(settings: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty('--brand-1', settings.color1);
  root.style.setProperty('--brand-2', settings.color2);
  root.style.setProperty('--brand-3', settings.color3);

  const preset = FONT_PRESETS[settings.font];
  if (settings.font !== 'default' && preset.googleUrl) {
    let link = document.getElementById('site-google-font') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'site-google-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== preset.googleUrl) link.href = preset.googleUrl;
    root.style.setProperty('--app-font-sans', preset.family);
    root.style.setProperty('--app-font-display', preset.family);
  } else {
    const link = document.getElementById('site-google-font');
    if (link) link.remove();
    root.style.removeProperty('--app-font-sans');
    root.style.removeProperty('--app-font-display');
  }
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => getSiteSettings());

  useEffect(() => {
    applyStyles(settings);
    setI18nOverrides(settings.textOverrides);
  }, [settings]);

  const update = useCallback((partial: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSiteSettings(next);
      return next;
    });
  }, []);

  const cardColors: CardColor[] = [
    { bg: settings.color1, text: textOnBg(settings.color1) },
    { bg: settings.color2, text: textOnBg(settings.color2) },
    { bg: settings.color3, text: textOnBg(settings.color3) },
  ];

  return (
    <SiteSettingsContext.Provider value={{ settings, update, cardColors }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
