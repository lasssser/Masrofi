import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import {
  expenseStorage,
  debtStorage,
  incomeStorage,
  budgetStorage,
  savingsGoalStorage,
  recurringExpenseStorage,
  settingsStorage,
  Settings,
} from '../../utils/storage';
import Card from '../../components/Card';
import Button from '../../components/Button';

// Production API URL - Use environment variable or fallback to VPS
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://45.9.191.190/masrofi-api';

interface AIAnalysis {
  analysis: string;
  insights: string[];
  recommendations: string[];
  alerts?: string[];
  spending_patterns?: Record<string, number>;
  forecast?: {
    monthly_balance: number;
    savings_rate?: number;
    debt_ratio?: number;
  };
}

export default function AIAnalysisScreen() {
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [quickTips, setQuickTips] = useState<string[]>([]);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const loadSettings = async () => {
    try {
      const data = await settingsStorage.get();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const collectFinancialData = async () => {
    const [expenses, incomes, debts, budgets, savingsGoals, recurringExpenses] = await Promise.all([
      expenseStorage.getAll(),
      incomeStorage.getAll(),
      debtStorage.getAll(),
      budgetStorage.getAll(),
      savingsGoalStorage.getAll(),
      recurringExpenseStorage.getAll(),
    ]);

    return {
      expenses: expenses.slice(0, 100), // Last 100 expenses
      incomes,
      debts,
      budgets,
      savings_goals: savingsGoals,
      recurring_expenses: recurringExpenses,
      currency: settings.currency,
    };
  };

  const analyzeFinances = async () => {
    setLoading(true);
    try {
      const financialData = await collectFinancialData();
      
      const response = await fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financial_data: financialData,
          analysis_type: 'full',
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بخدمة التحليل');
      }

      const data = await response.json();
      setAnalysis(data);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('خطأ', 'فشل التحليل. تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  const getQuickTips = async () => {
    try {
      const financialData = await collectFinancialData();
      
      const response = await fetch(`${API_URL}/api/ai/tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financial_data: financialData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuickTips(data.tips || []);
      }
    } catch (error) {
      console.error('Tips error:', error);
      setQuickTips([
        'تابع مصاريفك يومياً للتحكم بميزانيتك',
        'حدد ميزانية شهرية لكل فئة',
        'ادخر 20% من دخلك للطوارئ',
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getQuickTips();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      getQuickTips();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>المستشار المالي الذكي</Text>
          <Text style={styles.headerSubtitle}>
            تحليل شامل لوضعك المالي مع نصائح مخصصة
          </Text>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={analyzeFinances}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#667eea" />
            ) : (
              <>
                <Text style={styles.analyzeButtonText}>ابدأ التحليل</Text>
                <Ionicons name="analytics" size={20} color="#667eea" />
              </>
            )}
          </TouchableOpacity>
          {lastAnalyzed && (
            <Text style={styles.lastAnalyzed}>
              آخر تحليل: {lastAnalyzed.toLocaleTimeString('ar-SA')}
            </Text>
          )}
        </LinearGradient>

        {/* Quick Tips */}
        {quickTips.length > 0 && (
          <Card style={styles.tipsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>نصائح سريعة</Text>
            </View>
            {quickTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Main Analysis */}
            <Card style={styles.analysisCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>التحليل</Text>
              </View>
              <Text style={styles.analysisText}>{analysis.analysis}</Text>
            </Card>

            {/* Alerts */}
            {analysis.alerts && analysis.alerts.length > 0 && (
              <Card style={[styles.alertsCard, { borderColor: COLORS.danger + '50' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning" size={20} color={COLORS.danger} />
                  <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>تنبيهات مهمة</Text>
                </View>
                {analysis.alerts.map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <Card style={styles.insightsCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="eye" size={20} color={COLORS.secondary} />
                  <Text style={styles.sectionTitle}>ملاحظات</Text>
                </View>
                {analysis.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightBullet, { backgroundColor: COLORS.secondary + '20' }]}>
                      <Ionicons name="checkmark" size={14} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Card style={styles.recommendationsCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="rocket" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>توصيات</Text>
                </View>
                {analysis.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recItem}>
                    <LinearGradient
                      colors={[COLORS.primary + '20', COLORS.primaryLight + '10']}
                      style={styles.recBullet}
                    >
                      <Text style={styles.recBulletText}>{index + 1}</Text>
                    </LinearGradient>
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Forecast */}
            {analysis.forecast && (
              <Card style={styles.forecastCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={20} color={COLORS.secondary} />
                  <Text style={styles.sectionTitle}>التوقعات</Text>
                </View>
                <View style={styles.forecastGrid}>
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastLabel}>الرصيد الشهري</Text>
                    <Text style={[
                      styles.forecastValue,
                      { color: analysis.forecast.monthly_balance >= 0 ? COLORS.secondary : COLORS.danger }
                    ]}>
                      {analysis.forecast.monthly_balance.toLocaleString('ar-SA')} {settings.currency}
                    </Text>
                  </View>
                  {analysis.forecast.savings_rate !== undefined && (
                    <View style={styles.forecastItem}>
                      <Text style={styles.forecastLabel}>نسبة الادخار</Text>
                      <Text style={styles.forecastValue}>
                        {analysis.forecast.savings_rate}%
                      </Text>
                    </View>
                  )}
                  {analysis.forecast.debt_ratio !== undefined && (
                    <View style={styles.forecastItem}>
                      <Text style={styles.forecastLabel}>نسبة الديون</Text>
                      <Text style={[
                        styles.forecastValue,
                        { color: analysis.forecast.debt_ratio > 50 ? COLORS.danger : COLORS.text }
                      ]}>
                        {analysis.forecast.debt_ratio}%
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <Card style={styles.emptyCard}>
            <Ionicons name="analytics-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>ابدأ التحليل الذكي</Text>
            <Text style={styles.emptyText}>
              اضغط على "ابدأ التحليل" للحصول على تحليل شامل لوضعك المالي مع نصائح مخصصة لك
            </Text>
          </Card>
        )}

        {/* Powered By */}
        <View style={styles.poweredBy}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.textMuted} />
          <Text style={styles.poweredByText}>تحليل آمن ومشفر</Text>
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
  headerCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    marginBottom: SPACING.lg,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  analyzeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#667eea',
  },
  lastAnalyzed: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },
  tipsCard: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  analysisCard: {
    marginBottom: SPACING.md,
  },
  analysisText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 26,
    textAlign: 'right',
  },
  alertsCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.danger + '10',
    borderWidth: 1,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.danger,
    textAlign: 'right',
  },
  insightsCard: {
    marginBottom: SPACING.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  insightBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  recommendationsCard: {
    marginBottom: SPACING.md,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBulletText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  recText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  forecastCard: {
    marginBottom: SPACING.md,
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  forecastItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  forecastValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
  },
  poweredByText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});
