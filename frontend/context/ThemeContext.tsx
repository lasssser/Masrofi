import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
export type ThemeType = 'dark' | 'light' | 'midnight' | 'ocean' | 'sunset';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  background: string;
  backgroundLight: string;
  surface: string;
  surfaceLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  white: string;
  black: string;
  gradients: {
    primary: string[];
    success: string[];
    warning: string[];
    danger: string[];
  };
}

// Dark Theme (Default)
const darkTheme: ThemeColors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  background: '#0A0A0F',
  backgroundLight: '#12121A',
  surface: '#1A1A25',
  surfaceLight: '#252532',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#8B5CF6', '#6366F1'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
};

// Light Theme
const lightTheme: ThemeColors = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#8B5CF6',
  secondary: '#059669',
  accent: '#D97706',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  background: '#F8FAFC',
  backgroundLight: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: 'rgba(0, 0, 0, 0.08)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#8B5CF6', '#6366F1'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
};

// Midnight Theme
const midnightTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#06B6D4',
  background: '#020617',
  backgroundLight: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(59, 130, 246, 0.15)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#3B82F6', '#06B6D4'],
    success: ['#06B6D4', '#22D3EE'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
};

// Ocean Theme
const oceanTheme: ThemeColors = {
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#38BDF8',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#14B8A6',
  background: '#042F2E',
  backgroundLight: '#064E4A',
  surface: '#0D5E59',
  surfaceLight: '#107A73',
  text: '#F0FDFA',
  textSecondary: '#99F6E4',
  textMuted: '#5EEAD4',
  border: 'rgba(14, 165, 233, 0.15)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#0EA5E9', '#14B8A6'],
    success: ['#14B8A6', '#2DD4BF'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
};

// Sunset Theme
const sunsetTheme: ThemeColors = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FB923C',
  secondary: '#EC4899',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  background: '#18181B',
  backgroundLight: '#27272A',
  surface: '#3F3F46',
  surfaceLight: '#52525B',
  text: '#FAFAFA',
  textSecondary: '#FED7AA',
  textMuted: '#A1A1AA',
  border: 'rgba(249, 115, 22, 0.15)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#F97316', '#EC4899'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
};

// All themes
export const themes: Record<ThemeType, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
  midnight: midnightTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
};

// Theme options for UI
export const themeOptions = [
  { id: 'dark' as ThemeType, label: 'داكن', icon: 'moon', preview: ['#0A0A0F', '#8B5CF6'] },
  { id: 'light' as ThemeType, label: 'فاتح', icon: 'sunny', preview: ['#F8FAFC', '#7C3AED'] },
  { id: 'midnight' as ThemeType, label: 'منتصف الليل', icon: 'cloudy-night', preview: ['#020617', '#3B82F6'] },
  { id: 'ocean' as ThemeType, label: 'المحيط', icon: 'water', preview: ['#042F2E', '#0EA5E9'] },
  { id: 'sunset' as ThemeType, label: 'الغروب', icon: 'partly-sunny', preview: ['#18181B', '#F97316'] },
];

// Theme Context
interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkTheme,
  setTheme: async () => {},
  isDark: true,
});

const THEME_STORAGE_KEY = 'masrofi_app_theme';

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [colors, setColors] = useState<ThemeColors>(darkTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && themes[savedTheme as ThemeType]) {
        setThemeState(savedTheme as ThemeType);
        setColors(themes[savedTheme as ThemeType]);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
      setColors(themes[newTheme]);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = theme !== 'light';

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Export default colors for static imports (backwards compatibility)
export const COLORS = darkTheme;
