import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
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
          }} 
        />
        <Stack.Screen 
          name="debt/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'تفاصيل الدين',
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
          }} 
        />
        <Stack.Screen 
          name="shopping/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'قائمة التسوق',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.backgroundLight },
            headerTintColor: COLORS.text,
            headerTitle: 'الإعدادات',
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
