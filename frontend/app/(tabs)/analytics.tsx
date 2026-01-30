import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, CATEGORIES } from '../../constants/theme';
import {
  expenseStorage,
  incomeStorage,
  settingsStorage,
  Settings,
} from '../../utils/storage';
import { formatCurrency } from '../../utils/helpers';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{category: string; amount: number; color: string; percentage: number}[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [topCategory, setTopCategory] = useState<string>('');
  const [savingsRate, setSavingsRate] = useState(0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const loadData = useCallback(async () => {
    try {
      const [settingsData, expenses, incomes] = await Promise.all([
        settingsStorage.get(),
        expenseStorage.getByMonth(currentMonth),
        incomeStorage.getByMonth(currentMonth),
      ]);

      setSettings(settingsData);
      
      const expTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      const incTotal = incomes.reduce((sum, i) => sum + i.amount, 0);
      
      setTotalExpenses(expTotal);
      setTotalIncome(incTotal);

      // Calculate daily average
      const daysInMonth = new Date().getDate();
      setDailyAverage(daysInMonth > 0 ? expTotal / daysInMonth : 0);

      // Calculate savings rate
      setSavingsRate(incTotal > 0 ? Math.round(((incTotal - expTotal) / incTotal) * 100) : 0);

      // Category breakdown
      const categoryTotals: Record<string, number> = {};
      expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });

      const breakdown = Object.entries(categoryTotals)
        .map(([category, amount]) => {
          const cat = CATEGORIES.find(c => c.id === category);
          return {
            category: cat?.label || category,
            amount,
            color: cat?.color || COLORS.primary,
            percentage: expTotal > 0 ? Math.round((amount / expTotal) * 100) : 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown(breakdown);
      setTopCategory(breakdown[0]?.category || '');

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [currentMonth]);

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

  const balance = totalIncome - totalExpenses;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>التحليلات</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{monthName}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Main Stats Cards */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.statsRow}>
            <LinearGradient
              colors={colors.gradients.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Ionicons name="arrow-down-circle" size={28} color="#FFF" />
              <Text style={styles.statLabel}>الدخل</Text>
              <Text style={styles.statValue}>{formatCurrency(totalIncome, settings.currency)}</Text>
            </LinearGradient>

            <LinearGradient
              colors={colors.gradients.danger}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Ionicons name="arrow-up-circle" size={28} color="#FFF" />
              <Text style={styles.statLabel}>المصاريف</Text>
              <Text style={styles.statValue}>{formatCurrency(totalExpenses, settings.currency)}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Balance Card */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <LinearGradient
              colors={balance >= 0 ? colors.gradients.primary : colors.gradients.danger}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <Ionicons name={balance >= 0 ? "trending-up" : "trending-down"} size={32} color="#FFF" />
                <Text style={styles.balanceLabel}>{balance >= 0 ? 'الرصيد المتبقي' : 'العجز'}</Text>
              </View>
              <Text style={styles.balanceValue}>{formatCurrency(Math.abs(balance), settings.currency)}</Text>
              <Text style={styles.balanceHint}>
                {balance >= 0 ? `وفرت ${savingsRate}% من دخلك 💪` : 'أنفقت أكثر من دخلك ⚠️'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.quickStats}>
            <View style={[styles.quickStatItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.quickStatIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>متوسط يومي</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {formatCurrency(dailyAverage, settings.currency)}
              </Text>
            </View>

            <View style={[styles.quickStatItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.quickStatIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="pie-chart" size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>نسبة التوفير</Text>
              <Text style={[styles.quickStatValue, { color: savingsRate >= 0 ? colors.secondary : colors.danger }]}>
                {savingsRate}%
              </Text>
            </View>

            <View style={[styles.quickStatItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.quickStatIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="flame" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>الأعلى إنفاقاً</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]} numberOfLines={1}>
                {topCategory || '-'}
              </Text>
            </View>
          </Animated.View>

          {/* Category Breakdown */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>توزيع المصاريف</Text>
            
            {categoryBreakdown.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  لا توجد مصاريف هذا الشهر
                </Text>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categoryBreakdown.map((item, index) => (
                  <Animated.View 
                    key={item.category} 
                    entering={FadeInUp.delay(500 + index * 50)}
                    style={[styles.categoryItem, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.categoryName, { color: colors.text }]}>{item.category}</Text>
                      <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                        {item.percentage}%
                      </Text>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={[styles.progressBar, { backgroundColor: colors.backgroundLight }]}>
                      <Animated.View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }
                        ]} 
                      />
                    </View>
                    
                    <Text style={[styles.categoryAmount, { color: colors.text }]}>
                      {formatCurrency(item.amount, settings.currency)}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Tip Card */}
          <Animated.View entering={FadeInDown.delay(600)}>
            <View style={[styles.tipCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Ionicons name="bulb" size={24} color={colors.primary} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.primary }]}>نصيحة اليوم 💡</Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {savingsRate >= 20 
                    ? 'أداء ممتاز! استمر على هذا النحو للوصول لأهدافك المالية.'
                    : savingsRate >= 0
                    ? 'حاول تقليل المصاريف غير الضرورية لزيادة نسبة التوفير.'
                    : 'تنبيه: مصاريفك تتجاوز دخلك. راجع ميزانيتك!'
                  }
                </Text>
              </View>
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: 4,
  },
  balanceCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  balanceValue: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  balanceHint: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickStatItem: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  emptyState: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginTop: SPACING.sm,
  },
  categoryList: {
    gap: SPACING.sm,
  },
  categoryItem: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    textAlign: 'right',
  },
  categoryPercent: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    textAlign: 'left',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    textAlign: 'right',
  },
});
