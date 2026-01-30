import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { themeOptions, ThemeType, themes, setTheme } from '../utils/themes';
import { settingsStorage } from '../utils/storage';

export default function ThemesScreen() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('dark');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCurrentTheme();
    }, [])
  );

  const loadCurrentTheme = async () => {
    const settings = await settingsStorage.get();
    setSelectedTheme((settings.theme as ThemeType) || 'dark');
  };

  const handleSelectTheme = async (themeId: ThemeType) => {
    setSaving(true);
    setSelectedTheme(themeId);
    await setTheme(themeId);
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المظهر</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Theme Preview */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LinearGradient
            colors={themes[selectedTheme].gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <Text style={styles.previewLabel}>الثيم الحالي</Text>
            <Text style={styles.previewTitle}>
              {themeOptions.find(t => t.id === selectedTheme)?.label || 'داكن'}
            </Text>
            <View style={styles.previewColors}>
              <View style={[styles.previewColor, { backgroundColor: themes[selectedTheme].background }]} />
              <View style={[styles.previewColor, { backgroundColor: themes[selectedTheme].backgroundLight }]} />
              <View style={[styles.previewColor, { backgroundColor: themes[selectedTheme].surface }]} />
              <View style={[styles.previewColor, { backgroundColor: themes[selectedTheme].primary }]} />
              <View style={[styles.previewColor, { backgroundColor: themes[selectedTheme].secondary }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Theme Options */}
        <Text style={styles.sectionTitle}>اختر الثيم</Text>
        
        <View style={styles.themesGrid}>
          {themeOptions.map((theme, index) => (
            <Animated.View
              key={theme.id}
              entering={FadeInDown.delay(200 + index * 50)}
              style={styles.themeCardWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardSelected,
                ]}
                onPress={() => handleSelectTheme(theme.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={theme.preview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.themePreview}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                
                <Text style={styles.themeName}>{theme.label}</Text>
                
                {selectedTheme === theme.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            تغيير الثيم سيُطبق على جميع شاشات التطبيق. قد تحتاج لإعادة تشغيل التطبيق لرؤية التغييرات بالكامل.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  previewCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.xs,
  },
  previewTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  previewColors: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  previewColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  themeCardWrapper: {
    width: '47%',
  },
  themeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: COLORS.primary,
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  themeName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    lineHeight: 20,
  },
});
