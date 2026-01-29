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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { 
  settingsStorage, 
  Settings, 
  CURRENCIES, 
  backupStorage,
  expenseStorage,
  debtStorage,
  incomeStorage,
  CATEGORIES,
} from '../utils/storage';
import { requestNotificationPermissions } from '../utils/notifications';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/Card';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({ 
    currency: 'TRY', 
    notificationsEnabled: true,
    biometricEnabled: false,
    theme: 'dark',
    language: 'ar',
  });
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsStorage.get();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric:', error);
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
        Alert.alert('لا يوجد إذن', 'يرجى تفعيل الإشعارات من إعدادات الجهاز');
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

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && !biometricAvailable) {
      Alert.alert('غير متاح', 'البصمة غير متوفرة أو غير مفعلة على هذا الجهاز');
      return;
    }

    if (enabled) {
      // Verify biometric before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'تحقق من هويتك لتفعيل القفل بالبصمة',
        cancelLabel: 'إلغاء',
      });

      if (!result.success) {
        Alert.alert('فشل', 'لم يتم التحقق من الهوية');
        return;
      }
    }

    try {
      await settingsStorage.update({ biometricEnabled: enabled });
      setSettings(prev => ({ ...prev, biometricEnabled: enabled }));
      Alert.alert('نجاح', enabled ? 'تم تفعيل القفل بالبصمة' : 'تم إلغاء القفل بالبصمة');
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ الإعدادات');
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      await settingsStorage.update({ theme });
      setSettings(prev => ({ ...prev, theme }));
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
        const fileUri = FileSystem.documentDirectory + 'masrofi_backup_' + Date.now() + '.json';
        await FileSystem.writeAsStringAsync(fileUri, data);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'حفظ النسخة الاحتياطية',
          });
        } else {
          await Share.share({ message: data, title: 'نسخة احتياطية - مصروفي' });
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تصدير البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const [expenses, debts, incomes] = await Promise.all([
        expenseStorage.getAll(),
        debtStorage.getAll(),
        incomeStorage.getAll(),
      ]);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const monthIncomes = incomes.filter(i => i.date.startsWith(currentMonth));
      const totalIncomes = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
      const activeDebts = debts.filter(d => d.status === 'نشط');

      const getCategoryLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label || id;
      const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || settings.currency;

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              background: #f5f5f5;
              direction: rtl;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #4F46E5, #3730A3);
              color: white;
              border-radius: 10px;
            }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .summary {
              display: flex;
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              flex: 1;
              background: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .summary-card.income { border-top: 4px solid #10B981; }
            .summary-card.expense { border-top: 4px solid #EF4444; }
            .summary-card.balance { border-top: 4px solid #4F46E5; }
            .summary-card h3 { margin: 0; color: #666; font-size: 14px; }
            .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 10px; }
            .income .value { color: #10B981; }
            .expense .value { color: #EF4444; }
            .balance .value { color: #4F46E5; }
            .section {
              background: white;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .section h2 {
              margin: 0 0 15px;
              color: #333;
              border-bottom: 2px solid #4F46E5;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #eee;
            }
            th {
              background: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            tr:hover { background: #f5f5f5; }
            .amount { font-weight: bold; }
            .expense-amount { color: #EF4444; }
            .income-amount { color: #10B981; }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .category-badge {
              display: inline-block;
              padding: 4px 12px;
              background: #e8e8e8;
              border-radius: 20px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 تقرير مصروفي</h1>
            <p>${new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="summary">
            <div class="summary-card income">
              <h3>إجمالي الدخل</h3>
              <div class="value">${totalIncomes.toLocaleString('ar-SA')} ${currencySymbol}</div>
            </div>
            <div class="summary-card expense">
              <h3>إجمالي المصروفات</h3>
              <div class="value">${totalExpenses.toLocaleString('ar-SA')} ${currencySymbol}</div>
            </div>
            <div class="summary-card balance">
              <h3>الرصيد</h3>
              <div class="value">${(totalIncomes - totalExpenses).toLocaleString('ar-SA')} ${currencySymbol}</div>
            </div>
          </div>

          ${monthExpenses.length > 0 ? `
          <div class="section">
            <h2>📝 المصروفات (${monthExpenses.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>الفئة</th>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${monthExpenses.slice(0, 50).map(e => `
                  <tr>
                    <td>${e.title}</td>
                    <td><span class="category-badge">${getCategoryLabel(e.category)}</span></td>
                    <td>${new Date(e.date).toLocaleDateString('ar-SA')}</td>
                    <td class="amount expense-amount">${e.amount.toLocaleString('ar-SA')} ${currencySymbol}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${activeDebts.length > 0 ? `
          <div class="section">
            <h2>💰 الديون النشطة (${activeDebts.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>الشخص</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody>
                ${activeDebts.map(d => `
                  <tr>
                    <td>${d.personName}</td>
                    <td>${d.type}</td>
                    <td class="amount">${d.totalAmount.toLocaleString('ar-SA')} ${currencySymbol}</td>
                    <td>${new Date(d.dueDate).toLocaleDateString('ar-SA')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة تطبيق مصروفي</p>
            <p>© ${new Date().getFullYear()} Wethaq Digital Solutions</p>
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        // For web, open in new window
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
          newWindow.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'تصدير تقرير PDF',
          });
        }
      }

      Alert.alert('نجاح', 'تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('خطأ', 'فشل إنشاء التقرير');
    } finally {
      setExportingPDF(false);
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
        {/* Theme Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>المظهر</Text>
          </View>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'dark' && styles.themeOptionActive]}
              onPress={() => handleThemeChange('dark')}
            >
              <Ionicons name="moon" size={24} color={settings.theme === 'dark' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.themeOptionText, settings.theme === 'dark' && styles.themeOptionTextActive]}>داكن</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'light' && styles.themeOptionActive]}
              onPress={() => handleThemeChange('light')}
            >
              <Ionicons name="sunny" size={24} color={settings.theme === 'light' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.themeOptionText, settings.theme === 'light' && styles.themeOptionTextActive]}>فاتح</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'system' && styles.themeOptionActive]}
              onPress={() => handleThemeChange('system')}
            >
              <Ionicons name="phone-portrait" size={24} color={settings.theme === 'system' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.themeOptionText, settings.theme === 'system' && styles.themeOptionTextActive]}>تلقائي</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Security Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>الأمان</Text>
          </View>
          <View style={styles.settingRow}>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: COLORS.surface, true: COLORS.primaryLight }}
              thumbColor={settings.biometricEnabled ? COLORS.primary : COLORS.textMuted}
              disabled={!biometricAvailable}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>قفل بالبصمة</Text>
              <Text style={styles.settingDescription}>
                {biometricAvailable ? 'حماية التطبيق ببصمة الإصبع أو الوجه' : 'البصمة غير متوفرة على هذا الجهاز'}
              </Text>
            </View>
            <Ionicons name="finger-print-outline" size={24} color={biometricAvailable ? COLORS.primary : COLORS.textMuted} />
          </View>
        </Card>

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

        {/* Export Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>التقارير والتصدير</Text>
          </View>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <View style={styles.exportButtonContent}>
                  <Text style={styles.exportButtonText}>تصدير تقرير PDF</Text>
                  <View style={[styles.exportIcon, { backgroundColor: COLORS.danger + '20' }]}>
                    <Ionicons name="document-outline" size={20} color={COLORS.danger} />
                  </View>
                </View>
                <Text style={styles.exportButtonDescription}>
                  تقرير شامل بالمصروفات والديون
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Backup Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>النسخ الاحتياطي</Text>
          </View>

          <TouchableOpacity
            style={styles.backupButton}
            onPress={() => router.push('/cloud-sync')}
          >
            <View style={styles.backupButtonContent}>
              <Text style={styles.backupButtonText}>المزامنة السحابية</Text>
              <Ionicons name="cloud" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.backupButtonDescription}>
              نسخ احتياطي واستعادة البيانات
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleExport}
            disabled={loading}
          >
            <View style={styles.backupButtonContent}>
              <Text style={styles.backupButtonText}>تصدير البيانات</Text>
              <Ionicons name="download-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.backupButtonDescription}>
              حفظ نسخة من جميع البيانات (JSON)
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
            <View style={styles.featureBadges}>
              <View style={[styles.badge, { backgroundColor: COLORS.secondary + '20' }]}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.secondary} />
                <Text style={[styles.badgeText, { color: COLORS.secondary }]}>آمن 100%</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="cloud-offline" size={12} color={COLORS.primary} />
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>يعمل بدون إنترنت</Text>
              </View>
            </View>
            <Text style={styles.appVersion}>الإصدار 2.0.0</Text>
          </View>
        </Card>

        {/* Storage Info */}
        <Card style={[styles.section, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '30' }]}>
          <View style={styles.storageInfo}>
            <Ionicons name="information-circle" size={24} color={COLORS.warning} />
            <View style={styles.storageInfoText}>
              <Text style={styles.storageInfoTitle}>أين تُحفظ بياناتي؟</Text>
              <Text style={styles.storageInfoDescription}>
                جميع بياناتك تُحفظ محلياً على جهازك فقط. لا نرسل أي بيانات للإنترنت. 
                ننصحك بأخذ نسخة احتياطية بشكل دوري.
              </Text>
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
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  themeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  themeOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  themeOptionTextActive: {
    color: COLORS.white,
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
  exportButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  exportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  featureBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  storageInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  storageInfoText: {
    flex: 1,
  },
  storageInfoTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.warning,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  storageInfoDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 20,
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
