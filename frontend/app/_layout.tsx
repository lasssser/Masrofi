import React, { useEffect, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { COLORS } from '../constants/theme';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import SplashScreen from '../components/SplashScreen';
import BiometricLock from '../components/BiometricLock';
import FloatingAIButton from '../components/FloatingAIButton';
import { settingsStorage } from '../utils/storage';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Keep splash screen visible while loading fonts
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  const checkBiometricSettings = async () => {
    try {
      // Skip biometric on web
      if (Platform.OS === 'web') {
        setCheckingBiometric(false);
        return;
      }
      
      const settings = await settingsStorage.get();
      if (settings.biometricEnabled) {
        setShowBiometricLock(true);
      }
    } catch (error) {
      console.error('Error checking biometric settings:', error);
    } finally {
      setCheckingBiometric(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    checkBiometricSettings();
  };

  const handleBiometricSuccess = () => {
    setShowBiometricLock(false);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show custom splash screen
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  // Show biometric lock if enabled
  if (showBiometricLock && !checkingBiometric) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BiometricLock onSuccess={handleBiometricSuccess} />
      </SafeAreaProvider>
    );
  }

  // Show loading while checking biometric
  if (checkingBiometric) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="expense/add" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'إضافة مصروف',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="income/add" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'إضافة دخل',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="debt/add" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'إضافة دين',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="debt/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'تفاصيل الدين',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="shopping/add-list" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'قائمة جديدة',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="shopping/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'قائمة التسوق',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'الإعدادات',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="support" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'الدعم',
            headerTitleStyle: { fontFamily: 'Cairo_600SemiBold' },
          }} 
        />
        <Stack.Screen 
          name="achievements" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="alerts" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="themes" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
