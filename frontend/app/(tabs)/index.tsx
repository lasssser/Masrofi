import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, BADGES } from '../../constants/theme';
import {
  expenseStorage,
  incomeStorage,
  settingsStorage,
  Settings,
  financialAnalysis,
} from '../../utils/storage';
import { formatCurrency, formatTransactionAmount } from '../../utils/helpers';
import { streakStorage, achievementStorage } from '../../utils/achievements';
import AIChatModal from '../../components/AIChatModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [forecast, setForecast] = useState<any>(null);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
  }

  const loadData = async () => {
    try {
      const [settingsData, expenses, incomes, forecastData, streakData, unlockedAchievements] = await Promise.all([
        settingsStorage.get(),
        expenseStorage.getByMonth(currentMonth),
        incomeStorage.getByMonth(currentMonth),
        financialAnalysis.getMonthlyForecast(currentMonth),
        streakStorage.get(),
        achievementStorage.getUnlocked(),
      ]);
      
      setSettings(settingsData);
      setTotalExpenses(expenses.reduce((sum, e) => sum + e.amount, 0));
      setTotalIncome(incomes.reduce((sum, i) => sum + i.amount, 0));
      setForecast(forecastData);
      setRecentExpenses(expenses.slice(0, 5));
      setStreak(streakData.current);
      setEarnedBadges(unlockedAchievements.map(a => a.id));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting} 👋</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>مصروفي</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/alerts')}
            >
              <View style={[styles.notificationGradient, { backgroundColor: colors.surface }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Main Balance Card */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>الرصيد المتبقي</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthText}>
                    {new Date().toLocaleDateString('ar-SA', { month: 'short' })}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.balanceAmount}>
                {formatCurrency(balance, settings.currency)}
              </Text>
              
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <View style={styles.statIconUp}>
                    <Ionicons name="arrow-up" size={14} color={COLORS.secondary} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>الدخل</Text>
                    <Text style={styles.statValue}>{formatCurrency(totalIncome, settings.currency)}</Text>
                  </View>
                </View>
                
                <View style={styles.balanceDivider} />
                
                <View style={styles.balanceStat}>
                  <View style={styles.statIconDown}>
                    <Ionicons name="arrow-down" size={14} color={COLORS.danger} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>المصروفات</Text>
                    <Text style={styles.statValue}>{formatCurrency(totalExpenses, settings.currency)}</Text>
                  </View>
                </View>
              </View>

              {/* Decorative Elements */}
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </LinearGradient>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/expense/add')}
            >
              <LinearGradient
                colors={[COLORS.danger + '20', COLORS.danger + '10']}
                style={styles.quickActionIcon}
              >
                <Ionicons name="remove-circle" size={24} color={COLORS.danger} />
              </LinearGradient>
              <Text style={styles.quickActionText}>مصروف</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/income/add')}
            >
              <LinearGradient
                colors={[COLORS.secondary + '20', COLORS.secondary + '10']}
                style={styles.quickActionIcon}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
              </LinearGradient>
              <Text style={styles.quickActionText}>دخل</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/analytics')}
            >
              <LinearGradient
                colors={[COLORS.primary + '20', COLORS.primary + '10']}
                style={styles.quickActionIcon}
              >
                <Ionicons name="analytics" size={24} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.quickActionText}>تحليل</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/more')}
            >
              <LinearGradient
                colors={[COLORS.accent + '20', COLORS.accent + '10']}
                style={styles.quickActionIcon}
              >
                <Ionicons name="grid" size={24} color={COLORS.accent} />
              </LinearGradient>
              <Text style={styles.quickActionText}>المزيد</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Streak & Challenge Card */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <LinearGradient
              colors={COLORS.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.streakCard}
            >
              <View style={styles.streakContent}>
                <View style={styles.streakInfo}>
                  <View style={styles.streakIconContainer}>
                    <Ionicons name="flame" size={28} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.streakTitle}>{streak} يوم متواصل 🔥</Text>
                    <Text style={styles.streakSubtitle}>استمر في تسجيل مصاريفك!</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.streakButton}
                  onPress={() => router.push('/achievements')}
                >
                  <Text style={styles.streakButtonText}>التحديات</Text>
                  <Ionicons name="chevron-back" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Insights Cards */}
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>عرض الكل</Text>
              <Ionicons name="chevron-back" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>نظرة سريعة</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScroll}
          >
            <Animated.View entering={FadeInRight.delay(500)}>
              <LinearGradient
                colors={[colors.secondary + '20', colors.secondary + '10']}
                style={[styles.insightCard, { borderColor: colors.border }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: colors.secondary + '30' }]}>
                  <Ionicons name="trending-up" size={20} color={colors.secondary} />
                </View>
                <Text style={[styles.insightValue, { color: colors.text }]}>{savingsRate}%</Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>نسبة التوفير</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInRight.delay(600)}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={[styles.insightCard, { borderColor: colors.border }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: colors.primary + '30' }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.insightValue, { color: colors.text }]}>{forecast?.recurringExpenses || 0}</Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>مصاريف ثابتة</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInRight.delay(700)}>
              <LinearGradient
                colors={[colors.accent + '20', colors.accent + '10']}
                style={[styles.insightCard, { borderColor: colors.border }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: colors.accent + '30' }]}>
                  <Ionicons name="trophy" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.insightValue, { color: colors.text }]}>{earnedBadges.length}</Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>إنجازات</Text>
              </LinearGradient>
            </Animated.View>
          </ScrollView>

          {/* Recent Transactions */}
          <View style={styles.sectionHeader}>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/wallet')}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>عرض الكل</Text>
              <Ionicons name="chevron-back" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>آخر المعاملات</Text>
          </View>

          <Animated.View entering={FadeInDown.delay(800)} style={[styles.transactionsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => (
                <TouchableOpacity key={expense.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                  <View style={[styles.transactionIcon, { backgroundColor: COLORS.categoryColors[expense.category as keyof typeof COLORS.categoryColors] + '20' }]}>
                    <Ionicons 
                      name="receipt-outline" 
                      size={20} 
                      color={COLORS.categoryColors[expense.category as keyof typeof COLORS.categoryColors] || colors.primary} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]}>{expense.title}</Text>
                    <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                      {new Date(expense.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: colors.danger }]}>
                    -{formatTransactionAmount(expense.amount, expense.currency, settings.currency)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد معاملات بعد</Text>
                <TouchableOpacity 
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/expense/add')}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.white }]}>أضف أول مصروف</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* AI Tip */}
          <Animated.View entering={FadeInDown.delay(900)}>
            <TouchableOpacity onPress={() => setShowAIChat(true)}>
              <LinearGradient
                colors={[colors.surface, colors.backgroundLight]}
                style={[styles.tipCard, { borderColor: colors.border }]}
              >
                <View style={styles.tipHeader}>
                  <View style={[styles.tipIconContainer, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.tipTitle, { color: colors.accent }]}>نصيحة ذكية</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {balance >= 0 
                    ? `أحسنت! لديك ${formatCurrency(balance, settings.currency)} متبقي. حاول ادخار جزء منه.`
                    : `تنبيه: أنت تنفق أكثر من دخلك بـ ${formatCurrency(Math.abs(balance), settings.currency)}`
                  }
                </Text>
                <View style={styles.tipFooter}>
                  <Text style={[styles.tipAction, { color: colors.primary }]}>تحدث مع المساعد الذكي</Text>
                  <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      
      {/* AI Chat Modal */}
      <AIChatModal visible={showAIChat} onClose={() => setShowAIChat(false)} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
  },
  notificationGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  balanceCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  monthBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  monthText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIconUp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconDown: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.danger + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  streakCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  streakSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  streakButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  insightsScroll: {
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  insightCard: {
    width: 120,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: SPACING.sm,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  insightValue: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  insightLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  transactionsList: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: 'right',
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptyButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  tipCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.accent,
  },
  tipText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  tipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.xs,
  },
  tipAction: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});
