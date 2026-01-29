import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import {
  expenseStorage,
  Expense,
  settingsStorage,
  Settings,
  CATEGORIES,
} from '../../utils/storage';
import { formatCurrency, getDatesBetween, getDaysAgo } from '../../utils/helpers';
import Card from '../../components/Card';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const loadData = async () => {
    try {
      const [expensesData, settingsData] = await Promise.all([
        expenseStorage.getAll(),
        settingsStorage.get(),
      ]);
      setExpenses(expensesData);
      setSettings(settingsData);
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

  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = getDaysAgo(7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return expenses.filter(e => new Date(e.date) >= startDate);
  };

  const filteredExpenses = getFilteredExpenses();
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Pie chart data by category
  const categoryData = CATEGORIES.map(cat => {
    const total = filteredExpenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      value: total,
      color: COLORS.categoryColors[cat.id as keyof typeof COLORS.categoryColors] || COLORS.textMuted,
      text: cat.label,
      label: cat.label,
    };
  }).filter(item => item.value > 0);

  // Bar chart - daily spending
  const getDailyData = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const dates = getDatesBetween(getDaysAgo(days - 1), new Date());
    
    return dates.slice(-7).map(dateStr => {
      const dayTotal = filteredExpenses
        .filter(e => e.date.split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const dayName = new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'short' });
      return {
        value: dayTotal,
        label: dayName,
        frontColor: COLORS.primary,
      };
    });
  };

  // Line chart - trend
  const getTrendData = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const dates = getDatesBetween(getDaysAgo(days - 1), new Date());
    
    let cumulative = 0;
    return dates.slice(-14).map(dateStr => {
      const dayTotal = filteredExpenses
        .filter(e => e.date.split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      cumulative += dayTotal;
      return {
        value: dayTotal,
        dataPointText: '',
      };
    });
  };

  // Top spending categories
  const topCategories = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Average daily spending
  const avgDaily = period === 'week' 
    ? totalSpent / 7 
    : period === 'month' 
    ? totalSpent / 30 
    : totalSpent / 365;

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
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>إجمالي الإنفاق</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent, settings.currency)}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>المعدل اليومي</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {formatCurrency(avgDaily, settings.currency)}
            </Text>
          </Card>
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>عدد المعاملات</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
              {filteredExpenses.length}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>أعلى معاملة</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {formatCurrency(
                filteredExpenses.length > 0 
                  ? Math.max(...filteredExpenses.map(e => e.amount))
                  : 0,
                settings.currency
              )}
            </Text>
          </Card>
        </View>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>توزيع الإنفاق حسب الفئة</Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={categoryData}
                donut
                radius={80}
                innerRadius={50}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>الإجمالي</Text>
                    <Text style={styles.pieCenterValue}>
                      {formatCurrency(totalSpent, settings.currency)}
                    </Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legendContainer}>
              {categoryData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                  <Text style={styles.legendValue}>
                    {((item.value / totalSpent) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>الإنفاق اليومي (آخر 7 أيام)</Text>
          <View style={styles.barChartContainer}>
            <BarChart
              data={getDailyData()}
              barWidth={28}
              spacing={12}
              xAxisColor={COLORS.border}
              yAxisColor={COLORS.border}
              yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
              noOfSections={4}
              maxValue={Math.max(...getDailyData().map(d => d.value)) * 1.2 || 100}
              height={150}
              width={screenWidth - 100}
              isAnimated
              barBorderRadius={4}
            />
          </View>
        </Card>

        {/* Trend Line Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>اتجاه الإنفاق</Text>
          <View style={styles.lineChartContainer}>
            <LineChart
              data={getTrendData()}
              color={COLORS.primary}
              thickness={3}
              hideDataPoints={false}
              dataPointsColor={COLORS.primary}
              dataPointsRadius={4}
              xAxisColor={COLORS.border}
              yAxisColor={COLORS.border}
              yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
              height={120}
              width={screenWidth - 100}
              curved
              isAnimated
              areaChart
              startFillColor={COLORS.primary + '40'}
              endFillColor={COLORS.primary + '10'}
            />
          </View>
        </Card>

        {/* Top Categories */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>أعلى الفئات إنفاقاً</Text>
          {topCategories.map((cat, index) => {
            const category = CATEGORIES.find(c => c.label === cat.label);
            const percentage = (cat.value / totalSpent) * 100;
            
            return (
              <View key={index} style={styles.topCategoryItem}>
                <View style={styles.topCategoryRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={[styles.topCategoryIcon, { backgroundColor: cat.color }]}>
                  <Ionicons 
                    name={category?.icon as any || 'ellipsis-horizontal'} 
                    size={16} 
                    color={COLORS.white} 
                  />
                </View>
                <View style={styles.topCategoryInfo}>
                  <Text style={styles.topCategoryName}>{cat.label}</Text>
                  <View style={styles.topCategoryProgress}>
                    <View 
                      style={[
                        styles.topCategoryProgressFill, 
                        { width: `${percentage}%`, backgroundColor: cat.color }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.topCategoryAmount}>
                  {formatCurrency(cat.value, settings.currency)}
                </Text>
              </View>
            );
          })}
        </Card>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  pieCenterValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  legendValue: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  barChartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  lineChartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  topCategoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  topCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.sm,
  },
  topCategoryInfo: {
    flex: 1,
  },
  topCategoryName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  topCategoryProgress: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  topCategoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  topCategoryAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
});
