import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import Card from '../components/Card';

export default function SupportScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:info@wethaqdigital.com');
  };

  const handleWebsite = () => {
    Linking.openURL('https://wethaqdigital.com');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/company-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Info */}
        <Card style={styles.appInfoCard}>
          <Text style={styles.appName}>Masrofi</Text>
          <Text style={styles.appSubtitle}>by Wethaq Digital Solutions</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>نسخة تجريبية</Text>
          </View>
          <Text style={styles.appDescription}>
            تطبيق إدارة المصاريف الشخصية
          </Text>
          <Text style={styles.versionText}>الإصدار 1.0.0 (Beta)</Text>
        </Card>

        {/* Contact Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>تواصل معنا</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>البريد الإلكتروني</Text>
              <Text style={styles.contactValue}>info@wethaqdigital.com</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
            <View style={styles.contactIcon}>
              <Ionicons name="globe" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>الموقع الإلكتروني</Text>
              <Text style={styles.contactValue}>wethaqdigital.com</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* About Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>عن التطبيق</Text>
          <Text style={styles.aboutText}>
            مصروفي هو تطبيق بسيط وفعال لإدارة مصاريفك الشخصية وديونك وقوائم التسوق. 
            يعمل التطبيق بشكل كامل بدون إنترنت ويحافظ على خصوصية بياناتك.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>يعمل بدون إنترنت</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>بياناتك محفوظة على جهازك فقط</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>واجهة عربية بالكامل</Text>
            </View>
          </View>
        </Card>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © 2026 Wethaq Digital Solutions.
          </Text>
          <Text style={styles.copyrightText}>
            All rights reserved.
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 150,
    height: 150,
  },
  appInfoCard: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  appSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  betaBadge: {
    backgroundColor: COLORS.warning + '30',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
  },
  betaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.warning,
  },
  appDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  versionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  contactLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  contactValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  aboutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  featureList: {
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  copyrightContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  copyrightText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
