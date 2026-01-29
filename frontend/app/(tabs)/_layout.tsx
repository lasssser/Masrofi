import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundLight,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.backgroundLight,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
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
        name="index"
        options={{
          title: 'المصروف',
          headerTitle: 'بيتي بادجِت',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'الديون',
          headerTitle: 'الديون',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'المشتريات',
          headerTitle: 'المشتريات',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
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
