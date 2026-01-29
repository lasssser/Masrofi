import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'debts',
    title: 'الديون',
    subtitle: 'تتبع ديونك والمستحقات',
    icon: 'people',
    color: COLORS.danger,
    route: '/debts',
  },
  {
    id: 'savings',
    title: 'أهداف الادخار',
    subtitle: 'حقق أهدافك المالية',
    icon: 'flag',
    color: COLORS.secondary,
    route: '/savings',
  },
  {
    id: 'shopping',
    title: 'قوائم التسوق',
    subtitle: 'نظم مشترياتك',
    icon: 'cart',
    color: COLORS.accent,
    route: '/shopping',
  },
  {
    id: 'budget',
    title: 'الميزانية',
    subtitle: 'خطط مصاريفك الشهرية',
    icon: 'calculator',
    color: COLORS.primary,
    route: '/budget',
  },
  {
    id: 'recurring',
    title: 'المصاريف المتكررة',
    subtitle: 'إيجار، اشتراكات، فواتير',
    icon: 'repeat',
    color: '#8B5CF6',
    route: '/dashboard',
  },
  {
    id: 'cloud',
    title: 'النسخ الاحتياطي',
    subtitle: 'حماية بياناتك',
    icon: 'cloud',
    color: '#0EA5E9',
    route: '/cloud-sync',
  },
];

const settingsItems: MenuItem[] = [
  {
    id: 'settings',
    title: 'الإعدادات',
    subtitle: 'العملة، الإشعارات، المظهر',
    icon: 'settings',
    color: COLORS.textSecondary,
    route: '/settings',
  },
  {
    id: 'support',
    title: 'الدعم والمساعدة',
    subtitle: 'تواصل معنا',
    icon: 'help-circle',
    color: COLORS.textSecondary,
    route: '/support',
  },
];

export default function MoreScreen() {
  const router = useRouter();

  const renderMenuItem = (item: MenuItem, index: number) => (
    <Animated.View key={item.id} entering={FadeInDown.delay(100 + index * 50)}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push(item.route as any)}
      >
        <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المزيد</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pro Banner */}
          <Animated.View entering={FadeInDown.delay(50)}>
            <TouchableOpacity>
              <LinearGradient
                colors={COLORS.gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proBanner}
              >
                <View style={styles.proContent}>
                  <View style={styles.proIconContainer}>
                    <Ionicons name="diamond" size={24} color={COLORS.white} />
                  </View>
                  <View style={styles.proInfo}>
                    <Text style={styles.proTitle}>الترقية للنسخة الكاملة</Text>
                    <Text style={styles.proSubtitle}>احصل على جميع المميزات</Text>
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Main Menu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الأدوات</Text>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => renderMenuItem(item, index))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الإعدادات</Text>
            <View style={styles.menuContainer}>
              {settingsItems.map((item, index) => renderMenuItem(item, index + menuItems.length))}
            </View>
          </View>

          {/* App Info */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.appInfo}>
            <View style={styles.appLogoContainer}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={styles.appLogo}
              >
                <Ionicons name="wallet" size={28} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>مصروفي</Text>
            <Text style={styles.appVersion}>الإصدار 2.0.0</Text>
            <Text style={styles.appCompany}>by Wethaq Digital Solutions</Text>
            
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} />
                <Text style={styles.badgeText}>آمن</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="cloud-offline" size={14} color={COLORS.primary} />
                <Text style={styles.badgeText}>بدون إنترنت</Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  proContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  proIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proInfo: {},
  proTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  proSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginRight: SPACING.sm,
  },
  menuContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  menuSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appLogoContainer: {
    marginBottom: SPACING.md,
  },
  appLogo: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  appCompany: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
});
