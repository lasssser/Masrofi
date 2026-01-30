import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsStorage } from './storage';

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
  background: string;
  backgroundLight: string;
  surface: string;
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
  categoryColors: {
    food: string;
    transport: string;
    shopping: string;
    bills: string;
    entertainment: string;
    health: string;
    education: string;
    other: string;
  };
}

// Dark Theme (Default)
export const darkTheme: ThemeColors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#0F0F1A',
  backgroundLight: '#1A1A2E',
  surface: '#16213E',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: 'rgba(255, 255, 255, 0.1)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
  categoryColors: {
    food: '#F97316',
    transport: '#3B82F6',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#10B981',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Light Theme
export const lightTheme: ThemeColors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  backgroundLight: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: 'rgba(0, 0, 0, 0.1)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
  categoryColors: {
    food: '#F97316',
    transport: '#3B82F6',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#10B981',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Midnight Blue Theme
export const midnightTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#0C1222',
  backgroundLight: '#162032',
  surface: '#1E3A5F',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(59, 130, 246, 0.2)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#3B82F6', '#06B6D4'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
  categoryColors: {
    food: '#F97316',
    transport: '#3B82F6',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#10B981',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Ocean Theme
export const oceanTheme: ThemeColors = {
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#38BDF8',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#042F2E',
  backgroundLight: '#064E4A',
  surface: '#0D5E59',
  text: '#FFFFFF',
  textSecondary: '#99F6E4',
  textMuted: '#5EEAD4',
  border: 'rgba(14, 165, 233, 0.2)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#0EA5E9', '#14B8A6'],
    success: ['#14B8A6', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
  categoryColors: {
    food: '#F97316',
    transport: '#0EA5E9',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#14B8A6',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Sunset Theme
export const sunsetTheme: ThemeColors = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FB923C',
  secondary: '#EC4899',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#1C1917',
  backgroundLight: '#292524',
  surface: '#44403C',
  text: '#FFFFFF',
  textSecondary: '#FED7AA',
  textMuted: '#FDBA74',
  border: 'rgba(249, 115, 22, 0.2)',
  white: '#FFFFFF',
  black: '#000000',
  gradients: {
    primary: ['#F97316', '#EC4899'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
  },
  categoryColors: {
    food: '#F97316',
    transport: '#3B82F6',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#10B981',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Theme configurations
export const themes: Record<ThemeType, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
  midnight: midnightTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
};

// Theme metadata for display
export const themeOptions = [
  { id: 'dark' as ThemeType, label: 'داكن', icon: 'moon', preview: ['#0F0F1A', '#6366F1'] },
  { id: 'light' as ThemeType, label: 'فاتح', icon: 'sunny', preview: ['#F8FAFC', '#6366F1'] },
  { id: 'midnight' as ThemeType, label: 'منتصف الليل', icon: 'cloudy-night', preview: ['#0C1222', '#3B82F6'] },
  { id: 'ocean' as ThemeType, label: 'المحيط', icon: 'water', preview: ['#042F2E', '#0EA5E9'] },
  { id: 'sunset' as ThemeType, label: 'الغروب', icon: 'partly-sunny', preview: ['#1C1917', '#F97316'] },
];

// Get theme from storage
export const getTheme = async (): Promise<ThemeType> => {
  const settings = await settingsStorage.get();
  return (settings.theme as ThemeType) || 'dark';
};

// Get theme colors
export const getThemeColors = async (): Promise<ThemeColors> => {
  const themeType = await getTheme();
  return themes[themeType] || darkTheme;
};

// Save theme
export const setTheme = async (theme: ThemeType): Promise<void> => {
  await settingsStorage.update({ theme });
};
