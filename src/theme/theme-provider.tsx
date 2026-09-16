import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { palettes, radius, shadow, spacing, typography, type Palette, type ThemeScheme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'oqad.theme-mode.v1';

export type Theme = Palette & {
  scheme: ThemeScheme;
  radius: typeof radius;
  spacing: typeof spacing;
  type: typeof typography;
  shadow: (level?: 'sm' | 'md' | 'lg') => ReturnType<typeof shadow>;
};

type ThemeContextValue = {
  theme: Theme;
  scheme: ThemeScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(scheme: ThemeScheme): Theme {
  return {
    ...palettes[scheme],
    scheme,
    radius,
    spacing,
    type: typography,
    shadow: (level: 'sm' | 'md' | 'lg' = 'md') => shadow(scheme, level),
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ThemeScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setModeState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const scheme: ThemeScheme = mode === 'system' ? systemScheme : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: buildTheme(scheme), scheme, mode, setMode }),
    [scheme, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeController(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeController must be used inside ThemeProvider');
  return value;
}

export function useTheme(): Theme {
  return useThemeController().theme;
}
