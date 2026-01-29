import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height based on safe area
  const tabBarHeight = Platform.OS === 'android' ? 65 + insets.bottom : 65;
  const tabBarPaddingBottom = Platform.OS === 'android' ? 10 + insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundLight,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: FONTS.semiBold,
        },
        headerStyle: {
          backgroundColor: COLORS.backgroundLight,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
          fontSize: 18,
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'الرئيسية',
          headerTitle: 'لوحة التحكم',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'المصروفات',
          headerTitle: 'المصروفات',
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'الميزانية',
          headerTitle: 'الميزانية',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calculator-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'الادخار',
          headerTitle: 'الادخار',
          tabBarIcon: ({ color }) => (
            <Ionicons name="trending-up-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'الديون',
          headerTitle: 'الديون',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'التسوق',
          headerTitle: 'التسوق',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'التقارير',
          headerTitle: 'التقارير',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'الذكاء',
          headerTitle: 'المستشار الذكي',
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
});
