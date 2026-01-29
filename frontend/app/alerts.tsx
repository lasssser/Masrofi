import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { alertStorage, SpendingAlert, getMonthlyComparison } from '../utils/alerts';
import { settingsStorage, Settings } from '../utils/storage';

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'alerts' | 'comparison'>('alerts');

  const loadData = useCallback(async () => {
    const [alertsData, comparisonData, settingsData] = await Promise.all([
      alertStorage.getAll(),
      getMonthlyComparison(),
      settingsStorage.get(),
    ]);
    
    setAlerts(alertsData);
    setComparison(comparisonData);
    setSettings(settingsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkAsRead = async (alertId: string) => {
    await alertStorage.markAsRead(alertId);
    await loadData();
  };

  const handleMarkAllAsRead = async () => {
    await alertStorage.markAllAsRead();
    await loadData();
  };

  const getCurrencySymbol = () => {
    if (!settings) return '₺';
    switch (settings.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SYP': return 'ل.س';
      default: return '₺';
    }
  };

  const formatAmount = (amount: number) => {
    return `${getCurrencySymbol()} ${amount.toLocaleString('ar-SA')}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'danger': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'overspending': return 'warning';
      case 'budget_exceeded': return 'alert-circle';
      case 'budget_warning': return 'trending-up';
      case 'bill_reminder': return 'calendar';
      case 'savings_tip': return 'sparkles';
      default: return 'notifications';
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const renderAlertsTab = () => (
    <View style={styles.tabContent}>
      {/* Unread count header */}
      {unreadCount > 0 && (
        <View style={styles.unreadHeader}>
          <Text style={styles.unreadText}>{unreadCount} تنبيه غير مقروء</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>قراءة الكل</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.secondary} />
          <Text style={styles.emptyTitle}>كل شيء على ما يرام!</Text>
          <Text style={styles.emptySubtitle}>لا توجد تنبيهات حالياً</Text>
        </View>
      ) : (
        alerts.map((alert, index) => (
          <Animated.View
            key={alert.id}
            entering={FadeInUp.delay(index * 50)}
          >
            <TouchableOpacity
              style={[styles.alertCard, !alert.read && styles.alertCardUnread]}
              onPress={() => handleMarkAsRead(alert.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.alertIcon,
                  { backgroundColor: getSeverityColor(alert.severity) + '20' },
                ]}
              >
                <Ionicons
                  name={getSeverityIcon(alert.type) as any}
                  size={24}
                  color={getSeverityColor(alert.severity)}
                />
              </View>
              
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleDateString('ar-SA', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderComparisonTab = () => (
    <View style={styles.tabContent}>
      {comparison && (
        <>
          {/* Main comparison card */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <LinearGradient
              colors={comparison.change > 0 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.comparisonCard}
            >
              <View style={styles.comparisonHeader}>
                <Ionicons
                  name={comparison.change > 0 ? 'trending-up' : 'trending-down'}
                  size={32}
                  color={COLORS.white}
                />
                <Text style={styles.comparisonTitle}>
                  {comparison.change > 0 ? 'إنفاق أكثر' : 'إنفاق أقل'}
                </Text>
              </View>
              
              <Text style={styles.comparisonAmount}>
                {formatAmount(Math.abs(comparison.change))}
              </Text>
              
              <Text style={styles.comparisonPercent}>
                {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent}% مقارنة بالشهر الماضي
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Month totals */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.monthsRow}>
            <View style={styles.monthCard}>
              <Text style={styles.monthLabel}>هذا الشهر</Text>
              <Text style={styles.monthAmount}>{formatAmount(comparison.thisMonth.total)}</Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthCard}>
              <Text style={styles.monthLabel}>الشهر الماضي</Text>
              <Text style={styles.monthAmount}>{formatAmount(comparison.lastMonth.total)}</Text>
            </View>
          </Animated.View>

          {/* Category changes */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.sectionTitle}>التغيير حسب الفئة</Text>
            
            {comparison.categoryChanges.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={styles.emptyCategoriesText}>لا توجد بيانات كافية للمقارنة</Text>
              </View>
            ) : (
              comparison.categoryChanges.slice(0, 5).map((item: any, index: number) => (
                <View key={index} style={styles.categoryChangeCard}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <View style={styles.categoryChange}>
                    <Text
                      style={[
                        styles.categoryChangeText,
                        { color: item.change > 0 ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      {item.change > 0 ? '+' : ''}{item.changePercent}%
                    </Text>
                    <Ionicons
                      name={item.change > 0 ? 'arrow-up' : 'arrow-down'}
                      size={16}
                      color={item.change > 0 ? '#EF4444' : '#10B981'}
                    />
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التنبيهات والمقارنة</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.tabActive]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={selectedTab === 'alerts' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.tabTextActive]}>
            التنبيهات
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'comparison' && styles.tabActive]}
          onPress={() => setSelectedTab('comparison')}
        >
          <Ionicons
            name="git-compare"
            size={20}
            color={selectedTab === 'comparison' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabText, selectedTab === 'comparison' && styles.tabTextActive]}>
            المقارنة الشهرية
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {selectedTab === 'alerts' ? renderAlertsTab() : renderComparisonTab()}
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  tabContent: {
    flex: 1,
  },
  unreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  unreadText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  markAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertCardUnread: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  alertTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  alertMessage: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  alertTime: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  comparisonCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  comparisonTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  comparisonAmount: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  comparisonPercent: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  monthsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthCard: {
    flex: 1,
    alignItems: 'center',
  },
  monthDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  monthLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  monthAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  emptyCategories: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  categoryChangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  categoryChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  categoryChangeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
});
