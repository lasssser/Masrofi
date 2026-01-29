import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { settingsStorage, Settings, CURRENCIES, backupStorage } from '../utils/storage';
import { requestNotificationPermissions } from '../utils/notifications';
import Card from '../components/Card';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsStorage.get();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleCurrencyChange = async (currency: Settings['currency']) => {
    try {
      await settingsStorage.update({ currency });
      setSettings(prev => ({ ...prev, currency }));
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ الإعدادات');
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'لا يوجد إذن',
          'يرجى تفعيل الإشعارات من إعدادات الجهاز'
        );
        return;
      }
    }
    try {
      await settingsStorage.update({ notificationsEnabled: enabled });
      setSettings(prev => ({ ...prev, notificationsEnabled: enabled }));
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ الإعدادات');
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await backupStorage.exportAll();
      
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(data);
        Alert.alert('نجاح', 'تم نسخ البيانات إلى الحافظة. يمكنك لصقها في ملف نصي.');
      } else {
        await Share.share({
          message: data,
          title: 'نسخة احتياطية - مصروفي',
        });
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تصدير البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    Alert.prompt(
      'استيراد البيانات',
      'الصق بيانات النسخة الاحتياطية هنا',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استيراد',
          onPress: async (text) => {
            if (!text) return;
            setLoading(true);
            try {
              await backupStorage.importAll(text);
              Alert.alert('نجاح', 'تم استيراد البيانات بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'فشل استيراد البيانات. تأكد من صحة البيانات.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Currency Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>العملة الافتراضية</Text>
          </View>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map(currency => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyItem,
                  settings.currency === currency.code && styles.currencyItemActive,
                ]}
                onPress={() => handleCurrencyChange(currency.code as Settings['currency'])}
              >
                <Text style={[
                  styles.currencySymbol,
                  settings.currency === currency.code && styles.currencySymbolActive,
                ]}>
                  {currency.symbol}
                </Text>
                <Text style={[
                  styles.currencyLabel,
                  settings.currency === currency.code && styles.currencyLabelActive,
                ]}>
                  {currency.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: COLORS.surface, true: COLORS.primaryLight }}
              thumbColor={settings.notificationsEnabled ? COLORS.primary : COLORS.textMuted}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>الإشعارات</Text>
              <Text style={styles.settingDescription}>
                تذكيرات قبل مواعيد استحقاق الديون
              </Text>
            </View>
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </View>
        </Card>

        {/* Backup Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>النسخ الاحتياطي</Text>
          </View>
          
          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleExport}
            disabled={loading}
          >
            <View style={styles.backupButtonContent}>
              <Text style={styles.backupButtonText}>تصدير البيانات</Text>
              <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.backupButtonDescription}>
              حفظ نسخة من جميع البيانات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleImport}
            disabled={loading}
          >
            <View style={styles.backupButtonContent}>
              <Text style={styles.backupButtonText}>استيراد البيانات</Text>
              <Ionicons name="upload-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.backupButtonDescription}>
              استعادة البيانات من نسخة احتياطية
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Support Section */}
        <Card style={styles.section}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push('/support')}
          >
            <View style={styles.supportButtonContent}>
              <View>
                <Text style={styles.supportButtonText}>الدعم ومعلومات التطبيق</Text>
                <Text style={styles.supportButtonDescription}>
                  تواصل معنا • عن التطبيق
                </Text>
              </View>
              <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
            </View>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <Card style={styles.section}>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Masrofi</Text>
            <Text style={styles.appSubName}>by Wethaq Digital Solutions</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>نسخة تجريبية</Text>
            </View>
            <Text style={styles.appVersion}>الإصدار 1.0.0</Text>
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
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  currencyItem: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  currencyItemActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  currencySymbolActive: {
    color: COLORS.primary,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  currencyLabelActive: {
    color: COLORS.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  backupButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backupButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  backupButtonDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  supportButtonDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  appSubName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  betaBadge: {
    backgroundColor: COLORS.warning + '30',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  betaText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.warning,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  copyrightContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
  },
  copyrightText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
