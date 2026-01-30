import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, themeOptions, themes, ThemeType } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

export default function ThemesScreen() {
  const router = useRouter();
  const { theme, colors, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleSelectTheme = async (themeId: ThemeType) => {
    setSaving(true);
    try {
      await setTheme(themeId);
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'تم التغيير ✓',
          'تم تغيير الثيم بنجاح. بعض الشاشات قد تحتاج لإعادة الفتح لرؤية التغيير.',
          [{ text: 'حسناً' }]
        );
      }, 300);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تغيير الثيم');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>المظهر</Text>
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
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <Text style={styles.previewLabel}>الثيم الحالي</Text>
            <Text style={styles.previewTitle}>
              {themeOptions.find(t => t.id === theme)?.label || 'داكن'}
            </Text>
            <View style={styles.previewColors}>
              <View style={[styles.previewColor, { backgroundColor: colors.background }]} />
              <View style={[styles.previewColor, { backgroundColor: colors.backgroundLight }]} />
              <View style={[styles.previewColor, { backgroundColor: colors.surface }]} />
              <View style={[styles.previewColor, { backgroundColor: colors.primary }]} />
              <View style={[styles.previewColor, { backgroundColor: colors.secondary }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Theme Options */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>اختر الثيم</Text>
        
        <View style={styles.themesGrid}>
          {themeOptions.map((themeOption, index) => (
            <Animated.View
              key={themeOption.id}
              entering={FadeInDown.delay(200 + index * 50)}
              style={styles.themeCardWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.themeCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: theme === themeOption.id ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleSelectTheme(themeOption.id)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <LinearGradient
                  colors={themeOption.preview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.themePreview}
                >
                  <Ionicons
                    name={themeOption.icon as any}
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                
                <Text style={[styles.themeName, { color: colors.text }]}>{themeOption.label}</Text>
                
                {theme === themeOption.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle" size={24} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            تغيير الثيم سيُطبق فوراً على جميع الشاشات. إذا لم ترى التغيير، حاول الخروج من الشاشة وفتحها مجدداً.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#FFFFFF',
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
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
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'right',
    lineHeight: 20,
  },
});
