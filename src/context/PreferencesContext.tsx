"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AppSettings } from "@/types/settings";
import { DEFAULT_APP_SETTINGS, SETTINGS_UPDATED_EVENT } from "@/constants/settings";
import {
  getStoredSettings,
  saveStoredSettings,
  resetStoredSettings,
  applyTheme,
} from "@/lib/settings/settings-manager";

export interface PreferencesContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  settings: DEFAULT_APP_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  isLoaded: false,
});

export interface PreferencesProviderProps {
  children: React.ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize preferences on client mount without hydration mismatch
  useEffect(() => {
    const loaded = getStoredSettings();
    setSettings(loaded);
    setIsLoaded(true);
    applyTheme(loaded.theme);
  }, []);

  // Listen for preference changes from other components or tabs
  useEffect(() => {
    const handlePreferencesEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getStoredSettings());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key === "bus_user_preferences") {
        const refreshed = getStoredSettings();
        setSettings(refreshed);
        applyTheme(refreshed.theme);
      }
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handlePreferencesEvent);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handlePreferencesEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Listen for OS system theme changes if theme is set to 'system'
  useEffect(() => {
    if (settings.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const updated = saveStoredSettings(updates);
    setSettings(updated);
  }, []);

  const resetSettings = useCallback(() => {
    const defaulted = resetStoredSettings();
    setSettings(defaulted);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      isLoaded,
    }),
    [settings, updateSettings, resetSettings, isLoaded]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
