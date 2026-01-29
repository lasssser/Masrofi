import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { backupStorage } from '../utils/storage';
import Card from '../components/Card';
import Button from '../components/Button';

WebBrowser.maybeCompleteAuthSession();

const CLOUD_BACKUP_KEY = 'masrofi_cloud_backup_info';

interface CloudBackupInfo {
  lastBackup: string | null;
  lastRestore: string | null;
  isEnabled: boolean;
}

export default function CloudSyncScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<CloudBackupInfo>({
    lastBackup: null,
    lastRestore: null,
    isEnabled: false,
  });

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const data = await AsyncStorage.getItem(CLOUD_BACKUP_KEY);
      if (data) {
        setBackupInfo(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading backup info:', error);
    }
  };

  const saveBackupInfo = async (info: CloudBackupInfo) => {
    try {
      await AsyncStorage.setItem(CLOUD_BACKUP_KEY, JSON.stringify(info));
      setBackupInfo(info);
    } catch (error) {
      console.error('Error saving backup info:', error);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      // Export data
      const data = await backupStorage.exportAll();
      
      // Save locally with timestamp
      const backupKey = `masrofi_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, data);
      
      // Update backup info
      const newInfo = {
        ...backupInfo,
        lastBackup: new Date().toISOString(),
        isEnabled: true,
      };
      await saveBackupInfo(newInfo);

      Alert.alert(
        'تم بنجاح ✅',
        'تم حفظ نسخة احتياطية محلية. يمكنك تصديرها يدوياً من صفحة الإعدادات.',
        [{ text: 'حسناً' }]
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('خطأ', 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'استعادة البيانات',
      'سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Get the latest backup
              const keys = await AsyncStorage.getAllKeys();
              const backupKeys = keys.filter(k => k.startsWith('masrofi_backup_'));
              
              if (backupKeys.length === 0) {
                Alert.alert('لا توجد نسخ', 'لا توجد نسخ احتياطية محفوظة');
                return;
              }

              // Get the latest backup
              const latestKey = backupKeys.sort().reverse()[0];
              const data = await AsyncStorage.getItem(latestKey);
              
              if (data) {
                await backupStorage.importAll(data);
                
                const newInfo = {
                  ...backupInfo,
                  lastRestore: new Date().toISOString(),
                };
                await saveBackupInfo(newInfo);

                Alert.alert('تم بنجاح ✅', 'تم استعادة البيانات بنجاح');
              }
            } catch (error) {
              console.error('Restore error:', error);
              Alert.alert('خطأ', 'فشل استعادة البيانات');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'لم يتم بعد';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'المزامنة السحابية',
          headerStyle: { backgroundColor: COLORS.backgroundLight },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontFamily: FONTS.bold },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerIcon}>
              <Ionicons name="cloud" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.headerTitle}>المزامنة والنسخ الاحتياطي</Text>
            <Text style={styles.headerSubtitle}>
              احمِ بياناتك واستعدها في أي وقت
            </Text>
          </LinearGradient>

          {/* Backup Status */}
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Ionicons name="cloud-upload" size={24} color={COLORS.secondary} />
                <Text style={styles.statusLabel}>آخر نسخ احتياطي</Text>
                <Text style={styles.statusValue}>{formatDate(backupInfo.lastBackup)}</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Ionicons name="cloud-download" size={24} color={COLORS.primary} />
                <Text style={styles.statusLabel}>آخر استعادة</Text>
                <Text style={styles.statusValue}>{formatDate(backupInfo.lastRestore)}</Text>
              </View>
            </View>
          </Card>

          {/* Actions */}
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>الإجراءات</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleManualBackup}
              disabled={loading}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                <Ionicons name="cloud-upload" size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>إنشاء نسخة احتياطية</Text>
                <Text style={styles.actionDescription}>حفظ جميع البيانات</Text>
              </View>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRestore}
              disabled={loading}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="cloud-download" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>استعادة البيانات</Text>
                <Text style={styles.actionDescription}>من آخر نسخة احتياطية</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="share" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>تصدير/مشاركة</Text>
                <Text style={styles.actionDescription}>حفظ كملف أو مشاركة</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </Card>

          {/* Google Drive Section - Future */}
          <Card style={[styles.comingSoonCard, { opacity: 0.7 }]}>
            <View style={styles.comingSoonHeader}>
              <Ionicons name="logo-google" size={24} color={COLORS.textMuted} />
              <Text style={styles.comingSoonTitle}>Google Drive</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>قريباً</Text>
              </View>
            </View>
            <Text style={styles.comingSoonDescription}>
              مزامنة تلقائية مع حسابك في Google Drive
            </Text>
          </Card>

          {/* Tips */}
          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.tipsTitle}>نصائح مهمة</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.tipText}>قم بعمل نسخة احتياطية بشكل دوري (أسبوعياً)</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.tipText}>استخدم "تصدير البيانات" لحفظ ملف على جهازك</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.tipText}>احفظ الملف في مكان آمن (Email, Drive, etc.)</Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
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
  headerCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statusDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  statusLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  statusValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  actionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  actionDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  comingSoonCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  comingSoonTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  comingSoonBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  comingSoonBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  comingSoonDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  tipsCard: {
    backgroundColor: COLORS.warning + '10',
    borderColor: COLORS.warning + '30',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.warning,
    flex: 1,
    textAlign: 'right',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 20,
  },
});
