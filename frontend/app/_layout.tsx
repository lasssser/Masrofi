import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../constants/theme';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
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
      </Stack>
    </SafeAreaProvider>
  );
}
